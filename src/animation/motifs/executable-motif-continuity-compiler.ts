import type {
  KpExecutableSuccessorMotifPhaseEffect,
  KpExecutableSuccessorMotifProgramDraft,
  KpExecutableSuccessorMotifProgramKind,
  KpExecutableSuccessorMotifSemanticRole,
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program-validator.ts";
import type {
  KpPerceptualContinuityEndpointMetric,
  KpPerceptualContinuityVisibilityPolicy,
  KpVerifiedPerceptualContinuityContract
} from "../perceptual-continuity-contract.ts";
import {
  isKpVerifiedPerceptualContinuityContract
} from "../perceptual-continuity-contract.ts";
import {
  kpOperationEvaluationContinuityTopologyDecision
} from "../operation-evaluation-continuity-topology.ts";

const verifiedContinuityPrograms = new WeakSet<object>();

type KpVerifiedProgramOf<
  Kind extends KpExecutableSuccessorMotifProgramKind
> = KpVerifiedExecutableSuccessorMotifProgram &
  Extract<KpExecutableSuccessorMotifProgramDraft, { readonly kind: Kind }>;

export type KpExecutableMotifContinuityTopology =
  | "bounded-semantic-contact-co-presence"
  | "identity-preserving-branch-co-presence"
  | "identity-preserving-gather-co-presence"
  | "shared-zero-area-junction";

export type KpExecutableMotifContinuousTopology =
  Exclude<KpExecutableMotifContinuityTopology, "shared-zero-area-junction">;

export const kpExecutableMotifContinuityCompatibility = Object.freeze({
  "operation-evaluation":
    kpOperationEvaluationContinuityTopologyDecision.selectedTopology,
  "identity-fission": "identity-preserving-branch-co-presence",
  "identity-fusion": "identity-preserving-gather-co-presence"
} as const satisfies Readonly<
  Record<KpExecutableSuccessorMotifProgramKind,
    KpExecutableMotifContinuousTopology>
>);

export type KpExecutableMotifContinuityObligation =
  | "preserve-native-source-and-context"
  | "maintain-required-role-ink"
  | "co-present-contributors-at-certified-contact"
  | "co-present-source-and-descendants"
  | "co-present-contributors-and-ancestor"
  | "settle-exact-native-target-and-context";

export interface KpExecutableMotifContinuityPhaseBinding {
  readonly phaseId: string;
  readonly phaseEffect: KpExecutableSuccessorMotifPhaseEffect;
  readonly requiredRoles:
    readonly KpExecutableSuccessorMotifSemanticRole[];
  readonly continuityObligation:
    KpExecutableMotifContinuityObligation;
  readonly executionOrdinal: number;
}

export interface KpExecutableMotifContinuityProgram {
  readonly schemaVersion: "kp.executable-motif-continuity-program.v1";
  readonly kind: "executable-motif-continuity-program";
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind: KpExecutableSuccessorMotifProgramKind;
  readonly topology: KpExecutableMotifContinuousTopology;
  readonly visibility: KpPerceptualContinuityVisibilityPolicy & {
    readonly kind: "continuous-visible-ink";
  };
  readonly endpointMetrics:
    readonly KpPerceptualContinuityEndpointMetric[];
  readonly forwardPhases:
    readonly KpExecutableMotifContinuityPhaseBinding[];
  readonly rewindPhases:
    readonly KpExecutableMotifContinuityPhaseBinding[];
  readonly phaseAuthority: "executable-program-only";
  readonly presentationAuthority: "canonical-compositor-only";
}

export type KpExecutableMotifContinuityCompilerIssueCode =
  | "compiler.program.unverified"
  | "compiler.contract.unverified"
  | "compiler.contract.mismatch"
  | "compiler.topology.mismatch"
  | "compiler.intentional-vanish.required"
  | "compiler.visibility.mismatch"
  | "compiler.phase.mismatch";

export interface KpExecutableMotifContinuityCompilerIssue {
  readonly code: KpExecutableMotifContinuityCompilerIssueCode;
  readonly path: string;
  readonly message: string;
}

export type KpExecutableMotifContinuityCompilerResult =
  | {
      readonly status: "compiled";
      readonly continuityProgram: KpExecutableMotifContinuityProgram;
    }
  | {
      readonly status: "invalid";
      readonly issues:
        readonly KpExecutableMotifContinuityCompilerIssue[];
    };

/**
 * This compiler can constrain the paint behavior beneath a motif phase, but
 * cannot accept replacement phases. That one-way dependency prevents a
 * continuity repair from silently changing the pedagogical choreography.
 */
export function compileKpExecutableMotifContinuity(input: {
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly topology: KpExecutableMotifContinuityTopology;
}): KpExecutableMotifContinuityCompilerResult {
  const issues: KpExecutableMotifContinuityCompilerIssue[] = [];
  if (!isKpVerifiedExecutableSuccessorMotifProgram(input.program)) {
    issues.push(issue(
      "compiler.program.unverified",
      "program",
      "Continuity compilation requires a minted executable motif program."
    ));
  }
  if (!isKpVerifiedPerceptualContinuityContract(input.contract)) {
    issues.push(issue(
      "compiler.contract.unverified",
      "contract",
      "Continuity compilation requires a minted perceptual contract."
    ));
  }
  if (issues.length > 0) return invalid(issues);

  const { program, contract } = input;
  if (
    contract.programId !== program.id ||
    contract.programVersion !== program.programVersion ||
    contract.programKind !== program.kind
  ) {
    issues.push(issue(
      "compiler.contract.mismatch",
      "contract.programId",
      "Continuity contract must bind the exact executable program."
    ));
  }
  if (
    contract.phaseIds.length !== program.phases.length ||
    contract.phaseIds.some((phaseId, index) =>
      phaseId !== program.phases[index]?.id
    )
  ) {
    issues.push(issue(
      "compiler.phase.mismatch",
      "contract.phaseIds",
      "Continuity contract phase order must equal the executable program."
    ));
  }

  const expectedTopology =
    kpExecutableMotifContinuityCompatibility[program.kind];
  if (input.topology === "shared-zero-area-junction") {
    // No current sealed program grants this authority. Keeping the failure
    // explicit prevents the old blank-pulse topology from becoming fallback.
    issues.push(issue(
      "compiler.intentional-vanish.required",
      "topology",
      "Zero-area transfer requires explicit intentional-vanish authority " +
      "from both the exact program phase and perceptual contract."
    ));
  } else if (input.topology !== expectedTopology) {
    issues.push(issue(
      "compiler.topology.mismatch",
      "topology",
      `Program ${program.kind} requires ${expectedTopology}.`
    ));
  }
  if (contract.visibility.kind !== "continuous-visible-ink") {
    issues.push(issue(
      "compiler.visibility.mismatch",
      "contract.visibility",
      "Every currently supported topology requires continuous visible ink."
    ));
  }
  if (issues.length > 0) return invalid(issues);

  const forwardPhases = program.phases.map((phase, executionOrdinal) =>
    Object.freeze({
      phaseId: phase.id,
      phaseEffect: phase.effect,
      requiredRoles: Object.freeze([...phase.requiredRoles]),
      continuityObligation: obligationForPhase(program, phase.effect),
      executionOrdinal
    })
  );
  const rewindPhases = [...forwardPhases].reverse().map(
    (phase, executionOrdinal) => Object.freeze({
      ...phase,
      executionOrdinal
    })
  );
  const continuityProgram = Object.freeze({
    schemaVersion: "kp.executable-motif-continuity-program.v1" as const,
    kind: "executable-motif-continuity-program" as const,
    program,
    contract,
    programId: program.id,
    programVersion: program.programVersion,
    programKind: program.kind,
    topology: input.topology,
    visibility: Object.freeze({ ...contract.visibility }),
    endpointMetrics: Object.freeze([
      ...contract.endpointEquivalence.requiredMetrics
    ]),
    forwardPhases: Object.freeze(forwardPhases),
    rewindPhases: Object.freeze(rewindPhases),
    phaseAuthority: "executable-program-only" as const,
    presentationAuthority: "canonical-compositor-only" as const
  }) as KpExecutableMotifContinuityProgram;
  verifiedContinuityPrograms.add(continuityProgram);
  return Object.freeze({ status: "compiled", continuityProgram });
}

export function isKpExecutableMotifContinuityProgram(
  value: unknown
): value is KpExecutableMotifContinuityProgram {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedContinuityPrograms.has(value)
  );
}

