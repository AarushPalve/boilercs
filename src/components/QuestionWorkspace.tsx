'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Question } from '@/lib/types';
import type { RunResult } from '@/lib/runner/types';
import {
  runJava,
  parseCaseResults,
  parseOutputFiles,
  type CaseResult,
  type OutputFile,
} from '@/lib/runner/javaRunner';
import { runJavaScript, type JsRun } from '@/lib/runner/jsRunner';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  clearQuestionDrafts,
  loadAddedFiles,
  saveAddedFiles,
  clearAddedFiles,
} from '@/lib/drafts';
import {
  loadScore,
  recordScore,
  clearScore,
  earnedPoints,
  type QuestionScore,
} from '@/lib/scores';
import Markdown from './Markdown';
import CodeEditor from './CodeEditor';

interface Props {
  classSlug: string;
  classTitle: string;
  unitSlug: string;
  unitTitle: string;
  examSlug: string;
  examTitle: string;
  language: 'java' | 'javascript';
  question: Question;
  prevHref: string | null;
  nextHref: string | null;
}

function normalize(s: string): string {
  // Compare ignoring trailing whitespace per line + trailing blank lines.
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export default function QuestionWorkspace({
  classSlug,
  classTitle,
  unitSlug,
  unitTitle,
  examSlug,
  examTitle,
  language,
  question,
  prevHref,
  nextHref,
}: Props) {
  const starterNames = useMemo(
    () => question.starterFiles.map((f) => f.filename),
    [question],
  );

  // Files the learner has added beyond the starters (extra tabs).
  const [addedFiles, setAddedFiles] = useState<string[]>([]);

  // Full tab order: starter files first, then user-added files.
  const filenames = useMemo(
    () => [...starterNames, ...addedFiles],
    [starterNames, addedFiles],
  );

  // Per-file editor contents, seeded from drafts (sessionStorage) or starters.
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState(starterNames[0] ?? '');
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runMode, setRunMode] = useState<'run' | 'test' | 'grade'>('run');
  const [caseResults, setCaseResults] = useState<CaseResult[] | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [dirty, setDirty] = useState(false);
  const [savedScore, setSavedScore] = useState<QuestionScore | null>(null);

  const activeJsRun = useRef<JsRun | null>(null);

  // Seed editor state on mount / question change.
  useEffect(() => {
    const seeded: Record<string, string> = {};
    for (const f of question.starterFiles) {
      const draft = loadDraft(examSlug, question.id, f.filename);
      seeded[f.filename] = draft ?? f.contents;
    }
    // Restore any files the learner previously added for this question.
    const added = loadAddedFiles(examSlug, question.id);
    for (const name of added) {
      seeded[name] = loadDraft(examSlug, question.id, name) ?? '';
    }
    setAddedFiles(added);
    setFiles(seeded);
    setActiveFile(question.starterFiles[0]?.filename ?? added[0] ?? '');
    setStdin('');
    setResult(null);
    setDirty(false);
    setCaseResults(null);
    setSavedScore(loadScore(examSlug, question.id));
  }, [question, examSlug]);

  // Warn before an accidental reload if there are unsaved-feeling changes.
  // (Drafts are preserved in sessionStorage either way; this matches the
  // architecture spec's beforeunload interception.)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const updateFile = useCallback(
    (filename: string, contents: string) => {
      setFiles((prev) => ({ ...prev, [filename]: contents }));
      setDirty(true);
      saveDraft(examSlug, question.id, filename, contents);
    },
    [examSlug, question.id],
  );

  // Add a new, empty file as its own tab. Java files default to a class stub
  // matching the filename. Returns nothing; switches focus to the new file.
  const handleAddFile = useCallback(() => {
    const raw = window.prompt('New file name (e.g. Helper.java):');
    if (raw == null) return;
    let name = raw.trim();
    if (!name) return;
    // For Java, a bare class name gets a .java extension automatically.
    if (language === 'java' && !name.includes('.')) name = `${name}.java`;

    if (filenames.includes(name)) {
      window.alert(`A file named "${name}" already exists.`);
      setActiveFile(name);
      return;
    }

    // Seed Java files with a class stub derived from the filename.
    let seed = '';
    if (language === 'java' && name.toLowerCase().endsWith('.java')) {
      const base = name.slice(0, -'.java'.length);
      if (/^[A-Za-z_]\w*$/.test(base)) {
        seed = `public class ${base} {\n    \n}\n`;
      }
    }

    setFiles((prev) => ({ ...prev, [name]: seed }));
    setAddedFiles((prev) => {
      const nextAdded = [...prev, name];
      saveAddedFiles(examSlug, question.id, nextAdded);
      return nextAdded;
    });
    saveDraft(examSlug, question.id, name, seed);
    setActiveFile(name);
    setDirty(true);
  }, [examSlug, question.id, language, filenames]);

  // Remove a user-added file (starter files can't be removed).
  const handleDeleteFile = useCallback(
    (name: string) => {
      if (starterNames.includes(name)) return;
      if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

      setFiles((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setAddedFiles((prev) => {
        const nextAdded = prev.filter((f) => f !== name);
        saveAddedFiles(examSlug, question.id, nextAdded);
        return nextAdded;
      });
      clearDraft(examSlug, question.id, name);
      setActiveFile((cur) => (cur === name ? starterNames[0] ?? '' : cur));
      setDirty(true);
    },
    [examSlug, question.id, starterNames],
  );

  const handleReset = useCallback(() => {
    // Stop any in-flight JS run and restore starters (dropping added files).
    activeJsRun.current?.stop();
    activeJsRun.current = null;
    const fresh: Record<string, string> = {};
    for (const f of question.starterFiles) fresh[f.filename] = f.contents;
    // Clear drafts for starters AND any user-added files.
    clearQuestionDrafts(examSlug, question.id, filenames);
    clearAddedFiles(examSlug, question.id);
    setAddedFiles([]);
    setFiles(fresh);
    setActiveFile(question.starterFiles[0]?.filename ?? '');
    setResult(null);
    setDirty(false);
    setRunning(false);
  }, [examSlug, question, filenames]);

  const handleStop = useCallback(() => {
    activeJsRun.current?.stop();
    activeJsRun.current = null;
    setRunning(false);
    setResult({
      ok: false,
      stdout: '',
      stderr: 'Execution stopped by user.',
      stage: 'run',
    });
  }, []);

  // 'run' = user's own main; 'test' = tester harness; 'grade' = graded cases.
  const execute = useCallback(
    async (mode: 'run' | 'test' | 'grade') => {
      setRunning(true);
      setRunMode(mode);
      setResult(null);
      setCaseResults(null);
      setOutputFiles([]);

      // Build the payload from every open tab: starter files plus any files
      // the learner added. Starter contents fall back to their defaults.
      const starterDefaults: Record<string, string> = {};
      for (const f of question.starterFiles) starterDefaults[f.filename] = f.contents;
      const payload = filenames.map((name) => ({
        filename: name,
        contents: files[name] ?? starterDefaults[name] ?? '',
      }));

      try {
        if (language === 'javascript') {
          const run = runJavaScript(payload[0]?.contents ?? '');
          activeJsRun.current = run;
          const res = await run.done;
          activeJsRun.current = null;
          setResult(res);
          return;
        }

        // Java via the serverless proxy → OnlineCompiler.io (OpenJDK 25).
        let res: RunResult;
        if (mode === 'grade' && question.graderCases?.length) {
          res = await runJava({ files: payload, stdin, graderCases: question.graderCases });
          // Pull the per-case PASS/FAIL lines out of stdout.
          const parsed = parseCaseResults(res.stdout, question.graderCases);
          setCaseResults(parsed.cases);
          res = { ...res, stdout: parsed.cleanStdout };
          // Persist the best score locally (only when cases actually ran).
          if (res.ok && parsed.cases.length > 0) {
            const passed = parsed.cases.filter((c) => c.passed).length;
            const best = recordScore(
              examSlug,
              question.id,
              passed,
              parsed.cases.length,
              question.points,
            );
            setSavedScore(best);
          }
        } else if (mode === 'test' && question.testerCode) {
          res = await runJava({ files: payload, stdin, testerCode: question.testerCode });
        } else {
          res = await runJava({ files: payload, stdin });
          // The run launcher appends @@FILE@@ markers for any files the
          // program wrote (FileWriter, etc.). Surface them as read-only tabs.
          const parsedFiles = parseOutputFiles(res.stdout);
          setOutputFiles(parsedFiles.files);
          res = { ...res, stdout: parsedFiles.cleanStdout.trim() };
        }
        setResult(res);
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
    },
    [
      files,
      filenames,
      language,
      question.starterFiles,
      question.testerCode,
      question.graderCases,
      question.id,
      question.points,
      examSlug,
      stdin,
    ],
  );

  const handleRun = useCallback(() => execute('run'), [execute]);
  const handleTest = useCallback(() => execute('test'), [execute]);
  const handleGrade = useCallback(() => execute('grade'), [execute]);

  const hasGrader = (question.graderCases?.length ?? 0) > 0;

  // Grade summary (how many cases passed).
  const gradeSummary = useMemo(() => {
    if (!caseResults || caseResults.length === 0) return null;
    const passed = caseResults.filter((c) => c.passed).length;
    return { passed, total: caseResults.length };
  }, [caseResults]);

  // Compare stdout against the relevant expected output (run/test modes only).
  const sampleComparison = useMemo(() => {
    if (!result || !result.ok || runMode === 'grade') return null;
    const expected =
      runMode === 'test' ? question.testerExpectedOutput : question.expectedOutput;
    if (!expected) return null;
    return normalize(result.stdout) === normalize(expected);
  }, [result, runMode, question.expectedOutput, question.testerExpectedOutput]);

  const hasOwnMain = useMemo(
    () =>
      language === 'java' &&
      /(?:static\s+)?void\s+main\s*\(/.test(
        question.starterFiles.map((f) => f.contents).join('\n'),
      ),
    [language, question.starterFiles],
  );
  const hasTester = Boolean(question.testerCode);

  const visibleTests = question.tests.filter((t) => t.visible);
  const hiddenTests = question.tests.filter((t) => !t.visible);
  const needsStdin = /scanner|System\.in/i.test(
    question.starterFiles.map((f) => f.contents).join('\n'),
  );

  return (
    <div className="ed">
      {/* ---- Top toolbar (Ed-style) ---- */}
      <div className="ed__topbar">
        <div className="ed__crumbs eyebrow">
          <Link href="/">Classes</Link> <span className="sep">·</span>{' '}
          <Link href={`/classes/${classSlug}`}>{classTitle}</Link> <span className="sep">·</span>{' '}
          <Link href={`/classes/${classSlug}/${unitSlug}`}>{unitTitle}</Link>{' '}
          <span className="sep">·</span>{' '}
          <Link href={`/classes/${classSlug}/${unitSlug}/${examSlug}`}>{examTitle}</Link>
        </div>
        <div className="ed__nav">
          {prevHref ? (
            <Link className="btn btn--ghost btn--sm" href={prevHref}>
              ← Prev
            </Link>
          ) : (
            <span className="btn btn--ghost btn--sm is-disabled" aria-disabled>
              ← Prev
            </span>
          )}
          {nextHref ? (
            <Link className="btn btn--ghost btn--sm" href={nextHref}>
              Next →
            </Link>
          ) : (
            <span className="btn btn--ghost btn--sm is-disabled" aria-disabled>
              Next →
            </span>
          )}
        </div>
      </div>

      {/* ---- Split: problem | (editor over console) ---- */}
      <div className="ed__split">
        {/* Left: problem description pane */}
        <aside className="ed__pane ed__problem">
          <div className="ed__problem-inner">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Question {question.order} · {question.theme}
            </span>
            <h1 className="ed__title">{question.title}</h1>
            <div className="flex-row" style={{ marginBottom: '1rem' }}>
              <span className="tag">{question.points} points</span>
              {savedScore ? (
                <span
                  className={`tag score-badge ${
                    savedScore.total > 0 && savedScore.passed === savedScore.total
                      ? 'score-badge--pass'
                      : 'score-badge--partial'
                  }`}
                  title={`Best recorded: ${savedScore.passed}/${savedScore.total} tests passed`}
                >
                  Best: {savedScore.earned}/{savedScore.points} pts · {savedScore.passed}/
                  {savedScore.total} tests
                </span>
              ) : hasGrader ? (
                <span className="tag score-badge score-badge--none">Not graded yet</span>
              ) : null}
            </div>

            <div className="md">
              <Markdown source={question.prompt} />
            </div>

            {question.sampleRun ? (
              <>
                <h3 className="ed__h">Sample Run</h3>
                <pre className="output">{question.sampleRun}</pre>
                {question.expectedOutput ? (
                  <>
                    <h4 className="muted ed__subh">Expected Output</h4>
                    <pre className="output">{question.expectedOutput}</pre>
                  </>
                ) : null}
              </>
            ) : null}

            <h3 className="ed__h">Test Cases</h3>
            <ul className="test-list">
              {visibleTests.map((t) => (
                <li key={t.name}>
                  <span className="tag" style={{ marginRight: '0.5rem' }}>
                    Visible
                  </span>
                  <strong>{t.name}</strong>
                  <div className="muted">{t.description}</div>
                </li>
              ))}
              {hiddenTests.length > 0 ? (
                <li className="hidden-tests-note">
                  <span className="tag tag--oxblood" style={{ marginRight: '0.5rem' }}>
                    Hidden
                  </span>
                  <strong>
                    {hiddenTests.length} hidden test{hiddenTests.length === 1 ? '' : 's'}
                  </strong>
                  <div className="muted">
                    Additional edge cases run when you grade, but their details are not shown.
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
        </aside>

        {/* Right: editor pane stacked over the console pane */}
        <section className="ed__pane ed__right">
          <div className="ed__editor">
            {/* File tab strip */}
            <div className="ed__tabs" role="tablist">
              {filenames.map((fn) => {
                const removable = !starterNames.includes(fn);
                return (
                  <span
                    key={fn}
                    className={`ed__tab ${fn === activeFile ? 'is-active' : ''} ${
                      removable ? 'ed__tab--removable' : ''
                    }`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={fn === activeFile}
                      className="ed__tab-label"
                      onClick={() => setActiveFile(fn)}
                    >
                      {fn}
                    </button>
                    {removable ? (
                      <button
                        type="button"
                        className="ed__tab-close"
                        title={`Delete ${fn}`}
                        aria-label={`Delete ${fn}`}
                        onClick={() => handleDeleteFile(fn)}
                      >
                        ×
                      </button>
                    ) : null}
                  </span>
                );
              })}
              {language === 'java' ? (
                <button
                  type="button"
                  className="ed__tab ed__tab-add"
                  title="Add a new file"
                  onClick={handleAddFile}
                >
                  + New file
                </button>
              ) : null}
              <span className="ed__tabs-spacer" />
              <span className="ed__lang">{language === 'java' ? 'Java 25' : 'JavaScript'}</span>
            </div>

            <CodeEditor
              language={language}
              value={files[activeFile] ?? ''}
              onChange={(v) => updateFile(activeFile, v)}
              height="100%"
            />
          </div>

          {/* Console / run panel */}
          <div className="ed__console">
            <div className="ed__console-bar">
              <div className="ed__run-actions">
                {/* Run: shown for JS, or for Java whose own code has a main.
                    When Java code has no main but a tester exists, Run is
                    hidden in favor of the Test button. */}
                {language === 'javascript' || hasOwnMain || !hasTester ? (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleRun}
                    disabled={running}
                    title={
                      language === 'java' && !hasOwnMain
                        ? 'Your code has no main method; add one, or use Test.'
                        : undefined
                    }
                  >
                    {running && runMode === 'run'
                      ? 'Running…'
                      : language === 'java'
                        ? '▶ Compile & Run'
                        : '▶ Run'}
                  </button>
                ) : null}

                {hasTester ? (
                  <button
                    className={`btn btn--sm ${hasOwnMain ? 'btn--ghost' : 'btn--primary'}`}
                    onClick={handleTest}
                    disabled={running}
                    title="Run the provided tester harness against your classes"
                  >
                    {running && runMode === 'test' ? 'Testing…' : '✔ Test'}
                  </button>
                ) : null}

                {hasGrader ? (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleGrade}
                    disabled={running}
                    title="Grade your code against all test cases"
                  >
                    {running && runMode === 'grade' ? 'Grading…' : '◆ Grade'}
                  </button>
                ) : null}

                <button
                  className="btn btn--danger btn--sm"
                  onClick={handleStop}
                  disabled={!running}
                >
                  ■ Stop
                </button>
                <button className="btn btn--ghost btn--sm" onClick={handleReset} disabled={running}>
                  ⟲ Reset
                </button>
              </div>
              <div className="ed__status-group">
                {language === 'java' ? <span className="runtime-chip">Java 25</span> : null}
                {result?.stage ? <span className="tag">{result.stage}</span> : null}
              </div>
            </div>

            {language === 'java' && needsStdin ? (
              <div className="ed__stdin">
                <label className="ed__stdin-label" htmlFor="boilercs-stdin">
                  stdin — one <code>Scanner</code> input per line
                </label>
                <textarea
                  id="boilercs-stdin"
                  name="boilercs-stdin"
                  className="stdin-box"
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder={'1\n1\n4'}
                  rows={3}
                />
              </div>
            ) : null}

            <div className="ed__console-body">
              {running ? (
                <p className="muted ed__console-hint">
                  {language === 'java'
                    ? 'Compiling and running your Java (OpenJDK 25)…'
                    : 'Running your code…'}
                </p>
              ) : !result ? (
                <p className="muted ed__console-hint">
                  {language === 'java'
                    ? 'Press Compile & Run to compile and execute your code (OpenJDK 25). Output appears here.'
                    : 'Press Run to execute your code in the sandbox and see the output here.'}
                </p>
              ) : (
                <>
                  {/* Graded results: a summary + per-case pass/fail checklist. */}
                  {gradeSummary ? (
                    <>
                      <div
                        className={`verdict ${
                          gradeSummary.passed === gradeSummary.total
                            ? 'verdict--pass'
                            : 'verdict--fail'
                        }`}
                      >
                        {gradeSummary.passed === gradeSummary.total ? '✓ ' : '✗ '}
                        Passed {gradeSummary.passed} of {gradeSummary.total} test
                        {gradeSummary.total === 1 ? '' : 's'}
                        {' · '}
                        {earnedPoints(
                          gradeSummary.passed,
                          gradeSummary.total,
                          question.points,
                        )}
                        /{question.points} pts
                      </div>
                      {savedScore ? (
                        <p className="muted score-note">
                          Best score saved on this device:{' '}
                          <strong>
                            {savedScore.earned}/{savedScore.points} pts
                          </strong>{' '}
                          ({savedScore.passed}/{savedScore.total} tests)
                          <button
                            type="button"
                            className="link-btn score-clear"
                            onClick={() => {
                              clearScore(examSlug, question.id);
                              setSavedScore(null);
                            }}
                          >
                            clear
                          </button>
                        </p>
                      ) : null}
                      <ul className="case-list">
                        {caseResults!.map((c) => (
                          <li
                            key={c.index}
                            className={`case-item ${c.passed ? 'case-pass' : 'case-fail'}`}
                          >
                            <span className="case-icon">{c.passed ? '✓' : '✗'}</span>
                            <div>
                              <strong>
                                {c.hidden ? `Hidden test ${c.index + 1}` : c.name}
                              </strong>
                              {!c.passed && !c.hidden ? (
                                <div className="muted case-msg">{c.message}</div>
                              ) : null}
                              {!c.passed && c.hidden ? (
                                <div className="muted case-msg">(hidden test failed)</div>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {sampleComparison !== null ? (
                    <div
                      className={`verdict ${
                        sampleComparison ? 'verdict--pass' : 'verdict--fail'
                      }`}
                    >
                      {sampleComparison
                        ? '✓ Output matches the visible sample run.'
                        : '✗ Output differs from the visible sample run.'}
                    </div>
                  ) : null}

                  {result.stdout ? (
                    <>
                      <div className="ed__stream-label">stdout</div>
                      <pre className="output">{result.stdout}</pre>
                    </>
                  ) : null}

                  {outputFiles.length > 0 ? (
                    <div className="outfiles">
                      <div className="ed__stream-label">
                        files written ({outputFiles.length})
                      </div>
                      {outputFiles.map((f) => (
                        <div className="outfile" key={f.name}>
                          <div className="outfile__name">
                            <span className="outfile__icon" aria-hidden>
                              ▤
                            </span>
                            {f.name}
                            {f.truncated ? (
                              <span className="outfile__trunc"> (truncated)</span>
                            ) : null}
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
                    <p className="muted">(No output produced.)</p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
