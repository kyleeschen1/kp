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
  let stateKind: "source" | "expanded" | "target";
  if (state.objectId.endsWith(".initial")) {
    stateKind = "source";
    segments = [
      segment("operator", "\\int"),
      { kind: "latex", latex: " " },
      segment("base"),
      { kind: "latex", latex: "^{" },
      segment("exponent"),
      { kind: "latex", latex: "}\\," },
      segment("differential-symbol"),
      segment("integration-variable")
    ];
  } else if (state.objectId.endsWith(".expanded")) {
    stateKind = "expanded";
    segments = [
      { kind: "latex", latex: "\\frac{" },
      segment("numerator-base"),
      { kind: "latex", latex: "^{" },
      segment("numerator-exponent"),
      { kind: "latex", latex: "+" },
      segment("numerator-increment"),
      { kind: "latex", latex: "}}{" },
      segment("denominator-exponent"),
      { kind: "latex", latex: "+" },
      segment("denominator-increment"),
      { kind: "latex", latex: "} " },
      segment("connector"),
      { kind: "latex", latex: " " },
      segment("constant")
    ];
  } else if (state.objectId.endsWith(".integrated")) {
    stateKind = "target";
    segments = [
      { kind: "latex", latex: "\\frac{" },
      segment("numerator-base"),
      { kind: "latex", latex: "^{" },
      segment("numerator-exponent"),
      { kind: "latex", latex: "}}{" },
      segment("denominator"),
      { kind: "latex", latex: "} " },
      segment("connector"),
      { kind: "latex", latex: " " },
      segment("constant")
    ];
  } else {
    return undefined;
  }
  const annotated = createKpSelectorAnnotatedLatex({
    id: `antiderivative-power.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
  return bindAntiderivativeSemanticGroups({
    annotated,
    bySuffix,
    objectId: state.objectId,
    stateKind
  });
}

function bindAntiderivativeSemanticGroups(input: {
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly bySuffix: ReadonlyMap<string, AntiderivativePowerState["selectors"][number]>;
  readonly objectId: string;
  readonly stateKind: "source" | "expanded" | "target";
}): KpSelectorAnnotatedLatex {
  const token = (suffix: string): string => {
    const selectorId = input.bySuffix.get(suffix)?.id;
    const annotation = input.annotated.annotations.find((candidate) =>
      candidate.selectorId === selectorId
    );
    if (annotation === undefined) {
      throw new Error(
        `${input.objectId} cannot bind antiderivative group member ${suffix}.`
      );
    }
    return `\\htmlData{kp-motion-id=${annotation.motionId}}{${annotation.latex}}`;
  };
  let annotatedLatex = input.annotated.annotatedLatex;
  if (input.stateKind === "source") {
    const integrand = `${token("base")}^{${token("exponent")}}`;
    annotatedLatex = wrapExactFragment({
      annotatedLatex,
      fragment: integrand,
      attribute: "kp-antiderivative-integrand-scope",
      value: `${input.objectId}.integrand-scope`
    });
    const differential =
      `${token("differential-symbol")}${token("integration-variable")}`;
    annotatedLatex = wrapExactFragment({
      annotatedLatex,
      fragment: differential,
      attribute: "kp-antiderivative-differential-binding",
      value: `${input.objectId}.differential-binding`
    });
  } else {
    const quotient = input.stateKind === "expanded"
      ? `\\frac{${token("numerator-base")}^{${token("numerator-exponent")}+${token("numerator-increment")}}}{${token("denominator-exponent")}+${token("denominator-increment")}}`
      : `\\frac{${token("numerator-base")}^{${token("numerator-exponent")}}}{${token("denominator")}}`;
    annotatedLatex = wrapExactFragment({
      annotatedLatex,
      fragment: quotient,
      attribute: "kp-antiderivative-exact-quotient",
      value: `${input.objectId}.exact-quotient`
    });
    annotatedLatex = wrapExactFragment({
      annotatedLatex,
      fragment: `${token("connector")} ${token("constant")}`,
      attribute: "kp-antiderivative-integration-constant",
      value: `${input.objectId}.integration-constant`
    });
  }
  return { ...input.annotated, annotatedLatex };
}

function wrapExactFragment(input: {
  readonly annotatedLatex: string;
  readonly fragment: string;
  readonly attribute: string;
  readonly value: string;
}): string {
  const start = input.annotatedLatex.indexOf(input.fragment);
  if (start < 0 || input.annotatedLatex.indexOf(
    input.fragment,
    start + input.fragment.length
  ) >= 0) {
    throw new Error(
      `Antiderivative group ${input.value} must bind one exact KaTeX fragment.`
    );
  }
  return input.annotatedLatex.slice(0, start) +
    `\\htmlData{${input.attribute}=${input.value}}{${input.fragment}}` +
    input.annotatedLatex.slice(start + input.fragment.length);
}
