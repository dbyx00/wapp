import { describe, it, expect } from 'vitest';
import { validateUrl } from '../../src/utils/url';

describe('validateUrl', () => {
  it('accepts valid https URLs', () => {
    expect(validateUrl('https://example.com')).toBe('https://example.com/');
  });

  it('accepts valid http URLs', () => {
    expect(validateUrl('http://example.com')).toBe('http://example.com/');
  });

  it('adds https protocol when missing', () => {
    expect(validateUrl('example.com')).toBe('https://example.com/');
  });

  it('preserves paths and query parameters', () => {
    const result = validateUrl('https://example.com/path?query=value');
    expect(result).toContain('/path');
    expect(result).toContain('query=value');
  });

  it('handles URLs with www prefix', () => {
    expect(validateUrl('www.example.com')).toBe('https://www.example.com/');
  });

  it('throws on completely invalid input', () => {
    expect(() => validateUrl('   ')).toThrow('Invalid URL');
  });

  it('throws on malformed URLs', () => {
    expect(() => validateUrl('://invalid')).toThrow('Invalid URL');
  });

  it('normalizes trailing slash', () => {
    expect(validateUrl('https://example.com')).toBe('https://example.com/');
  });
});
