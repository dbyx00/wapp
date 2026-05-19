# Design: Clean Architecture Refactor

## 1. Architecture Overview

Target directory structure after all 4 phases:

```
src/
  index.ts                           # barrel exports (6 public APIs)
  config/
    paths.ts                         # ICONS_DIR, REGISTRY_DIR, REGISTRY_FILE
    browsers.ts                      # BROWSER_CONFIGS
  domain/
    types.ts                         # AppEntry, BrowserName, CreateAppOptions, ShortcutOptions
    appRegistry.ts                   # IAppRegistry interface
  services/
    appRegistry.ts                   # implements IAppRegistry (~90 lines)
    fileService.ts                   # deleteFile (safe unlinkSync)
    registryPersistence.ts           # JSON load/save
    browserResolver.ts               # resolveBrowserPath (~70 lines, no getAppArg)
    metadataResolver.ts              # unchanged (~55 lines)
    iconResolver/
      index.ts                       # resolveIcon orchestration (~40 lines)
      constants.ts                   # BROWSER_UA
      download.ts                    # tryDownloadIcon (~95 lines)
      discovery.ts                   # discoverHtmlIcon (~105 lines)
      defaultIcon.ts                 # createDefaultIcon (~15 lines)
  utils/
    url.ts                           # validateUrl
    sanitize.ts                      # sanitizeFileName (with .trim())
    debug.ts                         # createDebug(namespace)
  windows/
    shortcutCreator.ts               # ~95 lines, no getAppArg import
  cli/
    wappCommand.ts                   # Command setup + DI wiring (~30 lines)
    create.ts                        # createHandler
    list.ts                          # listHandler
    remove.ts                        # removeHandler
tests/
  unit/
    services/                        # 6 test files + fileService + registryPersistence
    utils/                           # url.test.ts, sanitize.test.ts
    windows/                         # shortcutCreator.test.ts
    cli/                             # create.test.ts, list.test.ts, remove.test.ts
  integration/
    core/                            # createApp.test.ts (merged)
```

## 2. Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| DI approach | Pass `IAppRegistry` as parameter | DI container | Simplest for CLI; no external deps |
| iconResolver split | `index.ts` + `download.ts` + `discovery.ts` + `defaultIcon.ts` | Keep monolith | Each file has single responsibility |
| Test layout | `tests/unit/` + `tests/integration/` | Keep in `src/` | Excludes from `dist/`; mirrors src |
| AppRegistry internals | Delegate to `fileService` + `registryPersistence` | Keep inline | SRP; testable isolation |
| Debug utility | `createDebug(namespace)` in `utils/debug.ts` | Inline closures | Reusable; same env-var semantics |
| BrowserName location | `domain/types.ts` | `config/browsers.ts` | Types are domain; config consumes them |

## 3. Module Dependency Graph

```
domain/types.ts (leaf, zero imports)
  ↑  ↑  ↑  ↑  ↑
config/paths.ts    config/browsers.ts (leaves, zero imports)
  ↑                  ↑
utils/debug.ts  utils/sanitize.ts  iconResolver/constants.ts (leaves)
  ↑                  ↑                ↑
iconResolver/download.ts  iconResolver/discovery.ts  iconResolver/defaultIcon.ts
  ↑                          ↑
iconResolver/index.ts (orchestrates download + discovery + defaultIcon)
  ↑
services/registryPersistence.ts  services/fileService.ts
  ↑                              ↑
services/appRegistry.ts (implements IAppRegistry)
  ↑
services/browserResolver.ts  services/metadataResolver.ts  windows/shortcutCreator.ts
  ↑                          ↑                              ↑
core/createApp.ts (accepts IAppRegistry)
  ↑
cli/{create,list,remove}.ts (accept IAppRegistry)
  ↑
cli/wappCommand.ts (instantiates AppRegistry once)
```

**No circular dependencies**: `domain/types.ts` and `config/*` are leaves. `iconResolver/*` sub-modules do not import each other; `index.ts` orchestrates. `appRegistry.ts` imports interface from `domain` and delegates from `services`, but nothing imports it from below.

## 4. Phase 1 — Reorganize

