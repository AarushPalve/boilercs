// ---------------------------------------------------------------------------
// Main-thread controller for the isolated JavaScript Web Worker.
//
// Honors the security spec's client-side DoS protection:
//  - Spawns the worker from /sandbox-worker.js.
//  - Starts a 3000ms watchdog (SRS threshold). If the worker does not reply in
//    time, it is forcibly .terminate()'d so an infinite loop cannot freeze the
//    user's machine.
//  - The returned `stop()` lets a global "Stop/Reset" button kill a frozen run.
// ---------------------------------------------------------------------------

import type { RunResult } from './types';

const WATCHDOG_MS = 3000;

export interface JsRun {
  /** Promise resolving with the run result (or timeout result). */
  done: Promise<RunResult>;
  /** Force-terminate the worker immediately (for a Stop button). */
  stop: () => void;
}

export function runJavaScript(code: string): JsRun {
  // Classic worker loaded from the static CDN path. worker-src 'self' allowed.
  const worker = new Worker('/sandbox-worker.js');

  let settled = false;
  let watchdog: ReturnType<typeof setTimeout>;

  const cleanup = () => {
    clearTimeout(watchdog);
    worker.terminate();
  };

  const done = new Promise<RunResult>((resolve) => {
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    worker.onmessage = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.type === 'result') {
        finish({
          ok: Boolean(d.ok),
          stdout: String(d.stdout ?? ''),
          stderr: String(d.stderr ?? ''),
          stage: 'run',
        });
      }
    };

    worker.onerror = (e) => {
      finish({
        ok: false,
        stdout: '',
        stderr: `Worker error: ${e.message}`,
        stage: 'run',
      });
    };

    watchdog = setTimeout(() => {
      finish({
        ok: false,
        stdout: '',
        stderr: 'Execution exceeded the 3-second limit and was terminated.',
        timedOut: true,
        stage: 'run',
      });
    }, WATCHDOG_MS);

    worker.postMessage({ type: 'run', code });
  });

  return {
    done,
    stop: () => {
      if (!settled) {
        settled = true;
        cleanup();
      }
    },
  };
}
