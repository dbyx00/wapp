# Tasks: Web UI for WApp

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (core) → PR 2 (API) → PR 3 (frontend) → PR 4 (CLI + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Event-driven core + registry | PR 1 | Base branch; domain types, core refactor, registry changes |
| 2 | API server + SSE adapter | PR 2 | Depends on PR 1 |
| 3 | Svelte frontend + Vite | PR 3 | Depends on PR 2 |
| 4 | CLI web command + tests | PR 4 | Depends on PR 2 |

## Phase 1: Foundation

- [x] 1.1 Add `hono`, `@hono/node-server`, `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`, `tailwindcss` to `package.json`
- [x] 1.2 Create `src/domain/events.ts` with `AppEvent`, `OnEvent`, `AppEventStatus`
- [x] 1.3 Modify `tsconfig.json` to exclude `src/web/`
- [x] 1.4 Add `unregister(name)` to `IAppRegistry` in `src/domain/appRegistry.ts`; remove `removeByQuery()`
- [x] 1.5 Implement `unregister()` in `src/services/appRegistry.ts`; delete `removeByQuery()`

## Phase 2: Core Logic

- [x] 2.1 Refactor `src/core/createApp.ts`: accept `onEvent?`, return `AppEntry`, emit step events, keep console fallback
- [x] 2.2 Create `src/core/removeApp.ts`: find → delete shortcut → delete icon → unregister, emit events
- [x] 2.3 Create `src/core/listApps.ts`: wrap `registry.list()` with `reading-registry` events
- [x] 2.4 Update `src/index.ts` to export `AppEvent`, `OnEvent`, `removeApp`, `listApps`

## Phase 3: CLI Adapters

- [x] 3.1 Modify `src/cli/create.ts`: map `onEvent` to `console.log`, handle returned `AppEntry`
- [x] 3.2 Modify `src/cli/remove.ts`: call `removeApp()` with event adapter
- [x] 3.3 Modify `src/cli/list.ts`: call `listApps()` with event adapter
- [x] 3.4 Modify `src/cli/wappCommand.ts`: add `web` command

## Phase 4: API & SSE

- [x] 4.1 Create `src/api/adapters/sseAdapter.ts`: `OnEvent` → Hono `streamSSE`
- [x] 4.2 Create `src/api/routes/apps.ts`: `GET`, `POST` SSE, `DELETE` SSE endpoints
- [x] 4.3 Create `src/api/server.ts`: Hono bootstrap, static files, icons, graceful shutdown, bind `127.0.0.1`

## Phase 5: Frontend

- [x] 5.1 Create `vite.config.ts` with Svelte plugin, build to `dist/public/`
- [x] 5.2 Create `src/web/main.ts`, `index.html`, Tailwind entry
- [x] 5.3 Create `src/web/App.svelte` with view switcher (list/create/remove)
- [x] 5.4 Create `src/web/stores/apps.svelte.ts` and `src/web/api/client.ts`
- [x] 5.5 Create `src/web/views/ListView.svelte`
- [x] 5.6 Create `src/web/views/CreateView.svelte` with SSE progress
- [x] 5.7 Create `src/web/views/RemoveView.svelte` with confirmation and SSE progress

## Phase 6: Testing & Verification

- [x] 6.1 Unit test `createApp` event sequence (Vitest, mocked services)
- [x] 6.2 Unit test `removeApp` event sequence
- [x] 6.3 Unit test `listApps` event sequence
- [x] 6.4 Unit test `sseAdapter` event→SSE conversion
- [x] 6.5 Integration test API endpoints with Hono test client
- [x] 6.6 Verify CLI `create`, `list`, `remove` output unchanged
- [x] 6.7 Verify `wapp web` starts on `localhost`, serves UI, binds `127.0.0.1`