function obligationForPhase(
  program: KpVerifiedExecutableSuccessorMotifProgram,
  effect: KpExecutableSuccessorMotifPhaseEffect
): KpExecutableMotifContinuityObligation {
  switch (effect) {
    case "orient":
      return "preserve-native-source-and-context";
    case "converge":
      return "maintain-required-role-ink";
    case "recognize-result":
      return "co-present-contributors-at-certified-contact";
    case "branch-identity":
    case "establish-descendants":
      requireProgramKind(program, "identity-fission");
      return "co-present-source-and-descendants";
    case "gather-identities":
    case "establish-ancestor":
      requireProgramKind(program, "identity-fusion");
      return "co-present-contributors-and-ancestor";
    case "settle":
      return "settle-exact-native-target-and-context";
    default:
      return unreachable(effect);
  }
}

function requireProgramKind<
  Kind extends KpExecutableSuccessorMotifProgramKind
>(
  program: KpVerifiedExecutableSuccessorMotifProgram,
  expected: Kind
): asserts program is KpVerifiedProgramOf<Kind> {
  if (program.kind !== expected) {
    throw new Error(
      `Phase effect requires ${expected}, received ${program.kind}.`
    );
  }
}

function issue(
  code: KpExecutableMotifContinuityCompilerIssueCode,
  path: string,
  message: string
): KpExecutableMotifContinuityCompilerIssue {
  return Object.freeze({ code, path, message });
}

function invalid(
  issues: KpExecutableMotifContinuityCompilerIssue[]
): KpExecutableMotifContinuityCompilerResult {
  return Object.freeze({
    status: "invalid",
    issues: Object.freeze([...issues])
  });
}

function unreachable(value: never): never {
  throw new Error(`Unsupported continuity phase effect ${String(value)}.`);
}
