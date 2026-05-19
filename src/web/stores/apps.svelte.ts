import { AppEntry } from '../../domain/types';
import { fetchApps as apiFetchApps } from '../api/client';

let apps = $state<AppEntry[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function getAppsState() {
  return {
    get apps() { return apps; },
    get loading() { return loading; },
    get error() { return error; },
  };
}

export async function fetchApps(): Promise<void> {
  loading = true;
  error = null;
  try {
    apps = await apiFetchApps();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  } finally {
    loading = false;
  }
}

export function addApp(app: AppEntry): void {
  apps = [app, ...apps];
}

export function removeAppFromStore(name: string): void {
  apps = apps.filter(a => a.name !== name);
}
