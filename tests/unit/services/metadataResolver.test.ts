import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveMetadata } from '../../../src/services/metadataResolver';

describe('metadataResolver', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns explicit name when provided', async () => {
    const result = await resolveMetadata('https://example.com', 'My Custom Name');
    expect(result).toBe('My Custom Name');
  });

  it('fetches HTML title when no explicit name provided', async () => {
    const mockHtml = '<html><head><title>Example Domain</title></head><body></body></html>';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(mockHtml),
    });

    const result = await resolveMetadata('https://example.com');
    expect(result).toBe('Example Domain');
  });

  it('falls back to domain name when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // Spy on console.warn to suppress output
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveMetadata('https://example.com');
    expect(result).toBe('Example');
  });

  it('falls back to domain name when no title tag found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('<html><head></head><body></body></html>'),
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveMetadata('https://example.com');
    expect(result).toBe('Example');
  });

  it('falls back to domain name on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveMetadata('https://example.com');
    expect(result).toBe('Example');
  });

  it('handles URLs with www prefix in fallback', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveMetadata('https://www.example.com');
    expect(result).toBe('Example');
  });

  it('returns generic fallback for invalid URLs', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await resolveMetadata('not-a-valid-url');
    expect(result).toBe('Web App');
  });
});
