# Exploration: Native Windows Packaging for WApp

## Current State

WApp is a TypeScript CLI + web UI application that converts URLs into installable Windows web app shortcuts. It currently runs via `npm start` or `wapp web`, which starts a Hono server on localhost. The architecture is:

- **CLI entry**: `src/cli/wappCommand.ts` (Commander.js) — handles `create`, `list`, `remove`, `web` commands.
- **API server**: `src/api/server.ts` — Hono + `@hono/node-server`, serves API routes and static frontend files from `dist/public`.
- **Frontend**: Svelte 5 + Tailwind CSS, built by Vite to `dist/public`.
- **Windows operations**: `src/windows/shortcutCreator.ts` uses PowerShell COM to create `.lnk` files in the Start Menu.
- **Data storage**: Registry JSON and icons stored in `%APPDATA%/WApp` — already user-writable, no admin needed.
- **Browser resolution**: Checks `LOCALAPPDATA`, `ProgramFiles`, `ProgramFiles(x86)` for Brave, Chrome, Edge.

To distribute this to non-technical Windows users, the app must be packaged as a standalone executable and installed without triggering UAC or unnecessary permission dialogs.

---

## Affected Areas

| File | Role | Packaging Impact |
|------|------|------------------|
| `src/api/server.ts` | Hono server, static file serving, browser launcher | **CRITICAL**: `process.cwd()` used for static files (line 36). Must resolve relative to executable location when bundled. |
| `src/cli/wappCommand.ts` | CLI entry point | **CRITICAL**: Dynamic `import('../api/server')` (line 58). Bundler must inline or resolve this. |
| `src/config/paths.ts` | Data paths (`%APPDATA%/WApp`) | No change needed — already user-writable. |
| `src/config/browsers.ts` | Browser search paths | No change needed — uses env vars correctly. |
| `src/windows/shortcutCreator.ts` | PowerShell shortcut creation | No change needed — `execSync` works from any exe context. |
| `package.json` | Dependencies, scripts | Must add bundler + SEA build scripts. |
| `vite.config.mts` | Frontend build config | No change needed for backend packaging, but `dist/public` must be included in installer. |
| `tsconfig.json` | CJS output, `outDir: ./dist` | Compatible with SEA. May need bundler step before SEA. |

---

## Packaging Option Comparison

| Approach | Pros | Cons | Effort | Verdict |
|----------|------|------|--------|---------|
| **Node SEA** (official, Node 20+) | Built-in, no external tools; supports assets; works with all current deps; `__dirname` maps to exe dir; Microsoft-supported future path. | Requires bundling to single JS first; `serveStatic` needs disk-based path (assets are embedded, not on disk); dynamic imports need bundler resolution. | Medium | **RECOMMENDED** |
| **pkg (Vercel)** | Mature virtual filesystem (`/snapshot/`); `serveStatic` works with `__dirname` out of the box; cross-platform builds. | **DEPRECATED** (archived Jan 2024, last release 5.8.1); no Node 22+ support; dead project. | Low | **REJECTED** — deprecated |
| **nexe** | Alternative to pkg; resource embedding; custom patches. | Less maintained than pkg; complex build pipeline; no Node 22 prebuilts readily available. | High | **REJECTED** — too complex |
| **Bun compile** | Truly single file; full-stack asset embedding; fast; Windows metadata (icon, hideConsole). | Requires migrating from `@hono/node-server` to `Bun.serve()`; potential compatibility issues with PowerShell `execSync`, Windows env vars; adds Bun as build + runtime dependency. | High | **RISKY** — runtime migration required |

### Why Node SEA is the right choice

1. **Zero runtime migration risk**: WApp uses `@hono/node-server`, `child_process`, `fs`, and `path` — all Node APIs. SEA is literally Node.js, so 100% compatibility is guaranteed.
2. **No dead dependencies**: `pkg` is archived. Relying on it is technical debt.
3. **Official support**: SEA is actively developed by the Node.js project, with new features in every release.
4. **Asset strategy is solvable**: The static file challenge is addressed by placing `dist/public` next to the exe (installer-managed) and resolving paths via `__dirname`/`process.execPath`.

