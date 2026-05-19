# Web UI Specification

## Purpose

Define the behavior of the Hono static file server when running bundled as a SEA executable.

## Requirements

### Requirement: Bundled Static Root

When `isSea()` returns `true`, the system MUST resolve the static frontend root to `dirname(process.execPath)/public` instead of `process.cwd()/dist/public`.

#### Scenario: Bundled exe serves frontend

- GIVEN `wapp.exe` is bundled with Node SEA
- AND a `public/` folder exists next to the executable
- WHEN `wapp.exe web` starts and a browser requests `/`
- THEN `index.html` is served from the exe-relative `public/` folder

#### Scenario: Missing public folder in bundled mode

- GIVEN `wapp.exe` runs as a SEA
- AND no `public/` folder exists next to the executable
- WHEN static files are requested
- THEN the server responds with 404 and logs `Public directory not found at {path}`

### Requirement: Dev Mode Unchanged

When `isSea()` returns `false`, the system MUST continue resolving static files from `join(process.cwd(), 'dist/public')`.

#### Scenario: Development server unchanged

- GIVEN the app is started with `npm run dev` or `npm start`
- WHEN static files are requested
- THEN they are served from the project `dist/public` directory

#### Scenario: Dev mode ignores exe location

- GIVEN the project is run from a directory different from where `wapp.exe` might reside
- WHEN the dev server starts
- THEN it still uses `process.cwd()` and not `process.execPath`
