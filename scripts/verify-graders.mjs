// ---------------------------------------------------------------------------
// Local grader verification harness.
//
// Replicates the server's buildGraderHarness + mergeToSingleUnit logic
// (src/app/api/run/route.ts) so we can compile a question's graderCases
// against a REFERENCE solution with the local `javac`/`java` (Java 26) and
// confirm every case PASSes.
//
// Usage:
//   node scripts/verify-graders.mjs <exam.json> <questionId> <refDir>
//
//   refDir contains the *.java reference solution files for that question.
//
// Exit code 0 = all cases passed; non-zero = at least one failed / error.
// ---------------------------------------------------------------------------

import { readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

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

function buildGraderHarness(cases) {
  const methods = cases
    .map(
      (c, i) =>
        `    static void case${i}() throws Throwable {\n` +
        c.body
          .split('\n')
          .map((l) => '        ' + l)
          .join('\n') +
        '\n    }',
    )
    .join('\n');

  const dispatch = cases
    .map((c, i) => `        runCase(${i}, ${javaStr(c.name)}, Main::case${i});`)
    .join('\n');

  return `import java.util.*;

public class Main {
    interface CaseFn { void run() throws Throwable; }

    static void runCase(int idx, String name, CaseFn fn) {
        try {
            fn.run();
            System.out.println("@@CASE@@" + idx + "@@PASS@@" + name);
        } catch (Throwable t) {
            String m = t.getMessage();
            System.out.println("@@CASE@@" + idx + "@@FAIL@@" + name + " :: "
                + t.getClass().getSimpleName() + (m != null ? ": " + m : ""));
        }
    }

    static void check(boolean cond, String msg) { if (!cond) throw new AssertionError(msg); }
    static void eq(Object a, Object b) {
        if (a == null ? b != null : !a.equals(b))
            throw new AssertionError("expected <" + b + "> but was <" + a + ">");
    }
    static void eqD(double a, double b) {
        if (Math.abs(a - b) > 1e-6)
            throw new AssertionError("expected <" + b + "> but was <" + a + ">");
    }

    public static void main(String[] __args) {
${dispatch}
    }

${methods}
}
`;
}

const [, , examPath, questionId, refDir] = process.argv;
if (!examPath || !questionId || !refDir) {
  console.error('Usage: node scripts/verify-graders.mjs <exam.json> <questionId> <refDir>');
  process.exit(2);
}

const exam = JSON.parse(readFileSync(examPath, 'utf8'));
const q = exam.questions.find((x) => x.id === questionId);
if (!q) {
  console.error(`Question ${questionId} not found in ${examPath}`);
  process.exit(2);
}
if (!q.graderCases || q.graderCases.length === 0) {
  console.error(`Question ${questionId} has no graderCases`);
  process.exit(2);
}

const work = mkdtempSync(join(tmpdir(), 'grader-'));
try {
  // Copy reference solution files verbatim (they keep their own public types).
  const refFiles = readdirSync(refDir).filter((f) => f.endsWith('.java'));
  for (const f of refFiles) {
    writeFileSync(join(work, f), readFileSync(join(refDir, f), 'utf8'));
  }
  // Write the generated Main harness.
  writeFileSync(join(work, 'Main.java'), buildGraderHarness(q.graderCases));

  // Compile everything together.
  execFileSync('javac', ['-d', work, ...refFiles.map((f) => join(work, f)), join(work, 'Main.java')], {
    stdio: 'pipe',
  });

  const out = execFileSync('java', ['-cp', work, 'Main'], { stdio: 'pipe' }).toString();
  const lines = out.split('\n');
  let pass = 0;
  let fail = 0;
  for (const line of lines) {
    const m = line.match(/^@@CASE@@(\d+)@@(PASS|FAIL)@@([\s\S]*)$/);
    if (m) {
      if (m[2] === 'PASS') pass++;
      else {
        fail++;
        console.error('FAIL: ' + m[3]);
      }
    } else if (line.trim()) {
      console.error('stdout: ' + line);
    }
  }
  console.log(`${questionId}: ${pass} passed, ${fail} failed (of ${q.graderCases.length})`);
  process.exit(fail === 0 && pass === q.graderCases.length ? 0 : 1);
} catch (e) {
  console.error('ERROR compiling/running:');
  if (e.stdout) console.error(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
  process.exit(1);
} finally {
  rmSync(work, { recursive: true, force: true });
}
