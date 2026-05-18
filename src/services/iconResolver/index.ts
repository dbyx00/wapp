import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sanitizeFileName } from '../../utils/sanitize';
import { ICONS_DIR } from '../../config/paths';
import { createDebug } from '../../utils/debug';
import { tryDownloadIcon } from './download';
import { discoverHtmlIcon } from './discovery';
import { createDefaultIcon } from './defaultIcon';

const debug = createDebug('icon-resolver');

/**
 * Main entrypoint
 */
export async function resolveIcon(
  url: string,
  appName: string
): Promise<string> {
  debug('Starting icon resolution for URL: %s, appName: %s', url, appName);
  ensureIconsDir();

  const parsed = new URL(url);
  const origin = parsed.origin;
  debug('Origin: %s', origin);

  const name = sanitizeFileName(appName);

  const icoPath = join(ICONS_DIR, `${name}.ico`);
  const pngPath = join(ICONS_DIR, `${name}.png`);
  const svgPath = join(ICONS_DIR, `${name}.svg`);

  /**
   * 1. Try common direct endpoints (fast path)
   */
  debug('Phase 1: Trying common favicon paths...');
  const quickPaths = [
    '/favicon.ico',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
  ];

  for (const path of quickPaths) {
    const iconUrl = `${origin}${path}`;
    debug('  Trying: %s', iconUrl);

    const result = await tryDownloadIcon(
      iconUrl,
      icoPath,
      pngPath,
      svgPath
    );

    if (result) {
      debug('  SUCCESS: %s', result);
      return result;
    }
    debug('  FAILED: %s', iconUrl);
  }

  /**
   * 2. Try HTML discovery (links rel icon)
   */
  debug('Phase 2: HTML discovery...');
  const htmlIcon = await discoverHtmlIcon(
    origin,
    icoPath,
    pngPath,
    svgPath
  );

  if (htmlIcon) {
    debug('  SUCCESS: %s', htmlIcon);
    return htmlIcon;
  }
  debug('  FAILED: No icon found in HTML');

  /**
   * 3. Final fallback
   */
  debug('Phase 3: Using default icon (all methods failed)');
  return createDefaultIcon(icoPath);
}

/**
 * Utils
 */
function ensureIconsDir(): void {
  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }
}
