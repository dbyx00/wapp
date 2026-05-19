import { Hono } from 'hono';
import { createApp } from '../../core/createApp';
import { removeApp } from '../../core/removeApp';
import { listApps } from '../../core/listApps';
import { AppRegistry } from '../../services/appRegistry';
import { sseAdapter } from '../adapters/sseAdapter';

const apps = new Hono();

/**
 * GET /api/apps
 * Returns all registered apps as a JSON array of AppEntry[].
 */
apps.get('/', async (c) => {
  const registry = new AppRegistry();
  const apps = await listApps(registry);
  return c.json(apps);
});

/**
 * POST /api/apps
 * Body: { url: string, name?: string, browser?: string }
 * Returns an SSE stream of AppEvents. The final event contains the created AppEntry.
 */
apps.post('/', async (c) => {
  let body: { url?: string; name?: string; browser?: string };
  try {
    body = await c.req.json<{ url?: string; name?: string; browser?: string }>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.url || typeof body.url !== 'string' || !body.url.trim()) {
    return c.json({ error: 'Missing or invalid required field: url' }, 400);
  }

  const url = body.url;
  const name = body.name;
  const browser = body.browser;
  const registry = new AppRegistry();

  return sseAdapter(c, async (onEvent) => {
    await createApp(
      {
        url,
        name,
        browser: browser as any,
        registry,
      },
      onEvent
    );
  });
});

/**
 * DELETE /api/apps/:name
 * Returns an SSE stream of AppEvents. The final event contains the removed AppEntry.
 */
apps.delete('/:name', async (c) => {
  const name = c.req.param('name');
  const registry = new AppRegistry();

  return sseAdapter(c, async (onEvent) => {
    await removeApp(name, registry, onEvent);
  });
});

export default apps;
