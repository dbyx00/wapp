import { execSync } from 'child_process';
import { join } from 'path';
import { sanitizeFileName } from '../utils/sanitize';

export interface ShortcutOptions {
  name: string;
  url: string;
  browserPath: string;
  iconPath: string;
}

/**
 * Creates a Windows shortcut in the Start Menu Programs folder.
 * Uses PowerShell COM (WScript.Shell) to create the .lnk file.
 */
export async function createShortcut(options: ShortcutOptions): Promise<string> {
  const startMenuPath = getStartMenuPath();
  const shortcutName = sanitizeFileName(options.name);
  const shortcutPath = join(startMenuPath, `${shortcutName}.lnk`);

  // Build the target command: browser --app=<url>
  const targetArgs = `${getAppArgForBrowser(options.browserPath)}${options.url}`;

  // Create PowerShell script to generate the shortcut
  const psScript = buildPowerShellScript({
    shortcutPath,
    targetPath: options.browserPath,
    arguments: targetArgs,
    iconPath: options.iconPath,
    description: `WApp: ${options.name}`,
  });

  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, {
      stdio: 'pipe',
    });
    return shortcutPath;
  } catch (error) {
    throw new Error(
      `Failed to create shortcut: ${error instanceof Error ? error.message : String(error)}\n` +
      `PowerShell output: ${error instanceof Error && 'stdout' in error ? (error as any).stdout : ''}`
    );
  }
}

/**
 * Returns the Start Menu Programs folder path.
 */
function getStartMenuPath(): string {
  // Use PowerShell to get the Start Menu path reliably
  const result = execSync(
    'powershell -NoProfile -Command "[Environment]::GetFolderPath(\'Programs\')"',
    { encoding: 'utf8' }
  ).trim();

  if (!result) {
    // Fallback to common path
    return join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
  }

  return result;
}

/**
 * Builds a PowerShell script to create a shortcut using WScript.Shell COM.
 */
function buildPowerShellScript(options: {
  shortcutPath: string;
  targetPath: string;
  arguments: string;
  iconPath: string;
  description: string;
}): string {
  // Escape single quotes for PowerShell
  const escape = (s: string) => s.replace(/'/g, "''");

  return [
    `$shell = New-Object -ComObject WScript.Shell`,
    `$shortcut = $shell.CreateShortcut('${escape(options.shortcutPath)}')`,
    `$shortcut.TargetPath = '${escape(options.targetPath)}'`,
    `$shortcut.Arguments = '${escape(options.arguments)}'`,
    `$shortcut.IconLocation = '${escape(options.iconPath)},0'`,
    `$shortcut.Description = '${escape(options.description)}'`,
    `$shortcut.WorkingDirectory = (Split-Path '${escape(options.targetPath)}' -Parent)`,
    `$shortcut.Save()`,
  ].join('; ');
}

/**
 * Determines the app argument prefix based on browser path.
 */
function getAppArgForBrowser(browserPath: string): string {
  const browser = browserPath.toLowerCase();
  if (browser.includes('brave')) return '--app=';
  if (browser.includes('chrome')) return '--app=';
  if (browser.includes('msedge') || browser.includes('edge')) return '--app=';
  return '--app='; // Default
}


