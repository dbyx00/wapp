# Delta Spec: clean-architecture-refactor

## Cross-Phase Constraints

| # | Constraint | Verification |
|---|-----------|--------------|
| C1 | All tests MUST pass after every phase | `npm test` exits 0 |
| C2 | User-facing behavior MUST NOT change | CLI output and exit codes remain identical |
| C3 | No circular dependencies MAY exist | Static analysis passes |
| C4 | `dist/` MUST NOT contain test files | Post-build glob is empty |
| C5 | Dead code and unused dependencies MUST be removed | Import and package audit |

## Phase 1 — Reorganize

### Requirement: Test Relocation
All 11 test files MUST move to `tests/` mirroring `src/` structure. `vitest.config.ts` MUST include `tests/**/*.test.ts`. `tsconfig.json` MUST exclude tests from `dist/`.

#### Scenario: Post-move verification
- GIVEN tests reside in `tests/`
- WHEN `npm test` runs
- THEN all suites pass

### Requirement: Barrel Export
`src/index.ts` MUST export all public APIs.

#### Scenario: Package entry point
- GIVEN `import { createApp } from './src/index'`
- THEN the function is defined

### Requirement: Deduplicated sanitizeFileName
`sanitizeFileName()` MUST exist only in `src/utils/sanitize.ts` with `.trim()` behavior.

#### Scenario: Shared utility
- GIVEN `iconResolver` and `shortcutCreator` import from `../utils/sanitize`
- WHEN sanitizing `" App<>Name "`
- THEN result is `"App__Name"`

### Requirement: Dead Code Removal
`shortcutCreator.ts` MUST NOT import `getAppArg`. `package.json` MUST NOT list `png-to-ico`.

#### Scenario: Import audit
- GIVEN `shortcutCreator.ts` is inspected
- THEN `getAppArg` import is absent
- AND `package.json` lacks `png-to-ico`

## Phase 2 — Config & Types

### Requirement: Centralized Config
`src/config/paths.ts` MUST export `ICONS_DIR`, `REGISTRY_DIR`, `REGISTRY_FILE`. `src/config/browsers.ts` MUST export `BROWSER_CONFIGS`.

#### Scenario: Config consumption
- GIVEN `browserResolver` imports from `../config/browsers`
- THEN all browser definitions are available

### Requirement: Centralized Types
`src/domain/types.ts` MUST export `AppEntry`, `BrowserName`, `CreateAppOptions`, `ShortcutOptions`.

#### Scenario: Type import
- GIVEN `appRegistry.ts` imports `AppEntry` from `../domain/types`
- THEN the type matches the existing contract

## Phase 3 — Services

### Requirement: Icon Resolver Decomposition
`src/services/iconResolver.ts` MUST split into `index.ts` (barrel + orchestration), `download.ts`, `discovery.ts`, `defaultIcon.ts`.

#### Scenario: Behavioral equivalence
- GIVEN `resolveIcon(url, name)` is called
- WHEN all download paths fail
- THEN it returns the default icon path

### Requirement: IAppRegistry Interface
`src/domain/appRegistry.ts` MUST declare `IAppRegistry` with `add`, `list`, `findByName`, `remove`, `search`, `getByIndex`, `removeByQuery`.

#### Scenario: Interface compliance
- GIVEN a mock implements `IAppRegistry`
- WHEN passed to `createApp` and CLI handlers
- THEN TypeScript compiles without error

### Requirement: Delegated Operations
`src/services/registryPersistence.ts` MUST handle JSON read/write. `src/services/fileService.ts` MUST handle `unlinkSync`.

#### Scenario: Safe deletion
- GIVEN a file does not exist
- WHEN `fileService.deleteFile(path)` is called
- THEN no error is thrown

### Requirement: Refactored AppRegistry
`src/services/appRegistry.ts` MUST implement `IAppRegistry`, delegating persistence and file operations.

#### Scenario: Remove delegation
- GIVEN `AppRegistry.remove(name)` is called
- WHEN the app exists
- THEN it delegates file deletion to `fileService` and persistence to `registryPersistence`

## Phase 4 — CLI & DI

### Requirement: Extracted Handlers
CLI commands MUST reside in `src/cli/create.ts`, `list.ts`, `remove.ts`.

#### Scenario: Command dispatch
- GIVEN `wappCommand.ts` parses `create <url>`
- WHEN the action triggers
- THEN `create.ts` handler is invoked with arguments

### Requirement: Dependency Injection
`createApp.ts` and CLI handlers MUST accept `registry: IAppRegistry`. No handler MAY instantiate `AppRegistry`.

#### Scenario: Injected registry
- GIVEN `createApp({ url, registry })` is called
- WHEN the app is created
- THEN `registry.add()` is invoked exactly once

### Requirement: CLI Layer Tests
CLI tests MUST assert `console.log`, `console.error`, and `process.exit` calls.

#### Scenario: List output
- GIVEN the registry has 2 apps
- WHEN the list handler runs
- THEN `console.log` outputs the count and formatted entries

### Requirement: Test Consolidation
`removeCommand.enhanced.test.ts` MUST NOT exist. Overlapping `createApp` tests MUST merge into one suite.

#### Scenario: Coverage preserved
- GIVEN `removeCommand.test.ts` covers exact, partial, numeric, and multi-match cases
- THEN no enhanced test file remains
