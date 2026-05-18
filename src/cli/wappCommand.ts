#!/usr/bin/env node

import { Command } from 'commander';
import { createApp } from '../core/createApp';
import { AppRegistry } from '../services/appRegistry';

const program = new Command();

program
  .name('wapp')
  .description('Windows Web App Installer - Convert URLs into installable Windows apps')
  .version('0.1.0');

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
    try {
      await createApp({
        url,
        name: options.name,
        browser: options.browser as 'brave' | 'chrome' | 'edge',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all installed WApps')
  .action(() => {
    const registry = new AppRegistry();
    const apps = registry.list();

    if (apps.length === 0) {
      console.log('No WApps installed. Use "wapp create <url>" to create one.');
      return;
    }

    console.log(`📱 Installed WApps (${apps.length}):`);
    console.log('');
    apps.forEach((app, index) => {
      const created = new Date(app.createdAt).toLocaleDateString();
      console.log(`  ${index + 1}. ${app.name}`);
      console.log(`     URL: ${app.url}`);
      console.log(`     Browser: ${app.browser}`);
      console.log(`     Created: ${created}`);
      console.log('');
    });
  });

program
  .command('remove <name>')
  .description('Remove an installed WApp')
  .addHelpText('after', `
Examples:
  $ wapp remove "ChatGPT"
  $ wapp remove GitHub`)
  .action((name: string) => {
    try {
      const registry = new AppRegistry();
      const app = registry.remove(name);

      console.log(`✓ App "${app.name}" removed`);
      console.log('✓ Shortcut deleted');
      console.log('✓ Icon deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
