import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';

import { join } from 'path';

const ICONS_DIR = join(
  process.env.APPDATA || '',
  'WApp',
  'icons'
);

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DEBUG = process.env.WAPP_DEBUG === '1' || process.env.WAPP_DEBUG === 'icon';

function debug(msg: string, ...args: unknown[]) {
  if (DEBUG) {
    console.log(`[icon-resolver] ${msg}`, ...args);
  }
}

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
 * Download + validate icon
 */
async function tryDownloadIcon(
  url: string,
  icoPath: string,
  pngPath: string,
  svgPath: string
): Promise<string | null> {
  try {
    debug('    Fetching: %s', url);
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'image/*,*/*',
      },
    });

    debug('    Response status: %d', res.status);
    if (!res.ok) {
      debug('    Skipping: HTTP %d', res.status);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    debug('    Downloaded %d bytes', buffer.length);
    if (buffer.length < 32) {
      debug('    Skipping: too small (%d bytes)', buffer.length);
      return null;
    }

    const contentType =
      res.headers.get('content-type') || '';
    debug('    Content-Type: %s', contentType);

    /**
     * Reject HTML responses (redirects, error pages, etc.)
     * Some sites return 200 with HTML for missing favicon paths
     */
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      debug('    Skipping: response is HTML, not an image');
      return null;
    }

    /**
     * SVG
     */
    if (
      contentType.includes('svg') ||
      buffer.toString('utf8', 0, 100).includes('<svg')
    ) {
      debug('    Detected: SVG');
      writeFileSync(svgPath, buffer);
      return svgPath;
    }

    /**
     * PNG
     */
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    /**
     * ICO
     */
    const isIco =
      buffer[0] === 0x00 &&
      buffer[1] === 0x00 &&
      buffer[2] === 0x01 &&
      buffer[3] === 0x00;

    if (isIco) {
      debug('    Detected: ICO');
      writeFileSync(icoPath, buffer);
      return icoPath;
    }

    if (isPng) {
      debug('    Detected: PNG');
      writeFileSync(pngPath, buffer);
      return pngPath;
    }

    /**
     * JPEG / WEBP fallback → PNG store
     */
    debug('    Detected: unknown (%s), saving as PNG fallback', contentType);
    writeFileSync(pngPath, buffer);
    return pngPath;

  } catch (err) {
    debug('    ERROR: %s', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * HTML icon discovery (IMPORTANT FIX FOR CHATGPT)
 */
async function discoverHtmlIcon(
  origin: string,
  icoPath: string,
  pngPath: string,
  svgPath: string
): Promise<string | null> {
  try {
    debug('    Fetching HTML from: %s', origin);
    const res = await fetch(origin, {
      headers: {
        'User-Agent': BROWSER_UA,
      },
    });

    if (!res.ok) {
      debug('    HTML fetch failed: HTTP %d', res.status);
      return null;
    }

    const html = await res.text();
    debug('    HTML size: %d bytes', html.length);

    /**
     * FIX: more robust regex (ChatGPT uses multiple icons)
     */
    const regex =
      /<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]+href=["']([^"']+)["']/gi;

    const matches = [...html.matchAll(regex)];
    debug('    Found %d <link rel="icon"> matches in HTML', matches.length);

    for (const m of matches) {
      const rel = m[1];
      const href = m[2];
      if (!href) continue;

      debug('    Trying link: rel="%s" href="%s"', rel, href);
      const iconUrl = new URL(href, origin).toString();
      debug('    Resolved URL: %s', iconUrl);

      const result = await tryDownloadIcon(
        iconUrl,
        icoPath,
        pngPath,
        svgPath
      );

      if (result) return result;
    }

    /**
     * FIX: manifest parsing (ChatGPT FIX HERE)
     */
    const manifestMatch = html.match(
      /<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i
    );

    if (manifestMatch?.[1]) {
      debug('    Found manifest link: %s', manifestMatch[1]);
      const manifestUrl = new URL(manifestMatch[1], origin).toString();
      debug('    Fetching manifest: %s', manifestUrl);

      const manifestRes = await fetch(manifestUrl);

      if (!manifestRes.ok) {
        debug('    Manifest fetch failed: HTTP %d', manifestRes.status);
        return null;
      }

      const manifest = await manifestRes.json().catch(() => null);
      debug('    Manifest parsed: %s', manifest ? 'OK' : 'FAILED');

      if (!manifest || !Array.isArray((manifest as any).icons)) {
        debug('    No icons array in manifest');
        return null;
      }

      const icons = (manifest as any).icons
        .filter((i: any) => i?.src)
        .sort((a: any, b: any) =>
          getSize(b?.sizes) - getSize(a?.sizes)
        );

      debug('    Found %d icons in manifest', icons.length);
      for (const icon of icons) {
        debug('    Trying manifest icon: %s (sizes: %s)', icon.src, icon.sizes);
        const iconUrl = new URL(icon.src, manifestUrl).toString();

        const result = await tryDownloadIcon(
          iconUrl,
          icoPath,
          pngPath,
          svgPath
        );

        if (result) return result;
      }
    } else {
      debug('    No manifest link found in HTML');
    }

    return null;
  } catch (err) {
    debug('    HTML discovery ERROR: %s', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Safe size parsing
 */
function getSize(sizes?: string): number {
  if (!sizes) return 0;

  let max = 0;

  for (const s of sizes.split(' ')) {
    const m = s.match(/(\d+)x(\d+)/);
    if (!m) continue;

    max = Math.max(max, parseInt(m[1], 10));
  }

  return max;
}

/**
 * Default icon
 */
function createDefaultIcon(savePath: string): string {
  console.warn('⚠ Icon download failed — using default placeholder icon');
  console.warn('  Tip: run with WAPP_DEBUG=icon to see detailed download logs');
  const ico = Buffer.from([
    0x00,0x00,0x01,0x00,0x01,0x00,
    0x10,0x10,0x00,0x00,0x01,0x00,
    0x01,0x00,0x68,0x00,0x00,0x00,
    0x16,0x00,0x00,0x00,
    ...new Array(104).fill(0x00)
  ]);

  writeFileSync(savePath, ico);
  return savePath;
}

/**
 * Utils
 */
function ensureIconsDir(): void {
  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim()
    .substring(0, 100);
}