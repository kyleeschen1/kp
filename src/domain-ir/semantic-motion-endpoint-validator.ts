import {
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1,
  KpSemanticMotionStateRefV1
} from "./semantic-motion-compiler-contract.ts";

export interface KpSemanticMotionSourceAuthorityV1 {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly assetIds: readonly string[];
  readonly states: readonly KpSemanticMotionStateRefV1[];
}

declare const kpSemanticMotionEndpointFrontierAuthority: unique symbol;

export type KpVerifiedSemanticMotionEndpointFrontier = Readonly<{
  kind: "verified-semantic-motion-endpoint-frontier";
  requestId: string;
  sourceId: string;
  revisionId: string;
  sourceStateId: string;
  targetStateId: string;
  sourceFrontierEntityIds: readonly string[];
  targetFrontierEntityIds: readonly string[];
  contextEntityIds: readonly string[];
  [kpSemanticMotionEndpointFrontierAuthority]: true;
}>;

export type KpSemanticMotionEndpointValidationResult =
  | {
      readonly status: "verified";
      readonly endpointFrontier: KpVerifiedSemanticMotionEndpointFrontier;
    }
  | KpSemanticMotionCompilerRepairRequiredV1;

const verifiedEndpointFrontiers = new WeakSet<object>();

export function validateKpSemanticMotionEndpointsAndFrontier(input: {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly source: KpSemanticMotionSourceAuthorityV1;
}): KpSemanticMotionEndpointValidationResult {
  const { request, source } = input;
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];

  if (
    request.semanticSource.sourceId !== source.sourceId ||
    request.semanticSource.revisionId !== source.revisionId
  ) {
    issues.push({
      code: "semantic-motion.endpoint.source-revision",
      path: "$.semanticSource",
      message:
        `Request ${request.id} pins ${request.semanticSource.sourceId}@${request.semanticSource.revisionId}, ` +
        `not supplied authority ${source.sourceId}@${source.revisionId}.`
    });
  }
  if (!source.assetIds.includes(request.assetId)) {
    issues.push({
      code: "semantic-motion.endpoint.foreign-asset",
      path: "$.assetId",
      message: `Asset ${request.assetId} does not belong to semantic source ${source.sourceId}.`
    });
  }

  validateExactState(request.sourceState, source, "sourceState", issues);
  validateExactState(request.targetState, source, "targetState", issues);
  validateFrontierPartition(request, issues);

  if (issues.length > 0) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues,
      repairTargets: [{
        kind: "semantic-state",
        targetId: request.semanticSource.sourceId
      }, {
        kind: "rewrite-frontier",
        targetId: request.operation.transformationId
      }]
    });
  }

  const endpointFrontier = Object.freeze({
    kind: "verified-semantic-motion-endpoint-frontier" as const,
    requestId: request.id,
    sourceId: source.sourceId,
    revisionId: source.revisionId,
    sourceStateId: request.sourceState.id,
    targetStateId: request.targetState.id,
    sourceFrontierEntityIds: Object.freeze([
      ...request.rewriteFrontier.sourceEntityIds
    ]),
    targetFrontierEntityIds: Object.freeze([
      ...request.rewriteFrontier.targetEntityIds
    ]),
    contextEntityIds: Object.freeze([...request.rewriteFrontier.contextEntityIds])
  }) as KpVerifiedSemanticMotionEndpointFrontier;
  verifiedEndpointFrontiers.add(endpointFrontier);
  return { status: "verified", endpointFrontier };
}

export function isKpVerifiedSemanticMotionEndpointFrontier(
  value: unknown
): value is KpVerifiedSemanticMotionEndpointFrontier {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedEndpointFrontiers.has(value)
  );
}

export function assertKpVerifiedSemanticMotionEndpointFrontier(
  value: unknown
): asserts value is KpVerifiedSemanticMotionEndpointFrontier {
  if (!isKpVerifiedSemanticMotionEndpointFrontier(value)) {
    throw new Error(
      "Semantic motion compilation requires the original endpoint/frontier validator authority."
    );
  }
}

