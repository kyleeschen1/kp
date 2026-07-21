import type { KpSemanticAssetObject } from "../semantic/asset.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export interface KpFractionalLinearAnnotatedLatex {
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly structuralSelectorIds: readonly string[];
}

export function createKpFractionalLinearSelectorAnnotatedLatex(
  state: KpSemanticAssetObject
): KpFractionalLinearAnnotatedLatex | undefined {
  if (!state.id.startsWith("equation.fractional-linear.")) return undefined;
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
  const fraction = (): readonly KpSelectorAnnotatedLatexSegment[] => [
    { kind: "latex", latex: "\\frac{" },
    token("fraction.numerator.x", "x"),
    { kind: "latex", latex: "}{" },
    token("fraction.denominator.2", "2"),
    { kind: "latex", latex: "}" }
  ];
  let segments: readonly KpSelectorAnnotatedLatexSegment[];
  switch (state.id) {
    case "equation.fractional-linear.initial":
      segments = [...fraction(), gap(), token("lhs.plus3", "+3"), gap(), token("equals", "="), gap(), token("rhs.7", "7")];
      break;
    case "equation.fractional-linear.after-subtract":
      segments = [...fraction(), gap(), token("lhs.plus3", "+3"), gap(), token("lhs.minus3", "-3"), gap(), token("equals", "="), gap(), token("rhs.7", "7"), gap(), token("rhs.minus", "-"), gap(), token("rhs.3", "3")];
      break;
    case "equation.fractional-linear.additive-cancelled":
      segments = [...fraction(), gap(), token("equals", "="), gap(), token("rhs.7", "7"), gap(), token("rhs.minus", "-"), gap(), token("rhs.3", "3")];
      break;
    case "equation.fractional-linear.right-simplified":
      segments = [...fraction(), gap(), token("equals", "="), gap(), token("rhs.4", "4")];
      break;
    case "equation.fractional-linear.multiplied":
      segments = [
        token("lhs.multiplier.2", "2"),
        { kind: "latex", latex: "\\left(" },
        ...fraction(),
        { kind: "latex", latex: "\\right)" },
        gap(), token("equals", "="), gap(), token("rhs.multiplier.2", "2"), gap(),
        token("rhs.product", "\\cdot"), gap(), token("rhs.4", "4")
      ];
      break;
    case "equation.fractional-linear.denominator-cancelled":
      segments = [token("lhs.x", "x"), gap(), token("equals", "="), gap(), token("rhs.multiplier.2", "2"), gap(), token("rhs.product", "\\cdot"), gap(), token("rhs.4", "4")];
      break;
    case "equation.fractional-linear.solved":
      segments = [token("lhs.x", "x"), gap(), token("equals", "="), gap(), token("rhs.8", "8")];
      break;
    default:
      return undefined;
  }
  return {
    annotated: createKpSelectorAnnotatedLatex({
      id: `fractional-linear.${state.id}`,
      expectedSelectorIds: semantic.map((selector) => selector.id),
      segments
    }),
    structuralSelectorIds: structural.map((selector) => selector.id)
  };
}

export function bindKpFractionalLinearStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly state: KpSemanticAssetObject;
}): void {
  const annotated = createKpFractionalLinearSelectorAnnotatedLatex(input.state);
  if (annotated === undefined) return;
  const fractionRuleId = annotated.structuralSelectorIds.find((id) => id.endsWith(".fraction.rule"));
  const fractionRule = input.root.querySelector<HTMLElement>(".frac-line");
  if (fractionRuleId !== undefined && fractionRule !== null) {
    bindAnchor(fractionRule, fractionRuleId);
  }
  const leftParenId = annotated.structuralSelectorIds.find((id) => id.endsWith(".lhs.left-paren"));
  const rightParenId = annotated.structuralSelectorIds.find((id) => id.endsWith(".lhs.right-paren"));
  const leftParen = input.root.querySelector<HTMLElement>(".mopen.delimcenter");
  const rightParen = input.root.querySelector<HTMLElement>(".mclose.delimcenter");
  if (leftParenId !== undefined && leftParen !== null) bindAnchor(leftParen, leftParenId);
  if (rightParenId !== undefined && rightParen !== null) bindAnchor(rightParen, rightParenId);
}

function bindAnchor(element: HTMLElement, selectorId: string): void {
  element.dataset["kpReaderEquationAnchorId"] = `anchor.${selectorId}`;
  element.dataset["kpReaderSelectorId"] = selectorId;
}
