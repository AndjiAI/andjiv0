# Changelog

All notable changes to the @andji/sdk package will be documented in this file.

## [0.1.20]

- You can now retrieve the output of an agent in `result.output` if result is the output of an awaited `client.run(...)` call.
- cwd is optional in the AndjiClient constructor.
- You can pass in `extraToolResults` into a run() call to include more info to the agent.

## [0.1.17]

### Added

- You can now get an API key from the [Andji website](https://www.andji.com/profile?tab=api-keys)!
- You can provide your own custom tools!

### Updated

- Updated types and docs

## [0.1.9] - 2025-08-13

### Added

- `closeConnection` method in `AndjiClient`

### Changed

- Automatic parsing of `knowledgeFiles` if not provided

### Fixed

- `maxAgentSteps` resets every run
- `AndjiClient` no longer requires binary to be installed

## [0.1.8] - 2025-08-13

### Added

- `withAdditionalMessage` and `withMessageHistory` functions
  - Add images, files, or other messages to a previous run
  - Modify the history of any run
- `initialSessionState` and `generateInitialRunState` functions
  - Create a SessionState or RunState object from scratch

### Removed

- `getInitialSessionState` function

## [0.1.7] - 2025-08-12

### Updated types! AgentConfig has been renamed to AgentDefinition.

## [0.1.5] - 2025-08-09

### Added

- Complete `AndjiClient`
- Better docs
- New `run()` api

## [0.0.1] - 2025-08-05

### Added

- Initial release of the Andji SDK
- `AndjiClient` class for interacting with Andji agents
- `runNewChat` method for starting new chat sessions
- TypeScript support with full type definitions
- Support for all Andji agent types
- Event streaming for real-time responses
