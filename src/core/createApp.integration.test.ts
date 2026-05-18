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

// Mock AppRegistry with constructor function
const mockAppRegistryAdd = vi.fn();

vi.mock('../services/appRegistry', () => {
  const MockAppRegistry = function(this: any) {
    this.add = mockAppRegistryAdd;
  };
  return { AppRegistry: MockAppRegistry };
});

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

describe('createApp integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers app in registry after successful creation', async () => {
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

    expect(mockAppRegistryAdd).toHaveBeenCalledWith({
      name: 'Example Site',
      url: 'https://example.com/',
      browser: 'brave',
      iconPath: 'C:\\icons\\Example.ico',
      shortcutPath: 'C:\\StartMenu\\Example.lnk',
    });
  });

  it('does not register app if shortcut creation fails', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example Site');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockRejectedValue(new Error('Shortcut creation failed'));

    await expect(createApp({
      url: 'https://example.com',
      name: 'Example Site',
      browser: 'brave',
    })).rejects.toThrow('Shortcut creation failed');

    expect(mockAppRegistryAdd).not.toHaveBeenCalled();
  });
});
