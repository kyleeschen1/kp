import type {
  KpAnimationCapabilityPlan,
  KpAnimationCapabilityRequirement,
  KpAnimationCapabilityRequirementKind
} from "./animation-capability-plan.ts";
import {
  createKpAnimationCapabilityAssetEvidence,
  type KpAnimationCapabilityAssetEvidence,
  type KpAnimationCapabilityAssetRequirementEvidence
} from "./animation-capability-asset-evidence.ts";
import {
  createKpAnimationCapabilityCompilerEvidence,
  type KpAnimationCapabilityCompilerEvidence,
  type KpAnimationCapabilityCompilerRequirementEvidence
} from "./animation-capability-compiler-evidence.ts";
import {
  createKpAnimationCapabilityReadiness,
  type KpAnimationCapabilityDirectIntentEvidence,
  type KpAnimationCapabilityReadiness,
  type KpAnimationCapabilityReadinessStatus
} from "./animation-capability-readiness.ts";
import {
  createKpAnimationDomainFrontendEvidence,
  type KpAnimationDomainFrontendEvidence,
  type KpAnimationDomainFrontendRequirementEvidence
} from "./animation-domain-frontend-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";
import { kpCalculusBcSymbolicMathematicsTaxonomy } from
  "./symbolic-mathematics-capability-taxonomy.ts";
import { kpSymbolicCoverageMaturityDimensions } from
  "./symbolic-mathematics-maturity.ts";

export const KP_ANIMATION_TRANSFORMATION_COVERAGE_SCHEMA =
  "kp.animation-transformation-coverage.v1" as const;

export interface KpAnimationTransformationCoverage {
  readonly schemaVersion:
    typeof KP_ANIMATION_TRANSFORMATION_COVERAGE_SCHEMA;
  readonly kind: "animation-transformation-coverage";
  readonly generatedFrom: Readonly<{
    planId: string;
    planSchemaVersion: string;
    assetEvidenceSchemaVersion: string;
    compilerEvidenceSchemaVersion: string;
    frontendEvidenceSchemaVersion: string;
    readinessSchemaVersion: string;
  }>;
  readonly summary: Readonly<{
    total: number;
    byStatus: Readonly<Record<KpAnimationCapabilityReadinessStatus, number>>;
  }>;
  readonly symbolicMathematics: KpSymbolicMathematicsCoverageProjection;
  readonly entries: readonly KpAnimationTransformationCoverageEntry[];
}

export interface KpSymbolicMathematicsCoverageProjection {
  readonly taxonomyId: string;
  readonly taxonomySchemaVersion: string;
  readonly maturityDimensions: readonly Readonly<{
    id: string;
    label: string;
    claim: string;
  }>[];
  readonly groups: readonly Readonly<{
    id: string;
    order: number;
    title: string;
    capabilityIds: readonly string[];
    byStatus: Readonly<Record<KpAnimationCapabilityReadinessStatus, number>>;
  }>[];
}

export interface KpAnimationTransformationCoverageEntry {
  readonly capabilityId: string;
  readonly order: number;
  readonly domain: KpAnimationCapabilityPlan["entries"][number]["domain"];
  readonly title: string;
  readonly scope: KpAnimationCapabilityPlan["entries"][number]["scope"];
  readonly status: KpAnimationCapabilityReadinessStatus;
  readonly requirements:
    readonly KpAnimationTransformationCoverageRequirement[];
  readonly gaps: readonly KpAnimationTransformationCoverageGap[];
  readonly remainingRequirementIds: readonly string[];
  readonly exemplarLinks: readonly Readonly<{
    assetId: string;
    title: string;
    href?: string | undefined;
  }>[];
  readonly evidenceTensions: readonly KpAnimationCoverageEvidenceTension[];
}

export type KpAnimationTransformationCoverageRequirement = Readonly<{
  id: string;
  kind: KpAnimationCapabilityRequirementKind;
  authorityId: string;
  summary: string;
  status: "satisfied" | "missing";
  evidenceSourceIds: readonly string[];
}>;

export type KpAnimationTransformationCoverageGap = Readonly<{
  kind: "frontend-required";
  requirementId: string;
  authorityId: string;
  repair: "Provide exact evidence from the declared domain-owned frontend.";
}>;

export type KpAnimationCoverageEvidenceTension =
  | "direct-deterministic-not-live-model-evidence"
  | "registered-without-direct-generation"
  | "playable-exemplar-without-general-generation"
  | "planned-capability-without-exact-asset";

/**
 * The generated artifact is a compact projection for product surfaces. It
 * carries evidence links and gaps, but cannot become a second editable plan.
 */
