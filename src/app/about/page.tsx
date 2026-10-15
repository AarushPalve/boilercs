export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '2rem', maxWidth: '46rem' }}>
      <p className="eyebrow">Colophon</p>
      <h1 className="flourish-title">About Boiler CS</h1>

      <div className="stack">
        <p className="dropcap">
          Boiler CS is a stateless, in-browser study hall for Purdue Computer Science
          courses. It is built as a Jamstack site: a bundle of static files served from a
          global edge CDN, with no database and no backend of our own. All of your work
          &mdash; the code you
          type, the questions you&rsquo;re on, your progress &mdash; lives only in your
          browser&rsquo;s memory and session storage.
        </p>

        <hr className="rule" />

        <h3>How your code runs</h3>
        <p>
          <strong>Java</strong> is compiled and run on <strong>OpenJDK&nbsp;25</strong> by{' '}
          <a href="https://onlinecompiler.io/" target="_blank" rel="noreferrer">
            OnlineCompiler.io
          </a>
          , a sandboxed code-execution service. When you press <em>Compile &amp; Run</em>, your
          source and any standard input are sent to a small server-side endpoint on this site,
          which forwards them to an isolated sandbox (512&nbsp;MB RAM, no network access,
          30-second limit) where they&rsquo;re compiled and executed, and the output is
          returned to the console panel.
        </p>
        <p>
          The execution service&rsquo;s secret key lives only on the server &mdash; it is never
          sent to your browser. Your code is sent only when you choose to run it.
        </p>
        <p>
          <strong>JavaScript</strong> playground code runs entirely on your device inside an
          isolated Web Worker, with a 3-second watchdog on the main thread that forcibly
          terminates any runaway loop so your browser never freezes.
        </p>
        <p>
          <strong>Run vs. Test.</strong> If your program has its own <code>main</code>
          (including the Java&nbsp;25 instance form <code>void main()</code> with{' '}
          <code>IO.println</code>), press <em>Compile&nbsp;&amp;&nbsp;Run</em>. For questions
          that only ask you to write a class, interface, or method &mdash; with no{' '}
          <code>main</code> of their own &mdash; press <em>Test</em>: it compiles your code
          together with a small driver that exercises it and prints results you can compare
          against the expected output.
        </p>

        <hr className="rule" />

        <h3>Privacy &amp; security</h3>
        <p>
          There are no accounts and no tracking. We never store authentication tokens or
          personal data. Session storage holds only your own draft code so an accidental reload
          doesn&rsquo;t lose your work; closing the tab clears it. Strict Content-Security-Policy,
          MIME-sniffing, and frame-protection headers are applied site-wide.
        </p>

        <hr className="rule" />

        <h3>A note on scope</h3>
        <p className="muted">
          The curriculum is authored as flat JSON files. Adding a new exam is as simple as
          dropping another file into <code>public/data/exams/</code> and listing its slug under
          a unit in <code>public/data/classes.json</code>. CS 18000 Midterm 2 ships with four
          full practice exams; Midterms 1, 3, and 4, plus the CS 240 / 182 / 251 classes, are
          scaffolded and ready for content.
        </p>
      </div>
    </div>
  );
}
