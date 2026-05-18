# Design: Web UI for WApp

## Technical Approach

Refactor core operations (`createApp`, `removeApp`, `listApps`) to emit typed `AppEvent`s via an optional `OnEvent` callback. A Hono server injects an SSE adapter that streams events to a Svelte 5 SPA. Vite builds the frontend to `dist/public/`; Hono serves static files and icons from `%APPDATA%/WApp/icons/`. The CLI remains unchanged when `onEvent` is omitted.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| HTTP framework | Hono | Express, Fastify | Native `streamSSE()`, lighter, type-safe middleware |
| Frontend framework | Svelte 5 | Preact, SolidJS, Vanilla | Compile-time zero-runtime; runes match reactive SSE streams |
| UI primitives | shadcn-svelte | Raw Tailwind, other libs | Copy-paste components; accessible Dialog/Toast/Progress |
| Progress streaming | Typed `AppEvent` callback | Parse stdout, wrappers | Type-safe, testable, optional (backward compatible) |
| Transport | SSE | WebSocket, long-polling | Unidirectional; no upgrade; first-class Hono support |

## Data Flow

```
Browser (Svelte 5)
    │ GET /api/apps
    │ POST /api/apps (SSE)
    └ DELETE /api/apps/:name (SSE)
                  │
                  ▼
           Hono (127.0.0.1)
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
 onEvent      onEvent       onEvent
 adapter     adapter       adapter
    │             │             │
    ▼             ▼             ▼
createApp    removeApp     listApps
    │             │             │
    └─────────────┼─────────────┘
                  ▼
        AppRegistry / Services
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
  SSE          SSE           JSON
 stream       stream        response
    │             │             │
    └─────────────┴─────────────┘
                  ▼
           Browser (UI update)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/events.ts` | Create | `AppEvent`, `OnEvent`, `AppEventStatus` |
| `src/core/createApp.ts` | Modify | Accept `onEvent?`, return `AppEntry`, emit step events |
| `src/core/removeApp.ts` | Create | Orchestrate find → delete files → unregister with events |
| `src/core/listApps.ts` | Create | Wrap `registry.list()` with `reading-registry` events |
| `src/domain/appRegistry.ts` | Modify | Add `unregister(name)` (JSON-only); keep `remove()` for compat |
| `src/services/appRegistry.ts` | Modify | Implement `unregister()`; `remove()` calls `unregister()` + file deletion |
| `src/cli/create.ts` | Modify | Pass `onEvent` mapping to `console.log` |
| `src/cli/remove.ts` | Modify | Call `removeApp()` instead of `registry.removeByQuery()` |
| `src/cli/list.ts` | Modify | Call `listApps()` instead of `registry.list()` |
| `src/cli/wappCommand.ts` | Modify | Add `web` command |
| `src/api/server.ts` | Create | Hono bootstrap, static files, graceful shutdown |
| `src/api/routes/apps.ts` | Create | `GET`, `POST`, `DELETE` endpoints |
| `src/api/adapters/sseAdapter.ts` | Create | `OnEvent` → Hono `streamSSE` |
| `src/web/` | Create | Svelte 5 SPA: `main.ts`, `App.svelte`, views, components, stores, API client |
| `vite.config.ts` | Create | Svelte plugin, build to `dist/public/` |
| `package.json` | Modify | Add `hono`, `@hono/node-server`, `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`, `tailwindcss`, `shadcn-svelte` |
| `tsconfig.json` | Modify | Exclude `src/web/` (Vite handles TS compilation) |
| `src/index.ts` | Modify | Export `AppEvent`, `OnEvent`, `removeApp`, `listApps` |

## Interfaces / Contracts

```ts
// src/domain/events.ts
export type AppEventStatus = 'start' | 'success' | 'error' | 'warning';

export interface AppEvent {
  step: string;
  status: AppEventStatus;
  data?: unknown;
  error?: string;
}

export type OnEvent = (event: AppEvent) => void;
```

API contracts:
- `GET /api/apps` → `200 OK` `AppEntry[]`
- `POST /api/apps` body `{ url, name?, browser? }` → SSE `AppEvent` stream, final `data` = `AppEntry`
- `DELETE /api/apps/:name` → SSE `AppEvent` stream, final `data` = `AppEntry`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `createApp`, `removeApp`, `listApps` event sequences | Vitest with mocked services |
| Unit | `sseAdapter` event→SSE conversion | Vitest |
| Integration | API endpoints (JSON + SSE) | Vitest, Hono test client |
| E2E | Frontend renders SSE progress | Manual or Playwright (deferred) |

## Migration / Rollout

Extract file deletion from `AppRegistry.remove` into core `removeApp` so each step can emit events. Add `unregister()` for JSON-only removal; keep `remove()` as backward-compatible wrapper. `createApp` becomes `Promise<AppEntry>` with optional `onEvent`; CLI adapters pass nothing and preserve console output. No registry data migration needed.

## Open Questions

- [ ] Does `AppRegistry.remove` stay as backward-compat wrapper, or do we remove it after CLI handlers migrate to core functions?
- [ ] Should the frontend use URL hash routing or a simple view switcher in `App.svelte`? (No external deps for router — likely switcher)
