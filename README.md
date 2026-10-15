# Boiler CS — Stateless Purdue CS Practice Platform

A in-browser coding practice platform for Purdue
Computer Science. Built as a **Jamstack static site** for the **Vercel free tier**:
no database, and **$0.00** hosting cost on Vercel's free tier. (One tiny serverless Route
Handler proxies Java execution so the execution-service key stays secret; everything else is
statically rendered.)

**Catalog:** CS 18000 (populated — Midterm 2 has four full practice exams; Midterms 1, 3, 4
are scaffolded), plus scaffolding placeholders for CS 24000, CS 18200, and CS 25100.
Hierarchy is **Class → Unit (midterm) → Exam → Question**.

- **Framework:** Next.js 14 (App Router). Mostly static, with one serverless Route Handler
  (`/api/run`) for Java execution.
- **Editor:** a self-contained, zero-dependency code editor (`src/components/CodeEditor.tsx`) —
  a styled textarea with a synced line-number gutter and Tab/indent handling. No external
  engine or CDN, so it always loads under a strict CSP.
- **Java execution:** **[OnlineCompiler.io](https://onlinecompiler.io/)** on **OpenJDK 25**,
  via its REST API. The browser never talks to the service directly — it POSTs to our own
  serverless endpoint `/api/run` (`src/app/api/run/route.ts`), which holds a **secret** REST
  key and forwards the request. This keeps the key off the client and lets our own editor,
  the Test button, and the automatic expected-output verdict all keep working. Requires one
  server env var, `COMPILE_API_KEY` (see "Java execution setup" below).
- **JavaScript execution:** an isolated **Web Worker** with a 3-second watchdog on the
  main thread (honors the Security spec's client-side DoS protection).
- **Curriculum:** flat JSON files under `public/data/` (4 full exams × 10 questions = 40
  challenges), with scaffolding for additional CS 180 midterms.


## Architecture mapping (how this satisfies the specs)

### System Architecture (SAS)
- **Mostly-static Jamstack:** pages are statically rendered and served from Vercel's edge CDN.
  No database. The only server code is one small Route Handler (`/api/run`) for Java execution.
- **Static JSON curriculum:** `public/data/classes.json` + `public/data/exams/*.json`. Routes
  like `/classes/cs180/midterm-2/practice-exam-1/q1-flight-ticket` resolve slugs to JSON.
- **Volatile state + sessionStorage drafts:** editor contents auto-save to `sessionStorage`
  (`src/lib/drafts.ts`); a `beforeunload` prompt guards accidental reloads; closing the tab
  purges everything.
- **Isolated Web Worker + postMessage + 3s watchdog + `.terminate()`:** `public/sandbox-worker.js`
  and `src/lib/runner/jsRunner.ts`.
- **≤ 2 MB JSON payloads:** each exam file is a few tens of KB.

### Execution decision — serverless proxy to a hosted sandbox
Java is compiled and executed by **[OnlineCompiler.io](https://onlinecompiler.io/)** on
**OpenJDK 25**. The browser never calls the service directly; it POSTs to our own serverless
endpoint `/api/run`, which holds the secret REST key and forwards the request.

Why this design (after exploring in-browser options):
- Pure in-browser Java (CheerpJ to run, teavm-javac to compile) kept hitting hard walls:
  CheerpJ can't practically compile source; teavm-javac is a self-contained WASM playground,
  not a clean compiler library; and no in-browser JVM supports Java > 17.
- OnlineCompiler.io's **WebSocket/Widget** path only runs through its own embeddable UI
  component (the raw socket is origin-gated and rejects browser-driven `runcode`), which would
  replace our editor and drop the automatic verdict. Its **REST** API needs a secret key.
- So we keep a **one-function backend**: `/api/run` holds the secret REST key server-side and
  returns output as plain JSON. This preserves our custom editor, the Test button, and the
  automatic expected-output verdict, and gives **real Java 25**.

**How a run works:**
1. Client (`src/lib/runner/javaRunner.ts`) POSTs `{ files, stdin, testerCode }` to `/api/run`.
2. The handler (`src/app/api/run/route.ts`) merges the files into one compilation unit
   (multiple top-level classes are legal if at most one is `public`; the entry class is kept
   public and named `Main`), then calls the service's sync endpoint with the secret key.
3. The sandbox (512 MB, 2 CPUs, 30 s, no network) compiles + runs it; the handler maps
   `output`/`error`/`exit_code`/`signal` to a clean `RunResult`. `Scanner` programs read stdin.

**Config:** one **secret** server env var, `COMPILE_API_KEY`. See "Java execution setup".

**Limits (from the service):** 30-second cap, 512 MB RAM, output truncated ~999 chars. Fine
for CS 18000 exercises.

### Security Requirements (SRS)
- **Sandboxed execution:** JS runs in an isolated Web Worker (no DOM, no page scope),
  communicating only via `postMessage`.
- **3-second DoS watchdog** forcibly `.terminate()`s runaway JS; a globally responsive
  **Stop/Reset** button is always available.
- **Security headers** (`vercel.json`): strict `Content-Security-Policy`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`.
- **Storage segmentation:** only the user's own draft code is stored (sessionStorage). No
  auth tokens, no PII — there is no auth at all.
- **Output sanitization:** prompt markdown is rendered through **DOMPurify**
  (`src/components/Markdown.tsx`), never as raw HTML.

#### Deliberate deviations from the SRS (documented)
- **CSP is tight:** `connect-src 'self'` — the browser only ever calls our own `/api/run`
  endpoint, never a third-party host directly. No external script/CDN/`eval` is allowed.
  `worker-src 'self' blob:` remains for the JavaScript sandbox worker.
- **`script-src` includes `'unsafe-inline'`.** Next.js emits inline bootstrap/hydration
  scripts; without `'unsafe-inline'` the app won't run. (No nonce/hash is used, so the browser
  honors `'unsafe-inline'`.) Other mitigations stay in place: `object-src 'none'`,
  `base-uri 'self'`, `X-Frame-Options: DENY`, DOMPurify on prompt HTML, and user Java never
  touches the page DOM (it runs in the remote sandbox).
- **The execution key is a server secret.** `COMPILE_API_KEY` is read only in `/api/run`
  (server side) and is never sent to the browser — store it as a Vercel **Secret**.

### Style Guide
The Dark Academia palette, serif type hierarchy (EB Garamond / Lora / Inter), double-line
gold card frames, drop caps, and small corner radii are implemented in
`src/app/globals.css`.

---

## Project structure

```
public/
  data/
    classes.json                 # course catalog (Class -> Unit -> Exam)
    exams/*.json                 # 4 exams, 10 questions each
  sandbox-worker.js              # isolated JS runner (Web Worker)
src/
  app/
    layout.tsx, globals.css, page.tsx, about/
    api/run/route.ts             # serverless Java execution proxy (secret key)
    classes/[classSlug]/
      page.tsx                                           # class -> units
      [unitSlug]/page.tsx                                # unit  -> exams
      [unitSlug]/[examSlug]/page.tsx                     # exam  -> questions
      [unitSlug]/[examSlug]/[questionId]/page.tsx        # the workspace
  components/
    CodeEditor.tsx               # self-contained textarea editor + line gutter
    Markdown.tsx                 # sanitized markdown renderer
    Ornament.tsx                 # Dark Academia filigree dividers
    RuntimeBootstrap.tsx         # unregisters any stale Service Worker
    QuestionWorkspace.tsx        # Ed-style editor + run + output + drafts
  lib/
    types.ts                     # domain types
    curriculum.ts                # JSON loader + static-param helpers
    drafts.ts                    # sessionStorage persistence
    runner/
      types.ts
      javaRunner.ts              # client: POSTs to /api/run (OpenJDK 25)
      jsRunner.ts                # Web Worker controller + watchdog (JS sandbox)
vercel.json                      # security headers + clean URLs
next.config.mjs                  # Next config (serverless, not static export)
.env.example                     # COMPILE_API_KEY template (server secret)
```

## Adding a new exam / midterm / class

1. Create `public/data/exams/<your-exam>.json` following the shape in `src/lib/types.ts`.
2. Register it in `src/lib/curriculum.ts` (`EXAM_REGISTRY`).
3. In `public/data/classes.json`, add the exam's slug to the relevant unit's `examSlugs`
   (e.g. the `midterm-1` placeholder under `cs180`), or add a whole new class/unit object.

That's it — routes and pages are generated automatically from the JSON.

## Editor note

The code editor is intentionally dependency-free: a styled `<textarea>` with a synced
line-number gutter and Tab/indent handling (`src/components/CodeEditor.tsx`). It always loads
and needs no CDN. (An earlier Monaco-based editor could silently fail to load under a strict
CSP, which is why this exists.)

## Notes on the Java runner
- **Setup step:** set the `COMPILE_API_KEY` **Secret** to an OnlineCompiler.io REST API key
  (see "Java execution setup"). Without it, Java questions show a clear "server is missing
  COMPILE_API_KEY" message; everything else still works.
- **Run vs. Test:** Run executes your own `main` (including Java 25 `void main()` + `IO.println`);
  Test compiles your classes with a provided driver harness and compares to the expected output.
- **Compile errors** are shown in the console panel as `javac` diagnostics.
- The in-app check compares against the **visible sample output** only. The hidden autograder
  cases described under each question are study guidance, not executed here.
- For questions whose harness provides helper classes (e.g. `Container`, `Vehicle`), add
  those classes as extra files/tabs so they compile together.
