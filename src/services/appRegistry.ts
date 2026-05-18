import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { AppEntry } from '../domain/types';
import { REGISTRY_DIR, REGISTRY_FILE } from '../config/paths';

interface RegistryData {
  apps: AppEntry[];
}

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

  /**
   * Searches apps by partial name match (case-insensitive).
   * Returns all matching apps.
   */
  search(query: string): AppEntry[] {
    const apps = this.list();
    const q = query.toLowerCase();
    return apps.filter(app => app.name.toLowerCase().includes(q));
  }

  /**
   * Gets an app by 1-based index from the list.
   * Returns undefined if index is out of range.
   */
  getByIndex(index: number): AppEntry | undefined {
    const apps = this.list();
    if (index < 1 || index > apps.length) {
      return undefined;
    }
    return apps[index - 1];
  }

  /**
   * Removes an app by query string.
   * Query can be:
   * - A number (1, 2, 3...) → removes app by list position
   * - A text → searches partial match, removes if single match found
   * Throws with helpful message if multiple matches or no matches.
   */
  removeByQuery(query: string): AppEntry {
    // Try as number first
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

    // Search by partial match
    const matches = this.search(query);

    if (matches.length === 0) {
      throw new Error(`No apps match "${query}"`);
    }

    if (matches.length === 1) {
      return this.remove(matches[0].name);
    }

    // Multiple matches - show suggestions
    const suggestions = matches.map((app, i) => `  ${i + 1}. ${app.name}`).join('\n');
    throw new Error(
      `Multiple apps match "${query}":\n${suggestions}\n\n` +
      `Use the app number (e.g., wapp remove 1) or a more specific name.`
    );
  }
}
