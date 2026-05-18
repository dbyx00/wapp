import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listHandler } from '../../../src/cli/list';
import { IAppRegistry } from '../../../src/domain/appRegistry';
import { AppEntry } from '../../../src/domain/types';

function createMockRegistry(overrides?: Partial<IAppRegistry>): IAppRegistry {
  return {
    add: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    findByName: vi.fn(),
    remove: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    removeByQuery: vi.fn(),
    ...overrides,
  };
}

describe('listHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints message when no apps installed', () => {
    const registry = createMockRegistry();

    listHandler(registry);

    expect(console.log).toHaveBeenCalledWith('No WApps installed. Use "wapp create <url>" to create one.');
  });

  it('prints app list when apps exist', () => {
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

    const registry = createMockRegistry({ list: vi.fn().mockReturnValue(mockApps) });

    listHandler(registry);

    expect(console.log).toHaveBeenCalledWith('📱 Installed WApps (1):');
    expect(console.log).toHaveBeenCalledWith('  1. ChatGPT');
  });

  it('calls registry.list() once', () => {
    const listMock = vi.fn().mockReturnValue([]);
    const registry = createMockRegistry({ list: listMock });

    listHandler(registry);

    expect(listMock).toHaveBeenCalledTimes(1);
  });
});
