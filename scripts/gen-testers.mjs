// ---------------------------------------------------------------------------
// One-off generator: inject a `testerCode` + `testerExpectedOutput` into every
// question that has no `main` in its starter files, so the workspace "Test"
// button can run a driver against the learner's classes.
//
// Strategy:
//   • Non-file questions: wrap the question's `sampleRun` snippet in a
//     `public class BoilerTester { public static void main(String[] a) throws Exception { ... } }`
//     and reuse `expectedOutput` as the expected tester output.
//   • File-I/O questions (sample run references a file via `// <name> contains:`):
//     the tester first writes the sample input file(s) parsed from the comment
//     block, then runs the snippet. Expected output reused from `expectedOutput`.
//
// Run with: node scripts/gen-testers.mjs
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const EXAM_DIR = join(process.cwd(), 'public', 'data', 'exams');

/** Split a sampleRun into leading `//` comment lines and executable lines. */
function splitSample(sample) {
  const commentLines = [];
  const codeLines = [];
  for (const line of sample.split('\n')) {
    if (/^\s*\/\//.test(line)) commentLines.push(line.replace(/^\s*\/\/\s?/, ''));
    else codeLines.push(line);
  }
  return { commentLines, codeLines: codeLines.join('\n').trim() };
}

/**
 * For file-I/O questions, the comment block looks like:
 *   server.log contains:
 *   # Gateway Web Access Log
 *   2026-...   (lines)
 *   (blank line)
 *   ...
 * We reconstruct the file name + contents. Multiple files are separated by a
 * new "<name>:" or "<name> contains:" / "File `x`:" header. Heuristic but works
 * for this dataset. Returns [{name, contents}] and the remaining code.
 */
function parseFiles(commentLines) {
  const files = [];
  let current = null;
  for (const raw of commentLines) {
    const header = raw.match(/^([\w.\-]+)\s*(?:contains:|:)\s*$/);
    if (header) {
      current = { name: header[1], lines: [] };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (/^\(blank line\)\s*$/i.test(raw)) {
      current.lines.push('');
    } else {
      current.lines.push(raw);
    }
  }
  return files.map((f) => ({ name: f.name, contents: f.lines.join('\n') }));
}

/** Java string literal for arbitrary text (handles quotes/newlines/tabs). */
function javaStr(s) {
  return (
    '"' +
    s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '')
      .replace(/\n/g, '\\n') +
    '"'
  );
}

function buildTester(q) {
  if (!q.sampleRun) return null;
  const { commentLines, codeLines } = splitSample(q.sampleRun);
  if (!codeLines) return null;

  const files = parseFiles(commentLines);

  const setup = files
    .map(
      (f) =>
        `        try (java.io.PrintWriter __w = new java.io.PrintWriter(${javaStr(
          f.name,
        )}, "UTF-8")) { __w.print(${javaStr(f.contents)}); }`,
    )
    .join('\n');

  const body =
    (setup ? setup + '\n' : '') +
    codeLines
      .split('\n')
      .map((l) => '        ' + l)
      .join('\n');

  return (
    'public class BoilerTester {\n' +
    '    public static void main(String[] __args) throws Exception {\n' +
    body +
    '\n    }\n' +
    '}\n'
  );
}

let changed = 0;
for (const file of readdirSync(EXAM_DIR).filter((f) => f.endsWith('.json'))) {
  const path = join(EXAM_DIR, file);
  const exam = JSON.parse(readFileSync(path, 'utf8'));
  let touched = false;

  for (const q of exam.questions) {
    const hasMain = q.starterFiles.some((f) => /void\s+main\s*\(/.test(f.contents));
    if (hasMain) continue; // interactive sims run directly
    if (q.testerCode) continue; // already has one
    const tester = buildTester(q);
    if (!tester) continue;
    q.testerCode = tester;
    if (q.expectedOutput) q.testerExpectedOutput = q.expectedOutput;
    touched = true;
    changed++;
  }

  if (touched) {
    writeFileSync(path, JSON.stringify(exam, null, 2) + '\n', 'utf8');
    console.log('updated', file);
  }
}
console.log('injected testers into', changed, 'questions');
