import { spawn } from 'child_process'

import { andji_BINARY } from './constants'

import type { PrintModeEvent } from '../../common/src/types/print-mode'

export function processStream({
  andjiArgs,
  handleEvent,
}: {
  andjiArgs: string[]
  handleEvent: (event: PrintModeEvent) => void
}): Promise<void> {
  let buffer = ''

  function onData(data: any) {
    buffer += data.toString()

    const lines = buffer.split('\n')

    buffer = lines.pop() || ''

    for (const line of lines) {
      const event = JSON.parse(line)
      handleEvent(event)
    }
  }

  const env = { ...process.env }
  const child = spawn(andji_BINARY, andjiArgs, {
    stdio: 'pipe',
    env,
  })

  child.stdout.on('data', onData)
  child.stderr.on('data', onData)

  return new Promise<void>((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`andji exited with code ${code}`))
      }
    })
  })
}
