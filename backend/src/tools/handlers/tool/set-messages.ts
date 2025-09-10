import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'
import type { Message } from '@andji/common/types/messages/andji-message'

export const handleSetMessages = (({
  previousToolCallFinished,
  toolCall,
  getLatestState,
}: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<'set_messages'>
  getLatestState: () => { messages: Message[] }
}): {
  result: Promise<andjiToolOutput<'set_messages'>>
  state: {}
} => {
  return {
    result: (async () => {
      await previousToolCallFinished
      getLatestState().messages = toolCall.input.messages
      return []
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'set_messages'>
