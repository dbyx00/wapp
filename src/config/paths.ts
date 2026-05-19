import { join } from 'path';
import { APP } from './app';

export const REGISTRY_DIR = join(process.env.APPDATA || '', APP.dataDir);
export const REGISTRY_FILE = join(REGISTRY_DIR, 'registry.json');
export const ICONS_DIR = join(REGISTRY_DIR, 'icons');
