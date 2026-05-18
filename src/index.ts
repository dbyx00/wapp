// Barrel export for all public APIs
export { createApp, CreateAppOptions } from './core/createApp';
export { AppRegistry } from './services/appRegistry';
export { resolveBrowserPath, BrowserName } from './services/browserResolver';
export { resolveIcon } from './services/iconResolver';
export { resolveMetadata } from './services/metadataResolver';
export { validateUrl } from './utils/url';
export { createShortcut, ShortcutOptions } from './windows/shortcutCreator';
export { sanitizeFileName } from './utils/sanitize';
