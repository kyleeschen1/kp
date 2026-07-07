import katex from "katex";

export function renderLatexToHtml(latex: string): string {
  return katex.renderToString(latex, {
    displayMode: true,
    output: "html",
    throwOnError: false
  });
}
