// ---------------------------------------------------------------------------
// Serverless Java execution proxy (Vercel Route Handler).
//
// The browser POSTs { files, stdin, testerCode } here; this function merges the
// sources into one compilation unit, calls OnlineCompiler.io's *sync* REST
// endpoint with a SECRET API key (never exposed to the client), and returns the
// execution result as JSON. Keeping the key server-side is why this route
// exists — the public WebSocket path isn't permitted for browser use.
//
// Env: COMPILE_API_KEY  — a REST API key from the OnlineCompiler.io "API Keys"
//                         page (store as a *Secret* env var in Vercel).
//      JAVA_COMPILER     — optional compiler id override (default openjdk-25).
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// This route must run per-request on the server, never statically prerendered.
export const dynamic = 'force-dynamic';

const SYNC_URL = 'https://api.onlinecompiler.io/api/run-code-sync/';
const COMPILER = process.env.JAVA_COMPILER || 'openjdk-25';
const API_KEY = process.env.COMPILE_API_KEY || '';

interface IncomingFile {
  filename: string;
  contents: string;
}

interface GraderCase {
  name: string;
  hidden?: boolean;
  body: string;
}

interface RunBody {
  files?: IncomingFile[];
  stdin?: string;
  testerCode?: string;
  graderCases?: GraderCase[];
}

/** Java string literal for arbitrary text. */
function javaStr(s: string): string {
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

/**
 * Generate the grading harness: a `public class Main` whose `main` runs each
 * case in isolation and prints a parseable line per case:
 *   @@CASE@@<index>@@<PASS|FAIL>@@<message>
 * Helpers check()/eq()/eqD() throw AssertionError on failure.
 */
function buildGraderHarness(cases: GraderCase[]): string {
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
    .map(
      (c, i) =>
        `        runCase(${i}, ${javaStr(c.name)}, Main::case${i});`,
    )
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

// ---- Source merging (moved server-side; mirrors the old client logic) -------

const MAIN_RE =
  /(?:public\s+|private\s+|protected\s+)?(?:static\s+)?void\s+main\s*\(\s*(?:String(?:\s*\[\s*\]|\.\.\.)\s*\w+)?\s*\)/;

function hasMain(src: string): boolean {
  return MAIN_RE.test(src);
}

function detectPublicType(src: string): string | null {
  const m = src.match(
    /\bpublic\s+(?:final\s+|abstract\s+)*(?:class|interface|enum|record)\s+([A-Za-z_]\w*)/,
  );
  return m ? m[1] : null;
}

function findMainClass(files: IncomingFile[]): string | null {
  for (const f of files) {
    if (!hasMain(f.contents)) continue;
    const cls = f.contents.match(
      /(?:public\s+)?(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)/,
    );
    if (cls) return cls[1];
    return '';
  }
  return null;
}

function splitImports(src: string): { imports: string[]; body: string } {
  const imports: string[] = [];
  const body: string[] = [];
  for (const line of src.split('\n')) {
    if (/^\s*import\s+[\w.*]+\s*;/.test(line)) imports.push(line.trim());
    else if (/^\s*package\s+[\w.]+\s*;/.test(line)) {
      /* drop package */
    } else body.push(line);
  }
  return { imports, body: body.join('\n') };
}

function mergeToSingleUnit(files: IncomingFile[], keepPublic: string | null): string {
  const allImports = new Set<string>();
  const bodies: string[] = [];
  // Keep the public (entry) type's body first, so the generated single file
  // leads with `public class <keepPublic>` — the shape the service expects (it
  // derives the filename from the leading public class). Others follow, demoted
  // to package-private so the single compilation unit stays legal.
  const leading: string[] = [];
  for (const f of files) {
    const { imports, body } = splitImports(f.contents);
    imports.forEach((i) => allImports.add(i));

    const isEntry = keepPublic != null && new RegExp(`\\bclass\\s+${keepPublic}\\b`).test(body);
    const demoted = body.replace(
      /\bpublic\s+((?:final\s+|abstract\s+)*)(class|interface|enum|record)\s+([A-Za-z_]\w*)/g,
      (match, mods, kind, name) =>
        keepPublic && name === keepPublic ? match : `${mods}${kind} ${name}`,
    );
    (isEntry ? leading : bodies).push(demoted.trim());
  }

  const parts = [...leading, ...bodies].filter((b) => b.length > 0);
  const importBlock = [...allImports].sort().join('\n');
  return (importBlock ? importBlock + '\n\n' : '') + parts.join('\n\n') + '\n';
}

function buildCode(body: RunBody): { code?: string; error?: string } {
  const files = (body.files ?? []).filter((f) => (f.contents ?? '').trim().length > 0);
  if (files.length === 0 && !body.testerCode) {
    return { error: 'There is no code to run yet — write a solution first.' };
  }

  const units: IncomingFile[] = [...files];
  let keepPublic: string | null;

  if (body.graderCases && body.graderCases.length > 0) {
    // Grading run: generate a harness that prints per-case PASS/FAIL.
    units.push({ filename: 'Main.java', contents: buildGraderHarness(body.graderCases) });
    keepPublic = 'Main';
  } else if (body.testerCode) {
    // Normalize the tester's public class to `Main` (the entry point).
    const origName = detectPublicType(body.testerCode) || 'BoilerTester';
    let normalized = body.testerCode;
    if (origName !== 'Main') {
      normalized = body.testerCode.replace(new RegExp(`\\b${origName}\\b`, 'g'), 'Main');
    }
    units.push({ filename: 'Main.java', contents: normalized });
    keepPublic = 'Main';
  } else {
    const mainClass = findMainClass(files);
    if (mainClass === null) {
      return {
        error:
          'This code has no `main` method, so there is nothing to run directly. ' +
          'Use the "Test" button, or add a `main`.',
      };
    }
    keepPublic = mainClass || detectPublicType(files.find((f) => hasMain(f.contents))!.contents);
  }

  // Preserve Java 25 compact-source semantics for a single top-level-main file.
  const singleCompact =
    units.length === 1 &&
    hasMain(units[0].contents) &&
    !/\b(?:public\s+)?(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\s+[A-Za-z_]\w*/.test(
      units[0].contents,
    );

  const code = singleCompact ? units[0].contents : mergeToSingleUnit(units, keepPublic);
  if (code.length > 100_000) {
    return { error: 'Your program exceeds the 100 KB source limit of the execution service.' };
  }
  return { code };
}

// ---- Diagnostics ------------------------------------------------------------
// GET /api/run  → returns the service's supported compiler list (fetched
// server-side, so no CORS) plus which compiler id this app is configured to
// use. Open it in the browser to verify that `openjdk-25` is actually valid
// for your account/key. (This endpoint reveals no secrets.)
export async function GET() {
  const info: Record<string, unknown> = {
    configuredCompiler: COMPILER,
    hasApiKey: Boolean(API_KEY),
  };
  try {
    const res = await fetch('https://api.onlinecompiler.io/api/compilers/', {
      headers: API_KEY ? { Authorization: API_KEY } : {},
      cache: 'no-store',
    });
    info.compilersStatus = res.status;
    const text = await res.text();
    try {
      info.compilers = JSON.parse(text);
    } catch {
      info.compilersRaw = text.slice(0, 2000);
    }
  } catch (e) {
    info.compilersError = (e as Error).message;
  }

  // Canonical hello-world run, trying both Authorization header formats, to
  // isolate whether the "internal error" is about auth format or payload.
  const helloCode =
    'public class Main { public static void main(String[] a){ System.out.println("hi"); } }';
  for (const authName of ['raw', 'bearer'] as const) {
    try {
      const res = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authName === 'bearer' ? `Bearer ${API_KEY}` : API_KEY,
        },
        body: JSON.stringify({ compiler: COMPILER, code: helloCode, input: '' }),
        cache: 'no-store',
      });
      const t = await res.text();
      info[`hello_${authName}_status`] = res.status;
      info[`hello_${authName}_body`] = t.slice(0, 500);
    } catch (e) {
      info[`hello_${authName}_error`] = (e as Error).message;
    }
  }

  return NextResponse.json(info, { status: 200 });
}