export function compileKpAnimationTransformationCoverage(input: {
  readonly plan: KpAnimationCapabilityPlan;
  readonly assetEvidence: KpAnimationCapabilityAssetEvidence;
  readonly compilerEvidence: KpAnimationCapabilityCompilerEvidence;
  readonly frontendEvidence: KpAnimationDomainFrontendEvidence;
  readonly readiness: KpAnimationCapabilityReadiness;
}): KpAnimationTransformationCoverage {
  const entries = Object.freeze(input.plan.entries.map((capability) => {
    const readiness = requiredReadiness(capability.id, input.readiness);
    const requirements = Object.freeze(capability.requirements.map(
      (requirement) => projectRequirement({
        capabilityId: capability.id,
        requirement,
        assetEvidence: input.assetEvidence.requirements,
        compilerEvidence: input.compilerEvidence.requirements,
        frontendEvidence: input.frontendEvidence.requirements,
        directIntentEvidence: input.readiness.directIntentEvidence
      })
    ));
    const gaps = Object.freeze(input.frontendEvidence.requirements
      .filter((evidence) => evidence.capabilityId === capability.id &&
        evidence.status === "missing")
      .map((evidence): KpAnimationTransformationCoverageGap => Object.freeze({
        kind: "frontend-required" as const,
        requirementId: evidence.requirementId,
        authorityId: evidence.authorityId,
        repair:
          "Provide exact evidence from the declared domain-owned frontend." as const
      })));
    const exemplarLinks = Object.freeze(input.assetEvidence.requirements
      .filter((evidence): evidence is Extract<
        KpAnimationCapabilityAssetRequirementEvidence,
        { readonly status: "matched" }
      > => evidence.capabilityId === capability.id &&
        evidence.status === "matched")
      .map(({ asset }) => Object.freeze({
        assetId: asset.assetId,
        title: asset.title,
        ...(asset.href === undefined ? {} : { href: asset.href })
      })));
    return Object.freeze({
      capabilityId: capability.id,
      order: capability.order,
      domain: capability.domain,
      title: capability.title,
      scope: Object.freeze({ ...capability.scope }),
      status: readiness.status,
      requirements,
      gaps,
      remainingRequirementIds: Object.freeze(requirements
        .filter(({ status }) => status === "missing")
        .map(({ id }) => id)),
      exemplarLinks,
      evidenceTensions: tensions(readiness.status, exemplarLinks.length)
    });
  }));
  const byStatus: Record<KpAnimationCapabilityReadinessStatus, number> = {
    Direct: 0,
    Registered: 0,
    Exemplar: 0,
    Missing: 0
  };
  entries.forEach(({ status }) => { byStatus[status] += 1; });
  const symbolicMathematics = projectSymbolicMathematicsCoverage(entries);
  return Object.freeze({
    schemaVersion: KP_ANIMATION_TRANSFORMATION_COVERAGE_SCHEMA,
    kind: "animation-transformation-coverage" as const,
    generatedFrom: Object.freeze({
      planId: input.plan.id,
      planSchemaVersion: input.plan.schemaVersion,
      assetEvidenceSchemaVersion: input.assetEvidence.schemaVersion,
      compilerEvidenceSchemaVersion: input.compilerEvidence.schemaVersion,
      frontendEvidenceSchemaVersion: input.frontendEvidence.schemaVersion,
      readinessSchemaVersion: input.readiness.schemaVersion
    }),
    summary: Object.freeze({
      total: entries.length,
      byStatus: Object.freeze(byStatus)
    }),
    symbolicMathematics,
    entries
  });
}

export function createKpAnimationTransformationCoverage():
KpAnimationTransformationCoverage {
  return compileKpAnimationTransformationCoverage({
    plan: kpAnimationCapabilityPlan,
    assetEvidence: createKpAnimationCapabilityAssetEvidence(),
    compilerEvidence: createKpAnimationCapabilityCompilerEvidence(),
    frontendEvidence: createKpAnimationDomainFrontendEvidence(),
    readiness: createKpAnimationCapabilityReadiness()
  });
}

