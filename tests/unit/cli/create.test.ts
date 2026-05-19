import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHandler } from '../../../src/cli/create';
import type { IAppRegistry } from '../../../src/domain/appRegistry';

// Mock createApp dependencies
vi.mock('../../../src/core/createApp', () => ({
  createApp: vi.fn(),
}));

import { createApp } from '../../../src/core/createApp';
const mockCreateApp = vi.mocked(createApp);

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

describe('createHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls createApp with correct parameters', async () => {
    mockCreateApp.mockResolvedValue({
      name: 'Test',
      url: 'https://example.com',
      browser: 'chrome',
      iconPath: '',
      shortcutPath: '',
      createdAt: '',
    });
    const registry = createMockRegistry();

    await createHandler('https://example.com', { name: 'Test', browser: 'chrome' }, registry);

    expect(mockCreateApp).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        name: 'Test',
        browser: 'chrome',
        registry,
      }),
      expect.any(Function)
    );
  });

  it('defaults browser to brave when not specified', async () => {
    mockCreateApp.mockResolvedValue({
      name: 'Test',
      url: 'https://example.com',
      browser: 'brave',
      iconPath: '',
      shortcutPath: '',
      createdAt: '',
    });
    const registry = createMockRegistry();

    await createHandler('https://example.com', {}, registry);

    expect(mockCreateApp).toHaveBeenCalledWith(
      expect.objectContaining({ browser: 'brave' }),
      expect.any(Function)
    );
  });

  it('prints error and exits on failure', async () => {
    mockCreateApp.mockRejectedValue(new Error('Something went wrong'));
    const registry = createMockRegistry();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      createHandler('https://example.com', {}, registry)
    ).rejects.toThrow('exit');

    expect(console.error).toHaveBeenCalledWith('✗ Error: Something went wrong');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
