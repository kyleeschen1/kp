import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface FunctionWrapState {
  readonly objectId: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}

export function createKpFunctionWrapSelectorAnnotatedLatex(
  state: FunctionWrapState
): KpSelectorAnnotatedLatex | undefined {
  if (!state.objectId.startsWith("expression.generated.function-wrap.")) {
    return undefined;
  }
  const bySuffix = new Map(
    state.selectors.map((selector) => [selector.id.slice(state.objectId.length + 1), selector])
  );
  const segment = (suffix: string): KpSelectorAnnotatedLatexSegment => {
    const selector = bySuffix.get(suffix);
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`Function-wrap state ${state.objectId} is missing labeled selector ${suffix}.`);
    }
    return { kind: "selector", selectorId: selector.id, latex: selector.label };
  };
  const segments = state.objectId.endsWith(".input")
    ? [segment("value")]
    : state.objectId.endsWith(".wrapped")
      ? [segment("function"), segment("left-paren"), segment("argument"), segment("right-paren")]
      : undefined;
  if (segments === undefined) return undefined;

  return createKpSelectorAnnotatedLatex({
    id: `function-wrap.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
}
