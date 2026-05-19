const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Read src/config/app.ts as text and extract APP constant values
const appTsPath = path.join(root, 'src', 'config', 'app.ts');
const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

function extractStringProp(content, propName) {
  const regex = new RegExp(`${propName}\\s*:\\s*['"]([^'"]+)['"]`, 'i');
  const match = content.match(regex);
  if (!match) {
    throw new Error(`Could not extract ${propName} from ${appTsPath}`);
  }
  return match[1];
}

function extractVersion(content) {
  const match = content.match(/version\s*:\s*['"]([\d.]+)['"]/i);
  if (!match) {
    throw new Error(`Could not extract version from ${appTsPath}`);
  }
  return match[1];
}

const APP_NAME = extractStringProp(appTsContent, 'name');
const APP_SLUG = extractStringProp(appTsContent, 'slug');
const APP_VERSION = extractVersion(appTsContent);
const APP_EXE_NAME = 'wapp.exe';

// Helper to render a template by replacing placeholders
function renderTemplate(templatePath, outputPath, replacements) {
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
  }
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`Rendered: ${outputPath}`);
}

// Render Inno Setup script
renderTemplate(
  path.join(root, 'installer', 'wapp.iss.template'),
  path.join(root, 'installer', 'wapp.iss'),
  {
    '{{APP_NAME}}': APP_NAME,
    '{{APP_VERSION}}': APP_VERSION,
    '{{APP_SLUG}}': APP_SLUG,
    '{{APP_EXE_NAME}}': APP_EXE_NAME,
  }
);

// Render MSIX manifest
renderTemplate(
  path.join(root, 'msix', 'AppxManifest.xml.template'),
  path.join(root, 'msix', 'AppxManifest.xml'),
  {
    '{{APP_NAME}}': APP_NAME,
    '{{APP_SLUG}}': APP_SLUG.charAt(0).toUpperCase() + APP_SLUG.slice(1),
    '{{VERSION}}': APP_VERSION,
  }
);

console.log('Manifest rendering complete.');
console.log(`  Name:    ${APP_NAME}`);
console.log(`  Slug:    ${APP_SLUG}`);
console.log(`  Version: ${APP_VERSION}`);
