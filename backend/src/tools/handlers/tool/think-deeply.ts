import { logger } from '../../../util/logger'

import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

export const handleThinkDeeply = ((params: {
  previousToolCallFinished: Promise<any>
  toolCall: andjiToolCall<'think_deeply'>
}): { result: Promise<andjiToolOutput<'think_deeply'>>; state: {} } => {
  const { previousToolCallFinished, toolCall } = params
  const { thought } = toolCall.input

  logger.debug(
    {
      thought,
    },
    'Thought deeply',
  )

  return {
    result: previousToolCallFinished.then(() => []),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<'think_deeply'>
