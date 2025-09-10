# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Andji** (formerly Codebuff) is a multi-agent AI coding assistant that coordinates specialized agents to understand and modify codebases through natural language instructions. The system uses a modular architecture with separate components for CLI, web interface, backend server, and agent orchestration.

## Key Commands

### Development Setup
```bash
# Install dependencies (requires Bun)
bun install

# Start backend server (port 3001)
bun run start-server

# Start CLI application
bun run start-bin

# Start web interface (requires Docker for database)
bun run start-web

# Run all tests
bun test

# Type checking
bun typecheck

# Format code
bun run format
```

### CLI Usage
```bash
# Install globally
npm install -g andji

# Run in current directory
andji

# Print mode (non-interactive)
andji -p "describe the codebase"

# Use specific agent
andji --agent file-picker "find auth files"

# Create agent templates
andji init-agents

# Publish agent
andji publish my-agent
```

## Architecture

### Component Structure
```
andji/
├── backend/          # Express server with WebSocket support
│   ├── src/
│   │   ├── websockets/    # Agent communication
│   │   ├── api/           # REST endpoints
│   │   └── llm-apis/      # AI model integrations
├── npm-app/          # CLI application (published as 'andji')
│   ├── src/
│   │   ├── cli.ts         # Main CLI interface
│   │   ├── agents/        # Agent loading/validation
│   │   └── terminal/      # Shell command execution
├── web/              # Next.js web interface
│   ├── src/
│   │   ├── app/           # App router pages
│   │   └── components/    # React components
├── common/           # Shared utilities and database
│   ├── src/
│   │   ├── db/            # Drizzle ORM schemas
│   │   └── tools/         # Agent tool definitions
├── sdk/              # TypeScript SDK for external use
└── .agents/          # Agent definition files
```

### Agent System

Agents are TypeScript files in `.agents/` that define:
- Model selection (Claude, GPT, OpenRouter models)
- Available tools (read_files, str_replace, run_terminal_command)
- Spawnable sub-agents
- Custom prompts and behavior

Key agents:
- `base.ts` - Main coordinator agent
- `file-explorer.ts` - Codebase navigation
- `git-committer.ts` - Git operations
- `reviewer.ts` - Code review
- `thinker.ts` - Planning and analysis

### Environment Configuration

Create `.env.local` with required variables:
- API keys: `ANTHROPIC_API_KEY`, `OPEN_AI_KEY`, `OPEN_ROUTER_API_KEY`
- Backend: `PORT=3001`, `NEXT_PUBLIC_andji_BACKEND_URL`
- Database: `DATABASE_URL` (PostgreSQL for web interface)
- Auth: `NEXTAUTH_SECRET`, `andji_GITHUB_ID/SECRET`

## Development Guidelines

### Working with Agents
- Agent definitions use TypeScript with specific interfaces
- Tools are defined in `common/src/tools/`
- Agents can spawn sub-agents inline or separately
- Context pruning handles large codebases automatically

### Key Files to Know
- `npm-app/src/index.ts` - CLI entry point
- `backend/src/websockets/server.ts` - Agent execution
- `.agents/*.ts` - Agent behavior definitions
- `andji.json` - Project configuration (startup processes, hooks)

### Testing
- Unit tests: `bun test [file]`
- Integration tests in `evals/` directory
- Agent validation happens on startup
- Use `--trace` flag for detailed agent logging

### Common Tasks

**Adding a new agent:**
1. Create `.agents/my-agent.ts`
2. Define model, tools, and prompts
3. Test with `andji --agent my-agent`

**Modifying tool behavior:**
1. Edit tool in `common/src/tools/`
2. Update TypeScript definitions
3. Regenerate with `bun run generate-tool-definitions`

**Debugging agent execution:**
1. Use `--trace` flag for detailed logs
2. Check `.agents/traces/*.log`
3. Monitor WebSocket messages in backend logs

## Important Notes

- The project uses Bun as the primary runtime but maintains Node.js compatibility
- Workspace structure uses yarn workspaces with multiple packages
- All packages are scoped under `@andji/*`
- The CLI is published as `andji` on npm
- Agent definitions support TypeScript generators for programmatic control
- BigQuery integration tracks usage and analytics
- Stripe integration handles billing for the web platform