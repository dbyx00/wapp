import { writeFileSync } from 'fs';

/**
 * Default icon
 */
export function createDefaultIcon(savePath: string): string {
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
