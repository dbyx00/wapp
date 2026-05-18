import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs module before importing the module under test
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

// Import after mock
import { resolveBrowserPath, getAppArg, BrowserName } from '../../../src/services/browserResolver';
import { existsSync } from 'fs';
const mockExistsSync = vi.mocked(existsSync);

describe('browserResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  describe('resolveBrowserPath', () => {
    it('returns brave path when installed', async () => {
      // Mock any path that contains 'brave.exe' to return true
      mockExistsSync.mockImplementation((p) => typeof p === 'string' && p.includes('brave.exe'));

      const result = await resolveBrowserPath('brave');
      expect(result).toContain('brave.exe');
    });

    it('returns chrome path when installed', async () => {
      mockExistsSync.mockImplementation((p) => typeof p === 'string' && p.includes('chrome.exe'));

      const result = await resolveBrowserPath('chrome');
      expect(result).toContain('chrome.exe');
    });

    it('returns edge path when installed', async () => {
      mockExistsSync.mockImplementation((p) => typeof p === 'string' && p.includes('msedge.exe'));

      const result = await resolveBrowserPath('edge');
      expect(result).toContain('msedge.exe');
    });

    it('falls back to edge when brave not found', async () => {
      mockExistsSync.mockImplementation((p) => typeof p === 'string' && p.includes('msedge.exe'));

      const result = await resolveBrowserPath('brave');
      expect(result).toContain('msedge.exe');
    });

    it('falls back to edge when chrome not found', async () => {
      mockExistsSync.mockImplementation((p) => typeof p === 'string' && p.includes('msedge.exe'));

      const result = await resolveBrowserPath('chrome');
      expect(result).toContain('msedge.exe');
    });

    it('throws when edge is not found and edge was requested', async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(resolveBrowserPath('edge')).rejects.toThrow('Browser not found');
    });

    it('throws when no browser is found and brave was requested', async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(resolveBrowserPath('brave')).rejects.toThrow('Browser not found');
    });

    it('throws on unsupported browser', async () => {
      await expect(resolveBrowserPath('firefox' as BrowserName)).rejects.toThrow('Unsupported browser');
    });
  });

  describe('getAppArg', () => {
    it('returns --app= for brave', () => {
      expect(getAppArg('brave')).toBe('--app=');
    });

    it('returns --app= for chrome', () => {
      expect(getAppArg('chrome')).toBe('--app=');
    });

    it('returns --app= for edge', () => {
      expect(getAppArg('edge')).toBe('--app=');
    });
  });
});
