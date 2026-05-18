// Barrel export for all public APIs
export { createApp } from './core/createApp';
export { removeApp } from './core/removeApp';
export { listApps } from './core/listApps';
export { AppRegistry } from './services/appRegistry';
export { resolveBrowserPath } from './services/browserResolver';
export { resolveIcon } from './services/iconResolver';
export { resolveMetadata } from './services/metadataResolver';
export { validateUrl } from './utils/url';
export { createShortcut } from './windows/shortcutCreator';
export { sanitizeFileName } from './utils/sanitize';
export { IAppRegistry } from './domain/appRegistry';
export { AppEntry, BrowserName, CreateAppOptions, ShortcutOptions } from './domain/types';
export { AppEvent, AppEventStatus, OnEvent } from './domain/events';
