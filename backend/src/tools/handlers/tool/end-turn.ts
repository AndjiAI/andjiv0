import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

export const handleEndTurn = (({
  previousToolCallFinished,
}: {
  previousToolCallFinished: Promise<any>
  toolCall: andjiToolCall<'end_turn'>
}): { result: Promise<andjiToolOutput<'end_turn'>>; state: {} } => {
  return {
    result: (async () => {
      await previousToolCallFinished
      return []
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'end_turn'>
