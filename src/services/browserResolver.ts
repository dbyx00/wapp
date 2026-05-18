import { existsSync } from 'fs';
import { BrowserName } from '../domain/types';
import { BROWSER_CONFIGS } from '../config/browsers';

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
