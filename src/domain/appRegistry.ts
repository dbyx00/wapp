import { AppEntry } from './types';

export interface IAppRegistry {
  add(entry: Omit<AppEntry, 'createdAt'>): void;
  list(): AppEntry[];
  findByName(name: string): AppEntry | undefined;
  remove(name: string): AppEntry;
  search(query: string): AppEntry[];
  getByIndex(index: number): AppEntry | undefined;
  removeByQuery(query: string): AppEntry;
}
