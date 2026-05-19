import { listApps } from '../core/listApps';
import type { AppEvent } from '../domain/events';
import type { AppEntry } from '../domain/types';
import type { IAppRegistry } from '../domain/appRegistry';

export async function listHandler(registry: IAppRegistry): Promise<void> {
  await listApps(registry, (event: AppEvent) => {
    if (event.step === 'listed' && event.status === 'success') {
      const { apps, count } = event.data as { apps: AppEntry[]; count: number };

      if (count === 0) {
        console.log('No WApps installed. Use "wapp create <url>" to create one.');
        return;
      }

      console.log(`📱 Installed WApps (${count}):`);
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
  });
}
