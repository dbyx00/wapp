import { existsSync } from 'fs';
import { join } from 'path';

export type BrowserName = 'brave' | 'chrome' | 'edge';

interface BrowserConfig {
  name: string;
  paths: string[];
  appArg: string;
}

const BROWSER_CONFIGS: Record<BrowserName, BrowserConfig> = {
  brave: {
    name: 'Brave',
    paths: [
      join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      join(process.env.ProgramFiles || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ],
    appArg: '--app=',
  },
  chrome: {
    name: 'Chrome',
    paths: [
      join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ],
    appArg: '--app=',
  },
  edge: {
    name: 'Edge',
    paths: [
      join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ],
    appArg: '--app=',
  },
};

/**
 * Resolves the installed executable path for the specified browser.
 * Falls back to edge if the requested browser is not found.
 */
export async function resolveBrowserPath(browser: BrowserName): Promise<string> {
  const config = BROWSER_CONFIGS[browser];
  if (!config) {
    throw new Error(`Unsupported browser: ${browser}. Supported: brave, chrome, edge`);
  }

  // Try to find the browser in known installation paths
  for (const path of config.paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Fallback: try edge if not the requested browser
  if (browser !== 'edge') {
    console.warn(`⚠ ${config.name} not found, falling back to Edge`);
    return resolveBrowserPath('edge');
  }

  throw new Error(
    `Browser not found: ${config.name}.\n` +
    `Searched paths:\n${config.paths.map(p => `  - ${p}`).join('\n')}\n` +
    `Please install ${config.name} or use --browser flag.`
  );
}

/**
 * Returns the app-mode argument for the browser.
 */
export function getAppArg(browser: BrowserName): string {
  return BROWSER_CONFIGS[browser].appArg;
}
