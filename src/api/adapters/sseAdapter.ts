import { streamSSE } from 'hono/streaming';
import type { Context } from 'hono';
import { AppEvent, OnEvent } from '../../domain/events';

/**
 * Creates an SSE stream response and invokes the handler with an OnEvent
 * callback that writes each AppEvent to the stream.
 *
 * SSE format per event:
 *   event: <step>
 *   data: <JSON-stringified AppEvent>
 */
export function sseAdapter(
  c: Context,
  handler: (onEvent: OnEvent) => Promise<void>
): Response {
  return streamSSE(c, async (stream) => {
    const onEvent: OnEvent = (event: AppEvent) => {
      stream.writeSSE({
        data: JSON.stringify(event),
        event: event.step,
      });
    };

    try {
      await handler(onEvent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stream.writeSSE({
        data: JSON.stringify({
          step: 'error',
          status: 'error',
          error: message,
        } as AppEvent),
        event: 'error',
      });
    }
  });
}
