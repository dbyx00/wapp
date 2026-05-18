import { writeFileSync } from 'fs';
import { BROWSER_UA } from './constants';
import { createDebug } from '../../utils/debug';

const debug = createDebug('icon-resolver');

/**
 * Download + validate icon
 */
export async function tryDownloadIcon(
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
