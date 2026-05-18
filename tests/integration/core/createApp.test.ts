import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../../src/core/createApp';

// Mock all dependencies
vi.mock('../../../src/services/browserResolver', () => ({
  resolveBrowserPath: vi.fn(),
}));

vi.mock('../../../src/services/metadataResolver', () => ({
  resolveMetadata: vi.fn(),
}));

vi.mock('../../../src/services/iconResolver', () => ({
  resolveIcon: vi.fn(),
}));

vi.mock('../../../src/windows/shortcutCreator', () => ({
  createShortcut: vi.fn(),
}));

vi.mock('../../../src/utils/url', () => ({
  validateUrl: vi.fn(),
}));

// Mock AppRegistry with constructor function
const mockAppRegistryAdd = vi.fn();

vi.mock('../../../src/services/appRegistry', () => {
  const MockAppRegistry = function(this: any) {
    this.add = mockAppRegistryAdd;
  };
  return { AppRegistry: MockAppRegistry };
});

import { resolveBrowserPath } from '../../../src/services/browserResolver';
import { resolveMetadata } from '../../../src/services/metadataResolver';
import { resolveIcon } from '../../../src/services/iconResolver';
import { createShortcut } from '../../../src/windows/shortcutCreator';
import { validateUrl } from '../../../src/utils/url';

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
