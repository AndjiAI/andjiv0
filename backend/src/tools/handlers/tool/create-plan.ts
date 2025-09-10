import { trackEvent } from '@andji/common/analytics'
import { AnalyticsEvent } from '@andji/common/constants/analytics-events'

import { getFileProcessingValues, postStreamProcessing } from './write-file'
import { logger } from '../../../util/logger'

import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  FileProcessingState,
  OptionalFileProcessingState,
} from './write-file'
import type {
  ClientToolCall,
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

export const handleCreatePlan = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<'create_plan'>
  requestClientToolCall: (
    toolCall: ClientToolCall<'create_plan'>,
  ) => Promise<andjiToolOutput<'create_plan'>>
  writeToClient: (chunk: string) => void

  getLatestState: () => FileProcessingState
  state: {
    agentStepId?: string
    clientSessionId?: string
    fingerprintId?: string
    userId?: string
    userInputId?: string
    repoId?: string
  } & OptionalFileProcessingState
}): {
  result: Promise<andjiToolOutput<'create_plan'>>
  state: FileProcessingState
} => {
  const {
    previousToolCallFinished,
    toolCall,
    requestClientToolCall,
    writeToClient,
    getLatestState,
    state,
  } = params
  const { path, plan } = toolCall.input
  const {
    agentStepId,
    clientSessionId,
    fingerprintId,
    userId,
    userInputId,
    repoId,
  } = state
  const fileProcessingState = getFileProcessingValues(state)

  logger.debug(
    {
      path,
      plan,
    },
    'Create plan',
  )
  // Add the plan file to the processing queue
  if (!fileProcessingState.promisesByPath[path]) {
    fileProcessingState.promisesByPath[path] = []
    if (path.endsWith('knowledge.md')) {
      trackEvent(AnalyticsEvent.KNOWLEDGE_FILE_UPDATED, userId ?? '', {
        agentStepId,
        clientSessionId,
        fingerprintId,
        userInputId,
        userId,
        repoName: repoId,
      })
    }
  }
  const change = {
    tool: 'create_plan' as const,
    path,
    content: plan,
    messages: [],
    toolCallId: toolCall.toolCallId,
  }
  fileProcessingState.promisesByPath[path].push(Promise.resolve(change))
  fileProcessingState.allPromises.push(Promise.resolve(change))

  return {
    result: (async () => {
      await previousToolCallFinished
      return await postStreamProcessing<'create_plan'>(
        change,
        getLatestState(),
        writeToClient,
        requestClientToolCall,
      )
    })(),
    state: fileProcessingState,
  }
}) satisfies andjiToolHandlerFunction<'create_plan'>
