# WApp - Windows Web App Installer

Convert any URL into an installable Windows app with a Start Menu shortcut.

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
