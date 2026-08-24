import type {
  KpAnimationCapabilityDomain,
  KpAnimationCapabilityPlan
} from "./animation-capability-plan.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";
import {
  kpCodeFrontendProofObligations,
  type KpCodeFrontendProofObligation
} from "./animation-domain-frontend-candidates.ts";
import {
  KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
  KP_GRAPH_2D_FUNCTION_FRONTEND_SOURCE
} from "../domain-ir/graph-2d-function-generation-request.ts";

export const KP_ANIMATION_DOMAIN_FRONTEND_EVIDENCE_SCHEMA =
  "kp.animation-domain-frontend-evidence.v1" as const;

export interface KpAnimationDomainFrontendAuthority {
  readonly authorityId: string;
  readonly domain: Exclude<KpAnimationCapabilityDomain, "equation">;
  readonly sourcePath: string;
  readonly proof?: readonly Readonly<{
    obligation: KpCodeFrontendProofObligation;
    evidenceSourceIds: readonly string[];
  }>[];
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
    | "frontend-evidence.domain-mismatch"
    | "frontend-evidence.proof-incomplete";
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
    Object.freeze({
      ...candidate,
      ...(candidate.proof === undefined ? {} : {
        proof: Object.freeze(candidate.proof.map((entry) => Object.freeze({
          ...entry,
          evidenceSourceIds: Object.freeze([...entry.evidenceSourceIds])
        })))
      })
    })
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
    const plannedCodeAuthority = input.plan.entries.some((capability) =>
      capability.domain === "code" && capability.requirements.some(
        ({ kind, authorityId }) => kind === "domain-frontend" &&
          authorityId === authority.authorityId
      )
    );
    if (plannedCodeAuthority && !completeCodeProof(authority.proof)) {
      diagnostics.push(issue(
        "frontend-evidence.proof-incomplete",
        authority.authorityId,
        `${authority.authorityId} must prove every code frontend obligation with exact sources.`
      ));
    }
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
    authorities: Object.freeze([
      codeAuthority(
        "frontend.code.typescript-compiler.v1",
        "scripts/typescript-code-generation-frontend.ts",
        {
          "parse-source": "scripts/typescript-refactor-frontend.ts",
          "recognize-extract-helper-roles":
            "scripts/typescript-extract-helper-role-recognizer.ts",
          "prove-refactor-legality":
            "scripts/typescript-extract-helper-legality.ts",
          "bind-semantic-identity":
            "scripts/typescript-extract-helper-semantic-binder.ts",
          "compile-operation":
            "scripts/typescript-code-generation-frontend.ts",
          "bind-causal-recipe":
            "tests/code-extract-helper-causal-recipe.test.ts",
          "pass-generation-corpus":
            "tests/typescript-extract-helper-generation-corpus.test.ts",
          "prove-runtime-isolation":
            "tests/typescript-code-generation-runtime-isolation.test.ts"
        }
      ),
      codeAuthority(
        "frontend.code.python-ast.v1",
        "scripts/python-code-generation-frontend.ts",
        {
          "parse-source": "scripts/python-refactor-frontend.py",
          "recognize-extract-helper-roles":
            "scripts/python-extract-helper-role-recognizer.ts",
          "prove-refactor-legality":
            "scripts/python-extract-helper-legality.ts",
          "bind-semantic-identity":
            "scripts/python-extract-helper-semantic-binder.ts",
          "compile-operation": "scripts/python-code-generation-frontend.ts",
          "bind-causal-recipe":
            "tests/code-extract-helper-causal-recipe.test.ts",
          "pass-generation-corpus":
            "tests/python-extract-helper-generation-corpus.test.ts",
          "prove-runtime-isolation":
            "tests/python-code-generation-runtime-isolation.test.ts"
        }
      ),
      {
        authorityId: KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
        domain: "graph-2d",
        sourcePath: KP_GRAPH_2D_FUNCTION_FRONTEND_SOURCE
      }
    ])
  });
}

function codeAuthority(
  authorityId: string,
  sourcePath: string,
  evidence: Readonly<Record<KpCodeFrontendProofObligation, string>>
): KpAnimationDomainFrontendAuthority {
  return Object.freeze({
    authorityId,
    domain: "code" as const,
    sourcePath,
    proof: Object.freeze(kpCodeFrontendProofObligations.map((obligation) =>
      Object.freeze({
        obligation,
        evidenceSourceIds: Object.freeze([evidence[obligation]])
      })
    ))
  });
}

function completeCodeProof(
  proof: KpAnimationDomainFrontendAuthority["proof"]
): boolean {
  if (proof === undefined || proof.length !==
      kpCodeFrontendProofObligations.length) return false;
  return kpCodeFrontendProofObligations.every((obligation) => {
    const matches = proof.filter((entry) => entry.obligation === obligation);
    return matches.length === 1 &&
      matches[0]!.evidenceSourceIds.length > 0 &&
      matches[0]!.evidenceSourceIds.every((sourceId) => sourceId.length > 0);
  });
}

function issue(
  code: KpAnimationDomainFrontendEvidenceDiagnostic["code"],
  authorityId: string,
  message: string
): KpAnimationDomainFrontendEvidenceDiagnostic {
  return Object.freeze({ code, authorityId, message });
}
