import { IAppRegistry } from '../domain/appRegistry';

export function removeHandler(query: string, registry: IAppRegistry): void {
  try {
    const num = parseInt(query, 10);
    let appName: string;

    if (!isNaN(num) && num.toString() === query) {
      if (num <= 0) {
        throw new Error(`Invalid app number: ${num}`);
      }
      const app = registry.getByIndex(num);
      if (!app) {
        throw new Error(`No app found at position ${num}`);
      }
      appName = app.name;
    } else {
      const byName = registry.findByName(query);
      if (byName) {
        appName = byName.name;
      } else {
        const matches = registry.search(query);
        if (matches.length === 0) {
          throw new Error(`No apps match "${query}"`);
        }
        if (matches.length > 1) {
          const suggestions = matches.map((app, i) => `  ${i + 1}. ${app.name}`).join('\n');
          throw new Error(
            `Multiple apps match "${query}":\n${suggestions}\n\n` +
            `Use the app number (e.g., wapp remove 1) or a more specific name.`
          );
        }
        appName = matches[0].name;
      }
    }

    const app = registry.remove(appName);

    console.log(`✓ App "${app.name}" removed`);
    console.log('✓ Shortcut deleted');
    console.log('✓ Icon deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${message}`);
    process.exit(1);
  }
}
