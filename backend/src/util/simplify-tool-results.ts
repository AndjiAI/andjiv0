import { errorToObject } from '@andji/common/util/object'
import { cloneDeep } from 'lodash'

import { logger } from './logger'

import type { andjiToolOutput } from '@andji/common/tools/list'

export function simplifyReadFileResults(
  messageContent: andjiToolOutput<'read_files'>,
): andjiToolOutput<'read_files'> {
  return [
    {
      type: 'json',
      value: cloneDeep(messageContent[0]).value.map(({ path }) => {
        return {
          path,
          contentOmittedForLength: true,
        }
      }),
    },
  ]
}

export function simplifyTerminalCommandResults(
  messageContent: andjiToolOutput<'run_terminal_command'>,
): andjiToolOutput<'run_terminal_command'> {
  try {
    const clone = cloneDeep(messageContent)
    const content = clone[0].value
    if ('processId' in content || 'errorMessage' in content) {
      return clone
    }
    const { command, message, exitCode } = content
    return [
      {
        type: 'json',
        value: {
          command,
          ...(message && { message }),
          stdoutOmittedForLength: true,
          ...(exitCode !== undefined && { exitCode }),
        },
      },
    ]
  } catch (error) {
    logger.error(
      { error: errorToObject(error), messageContent },
      'Error simplifying terminal command results',
    )
    return [
      {
        type: 'json',
        value: {
          command: '',
          stdoutOmittedForLength: true,
        },
      },
    ]
  }
}
