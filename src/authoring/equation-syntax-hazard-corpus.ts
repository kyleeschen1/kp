export const KP_EQUATION_SYNTAX_HAZARD_CORPUS_SCHEMA =
  "kp.equation-syntax-hazard-corpus.v1" as const;

export type KpEquationSyntaxHazardDisposition =
  | "normalized"
  | "typed-gap";

export type KpEquationSyntaxHazardMeaning =
  | "function-power"
  | "inverse-function"
  | "reciprocal-function"
  | "principal-square-root"
  | "indexed-root"
  | "absolute-value"
  | "piecewise-form"
  | "binder-limits"
  | "derivative-notation"
  | "differential-notation"
  | "integral-notation"
  | "one-sided-limit";

export interface KpEquationSyntaxHazardCase {
  readonly id: string;
  readonly latex: string;
  readonly meaning: KpEquationSyntaxHazardMeaning;
  readonly disposition: KpEquationSyntaxHazardDisposition;
  readonly rationale: string;
}

export interface KpEquationSyntaxHazardCorpus {
  readonly schemaVersion: typeof KP_EQUATION_SYNTAX_HAZARD_CORPUS_SCHEMA;
  readonly kind: "equation-syntax-hazard-corpus";
  readonly id: string;
  readonly cases: readonly KpEquationSyntaxHazardCase[];
}

/**
 * These cases define where syntax is safe to normalize and where KP must ask
 * for a bounded parser extension. They are not examples for a model to guess
 * from: neighboring spellings intentionally have different meanings.
 */
export const kpEquationSyntaxHazardCorpus = defineCorpus({
  schemaVersion: KP_EQUATION_SYNTAX_HAZARD_CORPUS_SCHEMA,
  kind: "equation-syntax-hazard-corpus",
  id: "corpus.equation.syntax-hazards.calculus-bc.v1",
  cases: [
    hazard("syntax-hazard.trig.function-power", "\\sin^2(x)",
      "function-power", "typed-gap",
      "The superscript applies to the function value, not to the function name as an inverse marker."),
    hazard("syntax-hazard.trig.inverse-sine", "\\sin^{-1}(x)",
      "inverse-function", "typed-gap",
      "Inverse sine must never be inferred as a reciprocal from the shared superscript glyph."),
    hazard("syntax-hazard.trig.reciprocal-sine", "\\frac{1}{\\sin(x)}",
      "reciprocal-function", "normalized",
      "An explicit fraction is structurally a reciprocal even before a cosecant rewrite is licensed."),
    hazard("syntax-hazard.function.inverse", "f^{-1}(x)",
      "inverse-function", "typed-gap",
      "Function inversion requires application-aware syntax rather than a numeric power parse."),
    hazard("syntax-hazard.root.principal-square", "\\sqrt{x}",
      "principal-square-root", "normalized",
      "The current bounded parser represents a principal square-root application."),
    hazard("syntax-hazard.root.indexed", "\\sqrt[3]{x}",
      "indexed-root", "typed-gap",
      "An indexed radical needs an explicit index role before normalization."),
    hazard("syntax-hazard.absolute-value.delimiters", "\\lvert x \\rvert",
      "absolute-value", "typed-gap",
      "Absolute-value delimiters must become a semantic enclosure, not two decorative bars."),
    hazard("syntax-hazard.piecewise.cases", "f(x)=\\begin{cases}x&x>0\\\\-x&x\\le0\\end{cases}",
      "piecewise-form", "typed-gap",
      "Case bodies and predicates need branch identity and ordered condition roles."),
    hazard("syntax-hazard.binder.sum-limits", "\\sum_{n=1}^{N}a_n",
      "binder-limits", "typed-gap",
      "A summation binder must preserve bound-variable scope and both limits."),
    hazard("syntax-hazard.derivative.leibniz", "\\frac{d}{dx}(x^2)",
      "derivative-notation", "typed-gap",
      "Leibniz notation is an operator application, not an ordinary quotient followed by implicit multiplication."),
    hazard("syntax-hazard.differential.dx", "dy=x\\,dx",
      "differential-notation", "typed-gap",
      "Differentials need dedicated roles before separation or integration can be licensed."),
    hazard("syntax-hazard.integral.definite", "\\int_{0}^{1}x^2\\,dx",
      "integral-notation", "typed-gap",
      "The integral body, bounds, and differential must retain distinct binder roles."),
    hazard("syntax-hazard.limit.one-sided", "\\lim_{x\\to0^+}f(x)",
      "one-sided-limit", "typed-gap",
      "The approach side is mathematical evidence and cannot be discarded as superscript decoration.")
  ]
});

export function defineCorpus(
  value: KpEquationSyntaxHazardCorpus
): KpEquationSyntaxHazardCorpus {
  const ids = new Set<string>();
  for (const entry of value.cases) {
    if (ids.has(entry.id)) throw new Error(`Duplicate syntax hazard ${entry.id}.`);
    if (entry.latex.trim().length === 0) {
      throw new Error(`Syntax hazard ${entry.id} requires LaTeX.`);
    }
    ids.add(entry.id);
  }
  return Object.freeze({
    ...value,
    cases: Object.freeze(value.cases.map((entry) => Object.freeze({ ...entry })))
  });
}

function hazard(
  id: string,
  latex: string,
  meaning: KpEquationSyntaxHazardMeaning,
  disposition: KpEquationSyntaxHazardDisposition,
  rationale: string
): KpEquationSyntaxHazardCase {
  return Object.freeze({ id, latex, meaning, disposition, rationale });
}
