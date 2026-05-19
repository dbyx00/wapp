# Design: Native Windows Packaging for WApp

## Technical Approach

Bundle the CLI with esbuild into `dist/bundle.js`, package as Node SEA (`dist/wapp.exe`), and place `dist/public` next to the exe. `server.ts` uses `node:sea` `isSea()` to switch static root from `process.cwd()` to `dirname(process.execPath)`. Inno Setup per-user install to `%LOCALAPPDATA%\Programs\WApp` with zero UAC. MSIX wraps the same exe for Store distribution. SignPath Foundation signs the exe for trust.

## Architecture Decisions

| Decision | Options | Tradeoffs | Chosen |
|---|---|---|---|
| Bundler | esbuild, rollup, webpack | esbuild resolves string-literal dynamic imports automatically; no plugin config needed | esbuild |
| SEA tool | Node SEA, pkg, nexe, Bun | Node SEA is official, actively maintained, 100% Node API compat; pkg is deprecated | Node SEA |
| Installer | Inno Setup, NSIS, WiX | Inno Setup supports `PrivilegesRequired=lowest` out of the box; chocolatey in CI | Inno Setup |
| Store format | MSIX, exe | MSIX is required for Microsoft Store; Store-signed MSIX bypasses SmartScreen | MSIX |
| Signing | SignPath OSS, self-signed, none | SignPath is free for OSS and provides CA-trusted certs; self-signed doesn't help SmartScreen | SignPath (best-effort) |

## 1. App Identity Config

```ts
// src/config/app.ts
export const APP = {
  name: 'WApp', namePlural: 'WApps', slug: 'WApp',
  version: '0.1.0',
  description: 'Windows Web App Installer - Convert URLs into installable Windows apps',
  dataDir: 'WApp',
} as const;
```

**Consumers**: `paths.ts` (dataDir), CLI strings (`create.ts`, `list.ts`, `remove.ts`, `wappCommand.ts`), `sea-config.json`, `installer/wapp.iss`, `msix/AppxManifest.xml`, `.github/workflows/release.yml`. Changing identity requires editing only `app.ts`; a build script (`scripts/render-manifests.js`) injects values into `.iss` and `.xml` templates.

## 2. esbuild Bundling Pipeline

**Entry**: `src/cli/wappCommand.ts`
**Config**: `esbuild src/cli/wappCommand.ts --bundle --platform=node --target=node22 --outfile=dist/bundle.js --format=cjs`

- `--platform=node` ensures built-ins are externalized correctly.
- `--bundle` inlines the dynamic `import('../api/server')` because it uses a string literal.
- Cheerio and all deps are pure JS — no `.node` files.

**New scripts**:
- `build:bundle`: runs esbuild
- `build:web`: existing Vite build to `dist/public`

## 3. Node SEA Configuration

```json
// sea-config.json
{ "main": "dist/bundle.js", "output": "dist/wapp.exe",
  "disableExperimentalSEAWarning": true, "useCodeCache": true }
```

**Build script** (`scripts/build-exe.js`):
```js
const { execSync } = require('child_process');
execSync('node --build-sea sea-config.json', { stdio: 'inherit' });
// node.exe is copied to dist/ by --build-sea; rename not needed
```

`dist/public` is NOT embedded in the SEA blob — SEA cannot embed a filesystem. The installer/MSIX places `public/` next to `wapp.exe` at install time.

**New scripts**:
- `build:exe`: `node scripts/build-exe.js`
- `build:all`: `npm run build:web && npm run build:bundle && npm run build:exe`

## 4. Exe-Relative Path Resolution

**Change in `src/api/server.ts`**:

```ts
import { isSea } from 'node:sea';
const publicDir = isSea()
  ? join(dirname(process.execPath), 'public')
  : join(process.cwd(), 'dist/public');
if (isSea() && !existsSync(publicDir)) {
  console.error(`Public directory not found at ${publicDir}`);
}
app.use('/*', serveStatic({ root: publicDir }));
```

- `isSea()` is the **only** branching point between dev and bundled behavior.
- `serveStatic` root changes from `dist/public` (dev) to `public/` (SEA).
- Missing `public/` in SEA mode logs an error and serves 404s.

```
Dev:  process.cwd() + '/dist/public'  →  serveStatic
SEA:  dirname(process.execPath) + '/public'  →  serveStatic
```

## 5. Inno Setup Installer

`installer/wapp.iss` (full script):

```pascal
#define AppName "WApp"
#define AppVersion "0.1.0"
#define AppSlug "WApp"
#define AppExeName "wapp.exe"

[Setup]
AppName={#AppName}
AppVersion={#AppVersion}
AppId={{{#AppSlug}}
PrivilegesRequired=lowest
DefaultDirName={localappdata}\Programs\{#AppSlug}
DisableProgramGroupPage=no
DefaultGroupName={#AppName}
OutputDir=dist
OutputBaseFilename=WApp-Setup-{#AppVersion}
SetupIconFile=installer\assets\wapp.ico
UninstallDisplayIcon={app}\{#AppExeName}

[Files]
Source: "dist\wapp.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{userprograms}\{#AppName}\{#AppName} Manager"; Filename: "{app}\{#AppExeName}"; Parameters: "web"
Name: "{userdesktop}\{#AppName} Manager"; Filename: "{app}\{#AppExeName}"; Parameters: "web"; Tasks: desktopicon
Name: "{userstartup}\{#AppName} Manager"; Filename: "{app}\{#AppExeName}"; Parameters: "web"; Tasks: startup

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"
Name: "startup"; Description: "Run at &Windows startup"; GroupDescription: "Additional icons:"

[Run]
Filename: "{app}\{#AppExeName}"; Parameters: "web"; Description: "Launch {#AppName}"; Flags: postinstall nowait skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\public"
```

