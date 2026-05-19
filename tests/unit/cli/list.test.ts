import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listHandler } from '../../../src/cli/list';
import type { IAppRegistry } from '../../../src/domain/appRegistry';
import type { AppEntry } from '../../../src/domain/types';

// Mock listApps
vi.mock('../../../src/core/listApps', () => ({
  listApps: vi.fn(),
}));

import { listApps } from '../../../src/core/listApps';
const mockListApps = vi.mocked(listApps);

function createMockRegistry(overrides?: Partial<IAppRegistry>): IAppRegistry {
  return {
    add: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    findByName: vi.fn(),
    remove: vi.fn(),
    unregister: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    ...overrides,
  };
}

describe('listHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints message when no apps installed', async () => {
    mockListApps.mockImplementation(async (registry, onEvent) => {
      if (onEvent) {
        onEvent({ step: 'listed', status: 'success', data: { apps: [], count: 0 } });
      }
      return [];
    });
    const registry = createMockRegistry();

    await listHandler(registry);

    expect(console.log).toHaveBeenCalledWith('No WApps installed. Use "wapp create <url>" to create one.');
  });

  it('prints app list when apps exist', async () => {
    const mockApps: AppEntry[] = [
      {
        name: 'ChatGPT',
        url: 'https://chatgpt.com',
        browser: 'brave',
        iconPath: 'C:\\icons\\ChatGPT.ico',
        shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk',
        createdAt: '2026-05-18T15:30:00.000Z',
      },
    ];

    mockListApps.mockImplementation(async (registry, onEvent) => {
      if (onEvent) {
        onEvent({ step: 'listed', status: 'success', data: { apps: mockApps, count: mockApps.length } });
      }
      return mockApps;
    });

    const registry = createMockRegistry();

    await listHandler(registry);

    expect(console.log).toHaveBeenCalledWith('📱 Installed WApps (1):');
    expect(console.log).toHaveBeenCalledWith('  1. ChatGPT');
  });

  it('calls listApps with registry and callback', async () => {
    mockListApps.mockResolvedValue([]);
    const registry = createMockRegistry();

    await listHandler(registry);

    expect(mockListApps).toHaveBeenCalledWith(registry, expect.any(Function));
  });
});
