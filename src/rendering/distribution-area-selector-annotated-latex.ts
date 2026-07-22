import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

interface KpDistributionAreaLatexState {
  readonly id: string;
  readonly selectors: readonly { readonly id: string; readonly label?: string | undefined }[];
}

export function createKpDistributionAreaSelectorAnnotatedLatex(
  state: KpDistributionAreaLatexState
): KpSelectorAnnotatedLatex {
  const suffix = state.id.split(".state.").at(-1);
  const selectorBySuffix = new Map(state.selectors.map((selector) => [
    selector.id.slice(state.id.length + 1),
    selector
  ]));
  const selector = (id: string): KpSelectorAnnotatedLatexSegment => {
    const candidate = selectorBySuffix.get(id);
    if (candidate?.label === undefined) {
      throw new Error(`Distribution area state ${state.id} is missing labeled selector ${id}.`);
    }
    return { kind: "selector", selectorId: candidate.id, latex: candidate.label };
  };
  const segments = suffix === "factored"
    ? [selector("factor.3"), selector("left-paren"), selector("term.x"), selector("plus"), selector("term.2"), selector("right-paren")]
    : suffix === "distributed"
      ? [selector("left.factor.3"), selector("left.term.x"), selector("plus"), selector("right.factor.3"), selector("right.times"), selector("right.term.2")]
      : suffix === "expanded"
        ? [selector("left.factor.3"), selector("left.term.x"), selector("plus"), selector("right.product.6")]
        : undefined;
  if (segments === undefined) throw new Error(`Unsupported distribution area state ${state.id}.`);
  return createKpSelectorAnnotatedLatex({
    id: `distribution-area.${suffix}`,
    expectedSelectorIds: state.selectors.map((candidate) => candidate.id),
    segments
  });
}

export function kpDistributionAreaLineageForSelectorId(selectorId: string): string {
  const suffix = selectorId.split(".state.").at(-1)?.replace(/^(factored|distributed|expanded)\./, "") ?? selectorId;
  if (suffix === "factor.3" || suffix === "left.factor.3" || suffix === "right.factor.3") return "factor.3";
  if (suffix === "term.x" || suffix === "left.term.x") return "term.x";
  if (suffix === "term.2" || suffix === "right.term.2") return "term.2";
  if (suffix === "right.product.6") return "product.6";
  if (suffix === "plus") return "operator.plus";
  if (suffix === "right.times") return "operator.times";
  if (suffix === "left-paren" || suffix === "right-paren") return "grouping";
  throw new Error(`Distribution area selector ${selectorId} has no visual lineage.`);
}
