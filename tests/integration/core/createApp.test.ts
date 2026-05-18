import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../../src/core/createApp';
import { IAppRegistry } from '../../../src/domain/appRegistry';

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
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    removeByQuery: vi.fn(),
  };
}

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
    const registry = createMockRegistry();

    await createApp({
      url: 'https://example.com',
      name: 'Example Site',
      browser: 'brave',
      registry,
    });

    expect(registry.add).toHaveBeenCalledWith({
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
