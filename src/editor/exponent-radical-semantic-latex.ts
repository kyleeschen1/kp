import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface ExponentRadicalState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpExponentRadicalSelectorAnnotatedLatex(
  state: ExponentRadicalState
): KpSelectorAnnotatedLatex | undefined {
  const exponent = state.objectId.startsWith("expression.generated.exponent.");
  const radical = state.objectId.startsWith("expression.generated.radical.");
  if (!exponent && !radical) return undefined;

  const structuralSuffixes = new Set(["exponent-fraction-line", "radical-symbol"]);
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
    segments = [
      { kind: "latex", latex: "\\sqrt{" },
      segment("radicand"),
      { kind: "latex", latex: "}" }
    ];
  } else {
    return undefined;
  }

  return createKpSelectorAnnotatedLatex({
    id: `exponent-radical.${state.objectId}`,
    expectedSelectorIds: semanticSelectors.map((selector) => selector.id),
    segments
  });
}

export function bindKpExponentRadicalStructuralMotionIds(input: {
  readonly root: HTMLElement;
  readonly states: readonly ExponentRadicalState[];
}): Readonly<Record<string, string>> {
  const motionIds: Record<string, string> = {};
  for (const state of input.states) {
    const object = input.root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    if (object === null) continue;
    for (const selector of state.selectors) {
      const name = suffix(state, selector.id);
      const element = name === "exponent-fraction-line"
        ? object.querySelector<HTMLElement>(".frac-line")
        : name === "radical-symbol"
          ? object.querySelector<HTMLElement>(".hide-tail")
          : null;
      if (element === null) continue;
      const motionId = `exponent-radical.${state.objectId}.${selector.id}`;
      element.dataset["kpMotionId"] = motionId;
      motionIds[selector.id] = motionId;
    }
  }
  return motionIds;
}

function suffix(state: ExponentRadicalState, selectorId: string): string {
  return selectorId.slice(state.objectId.length + 1);
}

function gap(): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: "\\;" };
}
