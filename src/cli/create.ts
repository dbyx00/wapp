import { createApp } from '../core/createApp';
import { APP } from '../config/app';
import type { AppEvent } from '../domain/events';
import type { IAppRegistry } from '../domain/appRegistry';
import type { BrowserName } from '../domain/types';

export interface CreateHandlerOptions {
  name?: string;
  browser?: string;
}

export async function createHandler(
  url: string,
  options: CreateHandlerOptions,
  registry: IAppRegistry
): Promise<void> {
  try {
    const app = await createApp(
      {
        url,
        name: options.name,
        browser: (options.browser || 'brave') as BrowserName,
        registry,
      },
      (event: AppEvent) => {
        // Map events to console output for backward-compatible CLI behavior
        if (event.status === 'success' && event.data !== undefined) {
          switch (event.step) {
            case 'validating':
              console.log(`✓ URL validated: ${event.data}`);
              break;
            case 'resolving-browser':
              console.log(`✓ Browser resolved: ${options.browser || 'brave'}`);
              break;
            case 'resolving-name':
              console.log(`✓ App name: ${event.data}`);
              break;
            case 'downloading-icon':
              console.log(`✓ Icon: ${event.data}`);
              break;
            case 'creating-shortcut':
              console.log(`✓ Shortcut: ${event.data}`);
              break;
            case 'registering':
              console.log('✓ App registered');
              break;
          }
        } else if (event.status === 'error') {
          console.error(`✗ ${event.step}: ${event.error}`);
        }
      }
    );

    // Final summary output
    console.log('');
    console.log(`✓ ${APP.name} created successfully`);
    console.log(`✓ Name: ${app.name}`);
    console.log(`✓ URL: ${app.url}`);
    console.log(`✓ Browser: ${app.browser}`);
    console.log(`✓ Icon: ${app.iconPath}`);
    console.log(`✓ Shortcut: Start Menu created`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${message}`);
    process.exit(1);
  }
}
