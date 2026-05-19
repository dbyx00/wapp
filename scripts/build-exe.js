const { execSync } = require('child_process');
const { copyFileSync, existsSync } = require('fs');
const { resolve, dirname } = require('path');

const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const bundlePath = resolve(distDir, 'bundle.js');
const seaConfigPath = resolve(root, 'sea-config.json');
const blobPath = resolve(distDir, 'sea.blob');
const exePath = resolve(distDir, 'wapp.exe');

// 1. Bundle with esbuild
console.log('Bundling with esbuild...');
execSync(
  'npx esbuild src/cli/wappCommand.ts --bundle --platform=node --target=node22 --outfile=dist/bundle.js --format=cjs',
  { cwd: root, stdio: 'inherit' }
);

if (!existsSync(bundlePath)) {
  console.error('Bundle not found:', bundlePath);
  process.exit(1);
}

// 2. Generate SEA blob
console.log('Generating SEA blob...');
execSync('node --experimental-sea-config sea-config.json', { cwd: root, stdio: 'inherit' });

if (!existsSync(blobPath)) {
  console.error('SEA blob not found:', blobPath);
  process.exit(1);
}

// 3. Copy node.exe to dist/wapp.exe
console.log('Copying node.exe...');
const nodeExe = process.execPath;
copyFileSync(nodeExe, exePath);

// 4. Inject blob into copied executable
console.log('Injecting SEA blob into wapp.exe...');
execSync(
  `npx postject "${exePath}" NODE_SEA_BLOB "${blobPath}" ` +
  `--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 ` +
  `--overwrite`,
  { cwd: root, stdio: 'inherit' }
);

console.log('Done:', exePath);
