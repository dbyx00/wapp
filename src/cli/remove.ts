import { IAppRegistry } from '../domain/appRegistry';

export function removeHandler(query: string, registry: IAppRegistry): void {
  try {
    const app = registry.removeByQuery(query);

    console.log(`✓ App "${app.name}" removed`);
    console.log('✓ Shortcut deleted');
    console.log('✓ Icon deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${message}`);
    process.exit(1);
  }
}
