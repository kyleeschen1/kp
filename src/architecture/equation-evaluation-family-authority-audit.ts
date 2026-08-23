import {
  resolveKpOperationEvaluationFamilyReleaseRegistration
} from "../animation/operation-evaluation-family-profile.ts";
import {
  kpCanonicalOperationEvaluationTransformationKinds
} from "../animation/operation-evaluation-presentation-types.ts";
import {
  kpEquationEvaluationAuthorityRegistryV2,
  type KpEquationEvaluationAuthorityRegistryV2
} from "../domain-ir/equation-evaluation-authority-registry-v2.ts";

export interface KpEquationEvaluationFamilyAuthorityIssue {
  readonly authorityId: string;
  readonly transformationKind: string;
  readonly claimedFamilyProfileId: string;
  readonly runtimeFamilyProfileId?: string | undefined;
  readonly code:
    | "evaluation-family.missing-runtime-profile"
    | "evaluation-family.profile-mismatch";
}

/**
 * Governance and runtime currently expose separate registries. This audit
 * makes disagreement observable until presentation selection has one owner.
 */
export function auditKpEquationEvaluationFamilyAuthority(input: {
  readonly registry?: KpEquationEvaluationAuthorityRegistryV2 | undefined;
} = {}): readonly KpEquationEvaluationFamilyAuthorityIssue[] {
  const registry = input.registry ?? kpEquationEvaluationAuthorityRegistryV2;
  const canonicalKinds = new Set<string>(
    kpCanonicalOperationEvaluationTransformationKinds
  );
  const issues: KpEquationEvaluationFamilyAuthorityIssue[] = [];
  registry.entries.forEach((entry) => {
    if (entry.presentationAuthority.kind !==
        "registered-operation-evaluation") {
      return;
    }
    const authority = entry.presentationAuthority;
    entry.transformationKinds.forEach((transformationKind) => {
      if (!canonicalKinds.has(transformationKind)) return;
      const runtime = resolveKpOperationEvaluationFamilyReleaseRegistration(
        transformationKind
      );
      if (runtime === undefined) {
        issues.push(Object.freeze({
          authorityId: entry.id,
          transformationKind,
          claimedFamilyProfileId: authority.familyProfileId,
          code: "evaluation-family.missing-runtime-profile" as const
        }));
        return;
      }
      if (runtime.familyProfileId === authority.familyProfileId) return;
      issues.push(Object.freeze({
        authorityId: entry.id,
        transformationKind,
        claimedFamilyProfileId: authority.familyProfileId,
        runtimeFamilyProfileId: runtime.familyProfileId,
        code: "evaluation-family.profile-mismatch" as const
      }));
    });
  });
  return Object.freeze(issues);
}
