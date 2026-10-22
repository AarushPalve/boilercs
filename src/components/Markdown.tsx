'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

// ---------------------------------------------------------------------------
// Minimal, dependency-light markdown -> HTML for question prompts.
// Supports: headings, bold, inline code, fenced code blocks, unordered lists,
// and paragraphs. All output is sanitized with DOMPurify before rendering
// (security spec: run descriptions through an active sanitizer; never render
// untrusted text as raw HTML). Prompt text is authored by us, but we sanitize
// defensively regardless.
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(s: string): string {
  // escape first, then re-introduce the handful of inline tags we support.
  let out = escapeHtml(s);
  // inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // emphasis
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return out;
}

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;
  let inList = false;
  let inOList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };
  const closeOList = () => {
    if (inOList) {
      html.push('</ol>');
      inOList = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      closeList();
      closeOList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      html.push(`<pre class="md-code"><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      closeOList();
      const level = h[1].length;
      html.push(`<h${level}>${inlineFormat(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // ordered list item (e.g. "1. text")
    const oli = line.match(/^\s*\d+\.\s+(.*)$/);
    if (oli) {
      closeList();
      if (!inOList) {
        html.push('<ol>');
        inOList = true;
      }
      html.push(`<li>${inlineFormat(oli[1])}</li>`);
      i++;
      continue;
    }

    // unordered list item (support nested indent as plain items)
    const li = line.match(/^\s*[*-]\s+(.*)$/);
    if (li) {
      closeOList();
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inlineFormat(li[1])}</li>`);
      i++;
      continue;
    }

    // blank line
    if (line.trim() === '') {
      closeList();
      closeOList();
      i++;
      continue;
    }

    // paragraph
    closeList();
    closeOList();
    html.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }
  closeList();
  closeOList();
  return html.join('\n');
}

export default function Markdown({ source }: { source: string }) {
  const clean = useMemo(() => {
    const rendered = renderMarkdown(source);
    // DOMPurify requires a DOM; guard for SSR safety.
    if (typeof window === 'undefined') return rendered;
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'br',
      ],
      ALLOWED_ATTR: ['class'],
    });
  }, [source]);

  return <div className="md" dangerouslySetInnerHTML={{ __html: clean }} />;
}
