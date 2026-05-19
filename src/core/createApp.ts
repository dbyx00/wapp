import { resolveBrowserPath } from '../services/browserResolver';
import { resolveMetadata } from '../services/metadataResolver';
import { resolveIcon } from '../services/iconResolver';
import { createShortcut } from '../windows/shortcutCreator';
import { validateUrl } from '../utils/url';
import { CreateAppOptions, AppEntry } from '../domain/types';
import { AppEvent, OnEvent } from '../domain/events';

export async function createApp(
  options: CreateAppOptions,
  onEvent?: OnEvent
): Promise<AppEntry> {
  const emit = (event: AppEvent) => {
    if (onEvent) {
      onEvent(event);
    }
  };

  // Step 1: Validate URL
  emit({ step: 'validating', status: 'start' });
  let validatedUrl: string;
  try {
    validatedUrl = validateUrl(options.url);
    emit({ step: 'validating', status: 'success', data: validatedUrl });
    if (!onEvent) {
      console.log(`✓ URL validated: ${validatedUrl}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'validating', status: 'error', error: message });
    throw error;
  }

  // Step 2: Resolve browser path
  emit({ step: 'resolving-browser', status: 'start' });
  const browser = options.browser || 'brave';
  let browserPath: string;
  try {
    browserPath = await resolveBrowserPath(browser);
    emit({ step: 'resolving-browser', status: 'success', data: browserPath });
    if (!onEvent) {
      console.log(`✓ Browser resolved: ${browser}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'resolving-browser', status: 'error', error: message });
    throw error;
  }

  // Step 3: Resolve app name (fetch metadata title if not provided)
  emit({ step: 'resolving-name', status: 'start' });
  let appName: string;
  try {
    appName = await resolveMetadata(validatedUrl, options.name);
    emit({ step: 'resolving-name', status: 'success', data: appName });
    if (!onEvent) {
      console.log(`✓ App name: ${appName}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'resolving-name', status: 'error', error: message });
    throw error;
  }

  // Step 4: Resolve and download icon
  emit({ step: 'downloading-icon', status: 'start' });
  let iconPath: string;
  try {
    iconPath = await resolveIcon(validatedUrl, appName);
    emit({ step: 'downloading-icon', status: 'success', data: iconPath });
    if (!onEvent) {
      console.log(`✓ Icon: ${iconPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'downloading-icon', status: 'error', error: message });
    throw error;
  }

  // Step 5: Create Windows shortcut
  emit({ step: 'creating-shortcut', status: 'start' });
  let shortcutPath: string;
  try {
    shortcutPath = await createShortcut({
      name: appName,
      url: validatedUrl,
      browserPath,
      iconPath,
    });
    emit({ step: 'creating-shortcut', status: 'success', data: shortcutPath });
    if (!onEvent) {
      console.log(`✓ Shortcut: ${shortcutPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'creating-shortcut', status: 'error', error: message });
    throw error;
  }

  // Step 6: Register app in registry
  emit({ step: 'registering', status: 'start' });
  const entry: Omit<AppEntry, 'createdAt'> = {
    name: appName,
    url: validatedUrl,
    browser,
    iconPath,
    shortcutPath,
  };
  try {
    options.registry.add(entry);
    emit({ step: 'registering', status: 'success' });
    if (!onEvent) {
      console.log(`✓ App registered`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'registering', status: 'error', error: message });
    throw error;
  }

  const app: AppEntry = { ...entry, createdAt: new Date().toISOString() };

  // Final event
  emit({ step: 'created', status: 'success', data: app });

  // Final output (backward compatibility)
  if (!onEvent) {
    console.log('');
    console.log('✓ WApp created successfully');
    console.log(`✓ Name: ${appName}`);
    console.log(`✓ URL: ${validatedUrl}`);
    console.log(`✓ Browser: ${browser}`);
    console.log(`✓ Icon: ${iconPath}`);
    console.log(`✓ Shortcut: Start Menu created`);
  }

  return app;
}
