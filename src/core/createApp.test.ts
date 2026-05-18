import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../core/createApp';

// Mock all dependencies
vi.mock('../services/browserResolver', () => ({
  resolveBrowserPath: vi.fn(),
  getAppArg: vi.fn(),
}));

vi.mock('../services/metadataResolver', () => ({
  resolveMetadata: vi.fn(),
}));

vi.mock('../services/iconResolver', () => ({
  resolveIcon: vi.fn(),
}));

vi.mock('../windows/shortcutCreator', () => ({
  createShortcut: vi.fn(),
}));

vi.mock('../utils/url', () => ({
  validateUrl: vi.fn(),
}));

import { resolveBrowserPath } from '../services/browserResolver';
import { resolveMetadata } from '../services/metadataResolver';
import { resolveIcon } from '../services/iconResolver';
import { createShortcut } from '../windows/shortcutCreator';
import { validateUrl } from '../utils/url';

const mockValidateUrl = vi.mocked(validateUrl);
const mockResolveBrowserPath = vi.mocked(resolveBrowserPath);
const mockResolveMetadata = vi.mocked(resolveMetadata);
const mockResolveIcon = vi.mocked(resolveIcon);
const mockCreateShortcut = vi.mocked(createShortcut);

describe('createApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full pipeline successfully', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example Site');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockResolvedValue('C:\\StartMenu\\Example.lnk');

    await createApp({
      url: 'https://example.com',
      name: 'Example Site',
      browser: 'brave',
    });

    expect(mockValidateUrl).toHaveBeenCalledWith('https://example.com');
    expect(mockResolveBrowserPath).toHaveBeenCalledWith('brave');
    expect(mockResolveMetadata).toHaveBeenCalledWith('https://example.com/', 'Example Site');
    expect(mockResolveIcon).toHaveBeenCalledWith('https://example.com/', 'Example Site');
    expect(mockCreateShortcut).toHaveBeenCalledWith({
      name: 'Example Site',
      url: 'https://example.com/',
      browserPath: 'C:\\Brave\\brave.exe',
      iconPath: 'C:\\icons\\Example.ico',
    });
  });

  it('uses default browser when not specified', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockResolvedValue('C:\\StartMenu\\Example.lnk');

    await createApp({
      url: 'https://example.com',
    });

    expect(mockResolveBrowserPath).toHaveBeenCalledWith('brave');
  });

  it('throws on invalid URL', async () => {
    mockValidateUrl.mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    await expect(createApp({
      url: 'not-a-url',
    })).rejects.toThrow('Invalid URL');
  });

  it('throws when browser not found', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockRejectedValue(new Error('Browser not found'));

    await expect(createApp({
      url: 'https://example.com',
      browser: 'firefox' as any,
    })).rejects.toThrow('Browser not found');
  });

  it('propagates errors from any step', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockRejectedValue(new Error('Network error'));

    await expect(createApp({
      url: 'https://example.com',
    })).rejects.toThrow('Network error');
  });
});
