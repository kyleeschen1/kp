import type {
  KpArtifactMaturity,
  KpArtifactPromotionLineage
} from "../animation/artifact-promotion.ts";
import {
  resolveKpAnimationPromotionLineage
} from "../animation/artifact-promotion.ts";
import type {
  KpAnimationWorkbenchCatalogEntry
} from "./semantic-animation-workbench-catalog-adapter.ts";
import type {
  KpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";
import {
  createKpAnimationLifecycleFacets,
  type KpAnimationLifecycleFacets,
  type KpAnimationMaturityState,
  type KpAnimationRoadmapState
} from "./semantic-animation-workbench-lifecycle.ts";
import type {
  KpAnimationRepresentationRelationship
} from "./semantic-animation-workbench-representation.ts";
import type {
  KpAnimationReviewProjection
} from "./semantic-animation-workbench-review-adapter.ts";
import type {
  KpAnimationTheseusProjection
} from "./semantic-animation-workbench-theseus-adapter.ts";
import {
  gateKpCanonicalPresentationPromotion,
  type KpCanonicalPresentationAuditEntry,
  type KpCanonicalPresentationPromotionResult
} from "./canonical-presentation-group-audit.ts";

export interface KpAnimationRoadmapProjection {
  readonly animationId: string;
  readonly state: KpAnimationRoadmapState;
  readonly sourceId: string;
}

export interface KpSemanticAnimationWorkbenchIndexEntry {
  readonly schemaVersion: "kp.semantic-animation-workbench-index-entry.v1";
  readonly identity: KpCanonicalAnimationIdentity;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly representations: readonly KpAnimationRepresentationRelationship[];
  readonly promotion: KpArtifactPromotionLineage;
  readonly presentationPromotion?:
    KpCanonicalPresentationPromotionResult | undefined;
  readonly lifecycle: KpAnimationLifecycleFacets;
  readonly controlIds: readonly string[];
  readonly review?: KpAnimationReviewProjection;
  readonly diagnostics: readonly KpSemanticAnimationWorkbenchIndexDiagnostic[];
}

export interface KpSemanticAnimationWorkbenchIndexDiagnostic {
  readonly code:
    | "catalog-planned-collision"
    | "duplicate-roadmap-state"
    | "identity-collision"
    | "lifecycle-conflict"
    | "orphan-representation"
    | "orphan-review"
    | "orphan-theseus"
    | "promotion-lineage-conflict"
    | "source-diagnostic";
  readonly animationId?: string;
  readonly sourceIds: readonly string[];
  readonly message: string;
}

export interface KpSemanticAnimationWorkbenchIndex {
  readonly schemaVersion: "kp.semantic-animation-workbench-index.v1";
  readonly valid: boolean;
  readonly entries: readonly KpSemanticAnimationWorkbenchIndexEntry[];
  readonly diagnostics: readonly KpSemanticAnimationWorkbenchIndexDiagnostic[];
}

export function compileKpSemanticAnimationWorkbenchIndex(input: {
  readonly catalogEntries: readonly KpAnimationWorkbenchCatalogEntry[];
  readonly plannedIdentities?: readonly KpCanonicalAnimationIdentity[];
  readonly representations?: readonly KpAnimationRepresentationRelationship[];
  readonly roadmap?: readonly KpAnimationRoadmapProjection[];
  readonly theseus?: readonly KpAnimationTheseusProjection[];
  readonly reviews?: readonly KpAnimationReviewProjection[];
  readonly sourceDiagnostics?: readonly {
    readonly animationId?: string;
    readonly sourceIds: readonly string[];
    readonly message: string;
  }[];
  readonly presentationAudits?:
    readonly KpCanonicalPresentationAuditEntry[] | undefined;
}): KpSemanticAnimationWorkbenchIndex {
  const diagnostics: KpSemanticAnimationWorkbenchIndexDiagnostic[] = [];
  const catalogById = new Map(
    input.catalogEntries.map((entry) => [entry.identity.animationId, entry])
  );
  const identityById = new Map<string, KpCanonicalAnimationIdentity>();
  const presentationAuditById = new Map(
    (input.presentationAudits ?? []).map((audit) => [
      audit.animationId,
      audit
    ])
  );

  for (const entry of input.catalogEntries) {
    addIdentity(entry.identity, identityById, diagnostics);
  }
  for (const identity of input.plannedIdentities ?? []) {
    if (catalogById.has(identity.animationId)) {
      diagnostics.push({
        code: "catalog-planned-collision",
        animationId: identity.animationId,
        sourceIds: [identity.provenance.kind],
        message:
          `Animation ${identity.animationId} cannot be both catalog-backed and planned-only.`
      });
      continue;
    }
    addIdentity(identity, identityById, diagnostics);
  }

  const knownIds = new Set(identityById.keys());
  diagnoseOrphans(
    input.representations ?? [],
    knownIds,
    "orphan-representation",
    (item) => item.animationId,
    (item) => item.id,
    diagnostics
  );
  diagnoseOrphans(
    input.theseus ?? [],
    knownIds,
    "orphan-theseus",
    (item) => item.animationId,
    (item) => item.controlIds.join(","),
    diagnostics
  );
  diagnoseOrphans(
    input.reviews ?? [],
    knownIds,
    "orphan-review",
    (item) => item.animationId,
    (item) =>
      [...item.current, ...item.historical]
        .map((evidence) => evidence.noteId)
        .join(","),
    diagnostics
  );

  for (const diagnostic of input.sourceDiagnostics ?? []) {
    diagnostics.push({
      code: "source-diagnostic",
      ...(diagnostic.animationId === undefined
        ? {}
        : { animationId: diagnostic.animationId }),
      sourceIds: diagnostic.sourceIds,
      message: diagnostic.message
    });
  }

  const entries = [...identityById.values()]
    .sort((left, right) => left.animationId.localeCompare(right.animationId))
    .map((identity) => {
      const catalog = catalogById.get(identity.animationId);
      const representations = (input.representations ?? [])
        .filter(
          (relationship) => relationship.animationId === identity.animationId
        )
        .sort((left, right) => left.id.localeCompare(right.id));
      const theseus = (input.theseus ?? []).filter(
        (projection) => projection.animationId === identity.animationId
      );
      const reviews = (input.reviews ?? []).filter(
        (projection) => projection.animationId === identity.animationId
      );
      const roadmap = (input.roadmap ?? []).filter(
        (projection) => projection.animationId === identity.animationId
      );
      const entryDiagnostics: KpSemanticAnimationWorkbenchIndexDiagnostic[] = [];
      const promotion = resolveKpAnimationPromotionLineage({
        animationId: identity.animationId
      });
      const presentationAudit = presentationAuditById.get(
        identity.animationId
      );
      const presentationPromotion = presentationAudit === undefined
        ? undefined
        : gateKpCanonicalPresentationPromotion(presentationAudit);
      if (
        catalog?.primaryDescriptor.promotion !== undefined &&
        !samePromotionFacet(
          catalog.primaryDescriptor.promotion,
          promotion.facet
        )
      ) {
        entryDiagnostics.push({
          code: "promotion-lineage-conflict",
          animationId: identity.animationId,
          sourceIds: [
            catalog.primaryDescriptor.id,
            ...promotion.evidenceSourceIds
          ],
          message:
            `Descriptor promotion for ${identity.animationId} disagrees with canonical promotion evidence.`
        });
      }
      const lifecycle = compileLifecycle({
        identity,
        promotion,
        roadmap,
        theseus,
        reviews,
        diagnostics: entryDiagnostics
      });

      diagnostics.push(...entryDiagnostics);
      return {
        schemaVersion:
          "kp.semantic-animation-workbench-index-entry.v1" as const,
        identity,
        summary:
          catalog?.primaryDescriptor.summary ??
          `Planned animation: ${identity.title}.`,
        tags: unique([
          ...(catalog?.primaryDescriptor.tags ?? []),
          ...identity.familyIds,
          ...representations.map((relationship) => relationship.kind)
        ]).sort(),
        representations,
        promotion,
        ...(presentationPromotion === undefined
          ? {}
          : { presentationPromotion }),
        lifecycle,
        controlIds: unique(
          theseus.flatMap((projection) => projection.controlIds)
        ).sort(),
        ...(reviews[0] === undefined ? {} : { review: reviews[0] }),
        diagnostics: entryDiagnostics
      };
    });

  return {
    schemaVersion: "kp.semantic-animation-workbench-index.v1",
    valid: diagnostics.length === 0,
    entries,
    diagnostics
  };
}

function compileLifecycle(input: {
  readonly identity: KpCanonicalAnimationIdentity;
  readonly promotion: KpArtifactPromotionLineage;
  readonly roadmap: readonly KpAnimationRoadmapProjection[];
  readonly theseus: readonly KpAnimationTheseusProjection[];
  readonly reviews: readonly KpAnimationReviewProjection[];
  readonly diagnostics: KpSemanticAnimationWorkbenchIndexDiagnostic[];
}): KpAnimationLifecycleFacets {
  const roadmapStates = unique(input.roadmap.map(({ state }) => state));
  if (roadmapStates.length > 1) {
    input.diagnostics.push({
      code: "duplicate-roadmap-state",
      animationId: input.identity.animationId,
      sourceIds: input.roadmap.map(({ sourceId }) => sourceId),
      message:
        `Roadmap sources for ${input.identity.animationId} disagree: ${roadmapStates.join(", ")}.`
    });
  }
  const executionStates = unique(
    input.theseus.flatMap((projection) =>
      projection.execution === undefined ? [] : [projection.execution]
    )
  );
  const sourceDiagnostics = input.theseus.flatMap(
    (projection) => projection.diagnostics
  );
  if (executionStates.length > 1 || sourceDiagnostics.length > 0) {
    input.diagnostics.push({
      code: "lifecycle-conflict",
      animationId: input.identity.animationId,
      sourceIds: input.theseus.flatMap((projection) => projection.controlIds),
      message:
        sourceDiagnostics[0]?.message ??
        `Execution sources for ${input.identity.animationId} disagree: ${executionStates.join(", ")}.`
    });
  }
  if (input.reviews.length > 1) {
    input.diagnostics.push({
      code: "lifecycle-conflict",
      animationId: input.identity.animationId,
      sourceIds: input.reviews.flatMap((review) =>
        [...review.current, ...review.historical].map(
          (evidence) => evidence.noteId
        )
      ),
      message:
        `Review adapter returned multiple projections for ${input.identity.animationId}.`
    });
  }

  const maturity =
    input.identity.availability === "planned"
      ? "proposed"
      : maturityState(input.promotion.facet.maturity);
  const approval =
    input.promotion.facet.maturity === "gold" ||
    input.promotion.facet.maturity === "promoted"
      ? "approved"
      : "unapproved";

  return createKpAnimationLifecycleFacets({
    roadmap: roadmapStates.length === 1 ? roadmapStates[0]! : "untracked",
    execution:
      executionStates.length === 1 ? executionStates[0]! : "not-scheduled",
    maturity,
    approval,
    review: input.reviews[0]?.state ?? "unreviewed",
    verification: "unknown",
    playability:
      input.identity.availability === "concrete" ? "playable" : "planned-only"
  });
}

function maturityState(
  maturity: KpArtifactMaturity | undefined
): KpAnimationMaturityState {
  switch (maturity) {
    case "promoted":
      return "promoted";
    case "gold":
      return "approved";
    case "reviewable":
      return "reviewable";
    case "draft":
    default:
      return "experimental";
  }
}

function addIdentity(
  identity: KpCanonicalAnimationIdentity,
  identities: Map<string, KpCanonicalAnimationIdentity>,
  diagnostics: KpSemanticAnimationWorkbenchIndexDiagnostic[]
): void {
  if (identities.has(identity.animationId)) {
    diagnostics.push({
      code: "identity-collision",
      animationId: identity.animationId,
      sourceIds: [identity.provenance.kind],
      message: `Duplicate canonical identity ${identity.animationId}.`
    });
    return;
  }
  identities.set(identity.animationId, identity);
}

function diagnoseOrphans<T>(
  items: readonly T[],
  knownIds: ReadonlySet<string>,
  code: Extract<
    KpSemanticAnimationWorkbenchIndexDiagnostic["code"],
    "orphan-representation" | "orphan-review" | "orphan-theseus"
  >,
  animationId: (item: T) => string,
  sourceId: (item: T) => string,
  diagnostics: KpSemanticAnimationWorkbenchIndexDiagnostic[]
): void {
  for (const item of items) {
    const id = animationId(item);
    if (!knownIds.has(id)) {
      diagnostics.push({
        code,
        animationId: id,
        sourceIds: [sourceId(item)],
        message: `${code} references unknown animation ${id}.`
      });
    }
  }
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function samePromotionFacet(
  left: KpArtifactPromotionLineage["facet"],
  right: KpArtifactPromotionLineage["facet"]
): boolean {
  return (
    left.maturity === right.maturity &&
    left.novelty === right.novelty &&
    left.humanReviewRequired === right.humanReviewRequired &&
    left.goldCohort === right.goldCohort
  );
}
