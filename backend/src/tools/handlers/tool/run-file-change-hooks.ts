import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  ClientToolCall,
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

type ToolName = 'run_file_change_hooks'
export const handleRunFileChangeHooks = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<ToolName>
  requestClientToolCall: (
    toolCall: ClientToolCall<ToolName>,
  ) => Promise<andjiToolOutput<ToolName>>
}): { result: Promise<andjiToolOutput<ToolName>>; state: {} } => {
  const { previousToolCallFinished, toolCall, requestClientToolCall } = params

  return {
    result: (async () => {
      await previousToolCallFinished
      return await requestClientToolCall(toolCall)
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'run_file_change_hooks'>
