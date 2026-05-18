import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createShortcut } from './shortcutCreator';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
const mockExecSync = vi.mocked(execSync);

describe('shortcutCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReturnValue('C:\\Users\\test\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates shortcut with correct parameters', async () => {
    const result = await createShortcut({
      name: 'Example',
      url: 'https://example.com',
      browserPath: 'C:\\Brave\\brave.exe',
      iconPath: 'C:\\icons\\Example.ico',
    });

    expect(mockExecSync).toHaveBeenCalledTimes(2); // Get start menu path + create shortcut
    expect(result).toContain('Example.lnk');
  });

  it('includes --app= argument in shortcut', async () => {
    await createShortcut({
      name: 'Test',
      url: 'https://test.com',
      browserPath: 'C:\\Brave\\brave.exe',
      iconPath: 'C:\\icons\\Test.ico',
    });

    const psCall = mockExecSync.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('WScript.Shell')
    );

    expect(psCall).toBeDefined();
    expect(psCall![0]).toContain('--app=https://test.com');
  });

  it('uses correct icon path', async () => {
    await createShortcut({
      name: 'Test',
      url: 'https://test.com',
      browserPath: 'C:\\Brave\\brave.exe',
      iconPath: 'C:\\icons\\Custom.ico',
    });

    const psCall = mockExecSync.mock.calls.find(
      call => typeof call[0] === 'string' && call[0].includes('WScript.Shell')
    );

    expect(psCall![0]).toContain('C:\\icons\\Custom.ico');
  });

  it('sanitizes shortcut name for Windows', async () => {
    const result = await createShortcut({
      name: 'Test: App',
      url: 'https://test.com',
      browserPath: 'C:\\Brave\\brave.exe',
      iconPath: 'C:\\icons\\Test.ico',
    });

    // Check the filename part (after last backslash) doesn't contain invalid chars
    const filename = result.split('\\').pop() || '';
    expect(filename).not.toContain(':');
    expect(filename).toBe('Test_ App.lnk');
  });

  it('throws error when PowerShell fails', async () => {
    mockExecSync.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('GetFolderPath')) {
        return 'C:\\StartMenu';
      }
      throw new Error('PowerShell execution failed');
    });

    await expect(createShortcut({
      name: 'Test',
      url: 'https://test.com',
      browserPath: 'C:\\Brave\\brave.exe',
      iconPath: 'C:\\icons\\Test.ico',
    })).rejects.toThrow('Failed to create shortcut');
  });
});
