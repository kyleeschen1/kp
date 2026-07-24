import {
  scoreKpFuzzyQuery,
  type KpFuzzyQueryField
} from "../search/fuzzy-query.ts";
import type {
  KpSemanticAnimationWorkbenchIndex,
  KpSemanticAnimationWorkbenchIndexEntry
} from "./semantic-animation-workbench-index.ts";

export interface KpSemanticAnimationWorkbenchQueryResult {
  readonly entry: KpSemanticAnimationWorkbenchIndexEntry;
  readonly score: number;
  readonly matchedValues: readonly string[];
}

export function queryKpSemanticAnimationWorkbench(
  index: KpSemanticAnimationWorkbenchIndex,
  query: string
): readonly KpSemanticAnimationWorkbenchQueryResult[] {
  return index.entries
    .flatMap((entry) => {
      const match = scoreKpFuzzyQuery(searchFields(entry), query);
      return match === undefined
        ? []
        : [
            {
              entry,
              score: match.score,
              matchedValues: match.matchedValues
            }
          ];
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.entry.identity.title.localeCompare(right.entry.identity.title) ||
        left.entry.identity.animationId.localeCompare(
          right.entry.identity.animationId
        )
    );
}

function searchFields(
  entry: KpSemanticAnimationWorkbenchIndexEntry
): readonly KpFuzzyQueryField[] {
  const lifecycle = entry.lifecycle;
  const fields = [
    { value: entry.identity.title, weight: 8 },
    { value: entry.identity.animationId, weight: 7 },
    ...entry.identity.aliases.map((value) => ({ value, weight: 6 })),
    ...entry.identity.familyIds.map((value) => ({ value, weight: 5 })),
    { value: entry.summary, weight: 3 },
    ...entry.tags.map((value) => ({ value, weight: 4 })),
    { value: lifecycle.roadmap, weight: 3 },
    { value: lifecycle.execution, weight: 3 },
    { value: lifecycle.maturity, weight: 3 },
    { value: lifecycle.approval, weight: 3 },
    { value: lifecycle.review, weight: 3 },
    { value: lifecycle.verification, weight: 2 },
    { value: lifecycle.playability, weight: 3 },
    ...(entry.presentationPromotion === undefined
      ? []
      : [
          { value: entry.presentationPromotion.status, weight: 3 },
          ...entry.presentationPromotion.diagnostics.map((diagnostic) => ({
            value: `${diagnostic.code} ${diagnostic.message}`,
            weight: 3
          }))
        ]),
    ...entry.representations.flatMap((representation) => [
      { value: representation.label, weight: 4 },
      { value: representation.representationId, weight: 3 },
      { value: representation.kind, weight: 2 }
    ])
  ];
  return [
    ...fields,
    ...fields.flatMap((field) =>
      searchTokens(field.value).map((value) => ({
        value,
        weight: Math.max(1, field.weight - 1)
      }))
    )
  ];
}

function searchTokens(value: string): readonly string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}
