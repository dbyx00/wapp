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
    unregister: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
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

  it('prints success message when removal by exact name succeeds', () => {
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(exampleApp),
      remove: vi.fn().mockReturnValue(exampleApp),
    });

    removeHandler('ChatGPT', registry);

    expect(console.log).toHaveBeenCalledWith('✓ App "ChatGPT" removed');
    expect(console.log).toHaveBeenCalledWith('✓ Shortcut deleted');
    expect(console.log).toHaveBeenCalledWith('✓ Icon deleted');
  });

  it('calls remove with the matched app name', () => {
    const removeMock = vi.fn().mockReturnValue(exampleApp);
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(exampleApp),
      remove: removeMock,
    });

    removeHandler('ChatGPT', registry);

    expect(removeMock).toHaveBeenCalledWith('ChatGPT');
  });

  it('falls back to search when exact name not found', () => {
    const searchMock = vi.fn().mockReturnValue([exampleApp]);
    const removeMock = vi.fn().mockReturnValue(exampleApp);
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(undefined),
      search: searchMock,
      remove: removeMock,
    });

    removeHandler('chat', registry);

    expect(searchMock).toHaveBeenCalledWith('chat');
    expect(removeMock).toHaveBeenCalledWith('ChatGPT');
  });

  it('removes by index when numeric query provided', () => {
    const getByIndexMock = vi.fn().mockReturnValue(exampleApp);
    const removeMock = vi.fn().mockReturnValue(exampleApp);
    const registry = createMockRegistry({
      getByIndex: getByIndexMock,
      remove: removeMock,
    });

    removeHandler('1', registry);

    expect(getByIndexMock).toHaveBeenCalledWith(1);
    expect(removeMock).toHaveBeenCalledWith('ChatGPT');
  });

  it('prints error and exits when removal fails', () => {
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(undefined),
      search: vi.fn().mockReturnValue([]),
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    expect(() => removeHandler('xyz', registry)).toThrow('exit');
    expect(console.error).toHaveBeenCalledWith('✗ Error: No apps match "xyz"');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('throws error for multiple matches', () => {
    const matches = [exampleApp, { ...exampleApp, name: 'ChatGPT2' }];
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(undefined),
      search: vi.fn().mockReturnValue(matches),
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    expect(() => removeHandler('chat', registry)).toThrow('exit');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Multiple apps match'));
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