---

## Installer Recommendation

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Inno Setup** | Free, mature, Pascal scripting; `PrivilegesRequired=lowest` for zero-UAC per-user installs; `{userstartup}` for auto-start; `{userprograms}` for Start Menu; excellent docs. | Pascal syntax is niche (but simple). | **RECOMMENDED** |
| **NSIS** | Also free, very flexible. | More complex scripting; steeper learning curve; less "batteries included" for modern installers. | Rejected — complexity |
| **WiX / MSI** | "Official" Windows installer format; integrates with Group Policy. | Heavy XML tooling; MSI often triggers UAC by default; overkill for a single-user CLI app. | Rejected — overkill |

### Inno Setup per-user strategy

```pascal
[Setup]
PrivilegesRequired=lowest
DefaultDirName={localappdata}\Programs\WApp
DisableProgramGroupPage=no
DefaultGroupName=WApp

[Files]
Source: "dist\wapp.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{userprograms}\WApp\WApp Manager"; Filename: "{app}\wapp.exe"; Parameters: "web"
Name: "{userdesktop}\WApp Manager"; Filename: "{app}\wapp.exe"; Parameters: "web"; Tasks: desktopicon
Name: "{userstartup}\WApp Manager"; Filename: "{app}\wapp.exe"; Parameters: "web"; Tasks: startup

[Run]
Filename: "{app}\wapp.exe"; Parameters: "web"; Description: "Launch WApp"; Flags: postinstall nowait skipifsilent
```

**Key points**:
- `{localappdata}` resolves to `%LOCALAPPDATA%` — no UAC, no admin, fully writable.
- `PrivilegesRequired=lowest` prevents the UAC shield from ever appearing.
- `{userstartup}` adds to the current user's Startup folder — no registry, no UAC.
- The installer itself is a single `.exe` that extracts the app. Windows may show a SmartScreen warning on the **installer** (see below), but never a UAC prompt.

---

## Windows Permissions & Trust Strategy

