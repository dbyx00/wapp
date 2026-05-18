#!/usr/bin/env node

import { Command } from 'commander';
import { createApp } from '../core/createApp';

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

program.parse();
