import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";

export type KpContinuantRelation =
  | "identity"
  | "role-change"
  | "representation-change";

export const kpContinuantRelations: readonly KpContinuantRelation[] = [
  "identity",
  "role-change",
  "representation-change"
];

export type KpContinuantIdentityAuthority =
  | {
      readonly kind: "canonical-operation";
      readonly operationId: string;
      readonly bindingId: string;
    }
  | {
      readonly kind: "correspondence";
      readonly transformationId: string;
      readonly correspondenceRecordId: string;
    };

export interface KpChoreographyEntityRef {
  readonly entityId: string;
  readonly selectorIds: readonly string[];
}

export interface KpSemanticContinuant {
  readonly id: string;
  readonly meaning: string;
  readonly relation: KpContinuantRelation;
  readonly source: KpChoreographyEntityRef;
  readonly target: KpChoreographyEntityRef;
  readonly identityAuthority: KpContinuantIdentityAuthority;
}

export type KpRepresentationalLineageCause =
  | {
      readonly kind: "canonical-operation";
      readonly operationId: string;
      readonly bindingId: string;
    }
  | {
      readonly kind: "transformation";
      readonly transformationId: string;
      readonly correspondenceRecordIds: readonly string[];
    };

export interface KpRepresentationalLineage {
  readonly id: string;
  readonly meaning: string;
  readonly sourceRepresentation: KpChoreographyEntityRef;
  readonly targetRepresentation: KpChoreographyEntityRef;
  readonly cause: KpRepresentationalLineageCause;
}

export type KpSemanticObjectConstancyMode =
  | "continuous"
  | "ownership-handoff"
  | "group-cohesion";

export const kpSemanticObjectConstancyModes:
  readonly KpSemanticObjectConstancyMode[] = [
    "continuous",
    "ownership-handoff",
    "group-cohesion"
  ];

export const kpSemanticObjectConstancyDimensions = [
  "movement",
  "seek",
  "rewind",
  "renderer-handoff"
] as const;

export type KpSemanticObjectConstancyDimension =
  (typeof kpSemanticObjectConstancyDimensions)[number];

export interface KpSemanticObjectConstancyRequirement {
  readonly id: string;
  readonly continuantId: string;
  readonly mode: KpSemanticObjectConstancyMode;
  readonly preserveThrough: readonly KpSemanticObjectConstancyDimension[];
}

export type KpPerceptualMaterialContinuityMode =
  | "continuant-motion"
  | "shared-reconciliation"
  | "causal-derivation";

export const kpPerceptualMaterialContinuityModes:
  readonly KpPerceptualMaterialContinuityMode[] = [
    "continuant-motion",
    "shared-reconciliation",
    "causal-derivation"
  ];

export interface KpPerceptualMaterialContinuityRequirement {
  readonly id: string;
  readonly mode: KpPerceptualMaterialContinuityMode;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly authorityRef:
    | {
        readonly kind: "continuant";
        readonly continuantId: string;
      }
    | {
        readonly kind: "representational-lineage";
        readonly lineageId: string;
      };
  readonly summary: string;
}

export type KpChoreographyMotionClass =
  | "meaningful"
  | "accommodation"
  | "attention"
  | "cleanup";

export const kpChoreographyMotionClasses:
  readonly KpChoreographyMotionClass[] = [
    "meaningful",
    "accommodation",
    "attention",
    "cleanup"
  ];

export interface KpChoreographyMotionClassification {
  readonly id: string;
  readonly entityIds: readonly string[];
  readonly motionClass: KpChoreographyMotionClass;
  readonly reason: string;
}

export interface KpChoreographyVocabulary {
  readonly id: string;
  readonly continuants: readonly KpSemanticContinuant[];
  readonly representationalLineages: readonly KpRepresentationalLineage[];
  readonly objectConstancy: readonly KpSemanticObjectConstancyRequirement[];
  readonly materialContinuity:
    readonly KpPerceptualMaterialContinuityRequirement[];
  readonly motionClassifications:
    readonly KpChoreographyMotionClassification[];
}

