import { assertKpPreparedCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { assertKpCommonFactorPresentation, type KpCommonFactorPresentation } from "../../authoring/common-factor-presentation.ts";
import { createKpSelectorAnnotatedLatex } from "../../rendering/selector-annotated-latex.ts";
import type { KpStructuredEquationAnnotatedEndpoint } from "../../rendering/structured-equation-selector-annotated-latex.ts";
import { assertKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";

export function composedAlgebraOperationEndpoints(presentation: KpComposedAlgebraPresentation, step: 0 | 1): readonly KpStructuredEquationAnnotatedEndpoint[] {
  assertKpComposedAlgebraPresentation(presentation);
  return presentation.steps[step].animation.bundle.objects.map(state => {
    const segments = state.selectors.flatMap(selector => {
      if (selector.label === undefined) throw new Error("Canonical algebra selector has no native notation.");
      const token = { kind: "selector" as const, selectorId: selector.id, latex: selector.label };
      return selector.kind === "operator" ? [{ kind: "latex" as const, latex: " " }, token, { kind: "latex" as const, latex: " " }] : [token];
    });
    const annotated = createKpSelectorAnnotatedLatex({ id: state.id, expectedSelectorIds: state.selectors.map(s => s.id), segments });
    const value = state.value;
    if (!value || typeof value !== "object" || !("latex" in value) || value.latex !== annotated.rawLatex)
      throw new Error("Algebra annotation must preserve the exact canonical endpoint source.");
    return Object.freeze({ stateId: state.id, label: state.title, annotated,
      groupEnvelopes: Object.freeze([{ id: `${state.id}.whole-expression`, memberSelectorIds: Object.freeze(state.selectors.map(s => s.id)) }]),
      structuralAnchors: Object.freeze([]) });
  });
}

/** Project the established factoring fixture's ordered selector roles. No glyph
 * search, inferred correspondence, or independently authored endpoint text. */
export function commonFactorEndpoints(draft: KpPreparedCommonFactorDraft): readonly KpStructuredEquationAnnotatedEndpoint[] {
  assertKpPreparedCommonFactorDraft(draft);
  return commonFactorPresentationEndpoints(draft.presentation);
}

export function commonFactorPresentationEndpoints(presentation: KpCommonFactorPresentation): readonly KpStructuredEquationAnnotatedEndpoint[] {
  assertKpCommonFactorPresentation(presentation);
  const operation = presentation.animation.transformations[0]!;
  return [operation.sourceObjectIds[0]!, operation.targetObjectIds[0]!].map((id, index) => {
    const state = presentation.animation.bundle.objects.find(s => s.id === id)!;
    const suffixes = index === 0 ? ["left-factor", "left-term", "plus", "right-factor", "right-term"]
      : ["factor", "left-paren", "left-term", "plus", "right-term", "right-paren"];
    const segments = suffixes.flatMap(suffix => {
      const selector = state.selectors.find(s => s.id === `${id}.${suffix}`);
      if (selector?.label === undefined) throw new Error(`Missing verified factoring role ${id}.${suffix}`);
      const token = { kind: "selector" as const, selectorId: selector.id, latex: selector.label };
      return suffix === "plus" ? [{ kind: "latex" as const, latex: " " }, token, { kind: "latex" as const, latex: " " }] : [token];
    });
    const annotated = createKpSelectorAnnotatedLatex({ id: `common-factor.${index}`, expectedSelectorIds: state.selectors.map(s => s.id), segments });
    const value = state.value;
    if (typeof value !== "object" || value === null || !("latex" in value) || value.latex !== annotated.rawLatex)
      throw new Error("Factoring annotation must preserve the exact native endpoint source.");
    return Object.freeze({ stateId: id, label: index === 0 ? "Expanded products" : "Factored sum", annotated,
      groupEnvelopes: Object.freeze([{ id: `${id}.whole-expression`, memberSelectorIds: Object.freeze(state.selectors.map(s => s.id)) }]),
      structuralAnchors: Object.freeze([]) });
  });
}
