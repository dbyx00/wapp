import { describe, it, expect, vi } from 'vitest';
import { join, dirname } from 'path';

describe('server SEA path resolution', () => {
  it('resolves static root to exe-relative public/ when isSea() is true', async () => {
    vi.doMock('node:sea', () => ({
      isSea: () => true,
    }));
    vi.resetModules();

    // Dynamic import to pick up the mock
    const { publicDir } = await import('../../../src/api/server');

    const expected = join(dirname(process.execPath), 'public');
    expect(publicDir).toBe(expected);

    vi.doUnmock('node:sea');
  });

  it('resolves static root to dist/public when isSea() is false', async () => {
    vi.doMock('node:sea', () => ({
      isSea: () => false,
    }));
    vi.resetModules();

    // Dynamic import to pick up the mock
    const { publicDir } = await import('../../../src/api/server');

    const expected = join(process.cwd(), 'dist/public');
    expect(publicDir).toBe(expected);

    vi.doUnmock('node:sea');
  });
});
