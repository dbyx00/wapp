import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveIcon } from '../../../src/services/iconResolver';

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
    // Create a valid ICO buffer with magic bytes: 00 00 01 00
    const mockIconBuffer = Buffer.alloc(100);
    mockIconBuffer[0] = 0x00; // Reserved
    mockIconBuffer[1] = 0x00; // Reserved
    mockIconBuffer[2] = 0x01; // Type: ICO
    mockIconBuffer[3] = 0x00; // Type: ICO

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'image/x-icon' },
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

  it('saves PNG files as .png when detected', async () => {
    // PNG magic bytes: 89 50 4E 47
    const pngBuffer = Buffer.alloc(200);
    pngBuffer[0] = 0x89;
    pngBuffer[1] = 0x50;
    pngBuffer[2] = 0x4E;
    pngBuffer[3] = 0x47;

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'image/png' },
        arrayBuffer: () => Promise.resolve(pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength)),
      });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveIcon('https://example.com', 'Example');

    // Should have saved as PNG on first call
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toContain('Example.png');
  });

  it('falls back to apple-touch-icon.png when earlier paths fail', async () => {
    // Valid ICO buffer
    const mockIconBuffer = Buffer.alloc(200);
    mockIconBuffer[0] = 0x00;
    mockIconBuffer[1] = 0x00;
    mockIconBuffer[2] = 0x01;
    mockIconBuffer[3] = 0x00;

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 }) // favicon.ico fails
      .mockResolvedValueOnce({ ok: false, status: 404 }) // favicon.png fails
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'image/x-icon' },
        arrayBuffer: () => Promise.resolve(mockIconBuffer.buffer.slice(mockIconBuffer.byteOffset, mockIconBuffer.byteOffset + mockIconBuffer.byteLength)),
      });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveIcon('https://example.com', 'Example');

    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      'https://example.com/apple-touch-icon.png',
      expect.any(Object)
    );
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(result).toContain('Example.ico');
  });

  it('creates default icon when all quick paths fail', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

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

  it('rejects tiny responses and tries remaining paths', async () => {
    // Too small to be valid (less than 32 bytes)
    const tinyBuffer = Buffer.from([0x00, 0x00]);

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'image/x-icon' },
        arrayBuffer: () => Promise.resolve(tinyBuffer.buffer.slice(tinyBuffer.byteOffset, tinyBuffer.byteOffset + tinyBuffer.byteLength)),
      })
      .mockResolvedValue({ ok: false, status: 404 });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await resolveIcon('https://example.com', 'Example');

    // Should have tried multiple paths after favicon was too small
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/favicon.ico',
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });
});
