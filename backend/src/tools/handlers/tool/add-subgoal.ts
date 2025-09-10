import { buildArray } from '@andji/common/util/array'

import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'
import type { Subgoal } from '@andji/common/types/session-state'

export const handleAddSubgoal = ((params: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<'add_subgoal'>
  state: { agentContext?: Record<string, Subgoal> }
}): {
  result: Promise<andjiToolOutput<'add_subgoal'>>
  state: { agentContext: Record<string, Subgoal> }
} => {
  const { previousToolCallFinished, toolCall, state } = params
  const agentContext = state.agentContext ?? {}

  agentContext[toolCall.input.id] = {
    objective: toolCall.input.objective,
    status: toolCall.input.status,
    plan: toolCall.input.plan,
    logs: buildArray([toolCall.input.log]),
  }

  return {
    result: (async () => {
      await previousToolCallFinished
      return [
        {
          type: 'json',
          value: {
            message: 'Successfully added subgoal',
          },
        },
      ]
    })(),
    state: { agentContext },
  }
}) satisfies andjiToolHandlerFunction<'add_subgoal'>
