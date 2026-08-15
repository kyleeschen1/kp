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

export type KpSemanticMotionCompilerIssueCodeV1 =
  | "semantic-motion.endpoint.source-revision"
  | "semantic-motion.endpoint.foreign-asset"
  | "semantic-motion.endpoint.missing-state"
  | "semantic-motion.endpoint.object-mismatch"
  | "semantic-motion.endpoint.entity-mismatch"
  | "semantic-motion.frontier.context-not-shared"
  | "semantic-motion.frontier.overlap"
  | "semantic-motion.frontier.foreign-source"
  | "semantic-motion.frontier.foreign-target"
  | "semantic-motion.frontier.incomplete-source"
  | "semantic-motion.frontier.incomplete-target"
  | "semantic-motion.frontier.duplicate"
  | "semantic-motion.provenance.authority-mismatch"
  | "semantic-motion.provenance.correspondence"
  | "semantic-motion.provenance.duplicate-entity-authority"
  | "semantic-motion.provenance.foreign-source"
  | "semantic-motion.provenance.foreign-target"
  | "semantic-motion.provenance.false-identity"
  | "semantic-motion.provenance.false-introduction"
  | "semantic-motion.provenance.false-derivation"
  | "semantic-motion.provenance.missing-entity-authority"
  | "semantic-motion.provenance.incomplete-lifecycle"
  | "semantic-motion.provenance.ambiguous-lifecycle"
  | "semantic-motion.lifecycle.authority-mismatch"
  | "semantic-motion.lifecycle.salience-overlap"
  | "semantic-motion.lifecycle.salience-reference"
  | "semantic-motion.lifecycle.opacity-authority"
  | "semantic-motion.lifecycle.trace-shape"
  | "semantic-motion.lifecycle.phase-order"
  | "semantic-motion.lifecycle.endpoint"
  | "semantic-motion.lifecycle.visibility-gap"
  | "semantic-motion.lifecycle.paint-owner"
  | "semantic-motion.structure.authority-mismatch"
  | "semantic-motion.structure.operation-mismatch"
  | "semantic-motion.structure.duplicate-role"
  | "semantic-motion.structure.unknown-role"
  | "semantic-motion.structure.missing-role"
  | "semantic-motion.structure.role-cardinality"
  | "semantic-motion.structure.duplicate-entity"
  | "semantic-motion.structure.foreign-entity"
  | "semantic-motion.structure.ambiguous-entity"
  | "semantic-motion.structure.duplicate-cohort"
  | "semantic-motion.structure.cohort-membership"
  | "semantic-motion.structure.cohesion"
  | "semantic-motion.structure.cohort-role"
  | "semantic-motion.structure.cohort-closure"
  | "semantic-motion.structure.duplicate-attachment"
  | "semantic-motion.structure.attachment-closure"
  | "semantic-motion.structure.attachment-role"
  | "semantic-motion.precedence.authority-mismatch"
  | "semantic-motion.precedence.physical-authority"
  | "semantic-motion.precedence.duplicate-event"
  | "semantic-motion.precedence.event-shape"
  | "semantic-motion.precedence.event-reference"
  | "semantic-motion.precedence.duplicate-edge"
  | "semantic-motion.precedence.edge-reference"
  | "semantic-motion.precedence.cycle"
  | "semantic-motion.precedence.target-ready"
  | "semantic-motion.precedence.disconnected-event"
  | "semantic-motion.history.history-id"
  | "semantic-motion.history.empty"
  | "semantic-motion.history.authority-mismatch"
  | "semantic-motion.history.duplicate-request"
  | "semantic-motion.history.duplicate-transition"
  | "semantic-motion.history.duplicate-stage"
  | "semantic-motion.history.source-authority"
  | "semantic-motion.history.source-boundary"
  | "semantic-motion.history.endpoint-seam"
  | "semantic-motion.history.identity-seam"
  | "semantic-motion.recipe.unsupported-operation"
  | "semantic-motion.recipe.cohesion-mismatch"
  | "semantic-motion.recipe.teaching-intent"
  | "semantic-motion.recipe.roles-mismatch"
  | "semantic-motion.recipe.events-mismatch"
  | "semantic-motion.schema.unknown-version"
  | "semantic-motion.schema.invalid-document"
  | "semantic-motion.schema.missing-patch"
  | "semantic-motion.schema.invalid-patch";

export interface KpSemanticMotionCompilerIssueV1 {
  readonly code: KpSemanticMotionCompilerIssueCodeV1;
  readonly path: string;
  readonly message: string;
}

export interface KpSemanticMotionRepairTargetV1 {
  readonly kind:
    | "semantic-state"
    | "operation-binding"
    | "correspondence"
    | "rewrite-frontier"
    | "teaching-intent"
    | "schema-document";
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
