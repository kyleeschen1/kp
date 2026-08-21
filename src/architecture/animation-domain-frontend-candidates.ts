import type {
  KpAnimationCapabilityPlan,
  KpAnimationCapabilityPlanEntry
} from "./animation-capability-plan.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";
import type { KpCodeRefactorLanguage } from
  "../domain-ir/code-refactor-generation-request.ts";

export const KP_ANIMATION_DOMAIN_FRONTEND_CANDIDATES_SCHEMA =
  "kp.animation-domain-frontend-candidates.v1" as const;

export const kpCodeFrontendProofObligations = Object.freeze([
  "parse-source",
  "recognize-extract-helper-roles",
  "prove-refactor-legality",
  "bind-semantic-identity",
  "compile-operation",
  "bind-causal-recipe",
  "pass-generation-corpus",
  "prove-runtime-isolation"
] as const);

export type KpCodeFrontendProofObligation =
  (typeof kpCodeFrontendProofObligations)[number];

export interface KpAnimationDomainFrontendCandidate {
  readonly status: "candidate";
  readonly authorityId: string;
  readonly capabilityId: string;
  readonly domain: "code";
  readonly language: KpCodeRefactorLanguage;
  readonly buildTimeEntrypoint: string;
  readonly runtimeBoundary: "generated-plain-data-only";
  readonly proofObligations: readonly KpCodeFrontendProofObligation[];
}

export interface KpAnimationDomainFrontendCandidates {
  readonly schemaVersion:
    typeof KP_ANIMATION_DOMAIN_FRONTEND_CANDIDATES_SCHEMA;
  readonly kind: "animation-domain-frontend-candidates";
  readonly candidates: readonly KpAnimationDomainFrontendCandidate[];
}

export interface KpAnimationDomainFrontendCandidateDiagnostic {
  readonly code:
    | "frontend-candidate.duplicate-authority"
    | "frontend-candidate.duplicate-capability"
    | "frontend-candidate.capability-missing"
    | "frontend-candidate.authority-mismatch"
    | "frontend-candidate.domain-mismatch"
    | "frontend-candidate.proof-obligations-incomplete";
  readonly candidateId: string;
  readonly message: string;
}

export class KpAnimationDomainFrontendCandidateError extends Error {
  override readonly name = "KpAnimationDomainFrontendCandidateError";
  readonly diagnostics:
    readonly KpAnimationDomainFrontendCandidateDiagnostic[];

  constructor(
    diagnostics: readonly KpAnimationDomainFrontendCandidateDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

/**
 * Candidate registration records what still needs proof. It deliberately
 * cannot produce frontend evidence or alter capability readiness.
 */
export function compileKpAnimationDomainFrontendCandidates(input: Readonly<{
  plan: KpAnimationCapabilityPlan;
  candidates: readonly KpAnimationDomainFrontendCandidate[];
}>): KpAnimationDomainFrontendCandidates {
  const diagnostics: KpAnimationDomainFrontendCandidateDiagnostic[] = [];
  duplicates(input.candidates, "authorityId").forEach((authorityId) =>
    diagnostics.push(issue(
      "frontend-candidate.duplicate-authority",
      authorityId,
      `Duplicate frontend candidate authority ${authorityId}.`
    ))
  );
  duplicates(input.candidates, "capabilityId").forEach((capabilityId) =>
    diagnostics.push(issue(
      "frontend-candidate.duplicate-capability",
      capabilityId,
      `Duplicate frontend candidate capability ${capabilityId}.`
    ))
  );

  input.candidates.forEach((candidate) => {
    const capability = input.plan.entries.find(
      ({ id }) => id === candidate.capabilityId
    );
    if (capability === undefined) {
      diagnostics.push(issue(
        "frontend-candidate.capability-missing",
        candidate.authorityId,
        `${candidate.capabilityId} is not a declared capability.`
      ));
      return;
    }
    checkCandidate(candidate, capability, diagnostics);
  });

  if (diagnostics.length > 0) {
    throw new KpAnimationDomainFrontendCandidateError(diagnostics);
  }
  return Object.freeze({
    schemaVersion: KP_ANIMATION_DOMAIN_FRONTEND_CANDIDATES_SCHEMA,
    kind: "animation-domain-frontend-candidates" as const,
    candidates: Object.freeze(input.candidates.map((candidate) =>
      deepFreeze({ ...candidate, proofObligations: [
        ...candidate.proofObligations
      ] })
    ))
  });
}

export function createKpAnimationDomainFrontendCandidates():
KpAnimationDomainFrontendCandidates {
  return compileKpAnimationDomainFrontendCandidates({
    plan: kpAnimationCapabilityPlan,
    candidates: [
      candidate(
        "frontend.code.typescript-compiler.v1",
        "capability.code.typescript-refactoring",
        "typescript",
        "scripts/typescript-refactor-frontend.ts"
      ),
      candidate(
        "frontend.code.python-ast.v1",
        "capability.code.python-refactoring",
        "python",
        "scripts/python-refactor-frontend.ts"
      )
    ]
  });
}

function candidate(
  authorityId: string,
  capabilityId: string,
  language: KpCodeRefactorLanguage,
  buildTimeEntrypoint: string
): KpAnimationDomainFrontendCandidate {
  return Object.freeze({
    status: "candidate" as const,
    authorityId,
    capabilityId,
    domain: "code" as const,
    language,
    buildTimeEntrypoint,
    runtimeBoundary: "generated-plain-data-only" as const,
    proofObligations: kpCodeFrontendProofObligations
  });
}

function checkCandidate(
  candidate: KpAnimationDomainFrontendCandidate,
  capability: KpAnimationCapabilityPlanEntry,
  diagnostics: KpAnimationDomainFrontendCandidateDiagnostic[]
): void {
  const frontendRequirement = capability.requirements.find(
    ({ kind }) => kind === "domain-frontend"
  );
  if (frontendRequirement?.authorityId !== candidate.authorityId) {
    diagnostics.push(issue(
      "frontend-candidate.authority-mismatch",
      candidate.authorityId,
      `${candidate.authorityId} does not satisfy ${capability.id}.`
    ));
  }
  if (capability.domain !== candidate.domain) {
    diagnostics.push(issue(
      "frontend-candidate.domain-mismatch",
      candidate.authorityId,
      `${candidate.authorityId} claims ${candidate.domain}, but ` +
        `${capability.id} belongs to ${capability.domain}.`
    ));
  }
  if (!equalStrings(
    candidate.proofObligations,
    kpCodeFrontendProofObligations
  )) {
    diagnostics.push(issue(
      "frontend-candidate.proof-obligations-incomplete",
      candidate.authorityId,
      `${candidate.authorityId} must retain every code frontend proof obligation.`
    ));
  }
}

function duplicates<
  TKey extends "authorityId" | "capabilityId"
>(
  candidates: readonly KpAnimationDomainFrontendCandidate[],
  key: TKey
): readonly string[] {
  const values = candidates.map((candidate) => candidate[key]);
  return Object.freeze(values.filter((value, index) =>
    values.indexOf(value) !== index && values.lastIndexOf(value) === index
  ));
}

function equalStrings(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function issue(
  code: KpAnimationDomainFrontendCandidateDiagnostic["code"],
  candidateId: string,
  message: string
): KpAnimationDomainFrontendCandidateDiagnostic {
  return Object.freeze({ code, candidateId, message });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

