import type { SelectorCorrespondenceRelationId } from "./correspondence.ts";

export const kpCanonicalOperationCoreVersion = "1.0.0" as const;

export type KpCanonicalOperationId =
  | "kp.core.persist"
  | "kp.core.introduce"
  | "kp.core.eliminate"
  | "kp.core.substitute"
  | "kp.core.copy"
  | "kp.core.fan-out"
  | "kp.core.merge"
  | "kp.core.reorder"
  | "kp.core.wrap"
  | "kp.core.unwrap"
  | "kp.core.group"
  | "kp.core.ungroup"
  | "kp.core.focus";

export type KpCanonicalOperationEndpoint = "source" | "target";

export type KpCanonicalOperationRoleKind =
  | "semantic-entity"
  | "structural-artifact"
  | "annotation";

export type KpCanonicalOperationRoleCardinality =
  | "exactly-one"
  | "zero-or-one"
  | "one-or-more";

export interface KpCanonicalOperationRole {
  readonly id: string;
  readonly endpoint: KpCanonicalOperationEndpoint;
  readonly kind: KpCanonicalOperationRoleKind;
  readonly cardinality: KpCanonicalOperationRoleCardinality;
  readonly summary: string;
}

export interface KpCanonicalOperationCoreDescriptor {
  readonly id: KpCanonicalOperationId;
  readonly version: typeof kpCanonicalOperationCoreVersion;
  readonly title: string;
  readonly summary: string;
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly correspondenceRelations: readonly SelectorCorrespondenceRelationId[];
  readonly reversibleAs?: KpCanonicalOperationId | undefined;
}

export const kpCanonicalOperationCore:
  readonly KpCanonicalOperationCoreDescriptor[] = [
    descriptor({
      id: "kp.core.persist",
      title: "Persist",
      summary: "Preserve one semantic entity across a state boundary.",
      roles: [entity("before", "source"), entity("after", "target")],
      correspondenceRelations: ["identity", "role-change"],
      reversibleAs: "kp.core.persist"
    }),
    descriptor({
      id: "kp.core.introduce",
      title: "Introduce",
      summary: "Create a semantic entity or structural artifact with an explicit reason.",
      roles: [entity("introduced", "target")],
      correspondenceRelations: ["introduction", "artifact"],
      reversibleAs: "kp.core.eliminate"
    }),
    descriptor({
      id: "kp.core.eliminate",
      title: "Eliminate",
      summary: "Remove a semantic entity or structural artifact with an explicit reason.",
      roles: [entity("eliminated", "source")],
      correspondenceRelations: ["removal", "cancelation", "artifact"],
      reversibleAs: "kp.core.introduce"
    }),
    descriptor({
      id: "kp.core.substitute",
      title: "Substitute",
      summary: "Transmit a value into a destination while replacing the prior occupant.",
      roles: [
        entity("value", "source"),
        entity("replaced", "source"),
        entity("replacement", "target")
      ],
      correspondenceRelations: ["role-change", "removal", "introduction"]
    }),
    descriptor({
      id: "kp.core.copy",
      title: "Copy",
      summary: "Preserve a source while deriving one lineage-bearing copy.",
      roles: [
        entity("source", "source"),
        entity("persistent-source", "target"),
        entity("copy", "target")
      ],
      correspondenceRelations: ["identity", "fan-out"]
    }),
    descriptor({
      id: "kp.core.fan-out",
      title: "Fan Out",
      summary: "Derive multiple lineage-bearing destinations from one source.",
      roles: [
        entity("source", "source"),
        entity("destinations", "target", "one-or-more")
      ],
      correspondenceRelations: ["fan-out"],
      reversibleAs: "kp.core.merge"
    }),
    descriptor({
      id: "kp.core.merge",
      title: "Merge",
      summary: "Combine multiple sources into one derived result.",
      roles: [
        entity("sources", "source", "one-or-more"),
        entity("result", "target")
      ],
      correspondenceRelations: ["fan-in"],
      reversibleAs: "kp.core.fan-out"
    }),
    descriptor({
      id: "kp.core.reorder",
      title: "Reorder",
      summary: "Preserve a collection of entities while changing their presentation order.",
      roles: [
        entity("items-before", "source", "one-or-more"),
        entity("items-after", "target", "one-or-more")
      ],
      correspondenceRelations: ["identity", "role-change"],
      reversibleAs: "kp.core.reorder"
    }),
    descriptor({
      id: "kp.core.wrap",
      title: "Wrap",
      summary: "Preserve content while introducing an enclosing semantic or structural context.",
      roles: [
        entity("content-before", "source"),
        entity("content-after", "target"),
        artifact("wrapper", "target", "one-or-more")
      ],
      correspondenceRelations: ["role-change", "introduction", "artifact"],
      reversibleAs: "kp.core.unwrap"
    }),
    descriptor({
      id: "kp.core.unwrap",
      title: "Unwrap",
      summary: "Preserve content while removing an enclosing semantic or structural context.",
      roles: [
        entity("content-before", "source"),
        artifact("wrapper", "source", "one-or-more"),
        entity("content-after", "target")
      ],
      correspondenceRelations: ["role-change", "removal", "artifact"],
      reversibleAs: "kp.core.wrap"
    }),
    descriptor({
      id: "kp.core.group",
      title: "Group",
      summary: "Preserve members while introducing a meaningful enclosing group.",
      roles: [
        entity("members-before", "source", "one-or-more"),
        entity("members-after", "target", "one-or-more"),
        entity("group", "target")
      ],
      correspondenceRelations: ["identity", "introduction"],
      reversibleAs: "kp.core.ungroup"
    }),
    descriptor({
      id: "kp.core.ungroup",
      title: "Ungroup",
      summary: "Preserve members while removing a meaningful enclosing group.",
      roles: [
        entity("group", "source"),
        entity("members-before", "source", "one-or-more"),
        entity("members-after", "target", "one-or-more")
      ],
      correspondenceRelations: ["identity", "removal"],
      reversibleAs: "kp.core.group"
    }),
    descriptor({
      id: "kp.core.focus",
      title: "Focus",
      summary: "Preserve an entity while changing explanatory attention or annotation.",
      roles: [
        entity("subject-before", "source"),
        entity("subject-after", "target"),
        annotation("focus", "target")
      ],
      correspondenceRelations: ["identity", "focus"],
      reversibleAs: "kp.core.focus"
    })
  ];

