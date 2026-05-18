import * as cheerio from 'cheerio';

/**
 * Resolves the app name for a URL.
 * If explicitName is provided, uses that.
 * Otherwise fetches the HTML title from the URL.
 * Falls back to domain-based name if title fetch fails.
 */
export async function resolveMetadata(url: string, explicitName?: string): Promise<string> {
  // Use explicit name if provided
  if (explicitName) {
    return explicitName;
  }

  try {
    // Fetch HTML and extract title
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'WApp/0.1.0 (Windows Web App Installer)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text().trim();

    if (title) {
      return title;
    }

    throw new Error('No <title> found in HTML');
  } catch (error) {
    // Fallback to domain-based name
    console.warn(`⚠ Could not fetch metadata: ${error instanceof Error ? error.message : String(error)}`);
    return getFallbackName(url);
  }
}

/**
 * Generates a fallback name from the URL domain.
 */
function getFallbackName(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove www. prefix and TLD, capitalize first letter
    const domain = parsed.hostname.replace(/^www\./, '');
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Web App';
  }
}
