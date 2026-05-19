## Exploration: Web UI for WApp

### Current State

WApp is a TypeScript CLI tool built on Clean Architecture with four distinct layers:

- **Domain** (`src/domain/`): `AppEntry`, `BrowserName`, `IAppRegistry` interface
- **Services** (`src/services/`): `AppRegistry` (file-backed persistence), `browserResolver`, `metadataResolver`, `iconResolver`
- **Core** (`src/core/createApp.ts`): Orchestrator that validates URL → resolves browser → fetches metadata → downloads icon → creates Windows shortcut → registers app
- **CLI** (`src/cli/`): Commander-based commands (`create`, `list`, `remove`) that instantiate `AppRegistry` and call core/services directly

`src/index.ts` already barrel-exports all public APIs, making it an ideal integration point for a new API layer.

**Build & runtime constraints:**
- Pure `tsc` (CommonJS, ES2020 target). No bundler.
- Runtime deps: `commander`, `cheerio` only.
- Tests: Vitest. No frontend testing infrastructure.
- `createApp` logs progress via `console.log`; it has no async progress callback or stream mechanism.

### Affected Areas

- `src/core/createApp.ts` — Must accept an optional progress callback to stream creation steps to the UI instead of only `console.log`.
- `src/index.ts` — Will likely need to export new API types (e.g., `JobProgress`, `CreateAppPayload`).
- `package.json` — New runtime dependencies (Express or Fastify, optionally `cors`) and dev dependencies (Vite, Tailwind, frontend framework).
- `tsconfig.json` — Current `include: ["src/**/*"]` and CommonJS output may need a separate `tsconfig.web.json` for frontend code, or frontend can be built entirely by Vite (which handles its own TS compilation).
- **New `src/api/`** — HTTP server bootstrap, route handlers, error middleware, SSE progress stream.
- **New `src/web/`** — Frontend entry point, pages/components, state store, API client.
- **New CLI command** — `wapp web` (or `wapp ui`) to start the server and open the browser.

### Approaches

| Approach | Description | Pros | Cons | Effort |
|----------|-------------|------|------|--------|
| **A. Express + HTMX + Tailwind** | Server-rendered HTML with HTMX for AJAX. No frontend build step. | Zero frontend bundling; leverages existing Node.js skills; extremely fast to implement. | Harder to achieve rich, modern UX (animations, complex state, optimistic UI); progress streaming via SSE is possible but less ergonomic. | Low |
| **B. Express REST + Preact + Vite + Tailwind** | Lightweight SPA. Preact is React-compatible (~3kb). Vite builds the frontend. Tailwind for styling. | Excellent UX possible (hooks, components, transitions); tiny runtime; huge ecosystem (Radix, etc.); Vite is fast and familiar. | Requires adding Vite to a `tsc`-only project; two build steps (tsc for backend, Vite for frontend). | Medium |
| **C. Express REST + SolidJS + Vite + Tailwind** | Similar to B but with SolidJS (no VDOM, signals-based). | Even smaller and faster than Preact; exceptional performance; fine-grained reactivity is great for live progress updates. | Smaller ecosystem than React/Preact; less hiring familiarity. | Medium |
| **D. Express REST + Vanilla TS + Vite + Tailwind** | No framework. Direct DOM manipulation. Small state library (Zustand/Valtio) if needed. | Absolute minimum overhead; no framework lock-in; perfectly adequate for a 3-view CRUD app. | Manual DOM management can become messy if UI complexity grows; reusable component patterns are DIY. | Low-Medium |
| **E. Fastify + tRPC + React + Vite** | Type-safe end-to-end API with Fastify and tRPC. | Type-safe API calls; Fastify is faster than Express; excellent DX. | tRPC adds complexity and bundle size; overkill for ~3 endpoints; Fastify learning curve if unfamiliar. | Medium-High |
| **F. Electron / Tauri** | Native desktop wrapper instead of browser-based UI. | Native window feel; no browser required. | Fundamentally changes product nature; heavy runtime (Electron) or Rust dependency (Tauri); massive scope increase. | High |

### Recommendation

**Primary: Approach B — Express REST API + Preact + Vite + Tailwind CSS**

Rationale:
1. **UX priority**: Preact gives us React’s component model, hooks, and ecosystem. We can build polished cards, skeleton loaders, inline error messages, and smooth progress bars. Tailwind enables rapid, modern styling without writing custom CSS.
2. **Lightweight**: Preact’s runtime is ~3kb. The total frontend bundle will be under 50kb gzipped easily.
3. **Fast to build**: Vite’s dev server and HMR are industry-standard. A developer familiar with React can be productive in minutes.
4. **Ecosystem**: Access to headless UI primitives (e.g., Radix via Preact-compat) if we need accessible modals, dropdowns, etc.
5. **Backend simplicity**: Express is familiar, stable, and sufficient for a local-only server with 3 REST endpoints + 1 SSE stream.

**Alternative: Approach D — Vanilla TS + Vite + Tailwind** if the team wants to avoid any framework runtime entirely. For a Create/List/Remove app this is viable, but the progressive enhancement and component reuse of Preact outweigh the ~3kb cost.

**API Design:**
- `GET /api/apps` → list all apps
- `POST /api/apps` → start creation (returns `{ jobId }`)
- `DELETE /api/apps/:name` → remove app
- `GET /api/progress/:jobId` → SSE stream of creation steps

**Progress Streaming:**
Add an optional `onProgress(step: string, message: string)` callback to `CreateAppOptions`. The API layer injects it and forwards events over SSE. The CLI continues to work unchanged (callback omitted).

**Integration:**
- `wapp web` starts Express on `localhost:3000`, serves Vite-built static files from `dist/public/`, and opens the default browser.
- Icons are served via a static route mapping to `%APPDATA%/WApp/icons/`.

### Risks

1. **Build toolchain bifurcation**: Moving from pure `tsc` to `tsc + Vite` adds complexity. Mitigation: keep frontend code in `src/web/` and let Vite handle it independently.
2. **Progress callback refactor**: `createApp` currently relies on `console.log`. Adding a callback must not break CLI behavior. Mitigation: make the callback optional and keep console fallback.
3. **Long-running server lifecycle**: The web server is a foreground process. Need graceful shutdown (Ctrl+C) and clear user messaging.
4. **Port conflicts**: If `:3000` is taken, the server should auto-increment or fail with a clear message.
5. **Security**: Local server MUST bind to `127.0.0.1` only; never `0.0.0.0`.
6. **File serving across layers**: Serving icons from `%APPDATA%` requires Express static middleware pointing outside the project root. Windows path handling must be correct.

### Ready for Proposal

**Yes.** The codebase is well-structured (Clean Architecture, barrel exports, clear interfaces) and the scope is well-defined (3 CLI features → 3 API endpoints + 1 SSE stream). The orchestrator can proceed to `sdd-propose` with the recommended stack: **Express + Preact + Vite + Tailwind CSS**.
