import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock readline for interactive input
vi.mock('readline', () => ({
  createInterface: vi.fn(),
}));

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

describe('remove command - enhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('remove by number', () => {
    it('removes app when query is valid number', () => {
      const mockApps = [
        { name: 'ChatGPT', url: 'https://chatgpt.com', browser: 'brave', iconPath: 'C:\\icons\\ChatGPT.ico', shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk', createdAt: '2026-01-01T00:00:00.000Z' },
        { name: 'GitHub', url: 'https://github.com', browser: 'chrome', iconPath: 'C:\\icons\\GitHub.ico', shortcutPath: 'C:\\StartMenu\\GitHub.lnk', createdAt: '2026-01-02T00:00:00.000Z' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      const removed = registry.removeByQuery('2');

      expect(removed.name).toBe('GitHub');
    });

    it('throws error when number is out of range', () => {
      const mockApps = [
        { name: 'ChatGPT', url: 'https://chatgpt.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      expect(() => registry.removeByQuery('5')).toThrow('No app found at position 5');
    });

    it('throws error when number is 0 or negative', () => {
      const mockApps = [
        { name: 'ChatGPT', url: 'https://chatgpt.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      expect(() => registry.removeByQuery('0')).toThrow('Invalid app number: 0');
      expect(() => registry.removeByQuery('-1')).toThrow('Invalid app number: -1');
    });
  });

  describe('remove by partial match', () => {
    it('removes app directly when single match found', () => {
      const mockApps = [
        { name: 'ChatGPT', url: 'https://chatgpt.com', browser: 'brave', iconPath: 'C:\\icons\\ChatGPT.ico', shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk', createdAt: '2026-01-01T00:00:00.000Z' },
        { name: 'GitHub', url: 'https://github.com', browser: 'chrome', iconPath: '', shortcutPath: '', createdAt: '' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      const removed = registry.removeByQuery('chat');

      expect(removed.name).toBe('ChatGPT');
    });

    it('throws error with suggestions when multiple matches found', () => {
      const mockApps = [
        { name: 'Example Site', url: 'https://example.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' },
        { name: 'Example App', url: 'https://example.org', browser: 'chrome', iconPath: '', shortcutPath: '', createdAt: '' },
        { name: 'My Example', url: 'https://myexample.com', browser: 'edge', iconPath: '', shortcutPath: '', createdAt: '' },
        { name: 'GitHub', url: 'https://github.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      expect(() => registry.removeByQuery('example')).toThrow('Multiple apps match "example"');
    });

    it('throws error when no matches found', () => {
      const mockApps = [
        { name: 'ChatGPT', url: 'https://chatgpt.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' },
        { name: 'GitHub', url: 'https://github.com', browser: 'chrome', iconPath: '', shortcutPath: '', createdAt: '' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      expect(() => registry.removeByQuery('nonexistent')).toThrow('No apps match "nonexistent"');
    });
  });

  describe('remove by exact name (backward compatibility)', () => {
    it('removes app when exact name matches', () => {
      const mockApps = [
        { name: 'ChatGPT', url: 'https://chatgpt.com', browser: 'brave', iconPath: 'C:\\icons\\ChatGPT.ico', shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk', createdAt: '2026-01-01T00:00:00.000Z' },
        { name: 'GitHub', url: 'https://github.com', browser: 'chrome', iconPath: '', shortcutPath: '', createdAt: '' },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ apps: mockApps }));

      const registry = new AppRegistry();
      const removed = registry.removeByQuery('ChatGPT');

      expect(removed.name).toBe('ChatGPT');
    });
  });
});
