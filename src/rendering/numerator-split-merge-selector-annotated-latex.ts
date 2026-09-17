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
  const structural = state.selectors.filter((selector) => selector.kind === "artifact");
  const semantic = state.selectors.filter((selector) => selector.kind !== "artifact");
  const byRole = new Map<string, typeof state.selectors>();
  state.selectors.forEach((selector) => {
    const role = selector.metadata?.["equationStructureRole"];
    if (typeof role !== "string") return;
    byRole.set(role, [...(byRole.get(role) ?? []), selector]);
  });
  const token = (
    role: string,
    ordinal = 0
  ): KpSelectorAnnotatedLatexSegment => {
    const selector = byRole.get(role)?.[ordinal];
    if (selector === undefined || selector.label === undefined) {
      throw new Error(`${state.id} is missing labeled role ${role}[${ordinal}]`);
    }
    return {
      kind: "selector",
      selectorId: selector.id,
      latex: selector.label
    };
  };
  const latex = (value: string): KpSelectorAnnotatedLatexSegment => ({
    kind: "latex",
    latex: value
  });
  const gap = (): KpSelectorAnnotatedLatexSegment => latex("\\;");
  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  if (byRole.has("numerator-operator")) {
    segments = [
      latex("\\frac{"),
      token("coefficient"),
      ...(byRole.has("variable") ? [token("variable")] : []),
      gap(), token("numerator-operator"), gap(),
      token("constant"),
      latex("}{"), token("denominator"), latex("}")
    ];
  } else if (byRole.has("sum-operator")) {
    segments = [
      latex("\\frac{"),
      token("coefficient"),
      ...(byRole.has("variable") ? [token("variable")] : []),
      latex("}{"), token("denominator", 0), latex("}"),
      gap(), token("sum-operator"), gap(),
      latex("\\frac{"), token("constant"),
      latex("}{"), token("denominator", 1), latex("}")
    ];
  } else {
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
