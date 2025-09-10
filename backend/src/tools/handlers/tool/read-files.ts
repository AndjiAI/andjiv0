import { getFileReadingUpdates } from '../../../get-file-reading-updates'
import { renderReadFilesResult } from '../../../util/parse-tool-call-xml'

import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'
import type { Message } from '@andji/common/types/messages/andji-message'
import type { ProjectFileContext } from '@andji/common/util/file'
import type { WebSocket } from 'ws'

type ToolName = 'read_files'
export const handleReadFiles = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<ToolName>

  agentStepId: string
  clientSessionId: string
  userInputId: string
  fileContext: ProjectFileContext

  state: {
    ws?: WebSocket
    userId?: string
    fingerprintId?: string
    repoId?: string
    messages?: Message[]
  }
}): {
  result: Promise<andjiToolOutput<ToolName>>
  state: {}
} => {
  const {
    previousToolCallFinished,
    toolCall,
    agentStepId,
    clientSessionId,
    userInputId,
    fileContext,
    state,
  } = params
  const { ws, fingerprintId, userId, repoId, messages } = state
  const { paths } = toolCall.input
  if (!ws) {
    throw new Error('Internal error for read_files: Missing WebSocket in state')
  }
  if (!messages) {
    throw new Error('Internal error for read_files: Missing messages in state')
  }
  if (!fingerprintId) {
    throw new Error(
      'Internal error for read_files: Missing fingerprintId in state',
    )
  }
  if (!userInputId) {
    throw new Error(
      'Internal error for read_files: Missing userInputId in state',
    )
  }

  const readFilesResultsPromise = (async () => {
    const { addedFiles, updatedFilePaths } = await getFileReadingUpdates(
      ws,
      messages,
      fileContext,
      {
        requestedFiles: paths,
        agentStepId,
        clientSessionId,
        fingerprintId,
        userInputId,
        userId,
        repoId,
      },
    )

    return renderReadFilesResult(addedFiles, fileContext.tokenCallers ?? {})
  })()

  return {
    result: (async () => {
      await previousToolCallFinished
      return [
        {
          type: 'json',
          value: await readFilesResultsPromise,
        },
      ]
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<ToolName>
