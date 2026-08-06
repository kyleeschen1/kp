import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderKpEconomicsDemandShiftInlineMarkdown(
  value: string
): string {
  const retainedReferences: Array<{
    readonly token: string;
    readonly html: string;
  }> = [];
  const source = value.replace(
    /\[\$([^$]+)\$\]\(kp-ref:([a-z0-9]+(?:-[a-z0-9]+)*)\)/g,
    (_match, latexSource: string, referenceId: string) => {
      const latex = latexSource.trim();
      const token = `\u{e000}${retainedReferences.length}\u{e001}`;
      retainedReferences.push({
        token,
        html: renderInlineMath(latex, referenceId)
      });
      return token;
    }
  );
  if (source.includes("kp-ref:")) {
    throw new Error(`Malformed semantic text reference in: ${value}`);
  }
  const parts = source.split("$");
  if (parts.length % 2 === 0) {
    throw new Error(`Unclosed inline math delimiter in: ${value}`);
  }
  let html = parts.map((part, index) => {
    if (index % 2 === 0) return escapeHtml(part);
    const latex = part.trim();
    return renderInlineMath(latex);
  }).join("");
  for (const reference of retainedReferences) {
    html = html.replaceAll(reference.token, reference.html);
  }
  return html;
}

function renderInlineMath(latex: string, referenceId?: string): string {
  return `<span class="kp-economics-tutorial__math" data-kp-latex="${escapeHtml(latex)}"${referenceId === undefined
    ? ""
    : ` data-kp-tutorial-text-reference="${referenceId}"`}>${renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  })}</span>`;
}
