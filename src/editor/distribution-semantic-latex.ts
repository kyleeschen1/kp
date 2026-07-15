import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface DistributionState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpDistributionSelectorAnnotatedLatex(
  state: DistributionState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith("expression.generated.distribution.")) {
    return undefined;
  }
  const bySuffix = new Map(
    state.selectors.map((selector) => [selector.id.slice(state.objectId.length + 1), selector])
  );
  const segment = (suffix: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(suffix);
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`Distribution state ${state.objectId} is missing labeled selector ${suffix}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: selector.label };
  };
  const segments = state.objectId.endsWith(".factored")
    ? [
        segment("factor"),
        segment("left-paren"),
        segment("left-term"),
        segment("plus"),
        segment("right-term"),
        segment("right-paren")
      ]
    : state.objectId.endsWith(".expanded")
      ? [
          segment("left-factor"),
          segment("left-term"),
          { kind: "latex" as const, latex: "\\;" },
          segment("plus"),
          { kind: "latex" as const, latex: "\\;" },
          segment("right-factor"),
          segment("right-term")
        ]
      : undefined;
  if (segments === undefined) return undefined;

  return createKpSelectorAnnotatedLatex({
    id: `distribution.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
}
