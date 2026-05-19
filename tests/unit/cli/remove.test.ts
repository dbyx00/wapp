import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { removeHandler } from '../../../src/cli/remove';
import type { IAppRegistry } from '../../../src/domain/appRegistry';
import type { AppEntry } from '../../../src/domain/types';

const exampleApp: AppEntry = {
  name: 'ChatGPT',
  url: 'https://chatgpt.com',
  browser: 'brave',
  iconPath: 'C:\\icons\\ChatGPT.ico',
  shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// Mock removeApp
vi.mock('../../../src/core/removeApp', () => ({
  removeApp: vi.fn(),
}));

import { removeApp } from '../../../src/core/removeApp';
const mockRemoveApp = vi.mocked(removeApp);

function createMockRegistry(overrides?: Partial<IAppRegistry>): IAppRegistry {
  return {
    add: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    findByName: vi.fn(),
    remove: vi.fn(),
    unregister: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    ...overrides,
  };
}

describe('removeHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls removeApp with correct parameters', async () => {
    mockRemoveApp.mockResolvedValue(exampleApp);
    const registry = createMockRegistry();

    await removeHandler('ChatGPT', registry);

    expect(mockRemoveApp).toHaveBeenCalledWith('ChatGPT', registry, expect.any(Function));
  });

  it('prints success message when removal succeeds', async () => {
    mockRemoveApp.mockImplementation(async (query, registry, onEvent) => {
      if (onEvent) {
        onEvent({ step: 'removed', status: 'success', data: exampleApp });
      }
      return exampleApp;
    });
    const registry = createMockRegistry();

    await removeHandler('ChatGPT', registry);

    expect(console.log).toHaveBeenCalledWith('✓ App "ChatGPT" removed');
    expect(console.log).toHaveBeenCalledWith('✓ Shortcut deleted');
    expect(console.log).toHaveBeenCalledWith('✓ Icon deleted');
  });

  it('prints error and exits when removal fails', async () => {
    mockRemoveApp.mockRejectedValue(new Error('No apps match "xyz"'));
    const registry = createMockRegistry();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(removeHandler('xyz', registry)).rejects.toThrow('exit');
    expect(console.error).toHaveBeenCalledWith('✗ Error: No apps match "xyz"');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
