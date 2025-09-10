import type { ToolName } from '@andji/common/tools/constants'

export type ToolDescription<T extends ToolName = ToolName> = {
  toolName: T
  description: string
}
