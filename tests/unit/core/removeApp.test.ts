import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { removeApp } from '../../../src/core/removeApp';
import { IAppRegistry } from '../../../src/domain/appRegistry';
import { AppEntry } from '../../../src/domain/types';
import { AppEvent } from '../../../src/domain/events';

vi.mock('../../../src/services/fileService', () => ({
  deleteFile: vi.fn(),
}));

import { deleteFile } from '../../../src/services/fileService';
const mockDeleteFile = vi.mocked(deleteFile);

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
    unregister: vi.fn().mockReturnValue(exampleApp),
    search: vi.fn().mockReturnValue([]),
    getByIndex: vi.fn(),
    ...overrides,
  };
}

describe('removeApp event sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits full success event sequence by exact name', async () => {
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(exampleApp),
    });

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await removeApp('ChatGPT', registry, collector);

    expect(events.map((e) => ({ step: e.step, status: e.status }))).toEqual([
      { step: 'finding-app', status: 'start' },
      { step: 'finding-app', status: 'success' },
      { step: 'deleting-shortcut', status: 'start' },
      { step: 'deleting-shortcut', status: 'success' },
      { step: 'deleting-icon', status: 'start' },
      { step: 'deleting-icon', status: 'success' },
      { step: 'updating-registry', status: 'start' },
      { step: 'updating-registry', status: 'success' },
      { step: 'removed', status: 'success' },
    ]);

    expect(events[1].data).toEqual(exampleApp);
    expect(events[8].data).toEqual(exampleApp);
  });

  it('emits full success event sequence by index', async () => {
    const registry = createMockRegistry({
      getByIndex: vi.fn().mockReturnValue(exampleApp),
    });

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await removeApp('1', registry, collector);

    expect(events.map((e) => ({ step: e.step, status: e.status }))).toEqual([
      { step: 'finding-app', status: 'start' },
      { step: 'finding-app', status: 'success' },
      { step: 'deleting-shortcut', status: 'start' },
      { step: 'deleting-shortcut', status: 'success' },
      { step: 'deleting-icon', status: 'start' },
      { step: 'deleting-icon', status: 'success' },
      { step: 'updating-registry', status: 'start' },
      { step: 'updating-registry', status: 'success' },
      { step: 'removed', status: 'success' },
    ]);
  });

  it('emits error when app not found', async () => {
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(undefined),
      search: vi.fn().mockReturnValue([]),
    });

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await expect(removeApp('xyz', registry, collector)).rejects.toThrow('No apps match "xyz"');

    expect(events).toEqual([
      { step: 'finding-app', status: 'start' },
      { step: 'finding-app', status: 'error', error: 'No apps match "xyz"' },
    ]);
  });

  it('emits error for multiple matches', async () => {
    const matches = [exampleApp, { ...exampleApp, name: 'ChatGPT2' }];
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(undefined),
      search: vi.fn().mockReturnValue(matches),
    });

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await expect(removeApp('chat', registry, collector)).rejects.toThrow('Multiple apps match');

    expect(events[0]).toEqual({ step: 'finding-app', status: 'start' });
    expect(events[1].step).toBe('finding-app');
    expect(events[1].status).toBe('error');
    expect((events[1].error as string) || '').toContain('Multiple apps match');
  });

  it('emits warning when shortcut deletion fails', async () => {
    mockDeleteFile.mockImplementationOnce(() => {
      throw new Error('Permission denied');
    });

    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(exampleApp),
    });

    const events: AppEvent[] = [];
    const collector = (event: AppEvent) => events.push(event);

    await removeApp('ChatGPT', registry, collector);

    expect(events.some((e) => e.step === 'deleting-shortcut' && e.status === 'warning')).toBe(true);
    expect(events.some((e) => e.step === 'deleting-shortcut' && e.status === 'warning' && (e.error as string).includes('Permission denied'))).toBe(true);
  });

  it('works when onEvent is omitted (backward compat)', async () => {
    const registry = createMockRegistry({
      findByName: vi.fn().mockReturnValue(exampleApp),
    });

    const result = await removeApp('ChatGPT', registry);

    expect(result.name).toBe('ChatGPT');
  });
});
