# Native Packaging Specification

## Purpose

Define app identity centralization, esbuild bundling, Node SEA packaging, and exe-relative path resolution for WApp.

## Requirements

### Requirement: App Identity Centralization

The system MUST maintain a single source of truth for app identity in `src/config/app.ts`.

| Field       | Source of Truth | Consumers                          |
|-------------|-----------------|------------------------------------|
| name        | app.ts          | CLI strings, installer, MSIX       |
| slug        | app.ts          | package.json scripts, file names   |
| version     | app.ts          | CLI --version, manifests           |
| description | app.ts          | installer, Store listing             |
| dataDir     | app.ts          | paths.ts, runtime data location    |

#### Scenario: Identity change propagates

- GIVEN `src/config/app.ts` is edited
- WHEN the build pipeline runs
- THEN all artifacts reflect the new identity without additional edits

### Requirement: esbuild Bundling

The system MUST bundle `src/cli/wappCommand.ts` and all dependencies into a single `dist/bundle.js`.

#### Scenario: Bundle includes dynamic import

- GIVEN `wappCommand.ts` uses `await import('../api/server')`
- WHEN esbuild runs
- THEN the bundle inlines the server module and its dependencies

#### Scenario: No native module errors

- GIVEN all dependencies are pure JavaScript
- WHEN the bundle is executed
- THEN no `.node` file resolution errors occur

### Requirement: Node SEA Executable

The system MUST produce `dist/wapp.exe` via `node --build-sea` from `sea-config.json`.

#### Scenario: SEA build succeeds

- GIVEN `npm run build:exe` is executed
- THEN `dist/wapp.exe` exists and `wapp.exe --version` prints the app version

#### Scenario: SEA runs without Node.js installed

- GIVEN a Windows machine without Node.js
- WHEN `wapp.exe create https://example.com` runs
- THEN the command completes successfully

### Requirement: Exe-Relative Path Resolution

The system MUST resolve static and data paths relative to `process.execPath` when running inside a SEA.

#### Scenario: Public folder resolved next to exe

- GIVEN `wapp.exe` is in `C:\Apps\` with a `public\` subfolder
- WHEN `wapp.exe web` serves the frontend
- THEN files are read from `C:\Apps\public\`

#### Scenario: Dev mode unchanged

- GIVEN `npm run dev` starts the server
- WHEN static files are requested
- THEN they resolve from `process.cwd()/dist/public`