### Per-user install (no UAC)
- Install directory: `%LOCALAPPDATA%\Programs\WApp` — writable by the current user without elevation.
- Data directory: `%APPDATA%\WApp` (already used for registry + icons) — writable without elevation.
- Startup: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` — writable without elevation.
- **Result**: No UAC prompt at any stage.

### SmartScreen and "Windows protected your PC"
- **The hard truth**: A brand-new, unsigned `.exe` downloaded from the internet **will** trigger Windows SmartScreen on first run. There is no free or cheap way to fully avoid this.
- **Code signing options**:
  - **None**: SmartScreen warning. Users click "More info" → "Run anyway". This is acceptable for open-source tools.
  - **Self-signed certificate**: Does NOT help SmartScreen. Windows ignores self-signed certs for reputation.
  - **Standard (OV) code signing**: Reduces but does not eliminate SmartScreen warnings. Reputation still needs to build over time.
  - **EV (Extended Validation) code signing**: The only way to bypass SmartScreen immediately. Costs ~$200–700/year. Overkill for v0.1.0.
- **Mitigations without paying**:
  1. Distribute via GitHub Releases (reputable domain).
  2. Include clear installation instructions with screenshots of the SmartScreen bypass.
  3. Embed proper version info (file description, company name, version) in the `.exe` — this increases user trust even if SmartScreen triggers.
  4. Build reputation over time: as more users download and run the file, SmartScreen learns to trust it.

### Code signing recommendation for this project
- **Phase 1 (now)**: No code signing. Accept SmartScreen warning. Focus on functionality.
- **Phase 2 (future)**: Consider a cheap OV certificate (~$70/year from Sectigo/Comodo) to start building reputation.
- **Phase 3 (if popular)**: EV certificate if the user base justifies the cost.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **`process.cwd()` breaks static files** | High | High | Change `server.ts` to resolve `dist/public` relative to `__dirname` / `process.execPath`. Use `node:sea` `isSea()` to detect bundled mode. |
| **Dynamic `import('../api/server')` not resolved by bundler** | Medium | High | Use `esbuild` or `rollup` to bundle. String-literal dynamic imports are resolved by esbuild. Alternatively, convert to static import guarded by `if (command === 'web')`. |
| **`serveStatic` incompatible with virtual filesystem** | Medium | Medium | With SEA, `serveStatic` reads from disk. Solution: place `dist/public` on disk next to exe (installer handles this). Do NOT embed static files as SEA assets. |
| **Cheerio or deps have hidden native modules** | Low | High | Verified: cheerio 1.0.0 and all sub-deps (htmlparser2, parse5, domutils) are pure JavaScript. No `.node` files found. |
| **PowerShell execution blocked by ExecutionPolicy** | Low | Medium | Already handled: `powershell -ExecutionPolicy Bypass` is used in `shortcutCreator.ts`. Works from any exe context. |
| **Inno Setup compiler not available in CI** | Medium | Low | Inno Setup can be installed in GitHub Actions via `choco install innosetup`. Build script runs `iscc` to compile `.iss` → `.exe`. |
| **Bun compile temptation** | N/A | N/A | Resist. Migrating from Node to Bun runtime for a Windows-specific tool is unnecessary risk. Node SEA is the pragmatic path. |
| **SmartScreen scares users** | Certain | Medium | Document clearly. Use reputable host (GitHub). Embed version metadata. Accept it for unsigned v0.1.0. |

---

## Recommended Approach

### Phase 1: Bundle + SEA

1. **Add a bundler** (e.g., `esbuild`) to create a single `dist/bundle.js` from `src/cli/wappCommand.ts`.
   - Bundle all dependencies (hono, commander, cheerio, etc.).
   - Handle the dynamic `import('../api/server')` — esbuild resolves string-literal dynamic imports automatically.
   - Output format: CommonJS (matches current `tsconfig.json`).

2. **Fix `server.ts` static file root**:
   ```ts
   import { isSea } from 'node:sea';
   import { dirname } from 'path';
   
   const publicDir = isSea()
     ? join(dirname(process.execPath), 'public')
     : join(process.cwd(), 'dist/public');
   
   app.use('/*', serveStatic({ root: publicDir }));
   ```
   *(Note: `__dirname` in SEA equals `dirname(process.execPath)`, so either works.)*

3. **Build SEA executable**:
   ```json
   // sea-config.json
   {
     "main": "dist/bundle.js",
     "output": "dist/wapp.exe",
     "disableExperimentalSEAWarning": true,
     "useCodeCache": true
   }
   ```
   ```bash
   node --build-sea sea-config.json
   ```

4. **Frontend build**:
   ```bash
   npm run build:web   # Vite builds to dist/public
   ```

### Phase 2: Inno Setup Installer

1. Create `installer/wapp.iss` with:
   - `PrivilegesRequired=lowest`
   - `DefaultDirName={localappdata}\Programs\WApp`
   - Installs `wapp.exe` + `public/` folder.
   - Creates Start Menu shortcut (`wapp.exe web`).
   - Optional desktop icon.
   - Optional startup shortcut (`{userstartup}`).
   - Post-install launch.

2. Build installer in CI or locally:
   ```bash
   "C:\Program Files (x86)\Inno Setup 6\iscc.exe" installer/wapp.iss
   ```

### Phase 3: Distribution

- GitHub Releases hosts `WApp-Setup-0.1.0.exe`.
- Users download, double-click, install per-user, no UAC.
- On first run of the installer or the app, SmartScreen may appear. Users click "More info" → "Run anyway".

---

## Ready for Proposal

**Yes.**

The orchestrator should tell the user:
- The app will be bundled with **esbuild**, packaged with **Node SEA**, and distributed via an **Inno Setup** per-user installer.
- **Zero UAC prompts** are achievable with per-user install to `%LOCALAPPDATA%`.
- **SmartScreen cannot be fully avoided** without paying for an EV certificate, but it is manageable for an open-source v0.1.0 tool.
- The only code changes required are: (1) fixing the static file path in `server.ts`, and (2) adding a bundler + SEA build step.
- No system tray will be implemented (explicitly excluded).
