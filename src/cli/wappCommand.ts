#!/usr/bin/env node

import { Command } from 'commander';
import { AppRegistry } from '../services/appRegistry';
import { BrowserName } from '../domain/types';
import { createHandler } from './create';
import { listHandler } from './list';
import { removeHandler } from './remove';

const program = new Command();

program
  .name('wapp')
  .description('Windows Web App Installer - Convert URLs into installable Windows apps')
  .version('0.1.0');

const registry = new AppRegistry();

program
  .command('create <url>')
  .description('Create a Windows app from a URL')
  .option('--name <name>', 'App name (overrides HTML title)')
  .option('--browser <browser>', 'Browser to use: brave, chrome, edge', 'brave')
  .addHelpText('after', `
Examples:
  $ wapp create https://chatgpt.com
  $ wapp create https://chatgpt.com --name "ChatGPT"
  $ wapp create https://github.com --browser chrome`)
  .action(async (url: string, options: { name?: string; browser?: string }) => {
    await createHandler(url, options, registry);
  });

program
  .command('list')
  .description('List all installed WApps')
  .action(async () => {
    await listHandler(registry);
  });

program
  .command('remove <query>')
  .description('Remove an installed WApp (by name, partial match, or list number)')
  .addHelpText('after', `
Examples:
  $ wapp remove "ChatGPT"      # Exact name
  $ wapp remove chat           # Partial match
  $ wapp remove 2              # By list number (see wapp list)`)
  .action(async (query: string) => {
    await removeHandler(query, registry);
  });

program
  .command('web')
  .description('Start the WApp web UI')
  .option('--port <port>', 'Port to run the server on', '3000')
  .action(async (options: { port?: string }) => {
    const port = parseInt(options.port || '3000', 10);
    const { startServer } = await import('../api/server');
    startServer(port);
  });

program.parse();
