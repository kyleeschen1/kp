import katex from "katex";

export function renderLatexToHtml(
  latex: string,
  options: { readonly displayMode?: boolean; readonly trust?: boolean } = {}
): string {
  return katex.renderToString(latex, {
    displayMode: options.displayMode ?? true,
    output: "html",
    trust: options.trust ?? false,
    throwOnError: false,
    ...(options.trust === true ? { strict: "ignore" as const } : {})
  });
}
