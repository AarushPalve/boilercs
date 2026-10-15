'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Self-contained code editor — zero external dependencies, same-origin only.
//
// Why not Monaco anymore:
//   @monaco-editor/react loads the engine + language workers from the jsDelivr
//   CDN as blob: scripts. On a CSP-locked static host (and when the CDN is
//   unreachable) that bootstrap can silently fail, leaving the editor blank.
//
// This component is a styled <textarea> with a synced line-number gutter and
// Tab/indent handling. It always loads, needs no network, and honors the
// Dark Academia theme. It is deliberately simple (no syntax tokenization),
// trading IntelliSense for guaranteed reliability — the right call for a
// stateless practice tool whose code is compiled by the in-browser JVM anyway.
// ---------------------------------------------------------------------------

export default function CodeEditor({
  value,
  onChange,
  height = 440,
}: {
  /** language is accepted for API compatibility; not used for tokenizing. */
  language?: string;
  value: string;
  onChange: (v: string) => void;
  height?: number | string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const recomputeLines = useCallback((text: string) => {
    const n = text.length === 0 ? 1 : text.split('\n').length;
    setLineCount(n);
  }, []);

  useEffect(() => {
    recomputeLines(value);
  }, [value, recomputeLines]);

  // Keep the gutter scrolled in lockstep with the textarea.
  const syncScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Tab inserts 4 spaces; Shift+Tab outdents; Enter preserves leading indent.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const { selectionStart, selectionEnd, value: v } = ta;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Outdent the current line by up to 4 leading spaces.
          const lineStart = v.lastIndexOf('\n', selectionStart - 1) + 1;
          const leading = v.slice(lineStart, lineStart + 4);
          const remove = leading.match(/^ {1,4}/)?.[0].length ?? 0;
          if (remove > 0) {
            const next = v.slice(0, lineStart) + v.slice(lineStart + remove);
            onChange(next);
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = Math.max(lineStart, selectionStart - remove);
            });
          }
          return;
        }
        const next = v.slice(0, selectionStart) + '    ' + v.slice(selectionEnd);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 4;
        });
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const lineStart = v.lastIndexOf('\n', selectionStart - 1) + 1;
        const indent = v.slice(lineStart).match(/^[ \t]*/)?.[0] ?? '';
        const insertion = '\n' + indent;
        const next = v.slice(0, selectionStart) + insertion + v.slice(selectionEnd);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + insertion.length;
        });
        return;
      }
    },
    [onChange],
  );

  // Match gutter height to textarea on mount.
  useLayoutEffect(() => {
    syncScroll();
  }, [syncScroll, lineCount]);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className="ce" style={{ height: heightStyle }}>
      <div className="ce__gutter" ref={gutterRef} aria-hidden>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="ce__lineno">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        id="boilercs-editor"
        name="boilercs-editor"
        aria-label="Code editor"
        className="ce__area"
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        onChange={(e) => {
          onChange(e.target.value);
          recomputeLines(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
      />
    </div>
  );
}