function projectRequirement(input: {
  readonly capabilityId: string;
  readonly requirement: KpAnimationCapabilityRequirement;
  readonly assetEvidence:
    readonly KpAnimationCapabilityAssetRequirementEvidence[];
  readonly compilerEvidence:
    readonly KpAnimationCapabilityCompilerRequirementEvidence[];
  readonly frontendEvidence:
    readonly KpAnimationDomainFrontendRequirementEvidence[];
  readonly directIntentEvidence:
    readonly KpAnimationCapabilityDirectIntentEvidence[];
}): KpAnimationTransformationCoverageRequirement {
  const evidenceSourceIds: string[] = [];
  const asset = input.assetEvidence.find((evidence) =>
    evidence.capabilityId === input.capabilityId &&
    evidence.requirementId === input.requirement.id &&
    evidence.status === "matched"
  );
  if (asset?.status === "matched") {
    evidenceSourceIds.push(asset.assetId);
  }
  const compiler = input.compilerEvidence.find((evidence) =>
    evidence.capabilityId === input.capabilityId &&
    evidence.requirementId === input.requirement.id &&
    evidence.status === "matched"
  );
  if (compiler?.status === "matched") {
    evidenceSourceIds.push(...compiler.evidence.map(({ sourceId }) => sourceId));
  }
  if (input.requirement.kind === "authoring-surface") {
    evidenceSourceIds.push(...input.directIntentEvidence
      .filter(({ authoringAuthorityId }) =>
        authoringAuthorityId === input.requirement.authorityId)
      .map(({ sourcePath }) => sourcePath));
  }
  if (input.requirement.kind === "generation-corpus") {
    evidenceSourceIds.push(...input.directIntentEvidence.flatMap((intent) =>
      intent.generationCorpusAuthorityIds.includes(input.requirement.authorityId)
        ? [input.requirement.authorityId]
        : []
    ));
  }
  if (input.requirement.kind === "domain-frontend") {
    const frontend = input.frontendEvidence.find((evidence) =>
      evidence.capabilityId === input.capabilityId &&
      evidence.requirementId === input.requirement.id &&
      evidence.status === "matched"
    );
    if (frontend?.status === "matched") {
      evidenceSourceIds.push(frontend.evidence.sourcePath);
    }
  }
  return Object.freeze({
    id: input.requirement.id,
    kind: input.requirement.kind,
    authorityId: input.requirement.authorityId,
    summary: input.requirement.summary,
    status: evidenceSourceIds.length > 0 ? "satisfied" as const : "missing" as const,
    evidenceSourceIds: Object.freeze([...new Set(evidenceSourceIds)])
  });
}

function requiredReadiness(
  capabilityId: string,
  readiness: KpAnimationCapabilityReadiness
): KpAnimationCapabilityReadiness["entries"][number] {
  const entry = readiness.entries.find((candidate) =>
    candidate.capabilityId === capabilityId
  );
  if (entry === undefined) {
    throw new Error(`Missing readiness evidence for ${capabilityId}.`);
  }
  return entry;
}

function tensions(
  status: KpAnimationCapabilityReadinessStatus,
  exemplarCount: number
): readonly KpAnimationCoverageEvidenceTension[] {
  if (status === "Direct") {
    return Object.freeze([
      "direct-deterministic-not-live-model-evidence" as const
    ]);
  }
  if (status === "Registered") {
    return Object.freeze([
      "registered-without-direct-generation" as const,
      ...(exemplarCount > 0
        ? ["playable-exemplar-without-general-generation" as const]
        : [])
    ]);
  }
  if (status === "Exemplar") {
    return Object.freeze([
      "playable-exemplar-without-general-generation" as const
    ]);
  }
  return Object.freeze([
    "planned-capability-without-exact-asset" as const
  ]);
}

function projectSymbolicMathematicsCoverage(
  entries: readonly KpAnimationTransformationCoverageEntry[]
): KpSymbolicMathematicsCoverageProjection {
  const entriesById = new Map(entries.map((entry) => [
    entry.capabilityId,
    entry
  ]));
  const groups = kpCalculusBcSymbolicMathematicsTaxonomy.groups.map((group) => {
    const byStatus: Record<KpAnimationCapabilityReadinessStatus, number> = {
      Direct: 0,
      Registered: 0,
      Exemplar: 0,
      Missing: 0
    };
    for (const capabilityId of group.capabilityIds) {
      const entry = entriesById.get(capabilityId);
      if (entry === undefined) {
        throw new Error(
          `Taxonomy group ${group.id} references absent coverage ${capabilityId}.`
        );
      }
      byStatus[entry.status] += 1;
    }
    return Object.freeze({
      id: group.id,
      order: group.order,
      title: group.title,
      capabilityIds: Object.freeze([...group.capabilityIds]),
      byStatus: Object.freeze(byStatus)
    });
  });
  return Object.freeze({
    taxonomyId: kpCalculusBcSymbolicMathematicsTaxonomy.id,
    taxonomySchemaVersion:
      kpCalculusBcSymbolicMathematicsTaxonomy.schemaVersion,
    maturityDimensions: Object.freeze(
      kpSymbolicCoverageMaturityDimensions.map((dimension) =>
        Object.freeze({ ...dimension })
      )
    ),
    groups: Object.freeze(groups)
  });
}
