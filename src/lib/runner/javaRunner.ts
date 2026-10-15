// ---------------------------------------------------------------------------
// Java execution client — posts to our own serverless proxy (/api/run), which
// holds the secret OnlineCompiler.io REST key and runs the code on OpenJDK 25.
// ---------------------------------------------------------------------------

import type { RunResult, StarterFilePayload } from './types';
import type { GraderCase } from '../types';

const ENDPOINT = '/api/run';
const CLIENT_TIMEOUT_MS = 40000;

export interface CaseResult {
  index: number;
  name: string;
  passed: boolean;
  message: string;
  hidden: boolean;
}

export interface RunJavaOptions {
  files: StarterFilePayload[];
  stdin?: string;
  /** Tester harness (its own `main`) appended server-side for the Test button. */
  testerCode?: string;
  /** Graded cases — when present, the server runs a grading harness. */
  graderCases?: GraderCase[];
}

/** Parse the harness's `@@CASE@@idx@@PASS|FAIL@@msg` lines out of stdout. */
export function parseCaseResults(
  stdout: string,
  cases: GraderCase[],
): { cases: CaseResult[]; cleanStdout: string } {
  const results: CaseResult[] = [];
  const kept: string[] = [];
  for (const line of stdout.split('\n')) {
    const m = line.match(/^@@CASE@@(\d+)@@(PASS|FAIL)@@([\s\S]*)$/);
    if (m) {
      const index = Number(m[1]);
      results.push({
        index,
        name: cases[index]?.name ?? m[3],
        passed: m[2] === 'PASS',
        message: m[3],
        hidden: Boolean(cases[index]?.hidden),
      });
    } else {
      kept.push(line);
    }
  }
  results.sort((a, b) => a.index - b.index);
  return { cases: results, cleanStdout: kept.join('\n').trim() };
}

export async function runJava({
  files,
  stdin = '',
  testerCode,
  graderCases,
}: RunJavaOptions): Promise<RunResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, stdin, testerCode, graderCases }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as RunResult | null;
    if (!data) {
      return {
        ok: false,
        stdout: '',
        stderr: `Unexpected response from the execution endpoint (HTTP ${res.status}).`,
        stage: 'runtime',
      };
    }
    return data;
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    return {
      ok: false,
      stdout: '',
      stderr: aborted
        ? 'The run timed out waiting for the server.'
        : `Could not reach the execution endpoint: ${(e as Error).message}`,
      timedOut: aborted,
      stage: 'runtime',
    };
  } finally {
    clearTimeout(timer);
  }
}
