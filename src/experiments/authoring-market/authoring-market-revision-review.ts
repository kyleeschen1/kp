import type { prepareKpAuthoringMarketPreview } from "./authoring-market-preview-prepare.ts";

type Prepared = ReturnType<typeof prepareKpAuthoringMarketPreview>;

/** Compare declared outputs, not the truth of arbitrary author prose. */
export function projectKpAuthoringMarketRevisionReview(previous: Prepared | undefined, current: Prepared) {
  if (previous === undefined || previous.facts.modelRevisionId === current.facts.modelRevisionId) return;
  const names = Object.keys(current.facts.values) as (keyof typeof current.facts.values)[];
  return Object.freeze({
    beforeRevision: previous.facts.modelRevisionId,
    afterRevision: current.facts.modelRevisionId,
    changedFacts: Object.freeze(names.filter(name => previous.facts.text(name) !== current.facts.text(name))),
    changedClaims: Object.freeze(Object.keys(current.boundArticle.claims).filter(name =>
      previous.boundArticle.claims[name] !== current.boundArticle.claims[name])),
    editorialReview: "Review free prose for stale assertions; refreshed bindings do not verify editorial claims."
  });
}
