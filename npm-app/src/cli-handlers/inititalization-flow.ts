import { existsSync, writeFileSync } from 'fs'
import path from 'path'

import { andjiConfigFile } from '@andji/common/json-config/constants'
import { green, bold, yellow } from 'picocolors'

import { getProjectRoot } from '../project-files'

export function handleInitializationFlowLocally(): void {
  const projectRoot = getProjectRoot()
  const configPath = path.join(projectRoot, andjiConfigFile)

  if (existsSync(configPath)) {
    console.log(yellow(`\n📋 ${andjiConfigFile} already exists.`))
    return
  }

  // Create the config file
  const configContent = {
    description:
      'Template configuration for this project. See https://www.andji.com/config for all options.',
    startupProcesses: [],
    fileChangeHooks: [],
  }
  writeFileSync(configPath, JSON.stringify(configContent, null, 2))

  console.log(green(`\n✅ Created ${bold(andjiConfigFile)}`))
}
