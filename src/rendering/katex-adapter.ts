import katex from "katex";
import type { KpSelectorAnnotatedLatex } from "./selector-annotated-latex.ts";

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

export function renderSelectorAnnotatedLatexToHtml(
  annotated: KpSelectorAnnotatedLatex,
  options: { readonly displayMode?: boolean } = {}
): string {
  // Trust is confined to annotations produced by KP's validated contract;
  // authored segments cannot contain KaTeX HTML or URL commands.
  return renderLatexToHtml(annotated.annotatedLatex, {
    ...(options.displayMode === undefined ? {} : { displayMode: options.displayMode }),
    trust: true
  });
}
