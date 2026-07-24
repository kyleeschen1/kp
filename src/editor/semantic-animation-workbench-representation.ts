import type {
  KpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";

export type KpAnimationRepresentationKind =
  | "editor"
  | "lesson"
  | "card"
  | "concept-room"
  | "static"
  | "export";

export type KpAnimationPresentationRole =
  | "canonical"
  | "projection"
  | "superseded-fixture";

export interface KpAnimationChoreographySourceRef {
  readonly kind: "catalog-animation" | "lesson-animation";
  readonly sourceId: string;
  readonly choreographyId: string;
}

export interface KpAnimationRepresentationRelationship {
  readonly schemaVersion: "kp.animation-representation-relationship.v2";
  readonly id: string;
  readonly animationId: string;
  readonly representationId: string;
  readonly kind: KpAnimationRepresentationKind;
  readonly label: string;
  readonly href?: string;
  readonly playable: boolean;
  readonly presentationRole: KpAnimationPresentationRole;
  readonly canonicalRepresentationId: string;
  readonly choreographySource: KpAnimationChoreographySourceRef;
  readonly aliases: readonly string[];
}

export function createKpAnimationRepresentationRelationship(input: {
  readonly animationId: string;
  readonly representationId: string;
  readonly kind: KpAnimationRepresentationKind;
  readonly label: string;
  readonly href?: string;
  readonly playable: boolean;
  readonly presentationRole?: KpAnimationPresentationRole;
  readonly canonicalRepresentationId?: string;
  readonly choreographySource?: KpAnimationChoreographySourceRef;
  readonly aliases?: readonly string[];
}): KpAnimationRepresentationRelationship {
  const animationId = requireText(input.animationId, "animation id");
  const representationId = requireText(
    input.representationId,
    "representation id"
  );
  if (representationId === animationId || representationId.startsWith("animation.")) {
    throw new Error(
      `Representation ${representationId} must not claim canonical animation identity.`
    );
  }
  const presentationRole = input.presentationRole ?? "canonical";
  const canonicalRepresentationId = requireText(
    input.canonicalRepresentationId ?? representationId,
    "canonical representation id"
  );
  const choreographySource = input.choreographySource ?? {
    kind: "catalog-animation" as const,
    sourceId: animationId,
    choreographyId: `choreography.catalog.${animationId}`
  };
  return {
    schemaVersion: "kp.animation-representation-relationship.v2",
    id: `representation.${animationId}.${input.kind}.${representationId}`,
    animationId,
    representationId,
    kind: input.kind,
    label: requireText(input.label, "representation label"),
    ...(input.href === undefined
      ? {}
      : { href: requireText(input.href, "representation href") }),
    playable: input.playable,
    presentationRole,
    canonicalRepresentationId,
    choreographySource: {
      ...choreographySource,
      sourceId: requireText(
        choreographySource.sourceId,
        "choreography source id"
      ),
      choreographyId: requireText(
        choreographySource.choreographyId,
        "choreography id"
      )
    },
    aliases: uniqueText(input.aliases ?? [], "representation alias")
  };
}

export function assertKpAnimationRepresentationRelationships(input: {
  readonly identities: readonly KpCanonicalAnimationIdentity[];
  readonly relationships: readonly KpAnimationRepresentationRelationship[];
}): void {
  const animationIds = new Set(
    input.identities.map((identity) => identity.animationId)
  );
  const relationshipIds = new Set<string>();
  const representationIds = new Set<string>();
  const aliasClaims = new Map<string, string>();
  for (const relationship of input.relationships) {
    if (!animationIds.has(relationship.animationId)) {
      throw new Error(
        `Representation ${relationship.representationId} references unknown animation ${relationship.animationId}.`
      );
    }
    if (relationshipIds.has(relationship.id)) {
      throw new Error(`Duplicate representation relationship ${relationship.id}.`);
    }
    relationshipIds.add(relationship.id);
    if (representationIds.has(relationship.representationId)) {
      throw new Error(
        `Representation ${relationship.representationId} cannot belong to multiple relationships.`
      );
    }
    representationIds.add(relationship.representationId);
    for (const alias of relationship.aliases) {
      const owner = aliasClaims.get(alias);
      if (owner !== undefined && owner !== relationship.animationId) {
        throw new Error(
          `Representation alias ${alias} cannot belong to multiple animations.`
        );
      }
      aliasClaims.set(alias, relationship.animationId);
    }
  }

  for (const identity of input.identities) {
    const relationships = input.relationships.filter(
      ({ animationId }) => animationId === identity.animationId
    );
    if (relationships.length === 0) continue;
    const canonical = relationships.filter(
      ({ presentationRole }) => presentationRole === "canonical"
    );
    if (canonical.length !== 1) {
      throw new Error(
        `Animation ${identity.animationId} requires exactly one canonical presentation relationship.`
      );
    }
    const canonicalRelationship = canonical[0]!;
    if (
      canonicalRelationship.canonicalRepresentationId !==
      canonicalRelationship.representationId
    ) {
      throw new Error(
        `Canonical presentation ${canonicalRelationship.representationId} must refer to itself.`
      );
    }
    if (
      relationships.some(({ kind }) => kind === "lesson") &&
      canonicalRelationship.kind !== "lesson"
    ) {
      throw new Error(
        `Animation ${identity.animationId} must use its lesson representation as canonical.`
      );
    }
    for (const relationship of relationships) {
      if (
        relationship.canonicalRepresentationId !==
        canonicalRelationship.representationId
      ) {
        throw new Error(
          `Representation ${relationship.representationId} must refer to canonical presentation ${canonicalRelationship.representationId}.`
        );
      }
      if (
        relationship.presentationRole === "projection" &&
        !sameChoreographySource(
          relationship.choreographySource,
          canonicalRelationship.choreographySource
        )
      ) {
        throw new Error(
          `Projection ${relationship.representationId} must consume canonical choreography ${canonicalRelationship.choreographySource.choreographyId}.`
        );
      }
    }
  }
}

function requireText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === "") throw new Error(`Workbench ${label} must not be empty.`);
  return normalized;
}

function uniqueText(values: readonly string[], label: string): readonly string[] {
  return [...new Set(values.map((value) => requireText(value, label)))];
}

function sameChoreographySource(
  left: KpAnimationChoreographySourceRef,
  right: KpAnimationChoreographySourceRef
): boolean {
  return (
    left.kind === right.kind &&
    left.sourceId === right.sourceId &&
    left.choreographyId === right.choreographyId
  );
}
