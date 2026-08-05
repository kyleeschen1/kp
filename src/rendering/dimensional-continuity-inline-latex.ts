import { renderLatexToHtml } from "./katex-adapter.ts";

const inlineLatexHtmlCache = new Map<string, string>();
const inlineLatexHtmlCacheLimit = 512;

export function renderKpDimensionalContinuityInlineLatex(latex: string): string {
  const cached = inlineLatexHtmlCache.get(latex);
  if (cached !== undefined) return cached;
  const html = renderLatexToHtml(latex, { displayMode: false });
  if (inlineLatexHtmlCache.size >= inlineLatexHtmlCacheLimit) {
    inlineLatexHtmlCache.delete(inlineLatexHtmlCache.keys().next().value ?? "");
  }
  inlineLatexHtmlCache.set(latex, html);
  return html;
}
