import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  ClientToolCall,
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

export const handleCodeSearch = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<'code_search'>
  requestClientToolCall: (
    toolCall: ClientToolCall<'code_search'>,
  ) => Promise<andjiToolOutput<'code_search'>>
}): { result: Promise<andjiToolOutput<'code_search'>>; state: {} } => {
  const { previousToolCallFinished, toolCall, requestClientToolCall } = params

  return {
    result: (async () => {
      await previousToolCallFinished
      return await requestClientToolCall(toolCall)
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'code_search'>
