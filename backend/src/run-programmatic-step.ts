import { getToolCallString } from '@andji/common/tools/utils'
import { getErrorObject } from '@andji/common/util/error'
import { cloneDeep } from 'lodash'

import { addAgentStep } from './agent-run'
import { executeToolCall } from './tools/tool-executor'
import { logger } from './util/logger'
import { SandboxManager } from './util/quickjs-sandbox'
import { getRequestContext } from './websockets/request-context'
import { sendAction } from './websockets/websocket-action'

import type { andjiToolCall } from '@andji/common/tools/list'
import type {
  AgentTemplate,
  StepGenerator,
  PublicAgentState,
} from '@andji/common/types/agent-template'
import type {
  ToolResultOutput,
  ToolResultPart,
} from '@andji/common/types/messages/content-part'
import type { PrintModeEvent } from '@andji/common/types/print-mode'
import type { AgentState } from '@andji/common/types/session-state'
import type { ProjectFileContext } from '@andji/common/util/file'
import type { WebSocket } from 'ws'

// Global sandbox manager for QuickJS contexts
const sandboxManager = new SandboxManager()

// Maintains generator state for all agents. Generator state can't be serialized, so we store it in memory.
const agentIdToGenerator: Record<string, StepGenerator | undefined> = {}
export const agentIdToStepAll: Set<string> = new Set()

// Function to clear the generator cache for testing purposes
export function clearAgentGeneratorCache() {
  for (const key in agentIdToGenerator) {
    delete agentIdToGenerator[key]
  }
  agentIdToStepAll.clear()
  // Clean up QuickJS sandboxes
  sandboxManager.dispose()
}

