import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

interface GeneratedLinearSolveSelector {
  readonly id: string;
  readonly semanticKind?: string | undefined;
  readonly kind?: string | undefined;
  readonly label?: string | undefined;
}

interface GeneratedLinearSolveState {
  readonly objectId: string;
  readonly selectors: readonly GeneratedLinearSolveSelector[];
}

export function createKpGeneratedLinearSolveSelectorAnnotatedLatex(
  state: GeneratedLinearSolveState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith("equation.generated.linear-solve.")) {
    return undefined;
  }
  const semanticSelectors = state.selectors.filter(
    (selector) => !isArtifact(selector)
  );
  const prefix = `${state.objectId}.`;
  const bySuffix = new Map(semanticSelectors.map((selector) => [
    selector.id.slice(prefix.length),
    selector
  ]));
  const segment = (suffix: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(suffix);
    if (selector?.label === undefined) {
      throw new Error(
        `Generated linear solve ${state.objectId} lacks selector ${suffix}.`
      );
    }
    return {
      kind: "selector",
      selectorId: selector.id,
      latex: selector.label
    };
  };
  const relation = (suffix: string) => [
    { kind: "latex" as const, latex: "\\;" },
    segment(suffix),
    { kind: "latex" as const, latex: "\\;" }
  ];

  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  if (state.objectId.endsWith(".initial")) {
    segments = [
      segment("lhs.coefficient"),
      segment("lhs.variable"),
      segment("lhs.addend"),
      ...relation("equals"),
      segment("rhs.value")
    ];
  } else if (state.objectId.endsWith(".subtract-introduced")) {
    segments = [
      segment("lhs.coefficient"),
      segment("lhs.variable"),
      segment("lhs.addend"),
      segment("lhs.subtract"),
      ...relation("equals"),
      segment("rhs.value"),
      segment("rhs.minus"),
      segment("rhs.subtrahend")
    ];
  } else if (state.objectId.endsWith(".additive-cancelled")) {
    segments = [
      segment("lhs.coefficient"),
      segment("lhs.variable"),
      ...relation("equals"),
      segment("rhs.value"),
      segment("rhs.minus"),
      segment("rhs.subtrahend")
    ];
  } else if (state.objectId.endsWith(".after-subtract")) {
    segments = [
      segment("lhs.coefficient"),
      segment("lhs.variable"),
      ...relation("equals"),
      segment("rhs.constant")
    ];
  } else if (state.objectId.endsWith(".divide-introduced")) {
    segments = [
      { kind: "latex", latex: "\\frac{" },
      segment("lhs.coefficient"),
      segment("lhs.variable"),
      { kind: "latex", latex: "}{" },
      segment("lhs.divide"),
      { kind: "latex", latex: "}" },
      ...relation("equals"),
      { kind: "latex", latex: "\\frac{" },
      segment("rhs.constant"),
      { kind: "latex", latex: "}{" },
      segment("rhs.divisor"),
      { kind: "latex", latex: "}" }
    ];
  } else if (state.objectId.endsWith(".solved")) {
    segments = [
      segment("lhs.variable"),
      ...relation("equals"),
      { kind: "latex", latex: "\\frac{" },
      segment("rhs.constant"),
      { kind: "latex", latex: "}{" },
      segment("rhs.divisor"),
      { kind: "latex", latex: "}" }
    ];
  } else {
    return undefined;
  }
  return createKpSelectorAnnotatedLatex({
    id: `generated-linear-solve.${state.objectId}`,
    expectedSelectorIds: semanticSelectors.map(({ id }) => id),
    segments
  });
}

export function bindKpGeneratedLinearSolveStructuralMotionIds(input: {
  readonly root: ParentNode;
  readonly state: GeneratedLinearSolveState;
}): Readonly<Record<string, string>> {
  if (!input.state.objectId.startsWith("equation.generated.linear-solve.")) {
    return {};
  }
  const rules = input.state.selectors.filter(isArtifact);
  const bars = [...input.root.querySelectorAll<HTMLElement>(".frac-line")];
  const motionIds: Record<string, string> = {};
  rules.forEach((rule, index) => {
    const bar = bars[index];
    if (bar === undefined) return;
    const motionId = `generated-linear-solve.${input.state.objectId}.${rule.id}`;
    bar.dataset["kpMotionId"] = motionId;
    motionIds[rule.id] = motionId;
  });
  return motionIds;
}

export function bindKpGeneratedLinearSolveReaderStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly state: GeneratedLinearSolveState;
}): void {
  if (!input.state.objectId.startsWith("equation.generated.linear-solve.")) {
    return;
  }
  const rules = input.state.selectors.filter(isArtifact);
  const bars = [...input.root.querySelectorAll<HTMLElement>(".frac-line")];
  if (rules.length !== bars.length) {
    throw new Error(
      `State ${input.state.objectId} expected ${rules.length} fraction rules, received ${bars.length}.`
    );
  }
  rules.forEach((rule, index) => {
    const bar = bars[index]!;
    bar.dataset["kpReaderEquationAnchorId"] = `anchor.${rule.id}`;
    bar.dataset["kpReaderSelectorId"] = rule.id;
  });
}

function isArtifact(selector: GeneratedLinearSolveSelector): boolean {
  return (selector.semanticKind ?? selector.kind) === "artifact";
}