| Action | File | Details |
|---|---|---|
| **Create** | `tests/unit/core/createApp.test.ts` | Move from `src/core/`; update mocks to `../../src/...` paths |
| **Create** | `tests/unit/services/appRegistry.test.ts` | Move from `src/services/` |
| **Create** | `tests/unit/services/browserResolver.test.ts` | Move from `src/services/` |
| **Create** | `tests/unit/services/iconResolver.test.ts` | Move from `src/services/` (tests public `resolveIcon`) |
| **Create** | `tests/unit/services/metadataResolver.test.ts` | Move from `src/services/` |
| **Create** | `tests/unit/utils/url.test.ts` | Move from `src/utils/` |
| **Create** | `tests/unit/windows/shortcutCreator.test.ts` | Move from `src/windows/` |
| **Create** | `tests/unit/cli/listCommand.test.ts` | Move from `src/cli/` |
| **Create** | `tests/unit/cli/removeCommand.test.ts` | Move from `src/cli/` |
| **Create** | `tests/unit/cli/removeCommand.enhanced.test.ts` | Move from `src/cli/` |
| **Create** | `tests/integration/core/createApp.test.ts` | Move from `src/core/createApp.integration.test.ts` |
| **Create** | `src/index.ts` | Barrel: `export *` from `core/createApp`, `services/appRegistry`, `services/browserResolver`, `services/metadataResolver`, `services/iconResolver`, `windows/shortcutCreator`, `utils/url` |
| **Create** | `src/utils/sanitize.ts` | `export function sanitizeFileName(name: string): string` with `.trim()` behavior |
| **Create** | `src/utils/debug.ts` | `export function createDebug(ns: string): (msg: string, ...args: unknown[]) => void` |
| **Modify** | `src/services/iconResolver.ts` | Import `sanitizeFileName` from `../utils/sanitize`; delete local copy |
| **Modify** | `src/windows/shortcutCreator.ts` | Import `sanitizeFileName` from `../utils/sanitize`; **remove dead import** `getAppArg` from `../services/browserResolver` |
| **Modify** | `vitest.config.ts` | `include: ['tests/**/*.test.ts']` |
| **Modify** | `package.json` | Remove `png-to-ico` dependency |
| **Delete** | `src/**/*.test.ts` (all 11) | After verified moves |

## 5. Phase 2 — Config & Types

### New files

**`src/config/paths.ts`**
```ts
import { join } from 'path';
export const REGISTRY_DIR = join(process.env.APPDATA || '', 'WApp');
export const REGISTRY_FILE = join(REGISTRY_DIR, 'registry.json');
export const ICONS_DIR = join(REGISTRY_DIR, 'icons');
```

**`src/config/browsers.ts`**
```ts
import { BrowserName } from '../domain/types';
interface BrowserConfig { name: string; paths: string[]; appArg: string; }
export const BROWSER_CONFIGS: Record<BrowserName, BrowserConfig> = { ... };
```

**`src/domain/types.ts`**
```ts
export type BrowserName = 'brave' | 'chrome' | 'edge';
export interface AppEntry { name: string; url: string; browser: string; iconPath: string; shortcutPath: string; createdAt: string; }
export interface CreateAppOptions { url: string; name?: string; browser?: BrowserName; }
export interface ShortcutOptions { name: string; url: string; browserPath: string; iconPath: string; }
```

### Import migration map

| Old import | New import | Affected files |
|---|---|---|
| `../services/browserResolver` (for `BrowserName`) | `../domain/types` | `createApp.ts`, `wappCommand.ts`, all tests |
| `../services/appRegistry` (for `AppEntry`) | `../domain/types` | `listCommand.test.ts`, `removeCommand.test.ts`, `removeCommand.enhanced.test.ts` |
| Inline `REGISTRY_DIR` / `REGISTRY_FILE` | `../config/paths` | `appRegistry.ts` |
| Inline `ICONS_DIR` | `../config/paths` | `iconResolver/index.ts` |
| Inline `BROWSER_CONFIGS` | `../config/browsers` | `browserResolver.ts` |

## 6. Phase 3 — Services

### iconResolver split plan

