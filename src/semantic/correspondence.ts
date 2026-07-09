export type SelectorCorrespondenceRelationId =
  | "identity"
  | "role-change"
  | "introduction"
  | "removal"
  | "cancelation"
  | "fan-in"
  | "fan-out"
  | "artifact"
  | "focus";

export type SelectorCorrespondenceEndpointShape =
  | "one-to-one"
  | "target-only"
  | "source-only"
  | "source-group"
  | "many-to-one"
  | "one-to-many"
  | "artifact"
  | "annotation";

export type SelectorCorrespondenceIdentityEffect =
  | "preserves-identity"
  | "introduces-value"
  | "removes-value"
  | "removes-through-cancelation"
  | "derives-value"
  | "visual-only";

export interface SelectorCorrespondenceRelationDefinition {
  readonly id: SelectorCorrespondenceRelationId;
  readonly endpointShape: SelectorCorrespondenceEndpointShape;
  readonly identityEffect: SelectorCorrespondenceIdentityEffect;
  readonly summary: string;
}

export const selectorCorrespondenceRelations: readonly SelectorCorrespondenceRelationDefinition[] = [
  {
    id: "identity",
    endpointShape: "one-to-one",
    identityEffect: "preserves-identity",
    summary: "A source selector and target selector represent the same semantic value."
  },
  {
    id: "role-change",
    endpointShape: "one-to-one",
    identityEffect: "preserves-identity",
    summary:
      "A selector preserves identity while moving into a new visual role such as script, numerator, denominator, or wrapper context."
  },
  {
    id: "introduction",
    endpointShape: "target-only",
    identityEffect: "introduces-value",
    summary: "A target selector is introduced by the transformation."
  },
  {
    id: "removal",
    endpointShape: "source-only",
    identityEffect: "removes-value",
    summary: "A source selector exits without a target selector."
  },
  {
    id: "cancelation",
    endpointShape: "source-group",
    identityEffect: "removes-through-cancelation",
    summary: "A source selector is removed because it cancels with another selector."
  },
  {
    id: "fan-in",
    endpointShape: "many-to-one",
    identityEffect: "derives-value",
    summary:
      "Multiple source selectors derive a target selector without preserving individual identity."
  },
  {
    id: "fan-out",
    endpointShape: "one-to-many",
    identityEffect: "derives-value",
    summary:
      "One source selector derives multiple target selectors without making each target the same identity."
  },
  {
    id: "artifact",
    endpointShape: "artifact",
    identityEffect: "visual-only",
    summary:
      "A rendered delimiter, fraction bar, radical, bracket, accent, or overlay belongs to a semantic selector but has no separate semantic identity."
  },
  {
    id: "focus",
    endpointShape: "annotation",
    identityEffect: "visual-only",
    summary: "A semantic-preserving visual emphasis or annotation relation."
  }
];

export const selectorCorrespondenceRelationIds =
  selectorCorrespondenceRelations.map((relation) => relation.id);

export function findSelectorCorrespondenceRelation(
  id: SelectorCorrespondenceRelationId
): SelectorCorrespondenceRelationDefinition {
  const relation = selectorCorrespondenceRelations.find(
    (candidate) => candidate.id === id
  );

  if (relation === undefined) {
    throw new Error(`Unknown selector correspondence relation: ${id}`);
  }

  return relation;
}
