import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppRegistry, AppEntry } from './appRegistry';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockUnlinkSync = vi.mocked(unlinkSync);

describe('appRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('add', () => {
    it('creates new registry file when it does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const registry = new AppRegistry();
      registry.add({
        name: 'TestApp',
        url: 'https://test.com',
        browser: 'brave',
        iconPath: 'C:\\icons\\TestApp.ico',
        shortcutPath: 'C:\\StartMenu\\TestApp.lnk',
      });

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('WApp'),
        { recursive: true }
      );
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('appends to existing registry', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'ExistingApp',
            url: 'https://existing.com',
            browser: 'chrome',
            iconPath: 'C:\\icons\\Existing.ico',
            shortcutPath: 'C:\\StartMenu\\Existing.lnk',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      registry.add({
        name: 'NewApp',
        url: 'https://new.com',
        browser: 'edge',
        iconPath: 'C:\\icons\\New.ico',
        shortcutPath: 'C:\\StartMenu\\New.lnk',
      });

      const savedData = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(savedData.apps).toHaveLength(2);
      expect(savedData.apps[1].name).toBe('NewApp');
    });

    it('sets createdAt timestamp', () => {
      mockExistsSync.mockReturnValue(false);

      const registry = new AppRegistry();
      const before = Date.now();
      registry.add({
        name: 'TestApp',
        url: 'https://test.com',
        browser: 'brave',
        iconPath: 'C:\\icons\\TestApp.ico',
        shortcutPath: 'C:\\StartMenu\\TestApp.lnk',
      });
      const after = Date.now();

      const savedData = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      const createdAt = new Date(savedData.apps[0].createdAt).getTime();
      expect(createdAt).toBeGreaterThanOrEqual(before - 1000);
      expect(createdAt).toBeLessThanOrEqual(after + 1000);
    });

    it('throws error when app with same name exists', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'DuplicateApp',
            url: 'https://test.com',
            browser: 'brave',
            iconPath: 'C:\\icons\\Dup.ico',
            shortcutPath: 'C:\\StartMenu\\Dup.lnk',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      expect(() =>
        registry.add({
          name: 'DuplicateApp',
          url: 'https://other.com',
          browser: 'chrome',
          iconPath: 'C:\\icons\\Dup.ico',
          shortcutPath: 'C:\\StartMenu\\Dup.lnk',
        })
      ).toThrow('App "DuplicateApp" already exists');
    });
  });

  describe('list', () => {
    it('returns empty array when registry does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const registry = new AppRegistry();
      const apps = registry.list();

      expect(apps).toEqual([]);
    });

    it('returns all apps from registry', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'App1',
            url: 'https://app1.com',
            browser: 'brave',
            iconPath: 'C:\\icons\\App1.ico',
            shortcutPath: 'C:\\StartMenu\\App1.lnk',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            name: 'App2',
            url: 'https://app2.com',
            browser: 'chrome',
            iconPath: 'C:\\icons\\App2.ico',
            shortcutPath: 'C:\\StartMenu\\App2.lnk',
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      const apps = registry.list();

      expect(apps).toHaveLength(2);
      expect(apps[0].name).toBe('App1');
      expect(apps[1].name).toBe('App2');
    });
  });

  describe('findByName', () => {
    it('returns app when found by exact name', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'ChatGPT',
            url: 'https://chatgpt.com',
            browser: 'brave',
            iconPath: 'C:\\icons\\ChatGPT.ico',
            shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      const app = registry.findByName('ChatGPT');

      expect(app).toBeDefined();
      expect(app!.name).toBe('ChatGPT');
      expect(app!.url).toBe('https://chatgpt.com');
    });

    it('returns undefined when app not found', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: [] }));

      const registry = new AppRegistry();
      const app = registry.findByName('NonExistent');

      expect(app).toBeUndefined();
    });

    it('returns undefined when registry does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const registry = new AppRegistry();
      const app = registry.findByName('Any');

      expect(app).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('removes app from registry', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'ToRemove',
            url: 'https://remove.com',
            browser: 'brave',
            iconPath: 'C:\\icons\\ToRemove.ico',
            shortcutPath: 'C:\\StartMenu\\ToRemove.lnk',
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
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      const removed = registry.remove('ToRemove');

      expect(removed).toBeDefined();
      expect(removed!.name).toBe('ToRemove');

      const savedData = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(savedData.apps).toHaveLength(1);
      expect(savedData.apps[0].name).toBe('Keep');
    });

    it('deletes shortcut file', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'TestApp',
            url: 'https://test.com',
            browser: 'brave',
            iconPath: 'C:\\icons\\Test.ico',
            shortcutPath: 'C:\\StartMenu\\Test.lnk',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      registry.remove('TestApp');

      expect(mockUnlinkSync).toHaveBeenCalledWith('C:\\StartMenu\\Test.lnk');
    });

    it('deletes icon file', () => {
      const existingRegistry = {
        apps: [
          {
            name: 'TestApp',
            url: 'https://test.com',
            browser: 'brave',
            iconPath: 'C:\\icons\\Test.ico',
            shortcutPath: 'C:\\StartMenu\\Test.lnk',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingRegistry));

      const registry = new AppRegistry();
      registry.remove('TestApp');

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
});