| Function | Destination | Responsibility |
|---|---|---|
| `resolveIcon()` | `iconResolver/index.ts` | Orchestration: quick paths → discovery → default |
| `tryDownloadIcon()` | `iconResolver/download.ts` | Fetch, validate magic bytes, write file |
| `discoverHtmlIcon()` | `iconResolver/discovery.ts` | HTML regex + manifest parsing, calls `tryDownloadIcon` |
| `createDefaultIcon()` | `iconResolver/defaultIcon.ts` | Hardcoded ICO buffer, write file |
| `BROWSER_UA` | `iconResolver/constants.ts` | Shared HTTP header string |
| `getSize()` | `iconResolver/discovery.ts` | Manifest size parsing (private) |
| `ensureIconsDir()` | `iconResolver/index.ts` | mkdirSync wrapper (private) |

`discovery.ts` imports `tryDownloadIcon` from `./download` and `BROWSER_UA` from `./constants`. `index.ts` imports all three sub-modules. No sub-module imports `index.ts`.

### IAppRegistry interface

**`src/domain/appRegistry.ts`**
```ts
import { AppEntry } from './types';
export interface IAppRegistry {
  add(entry: Omit<AppEntry, 'createdAt'>): void;
  list(): AppEntry[];
  findByName(name: string): AppEntry | undefined;
  remove(name: string): AppEntry;
  search(query: string): AppEntry[];
  getByIndex(index: number): AppEntry | undefined;
  removeByQuery(query: string): AppEntry;
}
```

### Delegation services

**`src/services/fileService.ts`**
```ts
import { existsSync, unlinkSync } from 'fs';
export function deleteFile(path: string): void {
  try { if (existsSync(path)) unlinkSync(path); } catch { /* ignore */ }
}
```

**`src/services/registryPersistence.ts`**
```ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { REGISTRY_DIR, REGISTRY_FILE } from '../config/paths';
import { AppEntry } from '../domain/types';
export interface RegistryData { apps: AppEntry[]; }
export function load(): RegistryData { ... }
export function save(data: RegistryData): void { ... }
```

### Refactored AppRegistry

**`src/services/appRegistry.ts`** implements `IAppRegistry`. It imports `load`/`save` from `registryPersistence` and `deleteFile` from `fileService`. All method signatures remain identical to the original; only internal implementation changes to delegation.

### Test changes

- `appRegistry.test.ts`: Update mocks to target `fs` via the new delegation path (mocking `fs` still works because `registryPersistence` and `fileService` use it). Add `tests/unit/services/fileService.test.ts` and `tests/unit/services/registryPersistence.test.ts`.
- `iconResolver.test.ts`: Move to `tests/unit/services/iconResolver/index.test.ts`. Import path stays `../../src/services/iconResolver` (resolves to `index.ts`). Optionally add unit tests for `download.ts` and `discovery.ts`.
- `browserResolver.test.ts`: Remove `getAppArg` tests; remove `getAppArg` mock from `createApp.test.ts`.

## 7. Phase 4 — CLI & DI

### Handler signatures

**`src/cli/create.ts`**
```ts
export async function createHandler(
  url: string,
  options: { name?: string; browser?: string },
  registry: IAppRegistry
): Promise<void>
```
Wraps `createApp({ url, name, browser, registry })`, catches errors, prints to `console.error`, calls `process.exit(1)`.

**`src/cli/list.ts`**
```ts
export function listHandler(registry: IAppRegistry): void
```
Calls `registry.list()`, formats output to `console.log`.

**`src/cli/remove.ts`**
```ts
export function removeHandler(query: string, registry: IAppRegistry): void
```
Calls `registry.removeByQuery(query)`, prints success or error.

### createApp signature change

**`src/core/createApp.ts`**
```ts
export interface CreateAppOptions {
  url: string;
  name?: string;
  browser?: BrowserName;
  registry: IAppRegistry;
}
export async function createApp(options: CreateAppOptions): Promise<void>
```
Replace `const registry = new AppRegistry()` with `options.registry`.

### DI wiring in wappCommand.ts

```ts
import { AppRegistry } from '../services/appRegistry';
import { createHandler } from './create';
import { listHandler } from './list';
import { removeHandler } from './remove';

const registry = new AppRegistry();

program.command('create <url>').action((url, opts) => createHandler(url, opts, registry));
program.command('list').action(() => listHandler(registry));
program.command('remove <query>').action((query) => removeHandler(query, registry));
```

