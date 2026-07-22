import type { KpSemanticAssetObject } from "../semantic/asset.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export interface KpNumeratorSplitMergeAnnotatedLatex {
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly structuralSelectorIds: readonly string[];
}

export function createKpNumeratorSplitMergeSelectorAnnotatedLatex(
  state: KpSemanticAssetObject
): KpNumeratorSplitMergeAnnotatedLatex | undefined {
  if (!state.id.startsWith("equation.numerator-split-merge.")) return undefined;
  const byPath = new Map(state.selectors.map((selector) => [
    selector.id.slice(state.id.length + 1),
    selector
  ]));
  const structural = state.selectors.filter((selector) => selector.kind === "artifact");
  const semantic = state.selectors.filter((selector) => selector.kind !== "artifact");
  const token = (path: string, latex?: string): KpSelectorAnnotatedLatexSegment => {
    const selector = byPath.get(path);
    if (selector === undefined) throw new Error(`${state.id} is missing selector ${path}`);
    return { kind: "selector", selectorId: selector.id, latex: latex ?? selector.label ?? path };
  };
  const latex = (value: string): KpSelectorAnnotatedLatexSegment => ({
    kind: "latex",
    latex: value
  });
  const gap = (): KpSelectorAnnotatedLatexSegment => latex("\\;");
  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  switch (state.id) {
    case "equation.numerator-split-merge.combined":
      segments = [
        latex("\\frac{"),
        token("fraction.numerator.coefficient.2", "2"),
        token("fraction.numerator.x", "x"),
        gap(), token("fraction.numerator.plus", "+"), gap(),
        token("fraction.numerator.6", "6"),
        latex("}{"), token("fraction.denominator.2", "2"), latex("}")
      ];
      break;
    case "equation.numerator-split-merge.split":
      segments = [
        latex("\\frac{"),
        token("left.fraction.numerator.coefficient.2", "2"),
        token("left.fraction.numerator.x", "x"),
        latex("}{"), token("left.fraction.denominator.2", "2"), latex("}"),
        gap(), token("between.plus", "+"), gap(),
        latex("\\frac{"), token("right.fraction.numerator.6", "6"),
        latex("}{"), token("right.fraction.denominator.2", "2"), latex("}")
      ];
      break;
    default:
      return undefined;
  }
  return {
    annotated: createKpSelectorAnnotatedLatex({
      id: `numerator-split-merge.${state.id}`,
      expectedSelectorIds: semantic.map((selector) => selector.id),
      segments
    }),
    structuralSelectorIds: structural.map((selector) => selector.id)
  };
}

export function bindKpNumeratorSplitMergeStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly state: KpSemanticAssetObject;
}): void {
  const annotated = createKpNumeratorSplitMergeSelectorAnnotatedLatex(input.state);
  if (annotated === undefined) return;
  const ruleIds = annotated.structuralSelectorIds.filter((id) => id.endsWith(".fraction.rule"));
  const rules = [...input.root.querySelectorAll<HTMLElement>(".frac-line")];
  if (ruleIds.length !== rules.length) {
    throw new Error(
      `State ${input.state.id} expected ${ruleIds.length} fraction rules, received ${rules.length}.`
    );
  }
  ruleIds.forEach((selectorId, index) => {
    const rule = rules[index]!;
    rule.dataset["kpReaderEquationAnchorId"] = `anchor.${selectorId}`;
    rule.dataset["kpReaderSelectorId"] = selectorId;
  });
}
