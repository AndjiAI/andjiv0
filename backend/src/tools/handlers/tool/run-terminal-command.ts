import type { andjiToolHandlerFunction } from '../handler-function-type'
import type {
  ClientToolCall,
  andjiToolCall,
  andjiToolOutput,
} from '@andji/common/tools/list'

type ToolName = 'run_terminal_command'
export const handleRunTerminalCommand = (({
  previousToolCallFinished,
  toolCall,
  requestClientToolCall,
}: {
  previousToolCallFinished: Promise<void>
  toolCall: andjiToolCall<ToolName>
  requestClientToolCall: (
    toolCall: ClientToolCall<ToolName>,
  ) => Promise<andjiToolOutput<ToolName>>
}): { result: Promise<andjiToolOutput<ToolName>>; state: {} } => {
  const clientToolCall: ClientToolCall<ToolName> = {
    toolName: 'run_terminal_command',
    toolCallId: toolCall.toolCallId,
    input: {
      command: toolCall.input.command,
      mode: 'assistant',
      process_type: toolCall.input.process_type,
      timeout_seconds: toolCall.input.timeout_seconds,
      cwd: toolCall.input.cwd,
    },
  }
  return {
    result: (async () => {
      await previousToolCallFinished
      return await requestClientToolCall(clientToolCall)
    })(),
    state: {},
  }
}) satisfies andjiToolHandlerFunction<ToolName>
