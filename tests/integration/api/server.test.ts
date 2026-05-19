import { describe, it, expect } from 'vitest';
import { app, startServer } from '../../../src/api/server';

describe('server', () => {
  it('exports startServer function', () => {
    expect(typeof startServer).toBe('function');
  });

  it('has API routes mounted at /api/apps', async () => {
    // A request to a non-existent method should still reach the router
    // and return 405 or be handled. We just verify the route exists
    // by making a GET request which we know should work.
    const res = await app.request('/api/apps');
    // listApps is called; if registry is empty it returns 200 with []
    expect(res.status).toBe(200);
  });

  it('has CORS middleware configured for localhost', async () => {
    const res = await app.request('/api/apps', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(res.headers.get('access-control-allow-origin')).toContain('localhost');
  });
});
