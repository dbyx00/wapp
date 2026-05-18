import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../../src/core/createApp';
import { IAppRegistry } from '../../../src/domain/appRegistry';

// Mock service dependencies (but NOT AppRegistry anymore)
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

function createMockRegistry(): IAppRegistry {
  return {
    add: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    findByName: vi.fn(),
    remove: vi.fn(),
    unregister: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
  };
}

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
    const registry = createMockRegistry();

    await createApp({
      url: 'https://example.com',
      name: 'Example Site',
      browser: 'brave',
      registry,
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
    expect(registry.add).toHaveBeenCalledWith({
      name: 'Example Site',
      url: 'https://example.com/',
      browser: 'brave',
      iconPath: 'C:\\icons\\Example.ico',
      shortcutPath: 'C:\\StartMenu\\Example.lnk',
    });
  });

  it('uses default browser when not specified', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockResolvedValue('C:\\StartMenu\\Example.lnk');
    const registry = createMockRegistry();

    await createApp({
      url: 'https://example.com',
      registry,
    });

    expect(mockResolveBrowserPath).toHaveBeenCalledWith('brave');
  });

  it('throws on invalid URL', async () => {
    mockValidateUrl.mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    const registry = createMockRegistry();

    await expect(createApp({
      url: 'not-a-url',
      registry,
    })).rejects.toThrow('Invalid URL');
  });

  it('throws when browser not found', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockRejectedValue(new Error('Browser not found'));
    const registry = createMockRegistry();

    await expect(createApp({
      url: 'https://example.com',
      browser: 'firefox' as any,
      registry,
    })).rejects.toThrow('Browser not found');
  });

  it('propagates errors from any step', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockRejectedValue(new Error('Network error'));
    const registry = createMockRegistry();

    await expect(createApp({
      url: 'https://example.com',
      registry,
    })).rejects.toThrow('Network error');
  });

  it('does not register app if shortcut creation fails', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example Site');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockRejectedValue(new Error('Shortcut creation failed'));
    const registry = createMockRegistry();

    await expect(createApp({
      url: 'https://example.com',
      name: 'Example Site',
      browser: 'brave',
      registry,
    })).rejects.toThrow('Shortcut creation failed');

    expect(registry.add).not.toHaveBeenCalled();
  });
});
