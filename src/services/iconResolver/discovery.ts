import { BROWSER_UA } from './constants';
import { createDebug } from '../../utils/debug';
import { tryDownloadIcon } from './download';

const debug = createDebug('icon-resolver');

/**
 * HTML icon discovery (IMPORTANT FIX FOR CHATGPT)
 */
export async function discoverHtmlIcon(
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
