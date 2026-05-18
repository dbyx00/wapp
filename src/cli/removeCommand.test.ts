import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { AppRegistry } from '../services/appRegistry';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockUnlinkSync = vi.mocked(unlinkSync);

describe('remove command logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes app and returns removed entry', () => {
    const mockApps = [
      {
        name: 'ToRemove',
        url: 'https://remove.com',
        browser: 'brave',
        iconPath: 'C:\\icons\\Remove.ico',
        shortcutPath: 'C:\\StartMenu\\Remove.lnk',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        name: 'Keep',
        url: 'https://keep.com',
        browser: 'chrome',
        iconPath: 'C:\\icons\\Keep.ico',
        shortcutPath: 'C:\\StartMenu\\Keep.lnk',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

    const registry = new AppRegistry();
    const removed = registry.remove('ToRemove');

    expect(removed.name).toBe('ToRemove');
    expect(removed.url).toBe('https://remove.com');
  });

  it('deletes shortcut and icon files', () => {
    const mockApps = [
      {
        name: 'TestApp',
        url: 'https://test.com',
        browser: 'brave',
        iconPath: 'C:\\icons\\Test.ico',
        shortcutPath: 'C:\\StartMenu\\Test.lnk',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));
    mockExistsSync.mockImplementation((path) => {
      // Return true for registry file, shortcut, and icon
      return true;
    });

    const registry = new AppRegistry();
    registry.remove('TestApp');

    expect(mockUnlinkSync).toHaveBeenCalledWith('C:\\StartMenu\\Test.lnk');
    expect(mockUnlinkSync).toHaveBeenCalledWith('C:\\icons\\Test.ico');
  });

  it('throws error when app not found', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ apps: [] }));

    const registry = new AppRegistry();

    expect(() => registry.remove('NonExistent')).toThrow('App "NonExistent" not found');
  });

  it('throws error when registry does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    const registry = new AppRegistry();

    expect(() => registry.remove('Any')).toThrow('App "Any" not found');
  });
});