function validateExactState(
  requested: KpSemanticMotionStateRefV1,
  source: KpSemanticMotionSourceAuthorityV1,
  path: "sourceState" | "targetState",
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  const authoritative = source.states.find(({ id }) => id === requested.id);
  if (authoritative === undefined) {
    issues.push({
      code: "semantic-motion.endpoint.missing-state",
      path: `$.${path}.id`,
      message: `Semantic source ${source.sourceId} has no state ${requested.id}.`
    });
    return;
  }
  if (!sameStrings(requested.objectIds, authoritative.objectIds)) {
    issues.push({
      code: "semantic-motion.endpoint.object-mismatch",
      path: `$.${path}.objectIds`,
      message: `State ${requested.id} does not exactly match its authoritative object sequence.`
    });
  }
  if (!sameStrings(requested.entityIds, authoritative.entityIds)) {
    issues.push({
      code: "semantic-motion.endpoint.entity-mismatch",
      path: `$.${path}.entityIds`,
      message: `State ${requested.id} does not exactly match its authoritative entity sequence.`
    });
  }
}

function validateFrontierPartition(
  request: KpSemanticMotionCompilerRequestV1,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  const frontier = request.rewriteFrontier;
  unique(frontier.sourceEntityIds, "$.rewriteFrontier.sourceEntityIds", issues);
  unique(frontier.targetEntityIds, "$.rewriteFrontier.targetEntityIds", issues);
  unique(frontier.contextEntityIds, "$.rewriteFrontier.contextEntityIds", issues);

  const sourceEntities = new Set(request.sourceState.entityIds);
  const targetEntities = new Set(request.targetState.entityIds);
  const sourceFrontier = new Set(frontier.sourceEntityIds);
  const targetFrontier = new Set(frontier.targetEntityIds);

  frontier.contextEntityIds.forEach((entityId, index) => {
    if (!sourceEntities.has(entityId) || !targetEntities.has(entityId)) {
      issues.push({
        code: "semantic-motion.frontier.context-not-shared",
        path: `$.rewriteFrontier.contextEntityIds[${index}]`,
        message: `Context entity ${entityId} must occur unchanged in both endpoint states.`
      });
    }
    if (sourceFrontier.has(entityId) || targetFrontier.has(entityId)) {
      issues.push({
        code: "semantic-motion.frontier.overlap",
        path: `$.rewriteFrontier.contextEntityIds[${index}]`,
        message: `Context entity ${entityId} cannot also belong to the rewrite frontier.`
      });
    }
  });
  frontier.sourceEntityIds.forEach((entityId, index) => {
    if (!sourceEntities.has(entityId)) {
      issues.push({
        code: "semantic-motion.frontier.foreign-source",
        path: `$.rewriteFrontier.sourceEntityIds[${index}]`,
        message: `Source frontier entity ${entityId} is outside source state ${request.sourceState.id}.`
      });
    }
  });
  frontier.targetEntityIds.forEach((entityId, index) => {
    if (!targetEntities.has(entityId)) {
      issues.push({
        code: "semantic-motion.frontier.foreign-target",
        path: `$.rewriteFrontier.targetEntityIds[${index}]`,
        message: `Target frontier entity ${entityId} is outside target state ${request.targetState.id}.`
      });
    }
  });

  const coveredSource = new Set([...frontier.sourceEntityIds, ...frontier.contextEntityIds]);
  const coveredTarget = new Set([...frontier.targetEntityIds, ...frontier.contextEntityIds]);
  if (!sameSet(sourceEntities, coveredSource)) {
    issues.push({
      code: "semantic-motion.frontier.incomplete-source",
      path: "$.rewriteFrontier.sourceEntityIds",
      message: "Source frontier and unchanged context must cover the exact source endpoint."
    });
  }
  if (!sameSet(targetEntities, coveredTarget)) {
    issues.push({
      code: "semantic-motion.frontier.incomplete-target",
      path: "$.rewriteFrontier.targetEntityIds",
      message: "Target frontier and unchanged context must cover the exact target endpoint."
    });
  }
}

function unique(
  values: readonly string[],
  path: string,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      issues.push({
        code: "semantic-motion.frontier.duplicate",
        path: `${path}[${index}]`,
        message: `Rewrite frontier repeats entity ${value}.`
      });
    }
    seen.add(value);
  });
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}
