import { IAppRegistry } from '../domain/appRegistry';

export function listHandler(registry: IAppRegistry): void {
  const apps = registry.list();

  if (apps.length === 0) {
    console.log('No WApps installed. Use "wapp create <url>" to create one.');
    return;
  }

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
