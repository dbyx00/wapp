import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../../src/core/createApp';
import { IAppRegistry } from '../../../src/domain/appRegistry';
import { AppEvent } from '../../../src/domain/events';

// Mock service dependencies
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

describe('createApp event sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits full success event sequence', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example Site');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockResolvedValue('C:\\StartMenu\\Example.lnk');
    const registry = createMockRegistry();

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await createApp(
      {
        url: 'https://example.com',
        name: 'Example Site',
        browser: 'brave',
        registry,
      },
      collector
    );

    expect(events.map((e) => ({ step: e.step, status: e.status }))).toEqual([
      { step: 'validating', status: 'start' },
      { step: 'validating', status: 'success' },
      { step: 'resolving-browser', status: 'start' },
      { step: 'resolving-browser', status: 'success' },
      { step: 'resolving-name', status: 'start' },
      { step: 'resolving-name', status: 'success' },
      { step: 'downloading-icon', status: 'start' },
      { step: 'downloading-icon', status: 'success' },
      { step: 'creating-shortcut', status: 'start' },
      { step: 'creating-shortcut', status: 'success' },
      { step: 'registering', status: 'start' },
      { step: 'registering', status: 'success' },
      { step: 'created', status: 'success' },
    ]);

    expect(events[1].data).toBe('https://example.com/');
    expect(events[3].data).toBe('C:\\Brave\\brave.exe');
    expect(events[5].data).toBe('Example Site');
    expect(events[7].data).toBe('C:\\icons\\Example.ico');
    expect(events[9].data).toBe('C:\\StartMenu\\Example.lnk');
    expect(events[12].data).toMatchObject({
      name: 'Example Site',
      url: 'https://example.com/',
      browser: 'brave',
    });
  });

  it('emits error event on invalid URL', async () => {
    mockValidateUrl.mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    const registry = createMockRegistry();

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await expect(
      createApp(
        {
          url: 'not-a-url',
          registry,
        },
        collector
      )
    ).rejects.toThrow('Invalid URL');

    expect(events).toEqual([
      { step: 'validating', status: 'start' },
      { step: 'validating', status: 'error', error: 'Invalid URL' },
    ]);
  });

  it('emits error event when browser not found', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockRejectedValue(new Error('Browser not found'));
    const registry = createMockRegistry();

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await expect(
      createApp(
        {
          url: 'https://example.com',
          browser: 'firefox' as any,
          registry,
        },
        collector
      )
    ).rejects.toThrow('Browser not found');

    expect(events.map((e) => ({ step: e.step, status: e.status }))).toEqual([
      { step: 'validating', status: 'start' },
      { step: 'validating', status: 'success' },
      { step: 'resolving-browser', status: 'start' },
      { step: 'resolving-browser', status: 'error' },
    ]);
    expect(events[3].error).toBe('Browser not found');
  });

  it('works when onEvent is omitted (backward compat)', async () => {
    mockValidateUrl.mockReturnValue('https://example.com/');
    mockResolveBrowserPath.mockResolvedValue('C:\\Brave\\brave.exe');
    mockResolveMetadata.mockResolvedValue('Example Site');
    mockResolveIcon.mockResolvedValue('C:\\icons\\Example.ico');
    mockCreateShortcut.mockResolvedValue('C:\\StartMenu\\Example.lnk');
    const registry = createMockRegistry();

    const result = await createApp({
      url: 'https://example.com',
      registry,
    });

    expect(result.name).toBe('Example Site');
  });
});
