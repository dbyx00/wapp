import { IAppRegistry } from '../domain/appRegistry';
import { AppEntry } from '../domain/types';
import { AppEvent, OnEvent } from '../domain/events';
import { deleteFile } from '../services/fileService';
import { APP } from '../config/app';

export async function removeApp(
  query: string,
  registry: IAppRegistry,
  onEvent?: OnEvent
): Promise<AppEntry> {
  const emit = (event: AppEvent) => {
    if (onEvent) {
      onEvent(event);
    }
  };

  // Step 1: Find app
  emit({ step: 'finding-app', status: 'start' });
  let app: AppEntry | undefined;

  const num = parseInt(query, 10);
  if (!isNaN(num) && num.toString() === query) {
    if (num <= 0) {
      const error = `Invalid app number: ${num}`;
      emit({ step: 'finding-app', status: 'error', error });
      throw new Error(error);
    }
    app = registry.getByIndex(num);
    if (!app) {
      const error = `No app found at position ${num}`;
      emit({ step: 'finding-app', status: 'error', error });
      throw new Error(error);
    }
  } else {
    app = registry.findByName(query);
    if (!app) {
      const matches = registry.search(query);
      if (matches.length === 0) {
        const error = `No apps match "${query}"`;
        emit({ step: 'finding-app', status: 'error', error });
        throw new Error(error);
      }
      if (matches.length > 1) {
        const suggestions = matches.map((a, i) => `  ${i + 1}. ${a.name}`).join('\n');
        const error =
          `Multiple apps match "${query}":\n${suggestions}\n\n` +
          `Use the app number (e.g., wapp remove 1) or a more specific name.`;
        emit({ step: 'finding-app', status: 'error', error });
        throw new Error(error);
      }
      app = matches[0];
    }
  }

  emit({ step: 'finding-app', status: 'success', data: app });

  // Step 2: Delete shortcut
  emit({ step: 'deleting-shortcut', status: 'start' });
  try {
    deleteFile(app.shortcutPath);
    emit({ step: 'deleting-shortcut', status: 'success' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'deleting-shortcut', status: 'warning', error: message });
  }

  // Step 3: Delete icon
  emit({ step: 'deleting-icon', status: 'start' });
  try {
    deleteFile(app.iconPath);
    emit({ step: 'deleting-icon', status: 'success' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'deleting-icon', status: 'warning', error: message });
  }

  // Step 4: Unregister from registry
  emit({ step: 'updating-registry', status: 'start' });
  let removed: AppEntry;
  try {
    removed = registry.unregister(app.name);
    emit({ step: 'updating-registry', status: 'success' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ step: 'updating-registry', status: 'error', error: message });
    throw error;
  }

  // Final event
  emit({ step: 'removed', status: 'success', data: removed });

  // Fallback console output for backward compatibility
  if (!onEvent) {
    console.log(`✓ ${APP.name} "${removed.name}" removed`);
    console.log('✓ Shortcut deleted');
    console.log('✓ Icon deleted');
  }

  return removed;
}
