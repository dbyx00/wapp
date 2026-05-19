# Windows Installer Specification

## Purpose

Define the Inno Setup per-user installer that deploys WApp without UAC prompts.

## Requirements

### Requirement: Zero-UAC Installation

The installer MUST use `PrivilegesRequired=lowest` and MUST NOT trigger a UAC elevation dialog.

#### Scenario: Standard user installs

- GIVEN a non-admin Windows user
- WHEN the installer is launched
- THEN no UAC prompt appears and installation proceeds

### Requirement: Per-User Install Location

The installer MUST default to `{localappdata}\Programs\{AppSlug}`.

#### Scenario: Install path resolves correctly

- GIVEN user `Alice` on Windows
- WHEN the installer runs with default settings
- THEN files are placed in `%LOCALAPPDATA%\Programs\WApp`

### Requirement: Asset Placement

The installer MUST copy `wapp.exe` and the `public/` folder into `{app}`.

#### Scenario: Frontend assets available after install

- GIVEN installation completes successfully
- WHEN the user runs the app via Start Menu
- THEN the web UI loads with all static assets

#### Scenario: Missing public folder fails gracefully

- GIVEN `public/` is missing from the installer payload
- WHEN `wapp.exe web` runs after installation
- THEN the server returns 404 for static requests and logs a clear error

### Requirement: Start Menu Shortcut

The installer MUST create a Start Menu shortcut pointing to `{app}\wapp.exe web`.

#### Scenario: Shortcut created and functional

- GIVEN installation completes
- WHEN the user opens Start Menu and clicks the WApp entry
- THEN the web UI opens in the default browser

### Requirement: Optional Desktop and Startup Shortcuts

The installer MAY offer a desktop icon and a startup shortcut via `[Tasks]`.

#### Scenario: User opts in to desktop icon

- GIVEN the user checks "Create desktop icon" during setup
- WHEN installation finishes
- THEN a desktop shortcut exists
