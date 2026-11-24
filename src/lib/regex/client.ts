import type { RegexRequest, RegexResult } from './execute';

/**
 * Executes a regex in a dedicated worker with a hard time limit. If the limit
 * is exceeded the worker is terminated (the only reliable way to stop a
 * runaway regex) and a fresh one is created on the next call.
 */
let worker: Worker | null = null;
let seq = 0;

function getWorker() {
  worker ??= new Worker(new URL('../../workers/regex.worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

export class RegexTimeoutError extends Error {
  constructor(ms: number) {
    super(`The expression took longer than ${(ms / 1000).toFixed(1)} s and was stopped. It may cause catastrophic backtracking — try making quantifiers less ambiguous.`);
    this.name = 'RegexTimeoutError';
  }
}

export function runRegex(req: RegexRequest, timeoutMs = 1500): Promise<RegexResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const id = ++seq;
    const timer = setTimeout(() => {
      w.terminate();
      if (worker === w) worker = null;
      reject(new RegexTimeoutError(timeoutMs));
    }, timeoutMs);
    const onMsg = (e: MessageEvent<{ id: number; ok: boolean; result?: RegexResult; error?: string }>) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      if (e.data.ok && e.data.result) resolve(e.data.result);
      else reject(new Error(e.data.error || 'Regex failed'));
    };
    w.addEventListener('message', onMsg);
    w.postMessage({ id, ...req });
  });
}
