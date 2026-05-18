import { resolveBrowserPath } from '../services/browserResolver';
import { resolveMetadata } from '../services/metadataResolver';
import { resolveIcon } from '../services/iconResolver';
import { createShortcut } from '../windows/shortcutCreator';
import { validateUrl } from '../utils/url';
import { AppRegistry } from '../services/appRegistry';
import { CreateAppOptions } from '../domain/types';

export async function createApp(options: CreateAppOptions): Promise<void> {
  // Step 1: Validate URL
  const validatedUrl = validateUrl(options.url);
  console.log(`✓ URL validated: ${validatedUrl}`);

  // Step 2: Resolve browser path
  const browser = options.browser || 'brave';
  const browserPath = await resolveBrowserPath(browser);
  console.log(`✓ Browser resolved: ${browser}`);

  // Step 3: Resolve app name (fetch metadata title if not provided)
  const appName = await resolveMetadata(validatedUrl, options.name);
  console.log(`✓ App name: ${appName}`);

  // Step 4: Resolve and download icon
  const iconPath = await resolveIcon(validatedUrl, appName);
  console.log(`✓ Icon: ${iconPath}`);

  // Step 5: Create Windows shortcut
  const shortcutPath = await createShortcut({
    name: appName,
    url: validatedUrl,
    browserPath,
    iconPath,
  });
  console.log(`✓ Shortcut: ${shortcutPath}`);

  // Step 6: Register app in registry
  const registry = new AppRegistry();
  registry.add({
    name: appName,
    url: validatedUrl,
    browser,
    iconPath,
    shortcutPath,
  });
  console.log(`✓ App registered`);

  // Final output
  console.log('');
  console.log('✓ WApp created successfully');
  console.log(`✓ Name: ${appName}`);
  console.log(`✓ URL: ${validatedUrl}`);
  console.log(`✓ Browser: ${browser}`);
  console.log(`✓ Icon: ${iconPath}`);
  console.log(`✓ Shortcut: Start Menu created`);
}
