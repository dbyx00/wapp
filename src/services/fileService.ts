import { existsSync, unlinkSync } from 'fs';

/**
 * Safely deletes a file. No-op if the file doesn't exist or deletion fails.
 */
export function deleteFile(path: string): void {
  try {
    if (existsSync(path)) {
      unlinkSync(path);
    }
  } catch {
    // Ignore if file already deleted
  }
}
