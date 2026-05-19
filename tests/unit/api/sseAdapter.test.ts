import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sseAdapter } from '../../../src/api/adapters/sseAdapter';
import { AppEvent } from '../../../src/domain/events';
import { Context } from 'hono';

vi.mock('hono/streaming', () => ({
  streamSSE: vi.fn(),
}));

import { streamSSE } from 'hono/streaming';
const mockStreamSSE = vi.mocked(streamSSE);

function createMockContext(): Context {
  return {} as Context;
}

describe('sseAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converts AppEvent objects to SSE format', async () => {
    const writtenEvents: Array<{ data: string; event: string }> = [];
    const mockStream = {
      writeSSE: vi.fn((payload: { data: string; event: string }) => {
        writtenEvents.push(payload);
      }),
    };

    mockStreamSSE.mockImplementation(async (_c, handler) => {
      await handler(mockStream as any);
      return new Response();
    });

    const c = createMockContext();
    const handler = async (onEvent: (event: AppEvent) => void) => {
      onEvent({ step: 'validating', status: 'start' });
      onEvent({ step: 'validating', status: 'success', data: 'https://example.com' });
    };

    sseAdapter(c, handler);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writtenEvents).toHaveLength(2);
    expect(writtenEvents[0]).toEqual({
      data: JSON.stringify({ step: 'validating', status: 'start' }),
      event: 'validating',
    });
    expect(writtenEvents[1]).toEqual({
      data: JSON.stringify({ step: 'validating', status: 'success', data: 'https://example.com' }),
      event: 'validating',
    });
  });

  it('sends error event when handler throws', async () => {
    const writtenEvents: Array<{ data: string; event: string }> = [];
    const mockStream = {
      writeSSE: vi.fn((payload: { data: string; event: string }) => {
        writtenEvents.push(payload);
      }),
    };

    mockStreamSSE.mockImplementation(async (_c, handler) => {
      await handler(mockStream as any);
      return new Response();
    });

    const c = createMockContext();
    const handler = async (_onEvent: (event: AppEvent) => void) => {
      throw new Error('Something went wrong');
    };

    sseAdapter(c, handler);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writtenEvents).toHaveLength(1);
    const parsed = JSON.parse(writtenEvents[0].data);
    expect(parsed).toMatchObject({
      step: 'error',
      status: 'error',
      error: 'Something went wrong',
    });
    expect(writtenEvents[0].event).toBe('error');
  });
});
