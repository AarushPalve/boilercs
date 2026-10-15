// Shared result shape for every execution backend (Java via OnlineCompiler.io, JS sandbox).

export interface RunResult {
  /** Combined stdout produced by the program. */
  stdout: string;
  /** Combined stderr / compile errors. */
  stderr: string;
  /** True if compilation (if any) and execution completed without error. */
  ok: boolean;
  /** Non-null when the run was aborted by the watchdog / timeout. */
  timedOut?: boolean;
  /** Human-readable stage label for UI, e.g. "runtime" | "compile" | "run". */
  stage?: string;
}

export interface StarterFilePayload {
  filename: string;
  contents: string;
}
