import {
  kpGestaltAccessibilityProjectionKinds,
  type KpGestaltAccessibilityProjectionKind
} from "../animation/gestalt-accessibility.ts";

export interface KpTutorialAccessibilityProjection {
  readonly id: string;
  readonly kind: KpGestaltAccessibilityProjectionKind;
  readonly gestaltProjectionId: string;
  readonly claimIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly semanticIdentityIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly narrationIds: readonly string[];
}

export interface KpTutorialAccessibilityFamily {
  readonly id: string;
  readonly projections: readonly KpTutorialAccessibilityProjection[];
}

export interface KpTutorialAccessibilityDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function compileKpTutorialAccessibilityFamily(input: {
  readonly id: string;
  readonly claimIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly semanticIdentityIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly narrationIds: readonly string[];
}): KpTutorialAccessibilityFamily {
  const semantics = {
    claimIds: [...input.claimIds],
    checkpointIds: [...input.checkpointIds],
    semanticIdentityIds: [...input.semanticIdentityIds],
    evidenceIds: [...input.evidenceIds],
    narrationIds: [...input.narrationIds]
  };

  return {
    id: input.id,
    projections: kpGestaltAccessibilityProjectionKinds.map((kind) => ({
      id: `${input.id}.${kind}`,
      kind,
      gestaltProjectionId: `projection.${kind}`,
      ...semantics
    }))
  };
}

export function validateKpTutorialAccessibilityFamily(
  family: KpTutorialAccessibilityFamily
): readonly KpTutorialAccessibilityDiagnostic[] {
  const diagnostics: KpTutorialAccessibilityDiagnostic[] = [];
  const reference = family.projections.find(({ kind }) => kind === "full");

  kpGestaltAccessibilityProjectionKinds.forEach((kind) => {
    if (!family.projections.some((projection) => projection.kind === kind)) {
      diagnostics.push({
        path: "projections",
        message: `Missing tutorial accessibility projection ${kind}.`
      });
    }
  });
  if (reference === undefined) return diagnostics;

  family.projections.forEach((projection, index) => {
    for (const field of [
      "claimIds",
      "checkpointIds",
      "semanticIdentityIds",
      "evidenceIds",
      "narrationIds"
    ] as const) {
      if (JSON.stringify(projection[field]) !== JSON.stringify(reference[field])) {
        diagnostics.push({
          path: `projections[${index}].${field}`,
          message: `${projection.kind} projection changed explanatory semantics.`
        });
      }
    }
  });

  return diagnostics;
}
