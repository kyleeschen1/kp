import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface DerivativePowerState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpDerivativePowerSelectorAnnotatedLatex(
  state: DerivativePowerState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith(
    "expression.generated.calculus.derivative.power-rule-"
  )) {
    return undefined;
  }
  const bySuffix = new Map(state.selectors.map((selector) => [
    selector.id.slice(state.objectId.length + 1),
    selector
  ]));
  const segment = (
    name: string,
    latex?: string
  ): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(name);
    const rendered = latex ?? selector?.label;
    if (selector === undefined || rendered === undefined) {
      throw new Error(`${state.objectId} is missing derivative role ${name}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: rendered };
  };
  const source = state.objectId.endsWith(".initial");
  const applied = state.objectId.endsWith(".applied");
  const target = state.objectId.endsWith(".derived");
  if (!source && !applied && !target) return undefined;

  const segments: readonly KpSelectorAnnotatedLatexSegment[] = source
    ? [
        { kind: "latex", latex: "\\frac{" },
        segment("operator", "d"),
        { kind: "latex", latex: "}{d" },
        segment("operator-variable"),
        { kind: "latex", latex: "}" },
        segment("base"),
        { kind: "latex", latex: "^{" },
        segment("exponent"),
        { kind: "latex", latex: "}" }
      ]
    : applied
    ? [
        segment("coefficient"),
        segment("base"),
        { kind: "latex", latex: "^{" },
        segment("exponent"),
        segment("decrement-operator"),
        segment("decrement-amount"),
        { kind: "latex", latex: "}" }
      ]
    : [
        segment("coefficient"),
        segment("base"),
        { kind: "latex", latex: "^{" },
        segment("exponent"),
        { kind: "latex", latex: "}" }
      ];
  const annotated = createKpSelectorAnnotatedLatex({
    id: `derivative-power.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
  if (!source) return annotated;
  const baseMotionId = annotated.annotations.find(
    (annotation) => annotation.selectorId === bySuffix.get("base")?.id
  )?.motionId;
  const operandStart = baseMotionId === undefined
    ? -1
    : annotated.annotatedLatex.indexOf(
        `\\htmlData{kp-motion-id=${baseMotionId}}`
      );
  if (operandStart < 0) {
    throw new Error(`${state.objectId} cannot isolate its derivative operator.`);
  }
  // The semantic operator and variable remain individually addressable, while
  // this renderer-owned wrapper keeps the fraction rule and denominator d in
  // the same visual lifecycle as the notation they structurally complete.
  const operatorApplicationId = `${annotated.id}.operator-application`;
  return {
    ...annotated,
    annotatedLatex:
      `\\htmlData{kp-derivative-operator-application=${operatorApplicationId}}{` +
      `${annotated.annotatedLatex.slice(0, operandStart)}}` +
      annotated.annotatedLatex.slice(operandStart)
  };
}
