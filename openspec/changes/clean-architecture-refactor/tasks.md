# Tasks: Clean Architecture Refactor

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (P1) → PR 2 (P2) → PR 3 (P3) → PR 4 (P4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|-----|-------|
| 1 | Move tests, barrel, utilities, dead code | PR 1 | Base=main; no behavior change |
| 2 | Centralize config and domain types | PR 2 | Depends PR 1; import updates |
| 3 | Decompose iconResolver and AppRegistry | PR 3 | Depends PR 2; medium risk |
| 4 | Extract CLI handlers, inject registry | PR 4 | Depends PR 3; test rewrites |

## Phase 1: Reorganize

- [ ] **P1-1** Move 10 unit tests from `src/` to `tests/unit/` mirroring structure; update imports to `../../src/...`. Files: create 10, modify 10. Test: `npm test`. Deps: none.
- [ ] **P1-2** Move `src/core/createApp.integration.test.ts` to `tests/integration/core/createApp.test.ts`; update imports. Files: create 1, modify 1. Test: `npm test`. Deps: P1-1.
- [ ] **P1-3** Update `vitest.config.ts` include to `tests/**/*.test.ts`; update `tsconfig.json` to exclude tests from `dist/`. Files: modify 2. Test: `npm test`. Deps: P1-1, P1-2.
- [ ] **P1-4** Create `src/utils/sanitize.ts` with `.trim()` behavior; update `iconResolver.ts` and `shortcutCreator.ts` to import it; remove dead `getAppArg` import from `shortcutCreator.ts`. Files: create 1, modify 2. Test: `npm test`. Deps: P1-3.
- [ ] **P1-5** Create `src/utils/debug.ts` with `createDebug`. Files: create 1. Test: `npm test`. Deps: none.
- [ ] **P1-6** Create `src/index.ts` barrel exporting public APIs. Files: create 1. Test: `npm test`. Deps: P1-4, P1-5.
- [ ] **P1-7** Remove `png-to-ico` from `package.json`; delete all 11 `src/**/*.test.ts`. Files: modify 1, delete 11. Test: `npm test`. Deps: P1-1, P1-2, P1-3.

## Phase 2: Config & Types

- [x] **P2-1** Create `src/domain/types.ts` with `AppEntry`, `BrowserName`, `CreateAppOptions`, `ShortcutOptions`. Files: create 1. Test: `npm test`. Deps: P1-7.
- [x] **P2-2** Create `src/config/paths.ts` and `src/config/browsers.ts` (imports `BrowserName` from domain). Files: create 2. Test: `npm test`. Deps: P2-1.
- [x] **P2-3** Update `browserResolver.ts`: import `BrowserName` from domain, `BROWSER_CONFIGS` from config; remove `getAppArg` export. Files: modify 1. Test: `npm test`. Deps: P2-2.
- [x] **P2-4** Update `appRegistry.ts` to import `AppEntry` from domain and paths from config. Files: modify 1. Test: `npm test`. Deps: P2-2.
- [x] **P2-5** Update `iconResolver.ts` to import `ICONS_DIR` from config; update `createApp.ts` to import types from domain. Files: modify 2. Test: `npm test`. Deps: P2-2, P2-4.
- [x] **P2-6** Update all test files importing `AppEntry` or `BrowserName` to use `domain/types`. Files: modify ~8. Test: `npm test`. Deps: P2-3, P2-4, P2-5.

## Phase 3: Services

- [ ] **P3-1** Create `src/services/iconResolver/` submodules: `constants.ts`, `download.ts`, `discovery.ts`, `defaultIcon.ts`, `index.ts`. Files: create 5. Test: `npm test`. Deps: P2-5.
- [ ] **P3-2** Delete `src/services/iconResolver.ts`. Files: delete 1. Test: `npm test`. Deps: P3-1.
- [ ] **P3-3** Create `src/domain/appRegistry.ts` with `IAppRegistry` interface. Files: create 1. Test: `npm test`. Deps: P2-1.
- [ ] **P3-4** Create `src/services/fileService.ts` (safe `deleteFile`) and `src/services/registryPersistence.ts` (JSON load/save). Files: create 2. Test: `npm test`. Deps: P2-2.
- [ ] **P3-5** Refactor `src/services/appRegistry.ts` to implement `IAppRegistry`, delegate to fileService and registryPersistence. Files: modify 1. Test: `npm test`. Deps: P3-3, P3-4.
- [ ] **P3-6** Update `appRegistry.test.ts` mocks for delegation; create `fileService.test.ts` and `registryPersistence.test.ts`. Files: modify 1, create 2. Test: `npm test`. Deps: P3-5.
- [ ] **P3-7** Move `iconResolver.test.ts` to `iconResolver/index.test.ts`; update import. Files: create 1, delete 1. Test: `npm test`. Deps: P3-2.
- [ ] **P3-8** Remove `getAppArg` tests from `browserResolver.test.ts` and `createApp.test.ts`. Files: modify 2. Test: `npm test`. Deps: P2-3.

## Phase 4: CLI & DI

- [ ] **P4-1** Create `src/cli/create.ts`, `list.ts`, `remove.ts` handlers accepting `registry: IAppRegistry`. Files: create 3. Test: `npm test`. Deps: P3-3.
- [ ] **P4-2** Update `src/core/createApp.ts` to accept `registry: IAppRegistry` in options. Files: modify 1. Test: `npm test`. Deps: P3-5, P4-1.
- [ ] **P4-3** Update `src/cli/wappCommand.ts` to instantiate `AppRegistry` once and wire handlers. Files: modify 1. Test: `npm test`. Deps: P4-2.
- [ ] **P4-4** Rewrite `tests/unit/cli/create.test.ts` mocking `IAppRegistry`, assert `registry.add` called. Files: create 1, delete 1. Test: `npm test`. Deps: P4-3.
- [ ] **P4-5** Rewrite `tests/unit/cli/list.test.ts` mocking registry, assert `console.log` output. Files: create 1, delete 1. Test: `npm test`. Deps: P4-3.
- [ ] **P4-6** Rewrite `tests/unit/cli/remove.test.ts` (merge enhanced), assert `console.log`/`process.exit`. Files: create 1, delete 2. Test: `npm test`. Deps: P4-3.
- [ ] **P4-7** Merge integration assertions into `tests/unit/core/createApp.test.ts`; delete `tests/integration/core/createApp.test.ts`. Files: modify 1, delete 1. Test: `npm test`. Deps: P4-2.
