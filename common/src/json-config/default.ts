import { MAX_AGENT_STEPS_DEFAULT } from '../constants/agents'
import { type andjiConfig } from './constants'

export function getDefaultConfig(): andjiConfig {
  return {
    description: '',
    startupProcesses: [],
    fileChangeHooks: [],
    maxAgentSteps: MAX_AGENT_STEPS_DEFAULT,
    baseAgent: undefined,
    spawnableAgents: undefined,
  }
}

