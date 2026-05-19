# WApp - Windows Web App Installer

Convert any URL into an installable Windows app with a Start Menu shortcut.

## Install

### Microsoft Store

[![Get it from Microsoft Store](https://get.microsoft.com/badge)](https://apps.microsoft.com/detail/TODO-REPLACE)

> Coming soon — the Store listing will be updated once the app is published.

### Standalone Installer

Download the latest `WApp-Setup-*.exe` from [GitHub Releases](https://github.com/GentlemanProgramming/wapp/releases).

⚠️ **SmartScreen notice:** This installer is not commercially signed. Windows may show a "Windows protected your PC" warning.
> Click **More info** → **Run anyway** to proceed. The source code is open for verification.

No administrator privileges are required — the installer places files in `%LOCALAPPDATA%\Programs\wapp`.

## Usage

```bash
wapp create <url> [--name <name>] [--browser brave|chrome|edge]
```

### Examples

```bash
# Create app from URL (uses Brave by default)
wapp create https://chatgpt.com

# Custom name and browser
wapp create https://example.com --name "My App" --browser chrome

# Edge fallback
wapp create https://example.com --browser edge
```

## Features

- **URL → Windows App**: Converts any web URL into a Start Menu shortcut
- **Browser Support**: Brave (default), Chrome, Edge
- **Automatic Metadata**: Fetches HTML title for app name
- **Favicon Resolution**: Downloads and uses site favicon as app icon
- **No Admin Required**: Works without elevated privileges
- **App Mode**: Opens URLs in browser app-mode (`--app` flag)

## Installation

```bash
npm install -g .
```

## Project Structure

```
src/
  cli/          - CLI entry point (wapp create)
  core/         - Orchestration (createApp pipeline)
  services/     - Browser, metadata, and icon resolution
  windows/      - Windows shortcut creation
  utils/        - Shared utilities
```

## Requirements

- Windows 10/11
- Node.js 18+
- One of: Brave, Chrome, or Edge browser

## License

MIT