### Test rewrite strategy

| Test file | Action | New assertions |
|---|---|---|
| `listCommand.test.ts` | **Rewrite** | Mock `IAppRegistry`, assert `console.log` output format and count |
| `removeCommand.test.ts` | **Rewrite + merge enhanced** | Mock `IAppRegistry`, assert `console.log`/`console.error`/`process.exit` for exact/partial/numeric/multi-match/no-match cases. Delete `removeCommand.enhanced.test.ts`. |
| `createApp.test.ts` + `createApp.integration.test.ts` | **Merge into one** | Mock services, pass mock `IAppRegistry`, assert `registry.add` called once with correct args, assert error propagation, assert no registration on shortcut failure. |

## 8. File Changes Summary

| File | Action | Description |
|---|---|---|
| `src/index.ts` | Create | Barrel export of all public APIs |
| `src/config/paths.ts` | Create | Centralized path constants |
| `src/config/browsers.ts` | Create | Browser config map |
| `src/domain/types.ts` | Create | Domain types: AppEntry, BrowserName, etc. |
| `src/domain/appRegistry.ts` | Create | IAppRegistry interface |
| `src/utils/sanitize.ts` | Create | Shared sanitizeFileName with .trim() |
| `src/utils/debug.ts` | Create | createDebug utility |
| `src/services/fileService.ts` | Create | Safe file deletion |
| `src/services/registryPersistence.ts` | Create | JSON registry read/write |
| `src/services/iconResolver/index.ts` | Create | Barrel + orchestration |
| `src/services/iconResolver/constants.ts` | Create | BROWSER_UA |
| `src/services/iconResolver/download.ts` | Create | Icon download + validation |
| `src/services/iconResolver/discovery.ts` | Create | HTML + manifest discovery |
| `src/services/iconResolver/defaultIcon.ts` | Create | Default ICO placeholder |
| `src/cli/create.ts` | Create | Create command handler |
| `src/cli/list.ts` | Create | List command handler |
| `src/cli/remove.ts` | Create | Remove command handler |
| `src/services/appRegistry.ts` | Modify | Implement IAppRegistry, delegate persistence/file ops |
| `src/services/browserResolver.ts` | Modify | Remove getAppArg export; import BrowserName from domain; import BROWSER_CONFIGS from config |
| `src/services/iconResolver.ts` | Delete | Replaced by iconResolver/ directory |
| `src/windows/shortcutCreator.ts` | Modify | Remove getAppArg import; import sanitizeFileName from utils |
| `src/core/createApp.ts` | Modify | Accept registry in options; use BrowserName from domain |
| `src/cli/wappCommand.ts` | Modify | Instantiate AppRegistry once; wire handlers |
| `vitest.config.ts` | Modify | include: tests/**/*.test.ts |
| `package.json` | Modify | Remove png-to-ico |
| `tests/**/*.test.ts` (11 files) | Create | Moved from src/ with updated imports |
| `tests/unit/services/fileService.test.ts` | Create | Unit tests for deleteFile |
| `tests/unit/services/registryPersistence.test.ts` | Create | Unit tests for load/save |
| `src/**/*.test.ts` (11 files) | Delete | After move |

## 9. Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `sanitizeFileName`, `fileService`, `registryPersistence`, `browserResolver`, `metadataResolver`, `iconResolver/*` sub-modules | Vitest with `vi.mock('fs')` or `global.fetch` |
| Unit — CLI | `createHandler`, `listHandler`, `removeHandler` | Mock `IAppRegistry`, spy `console.log`/`console.error`/`process.exit` |
| Integration | `createApp` full pipeline | Mock external services, inject mock `IAppRegistry`, assert side effects |
| Static | No circular deps, no test files in dist | Manual import graph review + post-build glob check |

## 10. Migration / Rollout

No data migration required. Each phase is an independent commit. Rollback: revert the failing commit.

## 11. Open Questions

- [ ] Should `tsconfig.json` add a separate `tsconfig.test.json` for IDE type-checking of moved tests, or is `rootDir: "./src"` with tests excluded sufficient?
- [ ] Should `listHandler` and `removeHandler` return exit codes instead of calling `process.exit` directly to improve testability (avoids killing test runner)?
