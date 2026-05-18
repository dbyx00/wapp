import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { load, save } from '../../../src/services/registryPersistence';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

describe('registryPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load', () => {
    it('returns empty data when registry file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const data = load();

      expect(data).toEqual({ apps: [] });
    });

    it('loads registry data from file', () => {
      const existingData = {
        apps: [
          { name: 'TestApp', url: 'https://test.com', browser: 'brave', iconPath: 'C:\\icons\\Test.ico', shortcutPath: 'C:\\StartMenu\\Test.lnk', createdAt: '2026-01-01T00:00:00.000Z' },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingData));

      const data = load();

      expect(data.apps).toHaveLength(1);
      expect(data.apps[0].name).toBe('TestApp');
    });

    it('returns empty data when file is corrupt', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('not valid json');

      const data = load();

      expect(data).toEqual({ apps: [] });
    });
  });

  describe('save', () => {
    it('creates directory if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      save({ apps: [] });

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('WApp'),
        { recursive: true }
      );
    });

    it('writes JSON data to file', () => {
      mockExistsSync.mockReturnValue(true);

      save({ apps: [{ name: 'App', url: 'https://app.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '2026-01-01' }] });

      expect(mockWriteFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(savedData.apps[0].name).toBe('App');
    });
  });
});