export function checkKpChoreographyVocabularyContract(
  vocabulary: KpChoreographyVocabulary
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const continuantIds = uniqueIds(
    vocabulary.continuants,
    "continuants",
    failures
  );
  const lineageIds = uniqueIds(
    vocabulary.representationalLineages,
    "representationalLineages",
    failures
  );

  requireText(vocabulary.id, "id", failures);
  vocabulary.continuants.forEach((continuant, index) => {
    const path = `continuants[${index}]`;
    requireText(continuant.id, `${path}.id`, failures);
    requireText(continuant.meaning, `${path}.meaning`, failures);
    requireEnum(
      continuant.relation,
      kpContinuantRelations,
      `${path}.relation`,
      "continuant relation",
      failures
    );
    validateEntityRef(continuant.source, `${path}.source`, failures);
    validateEntityRef(continuant.target, `${path}.target`, failures);
    validateIdentityAuthority(
      continuant.identityAuthority,
      `${path}.identityAuthority`,
      failures
    );
  });

  vocabulary.representationalLineages.forEach((lineage, index) => {
    const path = `representationalLineages[${index}]`;
    requireText(lineage.id, `${path}.id`, failures);
    requireText(lineage.meaning, `${path}.meaning`, failures);
    validateEntityRef(
      lineage.sourceRepresentation,
      `${path}.sourceRepresentation`,
      failures
    );
    validateEntityRef(
      lineage.targetRepresentation,
      `${path}.targetRepresentation`,
      failures
    );
    if (
      lineage.sourceRepresentation.entityId ===
      lineage.targetRepresentation.entityId
    ) {
      failures.push({
        path,
        message:
          "Representational lineage must connect distinct representations; use a semantic continuant for one entity."
      });
    }
    validateLineageCause(lineage.cause, `${path}.cause`, failures);
  });

  vocabulary.objectConstancy.forEach((requirement, index) => {
    const path = `objectConstancy[${index}]`;
    requireText(requirement.id, `${path}.id`, failures);
    requireReference(
      requirement.continuantId,
      continuantIds,
      `${path}.continuantId`,
      "semantic continuant",
      failures
    );
    requireEnum(
      requirement.mode,
      kpSemanticObjectConstancyModes,
      `${path}.mode`,
      "semantic object constancy mode",
      failures
    );
    requireNonEmpty(
      requirement.preserveThrough,
      `${path}.preserveThrough`,
      failures
    );
    requirement.preserveThrough.forEach((dimension, dimensionIndex) => {
      requireEnum(
        dimension,
        kpSemanticObjectConstancyDimensions,
        `${path}.preserveThrough[${dimensionIndex}]`,
        "semantic object constancy dimension",
        failures
      );
    });
  });

  vocabulary.materialContinuity.forEach((requirement, index) => {
    const path = `materialContinuity[${index}]`;
    requireText(requirement.id, `${path}.id`, failures);
    requireText(requirement.summary, `${path}.summary`, failures);
    requireEnum(
      requirement.mode,
      kpPerceptualMaterialContinuityModes,
      `${path}.mode`,
      "perceptual material continuity mode",
      failures
    );
    requireNonEmpty(
      requirement.sourceEntityIds,
      `${path}.sourceEntityIds`,
      failures
    );
    requireNonEmpty(
      requirement.targetEntityIds,
      `${path}.targetEntityIds`,
      failures
    );
    if (requirement.authorityRef.kind === "continuant") {
      requireReference(
        requirement.authorityRef.continuantId,
        continuantIds,
        `${path}.authorityRef.continuantId`,
        "semantic continuant",
        failures
      );
    } else if (
      requirement.authorityRef.kind === "representational-lineage"
    ) {
      requireReference(
        requirement.authorityRef.lineageId,
        lineageIds,
        `${path}.authorityRef.lineageId`,
        "representational lineage",
        failures
      );
    } else {
      failures.push({
        path: `${path}.authorityRef.kind`,
        message:
          "Perceptual material continuity requires a continuant or representational-lineage authority."
      });
    }
  });

  vocabulary.motionClassifications.forEach((classification, index) => {
    const path = `motionClassifications[${index}]`;
    requireText(classification.id, `${path}.id`, failures);
    requireText(classification.reason, `${path}.reason`, failures);
    requireNonEmpty(classification.entityIds, `${path}.entityIds`, failures);
    requireEnum(
      classification.motionClass,
      kpChoreographyMotionClasses,
      `${path}.motionClass`,
      "choreography motion class",
      failures
    );
  });

  return {
    lawId: "animation.choreography-vocabulary",
    passed: failures.length === 0,
    failures
  };
}

