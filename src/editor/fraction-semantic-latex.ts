import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface FractionSelector {
  readonly id: string;
  readonly semanticKind?: string | undefined;
  readonly kind?: string | undefined;
  readonly label?: string | undefined;
}

interface FractionState {
  readonly objectId: string;
  readonly selectors: readonly FractionSelector[];
}

export function createKpFractionSelectorAnnotatedLatex(
  state: FractionState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith("expression.generated.fraction-expression.")) {
    return undefined;
  }
  const semanticSelectors = state.selectors.filter((selector) => !isArtifact(selector));
  const bySuffix = new Map(
    semanticSelectors.map((selector) => [selector.id.slice(state.objectId.length + 1), selector])
  );
  const segment = (suffix: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(suffix);
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`Fraction state ${state.objectId} is missing labeled selector ${suffix}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: selector.label };
  };

  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  if (state.objectId.endsWith(".initial")) {
    segments = fraction(segment("numerator"), segment("denominator"));
  } else if (state.objectId.endsWith(".factored")) {
    segments = fraction(
      product(segment("base-numerator"), segment("numerator-times"), segment("common-numerator-factor")),
      product(segment("base-denominator"), segment("denominator-times"), segment("common-denominator-factor"))
    );
  } else if (state.objectId.endsWith(".common-factor")) {
    segments = [
      ...fraction(segment("base-numerator"), segment("base-denominator")),
      { kind: "latex", latex: "\\;" },
      segment("times"),
      { kind: "latex", latex: "\\;" },
      ...fraction(segment("unit-numerator"), segment("unit-denominator"))
    ];
  } else if (state.objectId.endsWith(".simplified")) {
    segments = fraction(segment("numerator"), segment("denominator"));
  } else {
    return undefined;
  }

  return createKpSelectorAnnotatedLatex({
    id: `fraction.${state.objectId}`,
    expectedSelectorIds: semanticSelectors.map((selector) => selector.id),
    segments
  });
}

export function bindKpFractionStructuralMotionIds(input: {
  readonly root: HTMLElement;
  readonly states: readonly FractionState[];
}): Readonly<Record<string, string>> {
  const motionIds: Record<string, string> = {};
  for (const state of input.states) {
    const object = input.root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    if (object === null) continue;
    const bars = [...object.querySelectorAll<HTMLElement>(".frac-line")];
    const artifacts = state.selectors.filter(isArtifact);
    artifacts.forEach((selector, index) => {
      const bar = bars[index];
      if (bar === undefined) return;
      // Fraction bars are KaTeX-owned geometry rather than authored text spans.
      const motionId = `fraction.${state.objectId}.${selector.id}`;
      bar.dataset["kpMotionId"] = motionId;
      motionIds[selector.id] = motionId;
    });
  }
  return motionIds;
}

function isArtifact(selector: FractionSelector): boolean {
  return (selector.semanticKind ?? selector.kind) === "artifact";
}

function fraction(
  numerator: KpSelectorAnnotatedLatexSegment | readonly KpSelectorAnnotatedLatexSegment[],
  denominator: KpSelectorAnnotatedLatexSegment | readonly KpSelectorAnnotatedLatexSegment[]
): readonly KpSelectorAnnotatedLatexSegment[] {
  return [
    { kind: "latex", latex: "\\frac{" },
    ...asSegments(numerator),
    { kind: "latex", latex: "}{" },
    ...asSegments(denominator),
    { kind: "latex", latex: "}" }
  ];
}

function product(
  left: KpSelectorAnnotatedLatexSegment,
  operator: KpSelectorAnnotatedLatexSegment,
  right: KpSelectorAnnotatedLatexSegment
): readonly KpSelectorAnnotatedLatexSegment[] {
  return [left, { kind: "latex", latex: "\\;" }, operator, { kind: "latex", latex: "\\;" }, right];
}

function asSegments(
  value: KpSelectorAnnotatedLatexSegment | readonly KpSelectorAnnotatedLatexSegment[]
): readonly KpSelectorAnnotatedLatexSegment[] {
  return Array.isArray(value) ? value : [value as KpSelectorAnnotatedLatexSegment];
}
