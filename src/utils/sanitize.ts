/**
 * Sanitizes a string for safe use as a Windows filename.
 * Removes or replaces invalid characters and trims whitespace.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim()
    .substring(0, 100);
}
