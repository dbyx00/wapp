# Proposal: Native Windows Packaging for WApp

## Intent

Package WApp as a native Windows desktop application so non-technical users can install and run it without Node.js, terminal commands, or UAC prompts.

## Scope

### In Scope
- Centralize hardcoded "wapp"/"WApp" identity into `src/config/app.ts`
- Bundle with esbuild and package as Node SEA single executable
- Fix `process.cwd()` in `server.ts` and dynamic import in `wappCommand.ts` for bundled context
- Build Inno Setup per-user installer (`PrivilegesRequired=lowest`)
- Build MSIX package for Microsoft Store distribution
- GitHub Actions CI to build exe, installer, and MSIX
- SmartScreen mitigation via SignPath Foundation OSS signing

### Out of Scope
- System tray or background daemon
- Auto-updater (Store handles updates)
- EV code signing (paid)

## Capabilities

### New Capabilities
- `native-packaging`: App identity config, esbuild + Node SEA bundling, exe-relative path resolution
- `windows-installer`: Inno Setup per-user installer with Start Menu and desktop shortcuts
- `store-distribution`: MSIX packaging, Store manifest, and submission assets
- `release-automation`: GitHub Actions workflow for building and publishing installer/MSIX

### Modified Capabilities
- `web-ui`: `server.ts` static root resolves relative to exe when bundled; no behavior change in dev

## Approach

Use esbuild to bundle the TypeScript CLI into a single JS file, then `node --build-sea` to produce `dist/wapp.exe`. Place `dist/public` next to the exe at install time. `server.ts` uses `node:sea` `isSea()` to switch from `process.cwd()` to `dirname(process.execPath)`. Inno Setup installs to `%LOCALAPPDATA%\Programs\WApp` with zero UAC. MSIX wraps the same exe for Store distribution. SignPath Foundation signs the exe for trust.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/config/app.ts` | New | Single source of truth for name, slug, version, description, dataDir |
| `src/config/paths.ts` | Modified | Reads dataDir from `app.ts` instead of hardcoded `'WApp'` |
| `src/api/server.ts` | Modified | Static root uses exe-relative path when `isSea()` |
| `src/cli/wappCommand.ts` | Modified | Dynamic import inlined by esbuild; identity from `app.ts` |
| `src/cli/*.ts` | Modified | User-facing strings reference `app.ts` identity |
| `package.json` | Modified | Add `esbuild`, SEA build scripts |
| `sea-config.json` | New | Node SEA configuration |
| `installer/wapp.iss` | New | Inno Setup script |
| `.github/workflows/release.yml` | New | CI build for exe, installer, MSIX |
| `README.md` | Modified | Store badge, SmartScreen disclaimer |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `serveStatic` breaks in bundled exe | High | Resolve public dir via `process.execPath`; place assets on disk |
| Dynamic import not inlined by esbuild | Med | Use string-literal dynamic import; esbuild resolves these |
| MSIX packaging complexity | Med | Use `makeappx` CLI; keep manifest minimal |
| SmartScreen still warns | High | SignPath OSS signing; Store MSIX avoids it entirely |

## Rollback Plan

1. Delete `src/config/app.ts`, `sea-config.json`, `installer/`, `.github/workflows/release.yml`
2. Revert `server.ts`, `wappCommand.ts`, `paths.ts`, `package.json`, `README.md`
3. Remove `esbuild` dependency

## Dependencies

- esbuild
- Inno Setup 6 (local dev + CI via chocolatey)
- Windows SDK / makeappx (for MSIX)
- SignPath Foundation account

## Success Criteria

- [ ] `npm run build:exe` produces `dist/wapp.exe`
- [ ] `dist/wapp.exe web` serves frontend and opens browser
- [ ] Inno Setup installer runs with no UAC prompt
- [ ] MSIX installs from Microsoft Store without SmartScreen
- [ ] GitHub Release contains `.exe` installer and `.msix`
- [ ] Changing app identity requires editing only `src/config/app.ts`
