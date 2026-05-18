import { AppEntry } from '../domain/types';
import { IAppRegistry } from '../domain/appRegistry';
import { deleteFile } from './fileService';
import { load, save } from './registryPersistence';

export class AppRegistry implements IAppRegistry {
  add(entry: Omit<AppEntry, 'createdAt'>): void {
    const data = load();
    if (data.apps.some(app => app.name === entry.name)) {
      throw new Error(`App "${entry.name}" already exists`);
    }
    data.apps.push({ ...entry, createdAt: new Date().toISOString() });
    save(data);
  }

  list(): AppEntry[] {
    return load().apps;
  }

  findByName(name: string): AppEntry | undefined {
    return this.list().find(app => app.name === name);
  }

  remove(name: string): AppEntry {
    const data = load();
    const index = data.apps.findIndex(app => app.name === name);
    if (index === -1) {
      throw new Error(`App "${name}" not found`);
    }
    const [removed] = data.apps.splice(index, 1);
    deleteFile(removed.shortcutPath);
    deleteFile(removed.iconPath);
    save(data);
    return removed;
  }

  search(query: string): AppEntry[] {
    const apps = this.list();
    const q = query.toLowerCase();
    return apps.filter(app => app.name.toLowerCase().includes(q));
  }

  getByIndex(index: number): AppEntry | undefined {
    const apps = this.list();
    if (index < 1 || index > apps.length) {
      return undefined;
    }
    return apps[index - 1];
  }

  removeByQuery(query: string): AppEntry {
    const num = parseInt(query, 10);
    if (!isNaN(num) && num.toString() === query) {
      if (num <= 0) {
        throw new Error(`Invalid app number: ${num}`);
      }
      const app = this.getByIndex(num);
      if (!app) {
        throw new Error(`No app found at position ${num}`);
      }
      return this.remove(app.name);
    }
    const matches = this.search(query);
    if (matches.length === 0) {
      throw new Error(`No apps match "${query}"`);
    }
    if (matches.length === 1) {
      return this.remove(matches[0].name);
    }
    const suggestions = matches.map((app, i) => `  ${i + 1}. ${app.name}`).join('\n');
    throw new Error(
      `Multiple apps match "${query}":\n${suggestions}\n\n` +
      `Use the app number (e.g., wapp remove 1) or a more specific name.`
    );
  }
}
