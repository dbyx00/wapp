import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface AppEntry {
  name: string;
  url: string;
  browser: string;
  iconPath: string;
  shortcutPath: string;
  createdAt: string;
}

interface RegistryData {
  apps: AppEntry[];
}

const REGISTRY_DIR = join(process.env.APPDATA || '', 'WApp');
const REGISTRY_FILE = join(REGISTRY_DIR, 'registry.json');

export class AppRegistry {
  /**
   * Adds a new app to the registry.
   * Throws if app with same name already exists.
   */
  add(entry: Omit<AppEntry, 'createdAt'>): void {
    const data = this.loadOrCreate();

    // Check for duplicate
    if (data.apps.some(app => app.name === entry.name)) {
      throw new Error(`App "${entry.name}" already exists`);
    }

    // Add with timestamp
    data.apps.push({
      ...entry,
      createdAt: new Date().toISOString(),
    });

    this.save(data);
  }

  /**
   * Returns all registered apps.
   */
  list(): AppEntry[] {
    if (!existsSync(REGISTRY_FILE)) {
      return [];
    }

    try {
      const data = JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
      return data.apps || [];
    } catch {
      return [];
    }
  }

  /**
   * Finds an app by exact name.
   * Returns undefined if not found.
   */
  findByName(name: string): AppEntry | undefined {
    const apps = this.list();
    return apps.find(app => app.name === name);
  }

  /**
   * Removes an app from registry and deletes its files.
   * Throws if app not found.
   */
  remove(name: string): AppEntry {
    const data = this.loadOrCreate();
    const index = data.apps.findIndex(app => app.name === name);

    if (index === -1) {
      throw new Error(`App "${name}" not found`);
    }

    const [removed] = data.apps.splice(index, 1);

    // Delete shortcut and icon files
    try {
      if (existsSync(removed.shortcutPath)) {
        unlinkSync(removed.shortcutPath);
      }
    } catch {
      // Ignore if file already deleted
    }

    try {
      if (existsSync(removed.iconPath)) {
        unlinkSync(removed.iconPath);
      }
    } catch {
      // Ignore if file already deleted
    }

    this.save(data);
    return removed;
  }

  /**
   * Loads existing registry or creates empty one.
   */
  private loadOrCreate(): RegistryData {
    if (!existsSync(REGISTRY_FILE)) {
      return { apps: [] };
    }

    try {
      return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
    } catch {
      return { apps: [] };
    }
  }

  /**
   * Saves registry data to file.
   */
  private save(data: RegistryData): void {
    if (!existsSync(REGISTRY_DIR)) {
      mkdirSync(REGISTRY_DIR, { recursive: true });
    }

    writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
  }
}