// Function to handle programmatic agents
export async function runProgrammaticStep(
  agentState: AgentState,
  {
    template,
    prompt,
    params,
    userId,
    userInputId,
    clientSessionId,
    fingerprintId,
    onResponseChunk,
    fileContext,
    ws,
    localAgentTemplates,
    stepsComplete,
    stepNumber,
  }: {
    template: AgentTemplate
    prompt: string | undefined
    params: Record<string, any> | undefined
    userId: string | undefined
    userInputId: string
    clientSessionId: string
    fingerprintId: string
    onResponseChunk: (chunk: string | PrintModeEvent) => void
    fileContext: ProjectFileContext
    ws: WebSocket
    localAgentTemplates: Record<string, AgentTemplate>
    stepsComplete: boolean
    stepNumber: number
  },
): Promise<{ agentState: AgentState; endTurn: boolean; stepNumber: number }> {
  if (!template.handleSteps) {
    throw new Error('No step handler found for agent template ' + template.id)
  }

  // Run with either a generator or a sandbox.
  let generator = agentIdToGenerator[agentState.agentId]
  let sandbox = sandboxManager.getSandbox(agentState.agentId)

  // Check if we need to initialize a generator (either native or QuickJS-based)
  if (!generator && !sandbox) {
    if (typeof template.handleSteps === 'string') {
      // Initialize QuickJS sandbox for string-based generator
      sandbox = await sandboxManager.getOrCreateSandbox(
        agentState.agentId,
        template.handleSteps,
        {
          agentState,
          prompt,
          params,
        },
      )
    } else {
      // Initialize native generator
      generator = template.handleSteps({
        agentState,
        prompt,
        params,
      })
      agentIdToGenerator[agentState.agentId] = generator
    }
  }

  // Check if we're in STEP_ALL mode
  if (agentIdToStepAll.has(agentState.agentId)) {
    if (stepsComplete) {
      // Clear the STEP_ALL mode. Stepping can continue if handleSteps doesn't return.
      agentIdToStepAll.delete(agentState.agentId)
    } else {
      return { agentState, endTurn: false, stepNumber }
    }
  }

  const agentStepId = crypto.randomUUID()

  const requestContext = getRequestContext()
  const repoId = requestContext?.processedRepoId

  // Initialize state for tool execution
  const toolCalls: andjiToolCall[] = []
  const toolResults: ToolResultPart[] = []
  const state = {
    ws,
    fingerprintId,
    userId,
    repoId,
    agentTemplate: template,
    localAgentTemplates,
    sendSubagentChunk: (data: {
      userInputId: string
      agentId: string
      agentType: string
      chunk: string
      prompt?: string
    }) => {
      sendAction(ws, {
        type: 'subagent-response-chunk',
        ...data,
      })
    },
    agentState: cloneDeep(agentState),
    agentContext: cloneDeep(agentState.agentContext),
    messages: cloneDeep(agentState.messageHistory),
  }

  let toolResult: ToolResultOutput[] = []
  let endTurn = false

  let startTime = new Date()
  let creditsBefore = agentState.directCreditsUsed
  let childrenBefore = agentState.childRunIds.length

  try {
    // Execute tools synchronously as the generator yields them
    do {
      startTime = new Date()
      creditsBefore = state.agentState.directCreditsUsed
      childrenBefore = state.agentState.childRunIds.length

      const result = sandbox
        ? await sandbox.executeStep({
            agentState: getPublicAgentState(state.agentState),
            toolResult,
            stepsComplete,
          })
        : generator!.next({
            agentState: getPublicAgentState(state.agentState),
            toolResult,
            stepsComplete,
          })

      if (result.done) {
        endTurn = true
        break
      }
      if (result.value === 'STEP') {
        break
      }
      if (result.value === 'STEP_ALL') {
        agentIdToStepAll.add(state.agentState.agentId)
        break
      }

      // Process tool calls yielded by the generator
      const toolCallWithoutId = result.value
      const toolCall = {
        ...toolCallWithoutId,
        toolCallId: crypto.randomUUID(),
      } as andjiToolCall & {
        includeToolCall?: boolean
      }

      // Note: We don't check if the tool is available for the agent template anymore.
      // You can run any tool from handleSteps now!
      // if (!template.toolNames.includes(toolCall.toolName)) {
      //   throw new Error(
      //     `Tool ${toolCall.toolName} is not available for agent ${template.id}. Available tools: ${template.toolNames.join(', ')}`,
      //   )
      // }

      const excludeToolFromMessageHistory = toolCall?.includeToolCall === false
      // Add assistant message with the tool call before executing it
      if (!excludeToolFromMessageHistory) {
        const toolCallString = getToolCallString(
          toolCall.toolName,
          toolCall.input,
        )
        onResponseChunk(toolCallString)
        state.messages.push({
          role: 'assistant' as const,
          content: toolCallString,
        })
        state.sendSubagentChunk({
          userInputId,
          agentId: state.agentState.agentId,
          agentType: state.agentState.agentType!,
          chunk: toolCallString,
        })
      }

      // Execute the tool synchronously and get the result immediately
      await executeToolCall({
        toolName: toolCall.toolName,
        input: toolCall.input,
        toolCalls,
        toolResults,
        previousToolCallFinished: Promise.resolve(),
        ws,
        agentTemplate: template,
        fileContext,
        agentStepId,
        clientSessionId,
        userInputId,
        fullResponse: '',
        onResponseChunk,
        state,
        userId,
        autoInsertEndStepParam: true,
        excludeToolFromMessageHistory,
      })

      // TODO: Remove messages from state and always use agentState.messageHistory.
      // Sync state.messages back to agentState.messageHistory
      state.agentState.messageHistory = state.messages

      // Get the latest tool result
      toolResult = toolResults[toolResults.length - 1]?.output

      if (state.agentState.runId) {
        await addAgentStep({
          userId,
          agentRunId: state.agentState.runId,
          stepNumber,
          credits: state.agentState.directCreditsUsed - creditsBefore,
          childRunIds: state.agentState.childRunIds.slice(childrenBefore),
          status: 'completed',
          startTime,
        })
      } else {
        logger.error('No runId found for agent state after finishing agent run')
      }
      stepNumber++

      if (toolCall.toolName === 'end_turn') {
        endTurn = true
        break
      }
    } while (true)

    return { agentState: state.agentState, endTurn, stepNumber }
  } catch (error) {
    endTurn = true

    const errorMessage = `Error executing handleSteps for agent ${template.id}: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`
    logger.error(
      { error: getErrorObject(error), template: template.id },
      errorMessage,
    )

    onResponseChunk(errorMessage)

    state.agentState.messageHistory = [
      ...state.messages,
      {
        role: 'assistant' as const,
        content: errorMessage,
      },
    ]
    state.agentState.output = {
      ...state.agentState.output,
      error: errorMessage,
    }

    if (agentState.runId) {
      await addAgentStep({
        userId,
        agentRunId: agentState.runId,
        stepNumber,
        credits: agentState.directCreditsUsed - creditsBefore,
        childRunIds: agentState.childRunIds.slice(childrenBefore),
        status: 'skipped',
        startTime,
      })
    } else {
      logger.error('No runId found for agent state after failed agent run')
    }
    stepNumber++

    return {
      agentState: state.agentState,
      endTurn,
      stepNumber,
    }
  } finally {
    if (endTurn) {
      if (sandbox) {
        // Clean up QuickJS sandbox if execution is complete
        sandboxManager.removeSandbox(agentState.agentId)
      }
      delete agentIdToGenerator[agentState.agentId]
      agentIdToStepAll.delete(agentState.agentId)
    }
  }
}

export const getPublicAgentState = (
  agentState: AgentState,
): PublicAgentState => {
  const { agentId, parentId, messageHistory, output } = agentState
  return {
    agentId,
    parentId,
    messageHistory: messageHistory as any as PublicAgentState['messageHistory'],
    output,
  }
}
