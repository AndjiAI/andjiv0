# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Yarn workspaces; code runs with Bun where noted.
- Key packages: `backend` (API server), `web` (Next.js app), `common` (shared DB, utils), `.agents` (agent code), `sdk` (TypeScript client), `scripts` (maintenance), `packages/*` (internal libs). Python utilities live in `python-app`.
- Tests: unit in each package (e.g., `web/src/__tests__/unit`), e2e in `web/src/__tests__/e2e`.

## Build, Test, and Development Commands
- From root:
  - `yarn dev` — Orchestrated dev (see `scripts/dev.sh`).
  - `yarn start-web` — Start DB then Next.js dev server.
  - `yarn start-server` — Start backend via Bun.
  - `yarn start-db` / `yarn start-studio` — Start Postgres (Docker + Drizzle) / open Drizzle Studio.
  - `yarn typecheck` / `yarn test` — Type checks and package tests via Bun filters.
  - `yarn format` — Prettier write across the repo.
- Per package examples:
  - Web: `bun --cwd web dev | build | test | e2e`.
  - Backend/Common: `bun --cwd backend test`, `bun --cwd common db:migrate`.

## Coding Style & Naming Conventions
- Language: TypeScript (Node ≥ 20, Bun ≥ 1.2). Indent 2 spaces.
- Formatting: Prettier; Linting: ESLint (Next config in `web`). Run `yarn format` and fix lint warnings.
- Naming: files `kebab-case.ts`; React components `PascalCase` (`*.tsx`); variables/functions `camelCase`; constants `UPPER_SNAKE_CASE`.

## Testing Guidelines
- Web unit: Jest + RTL (`yarn --cwd web test`).
- Web e2e: Playwright (`yarn --cwd web e2e`).
- Backend/Common/Agents: Bun test runner (`bun --cwd <pkg> test`).
- Place unit tests next to sources or under `src/__tests__`; name `*.spec.ts(x)`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `docs:`). Linting enforced via commitlint/husky in web.
- PRs must include: clear description, linked issues, test coverage for changes, screenshots for UI, and notes on migrations.
- Ensure CI green: `yarn typecheck`, `yarn test`, `yarn format` before requesting review.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` per package; see package READMEs for required vars.
- Database: requires Docker (see `common/src/db/docker-compose.yml`). Run `yarn start-db` before backend/web.

## Agent-Specific Instructions
- Agents live in `.agents` (see `.agents/base2/*`) and templates in `common/src/templates/initial-agents-dir`.
- Develop and test agents with `bun --cwd .agents test`. Keep agent files `kebab-case.ts` and export typed definitions.
