import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  ClientToolCall,
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

export const handleBrowserLogs = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<'browser_logs'>
  requestClientToolCall: (
    toolCall: ClientToolCall<'browser_logs'>,
  ) => Promise<andjiToolOutput<'browser_logs'>>
}): { result: Promise<andjiToolOutput<'browser_logs'>>; state: {} } => {
  const { previousToolCallFinished, toolCall, requestClientToolCall } = params

  return {
    result: (async () => {
      await previousToolCallFinished
      return await requestClientToolCall(toolCall)
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'browser_logs'>
