import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sseAdapter } from '../../../src/api/adapters/sseAdapter';
import type { AppEvent } from '../../../src/domain/events';
import type { Context } from 'hono';

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

  it('does not duplicate error event when handler already emitted one', async () => {
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
      onEvent({ step: 'registering', status: 'start' });
      onEvent({ step: 'registering', status: 'error', error: 'Duplicate name' });
      throw new Error('Duplicate name');
    };

    sseAdapter(c, handler);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should only have the 2 events from onEvent, NOT a third catch-all error
    expect(writtenEvents).toHaveLength(2);
    expect(writtenEvents[0].event).toBe('registering');
    expect(writtenEvents[1].event).toBe('registering');
    const parsed = JSON.parse(writtenEvents[1].data);
    expect(parsed.status).toBe('error');
    expect(parsed.error).toBe('Duplicate name');
  });
});