export function findKpCanonicalOperationCoreDescriptor(
  id: KpCanonicalOperationId
): KpCanonicalOperationCoreDescriptor {
  const descriptor = kpCanonicalOperationCore.find((candidate) => candidate.id === id);
  if (descriptor === undefined) {
    throw new Error(`Unknown canonical operation ${id}.`);
  }
  return descriptor;
}

function descriptor(
  input: Omit<KpCanonicalOperationCoreDescriptor, "version">
): KpCanonicalOperationCoreDescriptor {
  return { ...input, version: kpCanonicalOperationCoreVersion };
}

function entity(
  id: string,
  endpoint: KpCanonicalOperationEndpoint,
  cardinality: KpCanonicalOperationRoleCardinality = "exactly-one"
): KpCanonicalOperationRole {
  return role(id, endpoint, "semantic-entity", cardinality);
}

function artifact(
  id: string,
  endpoint: KpCanonicalOperationEndpoint,
  cardinality: KpCanonicalOperationRoleCardinality
): KpCanonicalOperationRole {
  return role(id, endpoint, "structural-artifact", cardinality);
}

function annotation(
  id: string,
  endpoint: KpCanonicalOperationEndpoint
): KpCanonicalOperationRole {
  return role(id, endpoint, "annotation", "exactly-one");
}

function role(
  id: string,
  endpoint: KpCanonicalOperationEndpoint,
  kind: KpCanonicalOperationRoleKind,
  cardinality: KpCanonicalOperationRoleCardinality
): KpCanonicalOperationRole {
  return {
    id,
    endpoint,
    kind,
    cardinality,
    summary: `${endpoint} ${kind} role ${id}`
  };
}

