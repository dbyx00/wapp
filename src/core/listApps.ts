import { IAppRegistry } from '../domain/appRegistry';
import { AppEntry } from '../domain/types';
import { AppEvent, OnEvent } from '../domain/events';

export async function listApps(
  registry: IAppRegistry,
  onEvent?: OnEvent
): Promise<AppEntry[]> {
  const emit = (event: AppEvent) => {
    if (onEvent) {
      onEvent(event);
    }
  };

  emit({ step: 'reading-registry', status: 'start' });
  const apps = registry.list();
  emit({ step: 'reading-registry', status: 'success' });
  emit({ step: 'listed', status: 'success', data: { apps, count: apps.length } });

  // Fallback console output for backward compatibility
  if (!onEvent) {
    if (apps.length === 0) {
      console.log('No WApps installed. Use "wapp create <url>" to create one.');
    } else {
      console.log(`📱 Installed WApps (${apps.length}):`);
      console.log('');
      apps.forEach((app, index) => {
        const created = new Date(app.createdAt).toLocaleDateString();
        console.log(`  ${index + 1}. ${app.name}`);
        console.log(`     URL: ${app.url}`);
        console.log(`     Browser: ${app.browser}`);
        console.log(`     Created: ${created}`);
        console.log('');
      });
    }
  }

  return apps;
}
