import type {
  KpAnimationCapabilityDomain,
  KpAnimationCapabilityPlan
} from "./animation-capability-plan.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";

export const KP_ANIMATION_DOMAIN_FRONTEND_EVIDENCE_SCHEMA =
  "kp.animation-domain-frontend-evidence.v1" as const;

export interface KpAnimationDomainFrontendAuthority {
  readonly authorityId: string;
  readonly domain: Exclude<KpAnimationCapabilityDomain, "equation">;
  readonly sourcePath: string;
}

export type KpAnimationDomainFrontendRequirementEvidence =
  | Readonly<{
      capabilityId: string;
      requirementId: string;
      authorityId: string;
      domain: Exclude<KpAnimationCapabilityDomain, "equation">;
      status: "matched";
      evidence: KpAnimationDomainFrontendAuthority;
    }>
  | Readonly<{
      capabilityId: string;
      requirementId: string;
      authorityId: string;
      domain: Exclude<KpAnimationCapabilityDomain, "equation">;
      status: "missing";
      reason: "frontend-required";
    }>;

export interface KpAnimationDomainFrontendEvidence {
  readonly schemaVersion:
    typeof KP_ANIMATION_DOMAIN_FRONTEND_EVIDENCE_SCHEMA;
  readonly kind: "animation-domain-frontend-evidence";
  readonly authorities: readonly KpAnimationDomainFrontendAuthority[];
  readonly requirements:
    readonly KpAnimationDomainFrontendRequirementEvidence[];
}

export interface KpAnimationDomainFrontendEvidenceDiagnostic {
  readonly code:
    | "frontend-evidence.duplicate-authority"
    | "frontend-evidence.domain-mismatch";
  readonly authorityId: string;
  readonly message: string;
}

export class KpAnimationDomainFrontendEvidenceError extends Error {
  override readonly name = "KpAnimationDomainFrontendEvidenceError";
  readonly diagnostics:
    readonly KpAnimationDomainFrontendEvidenceDiagnostic[];

  constructor(
    diagnostics: readonly KpAnimationDomainFrontendEvidenceDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

/**
 * Planned frontend IDs are requirements, not proof that an implementation
 * exists. This exact-ID join is the only route by which a domain can close its
 * frontend gap without teaching shared infrastructure that domain's syntax.
 */
export function compileKpAnimationDomainFrontendEvidence(input: {
  readonly plan: KpAnimationCapabilityPlan;
  readonly authorities: readonly KpAnimationDomainFrontendAuthority[];
}): KpAnimationDomainFrontendEvidence {
  const diagnostics: KpAnimationDomainFrontendEvidenceDiagnostic[] = [];
  const authorities = Object.freeze(input.authorities.map((candidate) =>
    Object.freeze({ ...candidate })
  ));
  const authorityById = new Map<string, KpAnimationDomainFrontendAuthority>();
  for (const authority of authorities) {
    if (authorityById.has(authority.authorityId)) {
      diagnostics.push(issue(
        "frontend-evidence.duplicate-authority",
        authority.authorityId,
        `Duplicate frontend authority ${authority.authorityId}.`
      ));
    } else authorityById.set(authority.authorityId, authority);
  }

  const requirements = Object.freeze(input.plan.entries.flatMap((capability) =>
    capability.requirements.flatMap((requirement) => {
      if (requirement.kind !== "domain-frontend") return [];
      if (capability.domain === "equation") {
        throw new Error(
          `${capability.id} cannot use the cross-domain frontend evidence seam.`
        );
      }
      const evidence = authorityById.get(requirement.authorityId);
      if (evidence !== undefined && evidence.domain !== capability.domain) {
        diagnostics.push(issue(
          "frontend-evidence.domain-mismatch",
          evidence.authorityId,
          `${evidence.authorityId} claims ${evidence.domain}, but ` +
            `${capability.id} requires ${capability.domain}.`
        ));
      }
      const projected: KpAnimationDomainFrontendRequirementEvidence =
        evidence === undefined || evidence.domain !== capability.domain
          ? Object.freeze({
              capabilityId: capability.id,
              requirementId: requirement.id,
              authorityId: requirement.authorityId,
              domain: capability.domain,
              status: "missing" as const,
              reason: "frontend-required" as const
            })
          : Object.freeze({
              capabilityId: capability.id,
              requirementId: requirement.id,
              authorityId: requirement.authorityId,
              domain: capability.domain,
              status: "matched" as const,
              evidence
            });
      return [projected];
    })
  ));

  if (diagnostics.length > 0) {
    throw new KpAnimationDomainFrontendEvidenceError(diagnostics);
  }
  return Object.freeze({
    schemaVersion: KP_ANIMATION_DOMAIN_FRONTEND_EVIDENCE_SCHEMA,
    kind: "animation-domain-frontend-evidence" as const,
    authorities,
    requirements
  });
}

export function createKpAnimationDomainFrontendEvidence():
KpAnimationDomainFrontendEvidence {
  return compileKpAnimationDomainFrontendEvidence({
    plan: kpAnimationCapabilityPlan,
    // No cross-domain generation frontend has yet earned this exact contract.
    authorities: Object.freeze([])
  });
}

function issue(
  code: KpAnimationDomainFrontendEvidenceDiagnostic["code"],
  authorityId: string,
  message: string
): KpAnimationDomainFrontendEvidenceDiagnostic {
  return Object.freeze({ code, authorityId, message });
}
