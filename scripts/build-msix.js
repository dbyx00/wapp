const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Ensure render-manifests has been run
const manifestPath = path.join(root, 'msix', 'AppxManifest.xml');
if (!existsSync(manifestPath)) {
  console.log('Rendering manifests first...');
  execSync('node scripts/render-manifests.js', { cwd: root, stdio: 'inherit' });
}

// Read version from src/config/app.ts (source of truth)
const appTsPath = path.join(root, 'src', 'config', 'app.ts');
const appTsContent = readFileSync(appTsPath, 'utf-8');
const versionMatch = appTsContent.match(/version\s*:\s*['"]([\d.]+)['"]/i);
if (!versionMatch) {
  throw new Error('Could not extract version from src/config/app.ts');
}
const version = versionMatch[1];

const msixPath = path.join(root, 'dist', `WApp-${version}.msix`);

console.log(`Packing MSIX: ${msixPath}`);
execSync(
  `makeappx pack /d "${path.join(root, 'msix')}" /p "${msixPath}"`,
  { cwd: root, stdio: 'inherit' }
);

console.log('MSIX package created:', msixPath);