Version info flows from `app.ts` → `scripts/render-manifests.js` → `#define AppVersion` at build time. `AppName`, `AppSlug`, and `AppVersion` are rendered into the script before `iscc` runs.

## 6. MSIX Packaging

`msix/AppxManifest.xml` template:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10">
  <Identity Name="GentlemanProgramming.WApp"
            Publisher="CN=..."
            Version="{{VERSION}}.0"
            ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>WApp</DisplayName>
    <PublisherDisplayName>Gentleman Programming</PublisherDisplayName>
    <Logo>assets\StoreLogo.png</Logo>
  </Properties>
  <Applications>
    <Application Id="WApp" Executable="wapp.exe"
                 EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="WApp"
        Square150x150Logo="assets\Square150x150Logo.png"
        Square44x44Logo="assets\Square44x44Logo.png" />
    </Application>
  </Applications>
</Package>
```

**Build command**:
```bash
makeappx pack /d msix\ /p dist\WApp-{version}.msix
```

**Asset requirements**: 44x44, 150x150, 71x71, 310x150, 310x310, 50x50, 30x30 PNGs in `msix/assets/`. These are created from a master icon via a script.

Version propagates: `app.ts` → `scripts/render-manifests.js` replaces `{{VERSION}}` → `makeappx` embeds the manifest.

## 7. GitHub Actions Workflow

`.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: choco install innosetup
      - run: npm ci
      - run: npm run build:all
      - run: node scripts/render-manifests.js
      - run: iscc installer/wapp.iss
      - run: makeappx pack /d msix\ /p dist\WApp-${{ github.ref_name }}.msix
      - uses: actions/upload-artifact@v4
        with: { name: artifacts, path: dist/wapp.exe, dist/WApp-*.exe, dist/*.msix }
  sign:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: SignPath/github-action-submit-signing-request@v1
        with: { api-token: ${{ secrets.SIGNPATH_API_TOKEN }}, ... }
    continue-on-error: true
  release:
    needs: [build, sign]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: artifacts }
      - uses: softprops/action-gh-release@v2
        with: { files: 'dist/*', generate_release_notes: true }
```

- SignPath step is best-effort; `continue-on-error: true` with an annotation if it fails.
- Artifacts are uploaded after build, downloaded before release.
- `makeappx` comes pre-installed on `windows-latest` runners.

## 8. README Update

Add sections:
- **Microsoft Store**: badge linking to Store listing.
- **Standalone Installer**: download from GitHub Releases; SmartScreen disclaimer ("unsigned exe may show a warning — click 'More info' → 'Run anyway'").
- **Install instructions**: Store (one-click) vs installer (download, double-click, no UAC).

## 9. File Map

**New files**:
| File | Purpose |
|---|---|
| `src/config/app.ts` | App identity source of truth |
| `sea-config.json` | Node SEA build config |
| `scripts/build-exe.js` | Runs esbuild + SEA build |
| `scripts/render-manifests.js` | Injects app identity into `.iss` and `.xml` |
| `installer/wapp.iss` | Inno Setup per-user installer |
| `installer/assets/wapp.ico` | App icon for installer and exe |
| `msix/AppxManifest.xml` | MSIX manifest template |
| `msix/assets/*.png` | Store tile/logos |
| `.github/workflows/release.yml` | CI build, sign, package, release |

**Modified files**:
| File | Change |
|---|---|
| `src/config/paths.ts` | Import `dataDir` from `app.ts` |
| `src/api/server.ts` | Add `isSea()` check for static root |
| `src/cli/wappCommand.ts` | Read `version`/`name` from `app.ts` |
| `src/cli/create.ts` | Replace "WApp" with `app.name` |
| `src/cli/list.ts` | Replace "WApps" with `app.namePlural` |
| `src/cli/remove.ts` | Replace "App" with `app.name` |
| `package.json` | Add `esbuild` devDep; `build:bundle`, `build:exe`, `build:all` scripts |
| `README.md` | Store badge, SmartScreen disclaimer, install instructions |

**Dependencies added**: `esbuild` (devDependency)

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `app.ts` exports, `paths.ts` resolution | Vitest |
| Integration | `server.ts` static root in dev vs SEA | Mock `node:sea`; assert path |
| E2E | `build:exe` produces runnable exe | CI: build, run `--version`, assert output |

## Migration / Rollout

No migration required. Dev mode (`npm run dev`, `npm run dev:web`) is unchanged.

## Open Questions

- [ ] Are `installer/assets/wapp.ico` and `msix/assets/*.png` available, or do they need to be created?
- [ ] SignPath Foundation account — who owns it and where are secrets stored?
