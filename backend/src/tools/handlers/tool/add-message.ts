import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'
import type { Message } from '@andji/common/types/messages/andji-message'

export const handleAddMessage = (({
  previousToolCallFinished,
  toolCall,
  getLatestState,
}: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<'add_message'>
  getLatestState: () => { messages: Message[] }
}): {
  result: Promise<andjiToolOutput<'add_message'>>
  state: {}
} => {
  return {
    result: (async () => {
      await previousToolCallFinished

      getLatestState().messages.push(toolCall.input)
      return []
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'add_message'>
