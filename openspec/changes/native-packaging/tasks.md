# Tasks: Native Windows Packaging for WApp

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 400–500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (identity+build+SEA) → PR 2 (installer+MSIX+CI+docs) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision resolved: feature-branch-chain
400-line budget risk: High

### Work Units

| Unit | Goal | PR | Base |
|------|------|-----|------|
| 1 | Identity centralization, esbuild/SEA pipeline, path fix, tests | PR 1 | feature/native-packaging |
| 2 | Inno Setup, MSIX, CI workflow, docs | PR 2 | PR 1 branch |

## Phase 1: Foundation

- [x] 1.1 Create `src/config/app.ts` with APP constant (name, slug, version, description, dataDir) (S)
- [x] 1.2 Update `src/config/paths.ts` to import `dataDir` from `app.ts` (S)
- [x] 1.3 Update `src/cli/wappCommand.ts` to import version/name/description from `app.ts` (S)
- [x] 1.4 Update `src/cli/create.ts`, `list.ts`, `remove.ts` to use `app.name`/`app.namePlural` (S)
- [x] 1.5 Update tests with hardcoded "WApp" to assert via imported identity (S)

## Phase 2: Build Pipeline

- [x] 2.1 Add `esbuild` devDep and `build:bundle` script to `package.json` (S)
- [x] 2.2 Create `sea-config.json` with `main: dist/bundle.js`, `output: dist/sea.blob` (S)
- [x] 2.3 Create `scripts/build-exe.js` running esbuild then `node --experimental-sea-config` and postject injection (M)
- [x] 2.4 Add `build:exe` and `build:all` scripts to `package.json` (S)
- [x] 2.5 Verify `npm run build:all` produces runnable `dist/wapp.exe --version` (M)

## Phase 3: SEA Path Resolution

- [x] 3.1 Modify `src/api/server.ts` to use `isSea()` for static root; dev mode unchanged (M)
- [x] 3.2 Add test mocking `node:sea` to assert exe-relative `public/` path in SEA mode (M)
- [x] 3.3 Verify `npm run dev` still serves static files from `dist/public` (S)

## Phase 4: Manifest Rendering

- [x] 4.1 Create `scripts/render-manifests.js` injecting `app.ts` into `.iss` and `.xml` templates (M)
- [x] 4.2 Verify rendered outputs contain correct version and app name (S)

## Phase 5: Windows Installer

- [x] 5.1 Create `installer/wapp.iss.template` with `PrivilegesRequired=lowest`, per-user paths, shortcuts (M)
- [x] 5.2 Verify rendering produces correct `installer/wapp.iss` (M)
- [x] 5.3 Verify `[Files]` copies `wapp.exe` and `public/`; `[Run]` launches `wapp.exe web` (M)

## Phase 6: MSIX Packaging

- [x] 6.1 Create `msix/AppxManifest.xml.template` with `Publisher="CN=TODO-REPLACE..."` (M)
- [x] 6.2 Add `build:msix` script using `makeappx pack` (S)
- [x] 6.3 Verify manifest template references all required assets (44x44, 150x150, StoreLogo) (M)
- [x] 6.4 Add TODO comment for placeholder icons and Publisher ID replacement (S)

## Phase 7: CI/CD

- [x] 7.1 Create `.github/workflows/release.yml` with build and release jobs on `v*` tags (L)
- [x] 7.2 Add SignPath signing job — OPTIONAL with `continue-on-error: true`; only runs when `SIGNPATH_API_TOKEN` secret is configured; skipped silently otherwise (M)
- [x] 7.3 Add MSIX packaging job — OPTIONAL with conditional (`if: vars.MSIX_ENABLED`); skipped when Microsoft Partner account is not yet configured (M)
- [x] 7.4 Release notes body template must include Store availability section: "**Microsoft Store:** Not yet available for this release" (updated manually when Store submission is complete) and SmartScreen disclaimer for the standalone .exe (M)
- [x] 7.5 Verify workflow YAML is valid and conditional logic for SignPath and MSIX is correct (M)

## Phase 8: Documentation

- [x] 8.1 Update `README.md` with Store badge (linking to Store, with note "Available soon"), SmartScreen disclaimer for standalone installer, and install instructions for both channels (M)
- [x] 8.2 Verify `index.html` title is consistent with `APP.name` (S)
- [x] 8.3 Add release notes template at `.github/RELEASE_TEMPLATE.md` with Store availability section and SmartScreen disclaimer (S)
