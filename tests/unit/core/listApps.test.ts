import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listApps } from '../../../src/core/listApps';
import { IAppRegistry } from '../../../src/domain/appRegistry';
import { AppEntry } from '../../../src/domain/types';
import { AppEvent } from '../../../src/domain/events';

const mockApps: AppEntry[] = [
  {
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    browser: 'brave',
    iconPath: 'C:\\icons\\ChatGPT.ico',
    shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    browser: 'chrome',
    iconPath: 'C:\\icons\\GitHub.ico',
    shortcutPath: 'C:\\StartMenu\\GitHub.lnk',
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

function createMockRegistry(overrides?: Partial<IAppRegistry>): IAppRegistry {
  return {
    add: vi.fn(),
    list: vi.fn().mockReturnValue(mockApps),
    findByName: vi.fn(),
    remove: vi.fn(),
    unregister: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    ...overrides,
  };
}

describe('listApps event sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits full success event sequence', async () => {
    const registry = createMockRegistry();

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await listApps(registry, collector);

    expect(events.map((e) => ({ step: e.step, status: e.status }))).toEqual([
      { step: 'reading-registry', status: 'start' },
      { step: 'reading-registry', status: 'success' },
      { step: 'listed', status: 'success' },
    ]);

    expect(events[2].data).toEqual({ apps: mockApps, count: 2 });
  });

  it('handles empty list', async () => {
    const registry = createMockRegistry({
      list: vi.fn().mockReturnValue([]),
    });

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    const result = await listApps(registry, collector);

    expect(result).toEqual([]);
    expect(events[2].data).toEqual({ apps: [], count: 0 });
  });

  it('returns the correct array', async () => {
    const registry = createMockRegistry();

    const result = await listApps(registry);

    expect(result).toEqual(mockApps);
    expect(registry.list).toHaveBeenCalledTimes(1);
  });

  it('works when onEvent is omitted (backward compat)', async () => {
    const registry = createMockRegistry();

    const result = await listApps(registry);

    expect(result).toEqual(mockApps);
  });
});