function validateIdentityAuthority(
  authority: KpContinuantIdentityAuthority,
  path: string,
  failures: KpLawFailure[]
): void {
  if (authority.kind === "canonical-operation") {
    requireText(authority.operationId, `${path}.operationId`, failures);
    requireText(authority.bindingId, `${path}.bindingId`, failures);
    return;
  }
  if (authority.kind === "correspondence") {
    requireText(
      authority.transformationId,
      `${path}.transformationId`,
      failures
    );
    requireText(
      authority.correspondenceRecordId,
      `${path}.correspondenceRecordId`,
      failures
    );
    return;
  }
  failures.push({
    path: `${path}.kind`,
    message:
      "Continuant identity must come from a canonical operation or explicit correspondence, never glyph, LaTeX, DOM, or geometry matching."
  });
}

function validateLineageCause(
  cause: KpRepresentationalLineageCause,
  path: string,
  failures: KpLawFailure[]
): void {
  if (cause.kind === "canonical-operation") {
    requireText(cause.operationId, `${path}.operationId`, failures);
    requireText(cause.bindingId, `${path}.bindingId`, failures);
    return;
  }
  if (cause.kind === "transformation") {
    requireText(cause.transformationId, `${path}.transformationId`, failures);
    requireNonEmpty(
      cause.correspondenceRecordIds,
      `${path}.correspondenceRecordIds`,
      failures
    );
    return;
  }
  failures.push({
    path: `${path}.kind`,
    message:
      "Representational lineage requires a canonical operation or transformation cause."
  });
}

function validateEntityRef(
  ref: KpChoreographyEntityRef,
  path: string,
  failures: KpLawFailure[]
): void {
  requireText(ref.entityId, `${path}.entityId`, failures);
  requireNonEmpty(ref.selectorIds, `${path}.selectorIds`, failures);
}

function uniqueIds<T extends { readonly id: string }>(
  values: readonly T[],
  path: string,
  failures: KpLawFailure[]
): ReadonlySet<string> {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    if (ids.has(value.id)) {
      failures.push({
        path: `${path}[${index}].id`,
        message: `Duplicate choreography vocabulary id ${value.id}.`
      });
    }
    ids.add(value.id);
  });
  return ids;
}

function requireReference(
  id: string,
  ids: ReadonlySet<string>,
  path: string,
  kind: string,
  failures: KpLawFailure[]
): void {
  if (!ids.has(id)) {
    failures.push({
      path,
      message: `Unknown ${kind} ${id}.`
    });
  }
}

function requireText(
  value: string,
  path: string,
  failures: KpLawFailure[]
): void {
  if (value.trim().length === 0) {
    failures.push({
      path,
      message: "Expected non-empty text."
    });
  }
}

function requireNonEmpty<T>(
  values: readonly T[],
  path: string,
  failures: KpLawFailure[]
): void {
  if (values.length === 0) {
    failures.push({
      path,
      message: "Expected at least one entry."
    });
  }
}

function requireEnum<T extends string>(
  value: T,
  allowed: readonly T[],
  path: string,
  label: string,
  failures: KpLawFailure[]
): void {
  if (!allowed.includes(value)) {
    failures.push({
      path,
      message: `Unknown ${label} ${value}.`
    });
  }
}