// ---- Handler ----------------------------------------------------------------

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        stdout: '',
        stderr:
          'Server is missing COMPILE_API_KEY. Add an OnlineCompiler.io REST API key as an ' +
          'environment variable (Secret) in Vercel and redeploy.',
        stage: 'runtime',
      },
      { status: 200 },
    );
  }

  let body: RunBody;
  try {
    body = (await request.json()) as RunBody;
  } catch {
    return NextResponse.json(
      { ok: false, stdout: '', stderr: 'Malformed request.', stage: 'runtime' },
      { status: 400 },
    );
  }

  const built = buildCode(body);
  if (built.error) {
    return NextResponse.json(
      { ok: false, stdout: '', stderr: built.error, stage: 'compile' },
      { status: 200 },
    );
  }

  // Call OnlineCompiler.io sync endpoint. The REST key goes in Authorization,
  // on the server, so it is never visible to the browser. Some deployments of
  // the service expect a bare key, others a "Bearer <key>" — if the first form
  // yields the service's own "internal error" (job never ran), retry with the
  // other form before giving up.
  const payload = JSON.stringify({
    compiler: COMPILER,
    code: built.code,
    input: body.stdin ?? '',
  });

  type SvcData = {
    output?: string;
    error?: string;
    status?: string;
    exit_code?: number;
    signal?: number | null;
  };

  const callService = async (authHeader: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const r = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: payload,
        signal: controller.signal,
      });
      return r;
    } finally {
      clearTimeout(timer);
    }
  };

  // Raw-key auth is confirmed correct for this service (Bearer returns 404).
  let res: Response;
  try {
    res = await callService(API_KEY);
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    return NextResponse.json(
      {
        ok: false,
        stdout: '',
        stderr: aborted
          ? 'The execution service did not respond in time.'
          : `Could not reach the execution service: ${(e as Error).message}`,
        stage: 'runtime',
      },
      { status: 200 },
    );
  }

  if (res.status === 429) {
    return NextResponse.json(
      {
        ok: false,
        stdout: '',
        stderr: 'The execution service is at capacity. Please run again in a moment.',
        stage: 'run',
      },
      { status: 200 },
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      {
        ok: false,
        stdout: '',
        stderr: `Execution service error (HTTP ${res.status}). ${text.slice(0, 300)}`,
        stage: 'runtime',
      },
      { status: 200 },
    );
  }

  const data = (await res.json().catch(() => ({}))) as SvcData;

  const stdout = data.output ?? '';
  let stderr = data.error ?? '';
  const code = data.exit_code ?? 0;
  if (data.signal === 9 || code === 137) {
    stderr = (stderr ? stderr + '\n' : '') + 'Killed: exceeded the memory or time limit.';
  } else if (code === 124) {
    stderr = (stderr ? stderr + '\n' : '') + 'Timed out: exceeded the 30-second limit.';
  }
  if (/internal error|code execution failed/i.test(stderr) || code === -1) {
    stderr =
      'The execution service could not run this submission. If you have written valid code ' +
      'and it still fails, try again in a moment.';
  }

  return NextResponse.json(
    {
      ok: data.status === 'success' && code === 0,
      stdout,
      stderr,
      stage: 'run',
    },
    { status: 200 },
  );
}
