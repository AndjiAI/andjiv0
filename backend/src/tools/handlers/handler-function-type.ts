import type { ToolName } from '@andji/common/tools/constants'
import type {
  ClientToolCall,
  ClientToolName,
  andjiToolCall,
  andjiToolOutput,
  andjiToolResult,
} from '@andji/common/tools/list'
import type { PrintModeEvent } from '@andji/common/types/print-mode'
import type { ProjectFileContext } from '@andji/common/util/file'

type PresentOrAbsent<K extends PropertyKey, V> =
  | { [P in K]: V }
  | { [P in K]: never }

export type andjiToolHandlerFunction<T extends ToolName = ToolName> = (
  params: {
    previousToolCallFinished: Promise<void>
    toolCall: andjiToolCall<T>

    agentStepId: string
    clientSessionId: string
    userInputId: string
    fileContext: ProjectFileContext

    fullResponse: string

    writeToClient: (chunk: string | PrintModeEvent) => void

    getLatestState: () => any
    state: { [K in string]?: any }
  } & PresentOrAbsent<
    'requestClientToolCall',
    (
      toolCall: ClientToolCall<T extends ClientToolName ? T : never>,
    ) => Promise<andjiToolOutput<T extends ClientToolName ? T : never>>
  >,
) => {
  result: Promise<andjiToolResult<T>['output']>
  state?: Record<string, any>
}
