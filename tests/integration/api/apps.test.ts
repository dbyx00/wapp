import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../src/api/server';

// Mock core functions
vi.mock('../../../src/core/createApp', () => ({
  createApp: vi.fn(),
}));

vi.mock('../../../src/core/removeApp', () => ({
  removeApp: vi.fn(),
}));

vi.mock('../../../src/core/listApps', () => ({
  listApps: vi.fn(),
}));

import { createApp } from '../../../src/core/createApp';
import { removeApp } from '../../../src/core/removeApp';
import { listApps } from '../../../src/core/listApps';

const mockCreateApp = vi.mocked(createApp);
const mockRemoveApp = vi.mocked(removeApp);
const mockListApps = vi.mocked(listApps);

async function readSSEEvents(response: Response): Promise<Array<{ event: string; data: unknown }>> {
  const reader = response.body?.getReader();
  if (!reader) return [];

  const decoder = new TextDecoder();
  let buffer = '';
  const events: Array<{ event: string; data: unknown }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6);
      } else if (line === '' && currentEvent) {
        events.push({ event: currentEvent, data: JSON.parse(currentData) });
        currentEvent = '';
        currentData = '';
      }
    }
  }

  return events;
}

describe('API endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/apps returns JSON array', async () => {
    const apps = [
      { name: 'Test', url: 'https://test.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' },
    ];
    mockListApps.mockResolvedValue(apps);

    const res = await app.request('/api/apps');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual(apps);
  });

  it('POST /api/apps returns SSE stream', async () => {
    mockCreateApp.mockImplementation(async (_options, onEvent) => {
      if (onEvent) {
        onEvent({ step: 'validating', status: 'start' });
        onEvent({ step: 'validating', status: 'success', data: 'https://example.com' });
        onEvent({ step: 'created', status: 'success', data: { name: 'Example', url: 'https://example.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' } });
      }
      return { name: 'Example', url: 'https://example.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' };
    });

    const res = await app.request('/api/apps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const events = await readSSEEvents(res);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].event).toBe('validating');
    expect(events.some((e) => e.event === 'created')).toBe(true);
  });

  it('DELETE /api/apps/:name returns SSE stream', async () => {
    mockRemoveApp.mockImplementation(async (_query, _registry, onEvent) => {
      if (onEvent) {
        onEvent({ step: 'finding-app', status: 'start' });
        onEvent({ step: 'removed', status: 'success', data: { name: 'TestApp', url: 'https://test.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' } });
      }
      return { name: 'TestApp', url: 'https://test.com', browser: 'brave', iconPath: '', shortcutPath: '', createdAt: '' };
    });

    const res = await app.request('/api/apps/TestApp', {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const events = await readSSEEvents(res);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.some((e) => e.event === 'removed')).toBe(true);
  });
});
