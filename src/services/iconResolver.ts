import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const ICONS_DIR = join(process.env.APPDATA || '', 'WApp', 'icons');

/**
 * Resolves and downloads the favicon for a URL.
 * Tries: favicon.ico -> apple-touch-icon.png -> default icon
 * Returns the local path to the saved icon.
 */
export async function resolveIcon(url: string, appName: string): Promise<string> {
  ensureIconsDir();

  const parsed = new URL(url);
  const domain = parsed.hostname;
  const baseIconPath = join(ICONS_DIR, `${sanitizeFileName(appName)}.ico`);

  // Try favicon.ico
  const faviconUrl = `${parsed.protocol}//${domain}/favicon.ico`;
  if (await tryDownloadIcon(faviconUrl, baseIconPath)) {
    return baseIconPath;
  }

  // Try apple-touch-icon.png
  const appleIconUrl = `${parsed.protocol}//${domain}/apple-touch-icon.png`;
  if (await tryDownloadIcon(appleIconUrl, baseIconPath)) {
    return baseIconPath;
  }

  // Generate default icon
  return createDefaultIcon(baseIconPath);
}

/**
 * Attempts to download an icon from a URL and save it locally.
 * Returns true if successful.
 * Validates that the downloaded file is a valid ICO format.
 */
async function tryDownloadIcon(url: string, savePath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'WApp/0.1.0 (Windows Web App Installer)',
      },
    });

    if (!response.ok || response.status === 404) {
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) {
      // Too small to be a valid icon
      return false;
    }

    // Validate ICO magic bytes: 00 00 01 00
    if (!isValidIco(buffer)) {
      return false;
    }

    writeFileSync(savePath, buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a buffer is a valid ICO file by examining magic bytes.
 * ICO files start with: 00 00 (reserved), 01 00 (type: ICO), XX XX (image count)
 */
function isValidIco(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00;
}

/**
 * Creates a default icon file (placeholder).
 * In a real implementation, this would generate a proper .ico file.
 * For MVP, we create a minimal valid ICO file.
 */
function createDefaultIcon(savePath: string): string {
  // Minimal 16x16 ICO file (blank/transparent)
  // This is a valid ICO header + 16x16 1-bit bitmap
  const minimalIco = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type: 1 = ICO
    0x01, 0x00, // Count: 1 image
    // Image directory entry
    0x10,       // Width: 16
    0x10,       // Height: 16
    0x00,       // Color count: 0 (>=256)
    0x00,       // Reserved
    0x01, 0x00, // Color planes: 1
    0x01, 0x00, // Bits per pixel: 1
    0x68, 0x00, 0x00, 0x00, // Size of image data
    0x16, 0x00, 0x00, 0x00, // Offset to image data
    // XOR bitmap (16x16, 1-bit)
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    // AND bitmap (mask, 16x16, 1-bit)
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);

  writeFileSync(savePath, minimalIco);
  return savePath;
}

/**
 * Ensures the icons directory exists.
 */
function ensureIconsDir(): void {
  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }
}

/**
 * Sanitizes a filename for safe use on Windows.
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').substring(0, 100);
}
