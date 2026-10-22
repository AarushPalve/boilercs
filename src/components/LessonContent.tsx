'use client';

import { useMemo } from 'react';
import Markdown from './Markdown';
import RunnableSnippet from './RunnableSnippet';

interface Props {
  /** Raw markdown body of the lesson. */
  body: string;
  /** Course language — lesson code blocks default to this. */
  language: 'java' | 'javascript';
}

type Segment =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; lang: string; code: string };

/**
 * Split a markdown document into prose runs and fenced code blocks so the code
 * can be rendered as an interactive, runnable editor while the surrounding
 * prose keeps its normal markdown rendering.
 */
function splitSegments(md: string): Segment[] {
  const lines = md.split('\n');
  const segments: Segment[] = [];
  let prose: string[] = [];

  const flushProse = () => {
    if (prose.length > 0) {
      const text = prose.join('\n').trim();
      if (text) segments.push({ kind: 'prose', text });
      prose = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const fence = lines[i].match(/^```(\w*)\s*$/);
    if (fence) {
      flushProse();
      const lang = (fence[1] || '').toLowerCase();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      segments.push({ kind: 'code', lang, code: buf.join('\n') });
      continue;
    }
    prose.push(lines[i]);
    i++;
  }
  flushProse();
  return segments;
}

/** Which fenced languages should become runnable editors. */
function isRunnableLang(lang: string, fallback: 'java' | 'javascript'): 'java' | 'javascript' | null {
  if (lang === 'java') return 'java';
  if (lang === 'javascript' || lang === 'js') return 'javascript';
  // Unlabeled fences default to the course language (lesson code is in that language).
  if (lang === '') return fallback;
  return null;
}

const JAVA_MAIN_RE = /\bvoid\s+main\s*\(/;
const JAVA_TYPE_RE = /\b(?:public\s+|final\s+|abstract\s+)*(?:class|interface|enum|record)\s+[A-Za-z_]\w*/;

/**
 * Turn a lesson Java snippet into a complete, runnable program:
 *  - Already has a `main` -> use as-is.
 *  - Declares types but no `main` -> append an editable `Main` with a demo
 *    `main`, so the learner can instantiate the just-defined classes and run.
 *  - Loose statements (no type, no main) -> wrap the statements in a `main`.
 */
function prepareJava(code: string): string {
  if (JAVA_MAIN_RE.test(code)) return code;

  if (JAVA_TYPE_RE.test(code)) {
    // Prepend a runnable `Main` so the proxy detects it as the entry class
    // (it keys off the first class declaration in the file). The learner can
    // edit this main to exercise the classes defined below.
    return (
      '// A runnable entry point — edit this to try the classes below.\n' +
      'public class Main {\n' +
      '    public static void main(String[] args) {\n' +
      '        // e.g. create an object and print something:\n' +
      '        // System.out.println("Hello from the lesson!");\n' +
      '    }\n' +
      '}\n\n' +
      code.trimStart()
    );
  }

  // Loose statements: indent and wrap in a main.
  const indented = code
    .split('\n')
    .map((l) => (l.length ? '        ' + l : l))
    .join('\n');
  return (
    'public class Main {\n' +
    '    public static void main(String[] args) throws Exception {\n' +
    indented +
    '\n    }\n' +
    '}\n'
  );
}

export default function LessonContent({ body, language }: Props) {
  const segments = useMemo(() => splitSegments(body), [body]);

  return (
    <div className="lesson-body md">
      {segments.map((seg, idx) => {
        if (seg.kind === 'prose') {
          return <Markdown key={idx} source={seg.text} />;
        }
        const runLang = isRunnableLang(seg.lang, language);
        if (runLang === 'java') {
          return <RunnableSnippet key={idx} initialCode={prepareJava(seg.code)} language="java" />;
        }
        if (runLang === 'javascript') {
          return <RunnableSnippet key={idx} initialCode={seg.code} language="javascript" />;
        }
        // Non-runnable fenced block (e.g. console/plain text): static preview.
        return (
          <pre key={idx} className="md-code">
            <code>{seg.code}</code>
          </pre>
        );
      })}
    </div>
  );
}
