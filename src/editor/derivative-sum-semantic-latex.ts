import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface DerivativeSumState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpDerivativeSumSelectorAnnotatedLatex(
  state: DerivativeSumState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith(
    "expression.generated.calculus.derivative.sum-rule-"
  )) {
    return undefined;
  }
  const bySuffix = new Map(state.selectors.map((selector) => [
    selector.id.slice(state.objectId.length + 1),
    selector
  ]));
  const segment = (
    suffix: string,
    latex?: string
  ): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(suffix);
    const rendered = latex ?? selector?.label;
    if (selector === undefined || rendered === undefined) {
      throw new Error(`${state.objectId} is missing derivative-sum role ${suffix}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: rendered };
  };
  const termCount = [...bySuffix.keys()].filter((suffix) =>
    /^(?:derived\.)?term\.\d+$/.test(suffix)
  ).length;
  const connector = (index: number): readonly KpSelectorAnnotatedLatexSegment[] => [
    { kind: "latex", latex: " " },
    segment(`connector.${index}`),
    { kind: "latex", latex: " " }
  ];
  const derivative = (suffix: string): KpSelectorAnnotatedLatexSegment => {
    const label = bySuffix.get(suffix)?.label;
    const match = /^d\/d(.+)$/.exec(label ?? "");
    if (match === null) {
      throw new Error(`${state.objectId} has invalid derivative label ${label}.`);
    }
    return segment(suffix, `\\frac{d}{d${match[1]}}`);
  };
  const initial = state.objectId.endsWith(".initial");
  const distributed = state.objectId.endsWith(".distributed");
  const target = state.objectId.endsWith(".derived");
  if (!initial && !distributed && !target) return undefined;

  const segments: KpSelectorAnnotatedLatexSegment[] = [];
  if (initial) {
    segments.push(
      derivative("operator"),
      { kind: "latex", latex: "(" }
    );
  }
  for (let index = 0; index < termCount; index += 1) {
    if (index > 0) segments.push(...connector(index - 1));
    if (distributed) {
      segments.push(derivative(`operator.${index}`));
    }
    segments.push(segment(`${target ? "derived." : ""}term.${index}`));
  }
  if (initial) segments.push({ kind: "latex", latex: ")" });

  return createKpSelectorAnnotatedLatex({
    id: `derivative-sum.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
}
