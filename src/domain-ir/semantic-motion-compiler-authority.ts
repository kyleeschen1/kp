import {
  kpSemanticMotionCompilerOutcomeSchemaVersion,
  kpSemanticMotionCompilerVersion,
  type KpSemanticMotionCompilerExplicitStaticV1,
  type KpSemanticMotionCompilerHumanReviewV1,
  type KpSemanticMotionCompilerIssueV1,
  type KpSemanticMotionCompilerOutcomeV1,
  type KpSemanticMotionCompilerRepairRequiredV1,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionRepairTargetV1,
  type KpVerifiedSemanticMotionCompilation
} from "./semantic-motion-compiler-contract.ts";

const verifiedCompilations = new WeakSet<object>();

/** Compiler-internal mint. It is intentionally absent from the public API. */
export function mintKpSemanticMotionCompilerReady(
  request: KpSemanticMotionCompilerRequestV1
): KpSemanticMotionCompilerOutcomeV1 {
  const compilation = Object.freeze({
    kind: "verified-semantic-motion-compilation" as const,
    compilerVersion: kpSemanticMotionCompilerVersion,
    compilationId: `semantic-motion-compilation.${request.id}`,
    requestId: request.id,
    assetId: request.assetId,
    transformationId: request.operation.transformationId,
    operationId: request.operation.operationId
  }) as KpVerifiedSemanticMotionCompilation;
  verifiedCompilations.add(compilation);
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerOutcomeSchemaVersion,
    status: "ready" as const,
    requestId: request.id,
    compilation,
    issues: Object.freeze([]) as readonly []
  });
}

export function createKpSemanticMotionCompilerRepairRequired(input: {
  readonly requestId: string;
  readonly issues: readonly KpSemanticMotionCompilerIssueV1[];
  readonly repairTargets: readonly KpSemanticMotionRepairTargetV1[];
}): KpSemanticMotionCompilerRepairRequiredV1 {
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerOutcomeSchemaVersion,
    status: "repair-required" as const,
    requestId: input.requestId,
    issues: freezeIssues(input.issues),
    repairTargets: Object.freeze(input.repairTargets.map((target) => ({ ...target })))
  });
}

export function createKpSemanticMotionCompilerExplicitStatic(input: {
  readonly requestId: string;
  readonly reason: KpSemanticMotionCompilerExplicitStaticV1["reason"];
  readonly staticStateId: string;
  readonly issues?: readonly KpSemanticMotionCompilerIssueV1[] | undefined;
}): KpSemanticMotionCompilerExplicitStaticV1 {
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerOutcomeSchemaVersion,
    status: "explicit-static" as const,
    requestId: input.requestId,
    reason: input.reason,
    staticStateId: input.staticStateId,
    issues: freezeIssues(input.issues ?? [])
  });
}

export function createKpSemanticMotionCompilerHumanReview(input: {
  readonly requestId: string;
  readonly reason: KpSemanticMotionCompilerHumanReviewV1["reason"];
  readonly reviewTargetIds: readonly string[];
  readonly issues?: readonly KpSemanticMotionCompilerIssueV1[] | undefined;
}): KpSemanticMotionCompilerHumanReviewV1 {
  return Object.freeze({
    schemaVersion: kpSemanticMotionCompilerOutcomeSchemaVersion,
    status: "human-review" as const,
    requestId: input.requestId,
    reason: input.reason,
    reviewTargetIds: Object.freeze([...input.reviewTargetIds]),
    issues: freezeIssues(input.issues ?? [])
  });
}

export function isKpVerifiedSemanticMotionCompilation(
  value: unknown
): value is KpVerifiedSemanticMotionCompilation {
  return typeof value === "object" && value !== null && verifiedCompilations.has(value);
}

export function assertKpVerifiedSemanticMotionCompilation(
  value: unknown
): asserts value is KpVerifiedSemanticMotionCompilation {
  if (!isKpVerifiedSemanticMotionCompilation(value)) {
    throw new Error(
      "Semantic motion playback requires the original compiler-minted compilation authority."
    );
  }
}

function freezeIssues(
  issues: readonly KpSemanticMotionCompilerIssueV1[]
): readonly KpSemanticMotionCompilerIssueV1[] {
  return Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
}

