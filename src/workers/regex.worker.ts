/// <reference lib="webworker" />
/**
 * Runs user-supplied regular expressions off the main thread. The caller
 * terminates this worker if it exceeds its time budget, which protects the
 * page from catastrophic backtracking (ReDoS).
 */
import { executeRegex, type RegexRequest } from '../lib/regex/execute';

self.onmessage = (e: MessageEvent<RegexRequest & { id: number }>) => {
  const { id, ...req } = e.data;
  try {
    const result = executeRegex(req);
    (self as unknown as Worker).postMessage({ id, ok: true, result });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
