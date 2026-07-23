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

export interface KpAnimationRepresentationRelationship {
  readonly schemaVersion: "kp.animation-representation-relationship.v1";
  readonly id: string;
  readonly animationId: string;
  readonly representationId: string;
  readonly kind: KpAnimationRepresentationKind;
  readonly label: string;
  readonly href?: string;
  readonly playable: boolean;
}

export function createKpAnimationRepresentationRelationship(input: {
  readonly animationId: string;
  readonly representationId: string;
  readonly kind: KpAnimationRepresentationKind;
  readonly label: string;
  readonly href?: string;
  readonly playable: boolean;
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
  return {
    schemaVersion: "kp.animation-representation-relationship.v1",
    id: `representation.${animationId}.${input.kind}.${representationId}`,
    animationId,
    representationId,
    kind: input.kind,
    label: requireText(input.label, "representation label"),
    ...(input.href === undefined
      ? {}
      : { href: requireText(input.href, "representation href") }),
    playable: input.playable
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
  }
}

function requireText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === "") throw new Error(`Workbench ${label} must not be empty.`);
  return normalized;
}
