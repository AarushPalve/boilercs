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

/** A file created / modified by the learner's program during a Run. */
export interface OutputFile {
  name: string;
  /** Decoded text contents (UTF-8). */
  contents: string;
  /** True if the captured bytes were truncated by the server (>64 KB). */
  truncated: boolean;
}

/**
 * Pull `@@FILE@@<name>@@<base64>` markers out of stdout (emitted by the run
 * launcher for files the program wrote) and return them decoded, along with
 * the stdout that remains after removing those marker lines.
 */
export function parseOutputFiles(
  stdout: string,
): { files: OutputFile[]; cleanStdout: string } {
  const files: OutputFile[] = [];
  const kept: string[] = [];
  for (const line of stdout.split('\n')) {
    const m = line.match(/^@@FILE@@([^@]+)@@([\s\S]*)$/);
    if (m) {
      const name = m[1];
      let contents = '';
      let truncated = false;
      try {
        const b64 = m[2];
        // Browser base64 decode → bytes → UTF-8 text.
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        contents = new TextDecoder('utf-8').decode(bytes);
        truncated = bytes.length >= 64 * 1024;
      } catch {
        contents = '(could not decode file contents)';
      }
      files.push({ name, contents, truncated });
    } else {
      kept.push(line);
    }
  }
  return { files, cleanStdout: kept.join('\n') };
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
