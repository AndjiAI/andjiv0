# Andji

Andji is an AI coding assistant that edits your codebase through natural language instructions. Instead of using one model for everything, it coordinates specialized agents that work together to understand your project and make precise changes.

<div align="center">
  <img src="./assets/andji-vs-claude-code.png" alt="Andji vs Claude Code" width="400">
</div>

Andji beats Claude Code at 61% vs 53% on [our evals](evals/README.md) across 175+ coding tasks over multiple open-source repos that simulate real-world tasks.

![Andji Demo](./assets/demo.gif)

## How it works

When you ask Andji to "add authentication to my API," it might invoke:

1. A **File Explorer Agent** scans your codebase to understand the architecture and find relevant files
2. An **Planner Agent** plans which files need changes and in what order
3. An **Implementation Agents** make precise edits
4. A **Review Agents** validate changes

<div align="center">
  <img src="./assets/multi-agents.png" alt="Andji Multi-Agents" width="250">
</div>

This multi-agent approach gives you better context understanding, more accurate edits, and fewer errors compared to single-model tools.

## CLI: Install and start coding

Install:

```bash
npm install -g andji
```

Run:

```bash
cd your-project
andji
```

Then just tell Andji what you want and it handles the rest:

- "Fix the SQL injection vulnerability in user registration"
- "Add rate limiting to all API endpoints"
- "Refactor the database connection code for better performance"

Andji will find the right files, makes changes across your codebase, and runs tests to make sure nothing breaks.

## Create custom agents

To get started building your own agents, run:

```bash
andji init-agents
```

You can write agent definition files that give you maximum control over agent behavior.

Implement your workflows by specifying tools, which agents can be spawned, and prompts. We even have TypeScript generators for more programmatic control.

For example, here's a `git-committer` agent that creates git commits based on the current git state. Notice that it runs `git diff` and `git log` to analyze changes, but then hands control over to the LLM to craft a meaningful commit messagea and perform the actual commit.

```typescript
export default {
  id: 'git-committer',
  displayName: 'Git Committer',
  model: 'openai/gpt-5-nano',
  toolNames: ['read_files', 'run_terminal_command', 'end_turn'],

  instructionsPrompt:
    'You create meaningful git commits by analyzing changes, reading relevant files for context, and crafting clear commit messages that explain the "why" behind changes.',

  async *handleSteps() {
    // Analyze what changed
    yield { tool: 'run_terminal_command', command: 'git diff' }
    yield { tool: 'run_terminal_command', command: 'git log --oneline -5' }

    // Stage files and create commit with good message
    yield 'STEP_ALL'
  },
}
```

## SDK: Run agents in production

Install the [SDK package](https://www.npmjs.com/package/@andji/sdk) -- note this is different than the CLI andji package.
```bash
npm install @andji/sdk
```

Import the client and run agents!

```typescript
import { AndjiClient } from '@andji/sdk'

// 1. Initialize the client
const client = new AndjiClient({
  apiKey: 'your-api-key',
  cwd: '/path/to/your/project',
  onError: (error) => console.error('Andji error:', error.message),
})

// 2. Do a coding task...
const result = await client.run({
  agent: 'base', // Andji's base coding agent
  prompt: 'Add comprehensive error handling to all API endpoints',
  handleEvent: (event) => {
    console.log('Progress', event)
  },
})

// 3. Or, run a custom agent!
const myCustomAgent: AgentDefinition = {
  id: 'greeter',
  displayName: 'Greeter',
  model: 'openai/gpt-5',
  instructionsPrompt: 'Say hello!',
}
await client.run({
  agent: 'greeter',
  agentDefinitions: [myCustomAgent],
  prompt: 'My name is Bob.',
  customToolDefinitions: [], // Add custom tools too!
  handleEvent: (event) => {
    console.log('Progress', event)
  },
})
```

Learn more about the SDK [here](https://www.npmjs.com/package/@andji/sdk).

## Why choose Andji

**Deep customizability**: Create sophisticated agent workflows with TypeScript generators that mix AI generation with programmatic control. Define custom agents that spawn subagents, implement conditional logic, and orchestrate complex multi-step processes that adapt to your specific use cases.

**Any model on OpenRouter**: Unlike Claude Code which locks you into Anthropic's models, Andji supports any model available on [OpenRouter](https://openrouter.ai/models) - from Claude and GPT to specialized models like Qwen, DeepSeek, and others. Switch models for different tasks or use the latest releases without waiting for platform updates.

**Reuse any published agent**: Compose existing [published agents](https://www.andji.com/agents) to get a leg up. Andji agents are the new MCP!

**Fully customizable SDK**: Build Andji's capabilities directly into your applications with a complete TypeScript SDK. Create custom tools, integrate with your CI/CD pipeline, build AI-powered development environments, or embed intelligent coding assistance into your products.

## Get started

### Install

**CLI**: `npm install -g andji`

**SDK**: `npm install @andji/sdk`

### Resources

**Running Andji locally**: [local-development.md](./local-development.md)

**Documentation**: [andji.com/docs](https://andji.com/docs)

**Community**: [Discord](https://andji.com/discord)

**Support**: [support@andji.com](mailto:support@andji.com)
