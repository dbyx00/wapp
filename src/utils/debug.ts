/**
 * Creates a debug logger for a namespace.
 * Logs only when WAPP_DEBUG env var matches the namespace or is '1'.
 */
export function createDebug(namespace: string): (msg: string, ...args: unknown[]) => void {
  return (msg: string, ...args: unknown[]) => {
    const debug = process.env.WAPP_DEBUG === '1' || process.env.WAPP_DEBUG === namespace;
    if (debug) {
      console.log(`[${namespace}] ${msg}`, ...args);
    }
  };
}
