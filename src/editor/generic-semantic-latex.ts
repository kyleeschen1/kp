import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

export function createKpGenericSelectorAnnotatedLatex(state: {
  readonly objectId: string;
  readonly latex: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly label?: string | undefined;
  }[];
}): KpSelectorAnnotatedLatex | undefined {
  const segments: KpSelectorAnnotatedLatexSegment[] = [];
  let cursor = 0;

  for (const selector of state.selectors) {
    if (selector.label === undefined || selector.label.length === 0) return undefined;
    const index = state.latex.indexOf(selector.label, cursor);
    if (index < cursor) return undefined;
    if (index > cursor) {
      segments.push({ kind: "latex", latex: state.latex.slice(cursor, index) });
    }
    segments.push({
      kind: "selector",
      selectorId: selector.id,
      latex: selector.label
    });
    cursor = index + selector.label.length;
  }

  if (cursor < state.latex.length) {
    segments.push({ kind: "latex", latex: state.latex.slice(cursor) });
  }

  return createKpSelectorAnnotatedLatex({
    id: `generic.${state.objectId}`,
    expectedSelectorIds: state.selectors.map((selector) => selector.id),
    segments
  });
}
