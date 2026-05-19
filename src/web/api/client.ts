import { AppEntry } from '../../domain/types';
import { AppEvent } from '../../domain/events';

export async function fetchApps(): Promise<AppEntry[]> {
  const response = await fetch('/api/apps');
  if (!response.ok) {
    throw new Error(`Failed to fetch apps: ${response.statusText}`);
  }
  return response.json();
}

function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: AppEvent) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  return new Promise((resolve, reject) => {
    function pump(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) {
          resolve();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent: Partial<AppEvent> = {};

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') {
            if (currentEvent.step) {
              onEvent(currentEvent as AppEvent);
            }
            currentEvent = {};
          } else if (trimmed.startsWith('event: ')) {
            currentEvent.step = trimmed.slice(7);
          } else if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              Object.assign(currentEvent, parsed);
            } catch {
              // Ignore parse errors
            }
          }
        }

        return pump();
      }).catch(reject);
    }

    pump();
  });
}

export async function createApp(
  url: string,
  name?: string,
  browser?: string,
  onEvent?: (event: AppEvent) => void,
  onComplete?: (success: boolean, result?: AppEntry, error?: string) => void
): Promise<void> {
  const response = await fetch('/api/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name, browser }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    onComplete?.(false, undefined, text);
    return;
  }

  if (!response.body) {
    onComplete?.(false, undefined, 'No response body');
    return;
  }

  let finalResult: AppEntry | undefined;
  let hadError = false;

  await parseSSEStream(response.body.getReader(), (event) => {
    onEvent?.(event);
    if (event.status === 'error') {
      hadError = true;
    }
    if (event.data && typeof event.data === 'object' && 'name' in event.data) {
      finalResult = event.data as AppEntry;
    }
  });

  onComplete?.(!hadError, finalResult, hadError ? 'Creation failed' : undefined);
}

export async function removeApp(
  name: string,
  onEvent?: (event: AppEvent) => void,
  onComplete?: (success: boolean, result?: AppEntry, error?: string) => void
): Promise<void> {
  const response = await fetch(`/api/apps/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    onComplete?.(false, undefined, text);
    return;
  }

  if (!response.body) {
    onComplete?.(false, undefined, 'No response body');
    return;
  }

  let finalResult: AppEntry | undefined;
  let hadError = false;

  await parseSSEStream(response.body.getReader(), (event) => {
    onEvent?.(event);
    if (event.status === 'error') {
      hadError = true;
    }
    if (event.data && typeof event.data === 'object' && 'name' in event.data) {
      finalResult = event.data as AppEntry;
    }
  });

  onComplete?.(!hadError, finalResult, hadError ? 'Removal failed' : undefined);
}
