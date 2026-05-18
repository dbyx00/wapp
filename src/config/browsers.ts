import { join } from 'path';
import { BrowserName } from '../domain/types';

export interface BrowserConfig {
  name: string;
  paths: string[];
  appArg: string;
}

export const BROWSER_CONFIGS: Record<BrowserName, BrowserConfig> = {
  brave: {
    name: 'Brave',
    paths: [
      join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      join(process.env.ProgramFiles || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ],
    appArg: '--app=',
  },
  chrome: {
    name: 'Chrome',
    paths: [
      join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ],
    appArg: '--app=',
  },
  edge: {
    name: 'Edge',
    paths: [
      join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ],
    appArg: '--app=',
  },
};
