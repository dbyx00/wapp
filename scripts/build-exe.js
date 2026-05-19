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

// 5. Patch PE subsystem from CONSOLE (0x03) to WINDOWS (0x02)
// This prevents Windows from showing a terminal window when the exe starts.
// PE layout: e_lfanew → PE sig(4) → COFF header(20) → Optional header → Subsystem at +0x44
// Absolute offset: e_lfanew + 0x18 (PEsig + COFF) + 0x44 (Subsystem) = e_lfanew + 0x5C
console.log('Patching PE subsystem to WINDOWS...');
const { openSync, readSync, writeSync, closeSync } = require('fs');
const fd = openSync(exePath, 'r+');
const e_lfanewBuf = Buffer.alloc(4);
readSync(fd, e_lfanewBuf, 0, 4, 0x3C);
const peOffset = e_lfanewBuf.readUInt32LE(0);
const subsystemOffset = peOffset + 0x5C; // PE sig(4) + COFF(20) + OptionalHdr.Subsystem(0x44)
const subsystem = Buffer.alloc(2);
readSync(fd, subsystem, 0, 2, subsystemOffset);
const currentSubsystem = subsystem.readUInt16LE(0);
if (currentSubsystem === 0x0003) {
  subsystem.writeUInt16LE(0x0002, 0); // CONSOLE -> WINDOWS
  writeSync(fd, subsystem, 0, 2, subsystemOffset);
  console.log('PE subsystem patched: CONSOLE (0x0003) -> WINDOWS (0x0002)');
} else if (currentSubsystem === 0x0002) {
  console.log('PE subsystem already WINDOWS (0x0002), skipping.');
} else {
  console.warn(`PE subsystem is 0x${currentSubsystem.toString(16).padStart(4, '0')}, expected 0x0003 (CONSOLE) or 0x0002 (WINDOWS). Skipping patch.`);
}
closeSync(fd);

console.log('Done:', exePath);
