/**
 * Validates and normalizes a URL string.
 * Throws Error if invalid.
 */
export function validateUrl(input: string): string {
  // Add protocol if missing
  let url = input;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new Error(`Invalid URL: ${input}. Please provide a valid URL (e.g., https://example.com)`);
  }
}
