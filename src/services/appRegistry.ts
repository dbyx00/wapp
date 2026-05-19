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
    const removed = this.unregister(name);
    deleteFile(removed.shortcutPath);
    deleteFile(removed.iconPath);
    return removed;
  }

  unregister(name: string): AppEntry {
    const data = load();
    const index = data.apps.findIndex(app => app.name === name);
    if (index === -1) {
      throw new Error(`App "${name}" not found`);
    }
    const [removed] = data.apps.splice(index, 1);
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

}
