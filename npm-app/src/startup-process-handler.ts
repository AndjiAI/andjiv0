import { gray } from 'picocolors'

import { cleanupStoredProcesses } from './background-process-manager'
import { startDevProcesses } from './dev-process-manager'
import { loadandjiConfig } from './json-config/parser'
import { getProjectRoot } from './project-files'

export function logAndHandleStartup(): Promise<any> {
  // First clean up any existing processes
  const { separateandjiInstanceRunning, cleanUpPromise } =
    cleanupStoredProcesses()

  const projectRoot = getProjectRoot()
  const config = loadandjiConfig()

  // Start up new processes if necessary
  if (config?.startupProcesses) {
    if (!separateandjiInstanceRunning) {
      startDevProcesses(config.startupProcesses, projectRoot)
    } else {
      console.log(
        gray(
          'Another instance of andji detected. Skipping startup processes.',
        ) + '\n',
      )
    }
  }
  return cleanUpPromise
}
