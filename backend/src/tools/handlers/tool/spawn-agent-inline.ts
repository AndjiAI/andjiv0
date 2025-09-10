import {
  validateSpawnState,
  validateAndGetAgentTemplate,
  validateAgentInput,
  logAgentSpawn,
  executeAgent,
  createAgentState,
} from './spawn-agent-utils'

import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'
import type { AgentTemplate } from '@andji/common/types/agent-template'
import type { Message } from '@andji/common/types/messages/andji-message'
import type { PrintModeEvent } from '@andji/common/types/print-mode'
import type { AgentState } from '@andji/common/types/session-state'
import type { ProjectFileContext } from '@andji/common/util/file'
import type { WebSocket } from 'ws'

type ToolName = 'spawn_agent_inline'
export const handleSpawnAgentInline = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<ToolName>
  fileContext: ProjectFileContext
  clientSessionId: string
  userInputId: string
  writeToClient: (chunk: string | PrintModeEvent) => void

  getLatestState: () => { messages: Message[] }
  state: {
    ws?: WebSocket
    fingerprintId?: string
    userId?: string
    agentTemplate?: AgentTemplate
    localAgentTemplates?: Record<string, AgentTemplate>
    messages?: Message[]
    agentState?: AgentState
  }
}): { result: Promise<andjiToolOutput<ToolName>>; state: {} } => {
  const {
    previousToolCallFinished,
    toolCall,
    fileContext,
    clientSessionId,
    userInputId,
    getLatestState,
    state,
    writeToClient,
  } = params
  const {
    agent_type: agentTypeStr,
    prompt,
    params: agentParams,
  } = toolCall.input
  const {
    ws,
    fingerprintId,
    userId,
    agentTemplate: parentAgentTemplate,
    localAgentTemplates,
    agentState,
  } = validateSpawnState(state, 'spawn_agent_inline')

  const triggerSpawnAgentInline = async () => {
    const { agentTemplate, agentType } = await validateAndGetAgentTemplate(
      agentTypeStr,
      parentAgentTemplate,
      localAgentTemplates,
    )

    validateAgentInput(agentTemplate, agentType, prompt, agentParams)

    // Create child agent state that shares message history with parent
    const childAgentState: AgentState = createAgentState(
      agentType,
      agentState,
      getLatestState().messages,
      agentState.agentContext,
    )

    logAgentSpawn(
      agentTemplate,
      agentType,
      childAgentState.agentId,
      childAgentState.parentId,
      prompt,
      agentParams,
      true, // inline = true
    )

    const result = await executeAgent({
      ws,
      userInputId: `${userInputId}-inline-${agentType}${childAgentState.agentId}`,
      prompt: prompt || '',
      params: agentParams,
      agentTemplate,
      parentAgentState: agentState,
      agentState: childAgentState,
      fingerprintId,
      fileContext,
      localAgentTemplates,
      userId,
      clientSessionId,
      onResponseChunk: (chunk) => {
        // Disabled.
        // Inherits parent's onResponseChunk
        // writeToClient(chunk)
      },
      clearUserPromptMessagesAfterResponse: false,
    })

    // Update parent's message history with child's final state
    // Since we share the same message array reference, this should already be updated
    let finalMessages = result.agentState?.messageHistory || state.messages

    state.messages = finalMessages

    // Update parent agent state to reflect shared message history
    if (agentState && result.agentState) {
      agentState.messageHistory = finalMessages
    }

    return undefined
  }

  return {
    result: (async () => {
      await previousToolCallFinished
      await triggerSpawnAgentInline()
      return []
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<ToolName>
