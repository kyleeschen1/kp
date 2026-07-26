import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export interface KpExponentRadicalSelectorState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export interface KpExponentRadicalSelectorAnnotatedLatex
  extends KpSelectorAnnotatedLatex {
  readonly structuralSelectorIds: readonly string[];
}

const structuralSuffixes = new Set([
  "exponent-fraction-line",
  "radical-hook",
  "radical-overbar"
]);

/**
 * Pure shared projection for editor, experiment, and reader consumers. KaTeX
 * produces fraction/radical structure, so those selector IDs are returned for
 * post-render DOM binding rather than encoded as fake semantic glyph spans.
 */
export function createKpExponentRadicalSelectorAnnotatedLatex(
  state: KpExponentRadicalSelectorState
): KpExponentRadicalSelectorAnnotatedLatex | undefined {
  const exponent = state.objectId.startsWith("expression.generated.exponent.");
  const radical = state.objectId.startsWith("expression.generated.radical.");
  if (!exponent && !radical) return undefined;

  const structuralSelectors = state.selectors.filter(
    (selector) => structuralSuffixes.has(suffix(state, selector.id))
  );
  const semanticSelectors = state.selectors.filter(
    (selector) => !structuralSuffixes.has(suffix(state, selector.id))
  );
  const bySuffix = new Map(
    semanticSelectors.map((selector) => [suffix(state, selector.id), selector])
  );
  const segment = (name: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(name);
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`${state.objectId} is missing labeled selector ${name}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: selector.label };
  };

  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  if (state.objectId.endsWith(".initial")) {
    segments = [
      segment("base"),
      { kind: "latex", latex: "^{" },
      segment("exponent"),
      { kind: "latex", latex: "}" }
    ];
  } else if (state.objectId.endsWith(".lowered")) {
    segments = [
      segment("factor-1"), gap(), segment("times-1"), gap(),
      segment("residual-base"),
      { kind: "latex", latex: "^{" },
      segment("residual-exponent"),
      { kind: "latex", latex: "}" }
    ];
  } else if (state.objectId.endsWith(".expanded")) {
    segments = state.selectors.flatMap((selector, index) => [
      ...(index === 0 ? [] : [gap()]),
      segment(suffix(state, selector.id))
    ]);
  } else if (state.objectId.endsWith(".power")) {
    segments = [
      segment("base"),
      { kind: "latex", latex: "^{\\frac{" },
      segment("exponent-numerator"),
      { kind: "latex", latex: "}{" },
      segment("exponent-denominator"),
      { kind: "latex", latex: "}}" }
    ];
  } else if (state.objectId.endsWith(".radical")) {
    const rootIndex = bySuffix.get("root-index");
    const radicandExponent = bySuffix.get("radicand-exponent");
    segments = [
      { kind: "latex", latex: rootIndex === undefined ? "\\sqrt{" : "\\sqrt[" },
      ...(rootIndex === undefined
        ? []
        : [segment("root-index"), { kind: "latex" as const, latex: "]{" }]),
      segment("radicand"),
      ...(radicandExponent === undefined
        ? []
        : [
            { kind: "latex" as const, latex: "^{" },
            segment("radicand-exponent"),
            { kind: "latex" as const, latex: "}" }
          ]),
      { kind: "latex", latex: "}" }
    ];
  } else {
    return undefined;
  }

  const annotated = createKpSelectorAnnotatedLatex({
    id: `exponent-radical.${state.objectId}`,
    expectedSelectorIds: semanticSelectors.map((selector) => selector.id),
    segments
  });
  return {
    ...annotated,
    structuralSelectorIds: structuralSelectors.map(({ id }) => id)
  };
}

function suffix(
  state: KpExponentRadicalSelectorState,
  selectorId: string
): string {
  return selectorId.slice(state.objectId.length + 1);
}

function gap(): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: "\\;" };
}
