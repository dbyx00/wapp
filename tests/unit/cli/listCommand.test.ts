import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { existsSync, readFileSync } from 'fs';
import { AppRegistry, AppEntry } from '../../../src/services/appRegistry';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('list command logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty list when no apps installed', () => {
    mockExistsSync.mockReturnValue(false);

    const registry = new AppRegistry();
    const apps = registry.list();

    expect(apps).toEqual([]);
  });

  it('formats app list correctly', () => {
    const mockApps: AppEntry[] = [
      {
        name: 'ChatGPT',
        url: 'https://chatgpt.com',
        browser: 'brave',
        iconPath: 'C:\\icons\\ChatGPT.ico',
        shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk',
        createdAt: '2026-05-18T15:30:00.000Z',
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
        browser: 'chrome',
        iconPath: 'C:\\icons\\GitHub.ico',
        shortcutPath: 'C:\\StartMenu\\GitHub.lnk',
        createdAt: '2026-05-18T16:00:00.000Z',
      },
    ];

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

    const registry = new AppRegistry();
    const apps = registry.list();

    expect(apps).toHaveLength(2);
    expect(apps[0].name).toBe('ChatGPT');
    expect(apps[0].browser).toBe('brave');
    expect(apps[1].name).toBe('GitHub');
    expect(apps[1].browser).toBe('chrome');
  });

  it('includes creation date in list', () => {
    const mockApps: AppEntry[] = [
      {
        name: 'Test',
        url: 'https://test.com',
        browser: 'edge',
        iconPath: 'C:\\icons\\Test.ico',
        shortcutPath: 'C:\\StartMenu\\Test.lnk',
        createdAt: '2026-05-18T15:30:00.000Z',
      },
    ];

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

    const registry = new AppRegistry();
    const apps = registry.list();

    expect(apps[0].createdAt).toBe('2026-05-18T15:30:00.000Z');
    expect(new Date(apps[0].createdAt).toLocaleDateString()).toBeDefined();
  });
});
