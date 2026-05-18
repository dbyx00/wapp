import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { removeHandler } from '../../../src/cli/remove';
import { IAppRegistry } from '../../../src/domain/appRegistry';
import { AppEntry } from '../../../src/domain/types';

const exampleApp: AppEntry = {
  name: 'ChatGPT',
  url: 'https://chatgpt.com',
  browser: 'brave',
  iconPath: 'C:\\icons\\ChatGPT.ico',
  shortcutPath: 'C:\\StartMenu\\ChatGPT.lnk',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function createMockRegistry(overrides?: Partial<IAppRegistry>): IAppRegistry {
  return {
    add: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    findByName: vi.fn(),
    remove: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    removeByQuery: vi.fn(),
    ...overrides,
  };
}

describe('removeHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints success message when removal succeeds', () => {
    const registry = createMockRegistry({
      removeByQuery: vi.fn().mockReturnValue(exampleApp),
    });

    removeHandler('ChatGPT', registry);

    expect(console.log).toHaveBeenCalledWith('✓ App "ChatGPT" removed');
    expect(console.log).toHaveBeenCalledWith('✓ Shortcut deleted');
    expect(console.log).toHaveBeenCalledWith('✓ Icon deleted');
  });

  it('calls removeByQuery with the query string', () => {
    const removeByQueryMock = vi.fn().mockReturnValue(exampleApp);
    const registry = createMockRegistry({ removeByQuery: removeByQueryMock });

    removeHandler('chat', registry);

    expect(removeByQueryMock).toHaveBeenCalledWith('chat');
  });

  it('prints error and exits when removal fails', () => {
    const registry = createMockRegistry({
      removeByQuery: vi.fn().mockImplementation(() => {
        throw new Error('No apps match "xyz"');
      }),
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    expect(() => removeHandler('xyz', registry)).toThrow('exit');
    expect(console.error).toHaveBeenCalledWith('✗ Error: No apps match "xyz"');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
