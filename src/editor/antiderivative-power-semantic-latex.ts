import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface AntiderivativePowerState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpAntiderivativePowerSelectorAnnotatedLatex(
  state: AntiderivativePowerState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith(
    "expression.generated.calculus.integral.power-rule-"
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
      throw new Error(`${state.objectId} is missing antiderivative role ${suffix}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: rendered };
  };
  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  if (state.objectId.endsWith(".initial")) {
    segments = [
      segment("operator", "\\int"),
      { kind: "latex", latex: " " },
      segment("coefficient"),
      segment("base"),
      { kind: "latex", latex: "^{" },
      segment("exponent"),
      { kind: "latex", latex: "}\\," },
      segment("differential")
    ];
  } else if (state.objectId.endsWith(".expanded")) {
    segments = [
      { kind: "latex", latex: "\\frac{" },
      segment("numerator-coefficient"),
      { kind: "latex", latex: "}{" },
      segment("denominator-exponent"),
      { kind: "latex", latex: "+" },
      segment("denominator-increment"),
      { kind: "latex", latex: "}" },
      segment("base"),
      { kind: "latex", latex: "^{" },
      segment("power-exponent"),
      { kind: "latex", latex: "+" },
      segment("power-increment"),
      { kind: "latex", latex: "}" }
    ];
  } else if (state.objectId.endsWith(".integrated")) {
    segments = [
      segment("coefficient"),
      segment("base"),
      { kind: "latex", latex: "^{" },
      segment("exponent"),
      { kind: "latex", latex: "} " },
      segment("connector"),
      { kind: "latex", latex: " " },
      segment("constant")
    ];
  } else {
    return undefined;
  }
  return createKpSelectorAnnotatedLatex({
    id: `antiderivative-power.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
}
