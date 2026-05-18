# Proposal: Web UI for WApp

## Intent

Add a browser-based UI so non-technical users can create, list, and remove WApps without using the CLI. The CLI remains fully functional; the web UI is an additional adapter.

## Scope

### In Scope
- Event-driven core refactor: `createApp`, `list`, `remove` emit typed step events
- Hono HTTP API with SSE streaming for all operations
- Svelte 5 SPA with shadcn-svelte components and Tailwind CSS
- `wapp web` command to start server, serve static files, and open browser
- Icons served statically from `%APPDATA%/WApp/icons/`

### Out of Scope
- Authentication or multi-user support
- Remote/network access (localhost only)
- Real-time collaboration or WebSocket push beyond SSE

## Capabilities

### New Capabilities
- `web-ui`: Hono REST API (`/api/apps`) + SSE streams + Svelte 5 frontend with create, list, remove views
- `event-driven-core`: Typed `AppEvent` system and `OnEvent` callback for all domain operations

### Modified Capabilities
- `app-creation`: `createApp` returns `Promise<AppEntry>` and accepts optional `onEvent` callback; CLI adapter preserves console output

## Approach

Refactor the core to emit typed events through an optional callback. Build a Hono server that injects an SSE-streaming `onEvent` into each operation. Build a Svelte 5 SPA that consumes SSE to render live step progress. Use shadcn-svelte for accessible UI primitives (Card, Button, Dialog, Toast, Progress). Vite builds the frontend; Hono serves `dist/public/` and binds to `127.0.0.1` only.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/events.ts` | New | `AppEvent` union type and `OnEvent` callback type |
| `src/core/createApp.ts` | Modified | Accept `onEvent`, return `AppEntry`, emit step events |
| `src/cli/` | Modified | Adapters map events to `console.log` |
| `src/api/` | New | Hono server, routes, SSE streaming, error handling |
| `src/web/` | New | Svelte 5 entry, components, stores, API client |
| `package.json` | Modified | Add `hono`, `@hono/node-server`, `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`, `tailwindcss`, `shadcn-svelte` deps |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Build toolchain bifurcation (`tsc` + Vite) | Med | Frontend isolated in `src/web/`; Vite handles its own TS compilation |
| Port 3000 conflict | Low | Auto-increment or clear error message |
| CLI regression from `createApp` refactor | Low | `onEvent` is optional; existing CLI tests pass unchanged |
| Local server exposed externally | Low | Bind to `127.0.0.1` only; no `0.0.0.0` |

## Rollback Plan

1. Revert `src/core/createApp.ts` to void return and `console.log` only.
2. Delete `src/api/`, `src/web/`, `src/domain/events.ts`.
3. Remove new dependencies from `package.json`.
4. Remove `web` command from CLI.

## Dependencies

- Node.js 18+ (for `fetch` and modern APIs)
- Windows runtime (shortcut creation and registry paths are Windows-specific)

## Success Criteria

- [ ] `wapp web` starts server on `localhost:3000` and opens browser
- [ ] Users can create an app through the UI with live progress steps
- [ ] Users can list and remove apps through the UI
- [ ] CLI commands `create`, `list`, `remove` continue to work identically
- [ ] Server binds only to `127.0.0.1`
