import type { KpCanonicalOperationPackPin } from
  "../semantic/canonical-operation-pack.ts";
import type { CorrespondenceMap } from "../semantic/correspondence.ts";

export const kpSemanticMotionCompilerRequestSchemaVersion =
  "kp.semantic-motion-compiler-request.v1" as const;

export const kpSemanticMotionCompilerOutcomeSchemaVersion =
  "kp.semantic-motion-compiler-outcome.v1" as const;

export const kpSemanticMotionCompilerVersion =
  "kp.semantic-motion-compiler.v1" as const;

export interface KpSemanticMotionStateRefV1 {
  readonly id: string;
  readonly objectIds: readonly string[];
  readonly entityIds: readonly string[];
}

export interface KpSemanticMotionOperationIntentV1 {
  readonly stepId: string;
  readonly transformationId: string;
  readonly operationId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly correspondenceMap: CorrespondenceMap;
}

export interface KpSemanticMotionRewriteFrontierV1 {
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly contextEntityIds: readonly string[];
}

export interface KpSemanticMotionTeachingIntentV1 {
  readonly kind: "notice" | "compare" | "transmit" | "cause";
  readonly primaryEntityIds: readonly string[];
  readonly secondaryEntityIds: readonly string[];
  readonly summary: string;
}

/**
 * The compiler front door accepts semantic references and teaching intent,
 * never renderer realization. Endpoint values are resolved from the pinned
 * semantic source so copied display text cannot become mathematical truth.
 */
export interface KpSemanticMotionCompilerRequestV1 {
  readonly schemaVersion: typeof kpSemanticMotionCompilerRequestSchemaVersion;
  readonly id: string;
  readonly assetId: string;
  readonly semanticSource: {
    readonly sourceId: string;
    readonly revisionId: string;
    readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  };
  readonly sourceState: KpSemanticMotionStateRefV1;
  readonly targetState: KpSemanticMotionStateRefV1;
  readonly operation: KpSemanticMotionOperationIntentV1;
  readonly rewriteFrontier: KpSemanticMotionRewriteFrontierV1;
  readonly teachingIntent: KpSemanticMotionTeachingIntentV1;
}

export interface KpSemanticMotionCompilerIssueV1 {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface KpSemanticMotionRepairTargetV1 {
  readonly kind:
    | "semantic-state"
    | "operation-binding"
    | "correspondence"
    | "rewrite-frontier"
    | "teaching-intent";
  readonly targetId: string;
}

declare const kpSemanticMotionCompilationAuthority: unique symbol;

/**
 * This token proves only that the request crossed the compiler-owned mint.
 * It deliberately carries no paths, timing, paint, DOM, or renderer data.
 */
export type KpVerifiedSemanticMotionCompilation = Readonly<{
  kind: "verified-semantic-motion-compilation";
  compilerVersion: typeof kpSemanticMotionCompilerVersion;
  compilationId: string;
  requestId: string;
  assetId: string;
  transformationId: string;
  operationId: string;
  [kpSemanticMotionCompilationAuthority]: true;
}>;

interface KpSemanticMotionCompilerOutcomeBaseV1 {
  readonly schemaVersion: typeof kpSemanticMotionCompilerOutcomeSchemaVersion;
  readonly requestId: string;
}

export interface KpSemanticMotionCompilerReadyV1
  extends KpSemanticMotionCompilerOutcomeBaseV1 {
  readonly status: "ready";
  readonly compilation: KpVerifiedSemanticMotionCompilation;
  readonly issues: readonly [];
}

export interface KpSemanticMotionCompilerRepairRequiredV1
  extends KpSemanticMotionCompilerOutcomeBaseV1 {
  readonly status: "repair-required";
  readonly issues: readonly KpSemanticMotionCompilerIssueV1[];
  readonly repairTargets: readonly KpSemanticMotionRepairTargetV1[];
}

export interface KpSemanticMotionCompilerExplicitStaticV1
  extends KpSemanticMotionCompilerOutcomeBaseV1 {
  readonly status: "explicit-static";
  readonly reason:
    | "authored-static"
    | "unsupported-operation"
    | "no-semantic-transition";
  readonly staticStateId: string;
  readonly issues: readonly KpSemanticMotionCompilerIssueV1[];
}

export interface KpSemanticMotionCompilerHumanReviewV1
  extends KpSemanticMotionCompilerOutcomeBaseV1 {
  readonly status: "human-review";
  readonly reason:
    | "unreviewed-recipe"
    | "ambiguous-semantic-intent"
    | "visual-approval-required";
  readonly reviewTargetIds: readonly string[];
  readonly issues: readonly KpSemanticMotionCompilerIssueV1[];
}

export type KpSemanticMotionCompilerOutcomeV1 =
  | KpSemanticMotionCompilerReadyV1
  | KpSemanticMotionCompilerRepairRequiredV1
  | KpSemanticMotionCompilerExplicitStaticV1
  | KpSemanticMotionCompilerHumanReviewV1;

/**
 * Rebuilds the public request from its registered vocabulary. This snapshot
 * boundary drops excess runtime keys, preventing authoring payloads from
 * smuggling presentation authority through structural typing.
 */
export function createKpSemanticMotionCompilerRequestV1(
  input: KpSemanticMotionCompilerRequestV1
): KpSemanticMotionCompilerRequestV1 {
  return deepFreeze({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: input.id,
    assetId: input.assetId,
    semanticSource: {
      sourceId: input.semanticSource.sourceId,
      revisionId: input.semanticSource.revisionId,
      operationPacks: input.semanticSource.operationPacks.map((pin) => ({ ...pin }))
    },
    sourceState: cloneState(input.sourceState),
    targetState: cloneState(input.targetState),
    operation: {
      stepId: input.operation.stepId,
      transformationId: input.operation.transformationId,
      operationId: input.operation.operationId,
      roleBindings: Object.fromEntries(
        Object.entries(input.operation.roleBindings).map(([roleId, entityIds]) => [
          roleId,
          [...entityIds]
        ])
      ),
      correspondenceMap: {
        id: input.operation.correspondenceMap.id,
        records: input.operation.correspondenceMap.records.map((record) => ({
          id: record.id,
          relation: record.relation,
          sourceSelectorIds: [...record.sourceSelectorIds],
          targetSelectorIds: [...record.targetSelectorIds],
          summary: record.summary
        }))
      }
    },
    rewriteFrontier: {
      sourceEntityIds: [...input.rewriteFrontier.sourceEntityIds],
      targetEntityIds: [...input.rewriteFrontier.targetEntityIds],
      contextEntityIds: [...input.rewriteFrontier.contextEntityIds]
    },
    teachingIntent: {
      kind: input.teachingIntent.kind,
      primaryEntityIds: [...input.teachingIntent.primaryEntityIds],
      secondaryEntityIds: [...input.teachingIntent.secondaryEntityIds],
      summary: input.teachingIntent.summary
    }
  });
}

function cloneState(state: KpSemanticMotionStateRefV1): KpSemanticMotionStateRefV1 {
  return {
    id: state.id,
    objectIds: [...state.objectIds],
    entityIds: [...state.entityIds]
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach((child) => deepFreeze(child));
  return Object.freeze(value);
}

