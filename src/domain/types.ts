import type { IAppRegistry } from './appRegistry';

export type BrowserName = 'brave' | 'chrome' | 'edge';

export interface AppEntry {
  name: string;
  url: string;
  browser: string;
  iconPath: string;
  shortcutPath: string;
  createdAt: string;
}

export interface CreateAppOptions {
  url: string;
  name?: string;
  browser?: BrowserName;
  registry: IAppRegistry;
}

export interface ShortcutOptions {
  name: string;
  url: string;
  browserPath: string;
  iconPath: string;
}
