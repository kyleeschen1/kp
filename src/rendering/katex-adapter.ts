import katex from "katex";

export function renderLatexToHtml(
  latex: string,
  options: { readonly displayMode?: boolean } = {}
): string {
  return katex.renderToString(latex, {
    displayMode: options.displayMode ?? true,
    output: "html",
    throwOnError: false
  });
}
