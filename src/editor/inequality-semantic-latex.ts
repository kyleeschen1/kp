import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface InequalityState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpInequalitySelectorAnnotatedLatex(
  state: InequalityState
): KpSelectorAnnotatedLatex | undefined {
  if (state.objectId !== "inequality.sign-flip.source" &&
      state.objectId !== "inequality.sign-flip.target") {
    return undefined;
  }
  const bySuffix = new Map(
    state.selectors.map((selector) => [selector.id.slice(state.objectId.length + 1), selector])
  );
  const segment = (name: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(name);
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`Inequality state ${state.objectId} is missing labeled selector ${name}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: selector.label };
  };
  const source = state.objectId.endsWith(".source");
  return createKpSelectorAnnotatedLatex({
    id: `inequality.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments: source
      ? [
          segment("lhs.operand"),
          { kind: "latex", latex: "\\;" },
          segment("relation"),
          { kind: "latex", latex: "\\;" },
          segment("rhs.operand")
        ]
      : [
          segment("lhs.multiplier"),
          segment("lhs.operand"),
          { kind: "latex", latex: "\\;" },
          segment("relation"),
          { kind: "latex", latex: "\\;" },
          segment("rhs.result")
        ]
  });
}
