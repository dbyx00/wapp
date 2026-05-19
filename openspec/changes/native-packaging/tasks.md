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

- [ ] 1.1 Create `src/config/app.ts` with APP constant (name, slug, version, description, dataDir) (S)
- [ ] 1.2 Update `src/config/paths.ts` to import `dataDir` from `app.ts` (S)
- [ ] 1.3 Update `src/cli/wappCommand.ts` to import version/name/description from `app.ts` (S)
- [ ] 1.4 Update `src/cli/create.ts`, `list.ts`, `remove.ts` to use `app.name`/`app.namePlural` (S)
- [ ] 1.5 Update tests with hardcoded "WApp" to assert via imported identity (S)

## Phase 2: Build Pipeline

- [ ] 2.1 Add `esbuild` devDep and `build:bundle` script to `package.json` (S)
- [ ] 2.2 Create `sea-config.json` with `main: dist/bundle.js`, `output: dist/wapp.exe` (S)
- [ ] 2.3 Create `scripts/build-exe.js` running esbuild then `node --build-sea` (M)
- [ ] 2.4 Add `build:exe` and `build:all` scripts to `package.json` (S)
- [ ] 2.5 Verify `npm run build:all` produces runnable `dist/wapp.exe --version` (M)

## Phase 3: SEA Path Resolution

- [ ] 3.1 Modify `src/api/server.ts` to use `isSea()` for static root; dev mode unchanged (M)
- [ ] 3.2 Add test mocking `node:sea` to assert exe-relative `public/` path in SEA mode (M)
- [ ] 3.3 Verify `npm run dev` still serves static files from `dist/public` (S)

## Phase 4: Manifest Rendering

- [ ] 4.1 Create `scripts/render-manifests.js` injecting `app.ts` into `.iss` and `.xml` templates (M)
- [ ] 4.2 Verify rendered outputs contain correct version and app name (S)

## Phase 5: Windows Installer

- [ ] 5.1 Create `installer/wapp.iss` with `PrivilegesRequired=lowest`, per-user paths, shortcuts (M)
- [ ] 5.2 Compile installer with `iscc`; verify zero-UAC and `%LOCALAPPDATA%\Programs\WApp` target (M)
- [ ] 5.3 Verify installed `wapp.exe web` works and missing `public/` logs 404 (M)

## Phase 6: MSIX Packaging

- [ ] 6.1 Create `msix/AppxManifest.xml` with `Publisher="CN=TODO-REPLACE..."` (M)
- [ ] 6.2 Add `build:msix` script using `makeappx pack` (S)
- [ ] 6.3 Verify `.msix` contains exe, `public/`, manifest, and assets (M)
- [ ] 6.4 Add TODO comment for placeholder icons and Publisher ID replacement (S)

## Phase 7: CI/CD

- [ ] 7.1 Create `.github/workflows/release.yml` with build and release jobs on `v*` tags (L)
- [ ] 7.2 Add SignPath signing job — OPTIONAL with `continue-on-error: true`; only runs when `SIGNPATH_API_TOKEN` secret is configured; skipped silently otherwise (M)
- [ ] 7.3 Add MSIX packaging job — OPTIONAL with conditional (`if: env.MSIX_ENABLED`); skipped when Microsoft Partner account is not yet configured (M)
- [ ] 7.4 Release notes body template must include Store availability section: "**Microsoft Store:** Not yet available for this release" (updated manually when Store submission is complete) and SmartScreen disclaimer for the standalone .exe (M)
- [ ] 7.5 Verify GitHub Release publishes with `.exe` installer + unsigned `wapp.exe` even when SignPath and MSIX steps are skipped (M)

## Phase 8: Documentation

- [ ] 8.1 Update `README.md` with Store badge (linking to Store, with note "Available soon"), SmartScreen disclaimer for standalone installer, and install instructions for both channels (M)
- [ ] 8.2 Update `index.html` title to reference app identity if static (S)
- [ ] 8.3 Add release notes template at `.github/RELEASE_TEMPLATE.md` with Store availability section and SmartScreen disclaimer (S)
