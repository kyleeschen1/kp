import type { Inspection } from "./argument.ts";
import { prepareColumnFonts } from "./fonts.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

/** The reading loads no material compositor until a reader asks to inspect.
 * Loading a module is not permission to mount: the document handoff decides
 * whether this result is still wanted after fonts/imports have completed. */
export async function prepareInspection(item: Inspection) {
  if (item.kind === "columns") {
    const [{ mountColumnPlayer }, { columnCardHtml }, { calculationLatex }] = await Promise.all([
      import("./player.ts"), import("./view.ts"), import("./presentation.ts"), prepareColumnFonts()
    ]);
    return {
      html: columnCardHtml(item.scene) + `<details><summary>Read the calculation</summary><div class="comb-static">${renderLatexToHtml(calculationLatex(item.scene), { output: "htmlAndMathml" })}</div></details>`,
      mount: (root: HTMLElement, progress: number, settled: (progress: number) => void) => mountColumnPlayer(root, item.scene, progress, settled)
    };
  }
  const [{ comparisonCardHtml, mountComparisonPlayer }, { comparisonStatic }] = await Promise.all([
    import("./comparison-player.ts"), import("./comparison-view.ts"), prepareColumnFonts(), document.fonts.load("italic 20px KaTeX_Math")
  ]);
  return {
    html: comparisonCardHtml(item.source) + `<details><summary>Read the complete comparison</summary><div class="comparison-static">${comparisonStatic(item.source.relation)}</div></details>`,
    mount: (root: HTMLElement, progress: number, settled: (progress: number) => void) => mountComparisonPlayer(root, item.source, progress, settled)
  };
}
