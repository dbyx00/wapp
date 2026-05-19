import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { exec } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { isSea } from 'node:sea';
import appsRoute from './routes/apps';
import { ICONS_DIR } from '../config/paths';

export const app = new Hono();

// CORS for localhost development
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
  })
);

// API routes
app.route('/api/apps', appsRoute);

// Serve icons from %APPDATA%/WApp/icons/
// rewriteRequestPath strips the /icons prefix so /icons/ChatGPT.ico
// maps to ICONS_DIR/ChatGPT.ico instead of ICONS_DIR/icons/ChatGPT.ico
app.use('/icons/*', serveStatic({
  root: ICONS_DIR,
  rewriteRequestPath: (path) => path.replace(/^\/icons/, ''),
}));

// Serve static frontend files built by Vite (Phase 5)
export const publicDir = isSea()
  ? join(dirname(process.execPath), 'public')
  : join(process.cwd(), 'dist/public');

if (isSea() && !existsSync(publicDir)) {
  console.error(`Public directory not found at ${publicDir}`);
}

app.use('/*', serveStatic({ root: publicDir }));

/**
 * Starts the Hono server on the given port (default 3000).
 * If the port is occupied, auto-increments up to 3010.
 * Binds to 127.0.0.1 for security.
 * Opens the default browser on Windows.
 */
export function startServer(port?: number): void {
  const startPort = port ?? 3000;
  const maxPort = 3010;

  const tryListen = (currentPort: number): void => {
    if (currentPort > maxPort) {
      console.error(
        `Could not find an available port between ${startPort} and ${maxPort}`
      );
      process.exit(1);
    }

    const server = serve(
      {
        fetch: app.fetch,
        port: currentPort,
        hostname: '127.0.0.1',
      },
      (info) => {
        const actualPort = info.port;
        const url = `http://127.0.0.1:${actualPort}`;
        console.log(`Server running at ${url}`);

        // Open default browser on Windows
        exec(`start ${url}`, (err) => {
          if (err) {
            console.error('Failed to open browser:', err.message);
          }
        });
      }
    );

    server.addListener('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
        server.close(() => {
          tryListen(currentPort + 1);
        });
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const shutdown = (): void => {
      console.log('\nShutting down server...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  };

  tryListen(startPort);
}
