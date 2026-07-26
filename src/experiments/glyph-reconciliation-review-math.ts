import katex from "katex";

export function createKpGlyphReviewMathRenderer(root: HTMLElement): {
  readonly math: (latex: string) => string;
  readonly renderMathSlots: (slot: string, html: string) => void;
  readonly trustedMath: (latex: string) => string;
} {
  return {
    math: (latex) => katex.renderToString(latex, { throwOnError: true }),
    renderMathSlots(slot, html) {
      const elements = root.querySelectorAll<HTMLElement>(
        `[data-math-slot="${slot}"]`
      );
      if (elements.length === 0) {
        throw new Error(`Glyph experiment math slot ${slot} is missing.`);
      }
      elements.forEach((element) => {
        element.innerHTML = html;
      });
    },
    trustedMath: (latex) => katex.renderToString(latex, {
      throwOnError: true,
      strict: false,
      trust: (context) => context.command === "\\htmlData"
    })
  };
}
