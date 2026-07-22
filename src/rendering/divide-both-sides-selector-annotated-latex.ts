import type { KpSemanticAssetObject } from "../semantic/asset.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export interface KpDivideBothSidesAnnotatedLatex {
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly structuralSelectorIds: readonly string[];
}

export function createKpDivideBothSidesSelectorAnnotatedLatex(
  state: KpSemanticAssetObject
): KpDivideBothSidesAnnotatedLatex | undefined {
  if (!state.id.startsWith("equation.divide-both-sides.")) return undefined;
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
  const gap = (): KpSelectorAnnotatedLatexSegment => ({ kind: "latex", latex: "\\;" });
  const fraction = (
    side: "lhs" | "rhs",
    numerator: readonly KpSelectorAnnotatedLatexSegment[]
  ): readonly KpSelectorAnnotatedLatexSegment[] => [
    { kind: "latex", latex: "\\frac{" },
    ...numerator,
    { kind: "latex", latex: "}{" },
    token(`${side}.fraction.denominator.3`, "3"),
    { kind: "latex", latex: "}" }
  ];
  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  switch (state.id) {
    case "equation.divide-both-sides.initial":
      segments = [
        token("lhs.coefficient.3", "3"),
        token("lhs.x", "x"),
        gap(), token("equals", "="), gap(), token("rhs.12", "12")
      ];
      break;
    case "equation.divide-both-sides.divided":
      segments = [
        ...fraction("lhs", [
          token("lhs.fraction.numerator.coefficient.3", "3"),
          token("lhs.fraction.numerator.x", "x")
        ]),
        gap(), token("equals", "="), gap(),
        ...fraction("rhs", [token("rhs.fraction.numerator.12", "12")])
      ];
      break;
    case "equation.divide-both-sides.coefficient-cancelled":
      segments = [
        token("lhs.x", "x"), gap(), token("equals", "="), gap(),
        ...fraction("rhs", [token("rhs.fraction.numerator.12", "12")])
      ];
      break;
    case "equation.divide-both-sides.solved":
      segments = [token("lhs.x", "x"), gap(), token("equals", "="), gap(), token("rhs.4", "4")];
      break;
    default:
      return undefined;
  }
  return {
    annotated: createKpSelectorAnnotatedLatex({
      id: `divide-both-sides.${state.id}`,
      expectedSelectorIds: semantic.map((selector) => selector.id),
      segments
    }),
    structuralSelectorIds: structural.map((selector) => selector.id)
  };
}

export function bindKpDivideBothSidesStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly state: KpSemanticAssetObject;
}): void {
  const annotated = createKpDivideBothSidesSelectorAnnotatedLatex(input.state);
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
