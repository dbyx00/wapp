# Exploration: Native Windows Packaging for WApp

## 1. Codebase Map

### Entry Points
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/cli/wappCommand.ts` | CLI entry (Commander). Registers `create`, `list`, `remove`, `web` commands | Must become the **tray-aware launcher** for the packaged app |
| `src/api/server.ts` | Hono server. Serves API + static frontend + opens browser | Static file serving uses `process.cwd()` — **will break in a single exe** |
| `src/index.ts` | Barrel exports | Not used as entry point in CLI mode |

### Core Modules
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/core/createApp.ts` | Orchestrates app creation pipeline | No issues — pure TypeScript |
| `src/core/removeApp.ts` | Orchestrates app removal | No issues |
| `src/core/listApps.ts` | Lists installed apps | No issues |

### API Layer
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/api/routes/apps.ts` | Hono routes (GET, POST, DELETE) | No issues |
| `src/api/adapters/sseAdapter.ts` | SSE streaming for progress events | No issues |

### Services
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/services/appRegistry.ts` | In-memory + JSON persistence | Writes to `%APPDATA%/WApp/registry.json` — **safe per-user path** |
| `src/services/registryPersistence.ts` | JSON file I/O | Uses `fs` module — safe |
| `src/services/browserResolver.ts` | Finds browser exe paths | Reads `ProgramFiles`, `LOCALAPPDATA` — safe |
| `src/services/metadataResolver.ts` | Fetches HTML title via `fetch()` | Uses `cheerio` (see below) |
| `src/services/iconResolver/index.ts` | Icon discovery & download | Pure JS, downloads to `%APPDATA%/WApp/icons/` — safe |
| `src/services/iconResolver/discovery.ts` | HTML regex + manifest parsing | No issues |
| `src/services/iconResolver/download.ts` | Download & type detection | No issues |
| `src/services/iconResolver/defaultIcon.ts` | Creates placeholder ICO | No issues |
| `src/services/fileService.ts` | Safe file deletion | No issues |

### Windows Layer
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/windows/shortcutCreator.ts` | Creates `.lnk` via PowerShell COM | Calls `powershell.exe` — **works in bundled exe** but requires PowerShell |

### Web Frontend
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/web/main.ts` | Svelte 5 mount point | Built to `dist/public/` by Vite |
| `src/web/App.svelte` | Root component | No issues |
| `src/web/views/*.svelte` | List, Create, Remove views | No issues |
| `src/web/api/client.ts` | Fetch wrapper for `/api/apps` | No issues |
| `src/web/stores/apps.svelte.ts` | Svelte 5 runes state | No issues |

### Config & Utilities
| File | Role | Packaging Impact |
|------|------|----------------|
| `src/config/paths.ts` | Defines `REGISTRY_DIR`, `ICONS_DIR` in `%APPDATA%` | **Safe — no elevation needed** |
| `src/config/browsers.ts` | Browser path configs | No issues |
| `src/utils/debug.ts` | Conditional logging | No issues |
| `src/utils/sanitize.ts` | Filename sanitization | No issues |
| `src/utils/url.ts` | URL validation | No issues |

### Build Config
| File | Role | Packaging Impact |
|------|------|----------------|
| `package.json` | Scripts, deps, bin entry | `bin` points to `./dist/cli/wappCommand.js` |
| `tsconfig.json` | CommonJS output, ES2020 target, excludes `src/web/**/*` | **Frontend must be pre-built by Vite** |
| `vite.config.mts` | Svelte + Tailwind build, outputs to `dist/public` | `server.proxy` is dev-only; **production uses Hono serveStatic** |

---

## 2. Packaging Option Comparison

### Node SEA (Single Executable Applications)
- **Status**: Built into Node 20+, CLI flag `--build-sea` added in v25.5.0, backported to v22.20.0 and v20.12.0
- **How it works**: Bundles a JS blob into a copy of the `node.exe` binary
- **Assets**: Supports embedding static files via `assets` config, accessible via `node:sea` API
- **require()**: In the injected script, `require()` can only load built-in modules by default. You can create a file-system-capable require via `module.createRequire(__filename)` if you need to load `.node` addons from temp files
- **Native modules**: Can be bundled as assets, extracted to temp, loaded via `process.dlopen()`
- **ESM/CJS**: Supports both. `mainFormat: "commonjs"` or `"module"`. Snapshot not compatible with ESM
- **Hono serveStatic**: The built-in `serveStatic` from `@hono/node-server` reads from the filesystem. In SEA, the static files must either be:
  - Embedded as SEA assets and served via a custom middleware using `sea.getAsset()`
  - Extracted to a temp directory on first run and served from there
- **Size**: ~80MB (node.exe + blob)

**Pros for WApp**:
- Official Node.js feature, actively maintained
- No external bundler tool needed (Node 25+), or just `postject` for older versions
- Asset embedding built-in
- Works with Node 22 LTS

**Cons for WApp**:
- `serveStatic` won't work out of the box with embedded assets — requires custom middleware
- `__dirname` becomes `dirname(process.execPath)` — may break path assumptions
- `process.cwd()` in `server.ts` line 36 will point to wherever the exe was launched from, not where the static files are

**Verdict**: **Viable but requires path refactoring**. Best long-term option.

---

### pkg (by Vercel)
- **Status**: Mature, widely used, but maintenance has slowed. Supports Node 18-20 well, Node 22+ support is community-driven
- **How it works**: Bundles Node.js runtime + source into a single executable via `pkg .`
- **Assets**: Supports `