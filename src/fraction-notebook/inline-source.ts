import { renderLatexToHtml } from '../rendering/katex-adapter.ts';
import { FractionNotebookGap } from './json.ts';
import type { Inline, InlineObject } from './types.ts';

export type InlinePresentation = { readonly kind: 'link'; readonly label: string; readonly href: string }
  | { readonly kind: 'math'; readonly latex: string; readonly html: string };
export function presentInline(kind: InlineObject['type'], source: string): InlinePresentation {
  if (kind === 'link') {
    const match = /^\[([^\]\n]+)\]\(([^\s<>\n]+)\)$/.exec(source);
    if (!match) throw new FractionNotebookGap('Use [label](destination) for this link.');
    const label = match[1]!, href = match[2]!;
    if (/[\u0000-\u0020\\]/.test(href) || href.startsWith('//')) throw new FractionNotebookGap('Use a web address, email address, or local article path.');
    const url = new URL(href, 'https://notebook.invalid/');
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) throw new FractionNotebookGap('Links support http, https, mailto and local article paths.');
    return { kind: 'link', label, href };
  }
  const match = /^\$([^\n]+)\$$/.exec(source);
  if (!match || /(?<!\\)\$/.test(match[1]!)) throw new FractionNotebookGap('Use a single pair of $ delimiters for inline mathematics.');
  const latex = match[1]!;
  // This is static inline presentation, not an equation operation or motion.
  return { kind: 'math', latex, html: renderLatexToHtml(latex, { displayMode: false, output: 'htmlAndMathml', trust: false, throwOnError: true }) };
}
export function projectionText(content: readonly Inline[]): string {
  return content.map(item => {
    if (item.type === 'text') return item.text;
    const rendered = presentInline(item.type, item.source);
    return rendered.kind === 'link' ? rendered.label : rendered.latex;
  }).join('');
}
export function renderInlineObject(item: InlineObject): HTMLElement {
  const value = presentInline(item.type, item.source), el = document.createElement(value.kind === 'link' ? 'a' : 'span');
  el.dataset['notebookCell'] = item.id; el.id = item.id;
  if (value.kind === 'math') { el.className = 'fn-inline-math'; el.innerHTML = value.html; }
  else { el.textContent = value.label; el.setAttribute('href', value.href); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
  return el;
}
