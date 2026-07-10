import type { EquationAnimationId } from "../editor/equation-animation-catalog.ts";

export interface KpEquationAnimationSelection {
  readonly id: EquationAnimationId;
  readonly label: string;
  readonly summary: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly tags: readonly string[];
  readonly fixtureId?: string | undefined;
  readonly defaultDurationMs: number;
}

export const kpEquationAnimationManifest: readonly KpEquationAnimationSelection[] = [
  {
    id: "linear-equation-solve-x",
    label: "x + 3 = 7",
    summary: "Subtract from both sides, cancel, and simplify.",
    sourceLatex: "x + 3 = 7",
    targetLatex: "x = 4",
    tags: ["algebra", "equation", "cancelation", "simplification"],
    defaultDurationMs: 1200
  },
  {
    id: "fixture-fraction-make-inline-to-stacked",
    label: "Inline fraction to stacked",
    summary:
      "Inline slash notation becomes a stacked fraction; the fraction bar is a target-only render artifact.",
    sourceLatex: "x / 3",
    targetLatex: "\\frac{x}{3}",
    tags: ["katex", "fraction", "notation-transform"],
    fixtureId: "fraction.make.inline-to-stacked",
    defaultDurationMs: 1200
  },
  {
    id: "fixture-radical-rewrite-power-as-root",
    label: "Power to radical",
    summary: "A fractional exponent is rewritten as a radical notation form.",
    sourceLatex: "x^{1/2}",
    targetLatex: "\\sqrt{x}",
    tags: ["katex", "radical", "notation-transform"],
    fixtureId: "radical.rewrite-power-as-root",
    defaultDurationMs: 1200
  },
  {
    id: "fixture-wrapper-function-wrap",
    label: "Wrap with function",
    summary: "A semantic expression is wrapped with a function-call notation shell.",
    sourceLatex: "x",
    targetLatex: "f(x)",
    tags: ["katex", "wrapper", "function", "notation-transform"],
    fixtureId: "wrapper.function.wrap",
    defaultDurationMs: 1200
  },
  {
    id: "fixture-script-combine-factor-as-power",
    label: "Repeated factor to exponent",
    summary: "Repeated multiplication is rewritten as exponent notation.",
    sourceLatex: "x \\cdot x",
    targetLatex: "x^2",
    tags: ["katex", "script", "exponent", "notation-transform"],
    fixtureId: "script.combine-factor-as-power",
    defaultDurationMs: 1200
  },
  {
    id: "fixture-matrix-bracket-change-delimiter",
    label: "Matrix bracket swap",
    summary: "A matrix changes delimiter notation while preserving entries.",
    sourceLatex: "\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}",
    targetLatex: "\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}",
    tags: ["katex", "matrix", "delimiter", "notation-transform"],
    fixtureId: "matrix.bracket.change-delimiter",
    defaultDurationMs: 1200
  }
];

export function listKpEquationAnimationSelections(): readonly KpEquationAnimationSelection[] {
  return kpEquationAnimationManifest;
}

export function findKpEquationAnimationSelection(
  id: string
): KpEquationAnimationSelection | undefined {
  return kpEquationAnimationManifest.find((selection) => selection.id === id);
}

