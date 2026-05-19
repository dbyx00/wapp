# Proposal: Clean Architecture Refactor

## Intent

Restructure wapp from ad-hoc modules into clean architecture with separated concerns, dependency injection, and tests in the correct layer. Eliminate duplicated code, dead code, and structural debt from rapid prototyping.

## Scope

### In Scope
- Move 11 test files from `src/` to `tests/`
- Extract shared `sanitizeFileName()`, remove dead `getAppArg` and `png-to-ico`
- Centralize config (`paths.ts`, `browsers.ts`) and domain types
- Split `iconResolver.ts` monolith into focused modules
- Refactor `AppRegistry` with `IAppRegistry` interface
- Split CLI commands, inject `IAppRegistry`
- Add barrel exports; fix CLI tests to test CLI layer

### Out of Scope
- No new user-facing features
- No changes to core domain logic or algorithms
- No build tool changes beyond `tsconfig.json` test exclusion
- No external library additions

## Capabilities

### New Capabilities
None — pure refactor with no spec-level behavior changes.

### Modified Capabilities
None — requirements remain identical; only implementation structure changes.

## Approach

Incremental 4-phase migration, keeping tests green after each phase:

1. **Reorganize** — Move tests, barrel exports, deduplicate `sanitizeFileName`, remove dead code
2. **Config & Types** — Extract `src/config/paths.ts`, `src/config/browsers.ts`, `src/domain/types.ts`
3. **Services** — Split `iconResolver.ts` into `download.ts`, `discovery.ts`, `defaultIcon.ts`; refactor `AppRegistry` with interface + delegation
4. **CLI & DI** — Extract command handlers; pass `IAppRegistry`; rewrite CLI tests for console output and exit codes; consolidate overlapping tests

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `tests/` | New | All test files relocated from `src/` |
| `src/config/`, `src/domain/` | New | Centralized config and types |
| `src/services/iconResolver/` | New | Split from monolith into 4 modules |
| `src/services/appRegistry.ts` | Modified | Implements `IAppRegistry`, delegates persistence |
| `src/cli/` | Modified | Commands extracted into separate files |
| `vitest.config.ts`, `tsconfig.json`, `package.json` | Modified | Paths updated, `png-to-ico` removed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Broken test imports after moves | Low | Update `vitest.config.ts` and relative imports in one commit |
| `AppRegistry` contract breakage | Medium | Preserve existing API signatures; internal delegation only |
| CLI tests rewritten incorrectly | Medium | Assert console output and exit codes, not registry state |
| Import cycles | Low | Keep `domain/types.ts` and `config/paths.ts` import-free |

## Rollback Plan

Each phase is an independent commit. Revert any single failing commit. Keep original `AppRegistry` and `wappCommand.ts` as reference during Phase 3–4.

## Dependencies

- All existing tests pass on `main`
- `vitest.config.ts` committed and functional
- No open PRs touching `src/services/iconResolver.ts`, `src/services/appRegistry.ts`, or `src/cli/wappCommand.ts`

## Success Criteria

- [ ] All 11 test files in `tests/` pass
- [ ] `dist/` contains no test files
- [ ] No duplicate `sanitizeFileName()`
- [ ] `iconResolver.ts` < 100 lines with sub-modules
- [ ] `AppRegistry` exposes `IAppRegistry`; persistence delegated
- [ ] CLI handlers accept `IAppRegistry`; no `new AppRegistry()` in commands
- [ ] CLI tests assert output/exit behavior, not registry internals
- [ ] No dead imports or unused dependencies
- [ ] No circular dependencies
