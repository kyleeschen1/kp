const kpEditorKatexFontProbes = Object.freeze([
  Object.freeze({ descriptor: "400 1em KaTeX_Main", sample: "0123456789+=()" }),
  Object.freeze({ descriptor: "700 1em KaTeX_Main", sample: "0123456789" }),
  Object.freeze({ descriptor: "italic 400 1em KaTeX_Math", sample: "xyv" }),
  Object.freeze({ descriptor: "400 1em KaTeX_Size1", sample: "()[]" }),
  Object.freeze({ descriptor: "400 1em KaTeX_Size2", sample: "()[]" }),
  Object.freeze({ descriptor: "400 1em KaTeX_AMS", sample: "ℝ" })
]);

let pending: Promise<void> | undefined;

/**
 * Lazy surface CSS declares KaTeX fonts before the selected stage is mounted.
 * Load the families used by catalogue equations and labels at that boundary so
 * the first visible frame never measures fallback glyphs and then reflows.
 */
export function prepareKpEditorKatexFonts(): Promise<void> {
  if (typeof document === "undefined" || document.fonts === undefined) {
    return Promise.resolve();
  }
  return pending ??= Promise.all(kpEditorKatexFontProbes.map(({
    descriptor,
    sample
  }) =>
    document.fonts.load(descriptor, sample)
  )).then(() => undefined);
}
