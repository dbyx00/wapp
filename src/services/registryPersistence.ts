import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { REGISTRY_DIR, REGISTRY_FILE } from '../config/paths';
import { AppEntry } from '../domain/types';

export interface RegistryData {
  apps: AppEntry[];
}

/**
 * Loads registry data from file, or returns empty data if file doesn't exist.
 */
export function load(): RegistryData {
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
 * Saves registry data to file. Creates directory if needed.
 */
export function save(data: RegistryData): void {
  if (!existsSync(REGISTRY_DIR)) {
    mkdirSync(REGISTRY_DIR, { recursive: true });
  }

  writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
}
