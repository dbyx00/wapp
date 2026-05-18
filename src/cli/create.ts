import { createApp } from '../core/createApp';
import { IAppRegistry } from '../domain/appRegistry';
import { BrowserName } from '../domain/types';

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
    await createApp({
      url,
      name: options.name,
      browser: (options.browser || 'brave') as BrowserName,
      registry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${message}`);
    process.exit(1);
  }
}
