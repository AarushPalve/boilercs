'use client';

import { useCallback, useRef, useState } from 'react';
import type { RunResult } from '@/lib/runner/types';
import { runJava, parseOutputFiles, type OutputFile } from '@/lib/runner/javaRunner';
import { runJavaScript, type JsRun } from '@/lib/runner/jsRunner';
import CodeEditor from './CodeEditor';

interface Props {
  /** Initial code (from the lesson's fenced block). */
  initialCode: string;
  /** 'java' | 'javascript' — drives which runner is used. */
  language: 'java' | 'javascript';
}

/** Best-effort Java entry filename from a public class name (cosmetic only). */
function javaFilename(code: string): string {
  const m = code.match(
    /\bpublic\s+(?:final\s+|abstract\s+)*class\s+([A-Za-z_]\w*)/,
  );
  return `${m ? m[1] : 'Main'}.java`;
}

/**
 * An editable, runnable code block for lesson walkthroughs. Reuses the same
 * execution path as the exam workspace: Java goes through the serverless proxy
 * (OpenJDK 25); JavaScript runs in the sandboxed Web Worker with the 3s
 * watchdog. Learners can tweak the example and re-run it in place.
 */
export default function RunnableSnippet({ initialCode, language }: Props) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const activeJsRun = useRef<JsRun | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setOutputFiles([]);
    try {
      if (language === 'javascript') {
        const run = runJavaScript(code);
        activeJsRun.current = run;
        const res = await run.done;
        activeJsRun.current = null;
        setResult(res);
        return;
      }
      const res = await runJava({
        files: [{ filename: javaFilename(code), contents: code }],
      });
      const parsed = parseOutputFiles(res.stdout);
      setOutputFiles(parsed.files);
      setResult({ ...res, stdout: parsed.cleanStdout.trim() });
    } catch (err) {
      setResult({
        ok: false,
        stdout: '',
        stderr: `Unexpected error while running: ${(err as Error).message}`,
        stage: 'run',
      });
    } finally {
      setRunning(false);
    }
  }, [code, language]);

  const handleStop = useCallback(() => {
    activeJsRun.current?.stop();
    activeJsRun.current = null;
    setRunning(false);
    setResult({ ok: false, stdout: '', stderr: 'Execution stopped by user.', stage: 'run' });
  }, []);

  const handleReset = useCallback(() => {
    activeJsRun.current?.stop();
    activeJsRun.current = null;
    setCode(initialCode);
    setResult(null);
    setOutputFiles([]);
    setRunning(false);
  }, [initialCode]);

  const lineCount = Math.max(6, Math.min(28, code.split('\n').length + 1));

  return (
    <div className="snippet">
      <div className="snippet__bar">
        <span className="snippet__lang">{language === 'java' ? 'Java 25' : 'JavaScript'}</span>
        <span className="snippet__spacer" />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={handleRun}
          disabled={running}
        >
          {running ? 'Running…' : language === 'java' ? '▶ Compile & Run' : '▶ Run'}
        </button>
        {running ? (
          <button type="button" className="btn btn--danger btn--sm" onClick={handleStop}>
            ■ Stop
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleReset}
          disabled={running}
        >
          ⟲ Reset
        </button>
      </div>

      <CodeEditor language={language} value={code} onChange={setCode} height={`${lineCount * 1.5}rem`} />

      {result || running ? (
        <div className="snippet__console">
          {running ? (
            <p className="muted" style={{ margin: 0 }}>
              {language === 'java' ? 'Compiling and running (OpenJDK 25)…' : 'Running…'}
            </p>
          ) : result ? (
            <>
              {result.stdout ? (
                <>
                  <div className="ed__stream-label">stdout</div>
                  <pre className="output">{result.stdout}</pre>
                </>
              ) : null}

              {outputFiles.length > 0 ? (
                <div className="outfiles">
                  <div className="ed__stream-label">files written ({outputFiles.length})</div>
                  {outputFiles.map((f) => (
                    <div className="outfile" key={f.name}>
                      <div className="outfile__name">
                        <span className="outfile__icon" aria-hidden>
                          ▤
                        </span>
                        {f.name}
                        {f.truncated ? <span className="outfile__trunc"> (truncated)</span> : null}
                      </div>
                      <pre className="output outfile__body">{f.contents}</pre>
                    </div>
                  ))}
                </div>
              ) : null}

              {result.stderr ? (
                <>
                  <div className="ed__stream-label">
                    {result.stage === 'compile' ? 'compiler' : 'stderr'}
                  </div>
                  <pre className="output output--error">{result.stderr}</pre>
                </>
              ) : null}

              {!result.stdout && !result.stderr && outputFiles.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  (No output produced.)
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
