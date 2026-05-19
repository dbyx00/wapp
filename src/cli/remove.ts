import { removeApp } from '../core/removeApp';
import { APP } from '../config/app';
import type { AppEvent } from '../domain/events';
import type { IAppRegistry } from '../domain/appRegistry';

export async function removeHandler(query: string, registry: IAppRegistry): Promise<void> {
  try {
    await removeApp(query, registry, (event: AppEvent) => {
      if (event.step === 'removed' && event.status === 'success') {
        const app = event.data as { name: string };
        console.log(`✓ ${APP.name} "${app.name}" removed`);
        console.log('✓ Shortcut deleted');
        console.log('✓ Icon deleted');
      } else if (event.status === 'error') {
        console.error(`✗ ${event.step}: ${event.error}`);
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${message}`);
    process.exit(1);
  }
}
