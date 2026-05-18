import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveIcon } from './iconResolver';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { existsSync, mkdirSync, writeFileSync } from 'fs';
const mockExistsSync = vi.mocked(existsSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe('iconResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads favicon.ico when available', async () => {
    const mockIconBuffer = Buffer.from('fake-icon-data'.repeat(10));

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(mockIconBuffer.buffer.slice(mockIconBuffer.byteOffset, mockIconBuffer.byteOffset + mockIconBuffer.byteLength)),
      });

    const result = await resolveIcon('https://example.com', 'Example');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/favicon.ico',
      expect.any(Object)
    );
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(result).toContain('Example.ico');
  });

  it('falls back to apple-touch-icon.png when favicon.ico not found', async () => {
    const mockIconBuffer = Buffer.from('apple-icon-data'.repeat(10));

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 }) // favicon.ico fails
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(mockIconBuffer.buffer.slice(mockIconBuffer.byteOffset, mockIconBuffer.byteOffset + mockIconBuffer.byteLength)),
      });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveIcon('https://example.com', 'Example');

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://example.com/apple-touch-icon.png',
      expect.any(Object)
    );
    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it('creates default icon when both favicon and apple-touch-icon fail', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 }) // favicon.ico fails
      .mockResolvedValueOnce({ ok: false, status: 404 }); // apple-touch-icon fails

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveIcon('https://example.com', 'Example');

    // Should have written a default icon
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(result).toContain('Example.ico');
  });

  it('creates icons directory if it does not exist', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await resolveIcon('https://example.com', 'Example');

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('WApp'),
      { recursive: true }
    );
  });

  it('sanitizes filename for Windows', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveIcon('https://example.com', 'My App: Special');

    // Check the filename part (after last backslash) doesn't contain invalid chars
    const filename = result.split('\\').pop() || '';
    expect(filename).not.toContain(':');
    expect(filename).toBe('My App_ Special.ico');
  });

  it('rejects tiny responses as invalid icons', async () => {
    const tinyBuffer = Buffer.from('404');

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(tinyBuffer.buffer.slice(tinyBuffer.byteOffset, tinyBuffer.byteOffset + tinyBuffer.byteLength)),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await resolveIcon('https://example.com', 'Example');

    // Should have tried apple-touch-icon since favicon was too small
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
