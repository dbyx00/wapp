import { join } from 'path';

export const REGISTRY_DIR = join(process.env.APPDATA || '', 'WApp');
export const REGISTRY_FILE = join(REGISTRY_DIR, 'registry.json');
export const ICONS_DIR = join(REGISTRY_DIR, 'icons');
