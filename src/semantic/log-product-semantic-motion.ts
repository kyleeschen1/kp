import {
  compileKpSemanticMotion,
  createKpSemanticMotionCompilerRequestV1,
  createKpSemanticMotionSourceAuthority,
  kpSemanticMotionCompilerRequestSchemaVersion,
  type KpSemanticMotionEventSpec,
  type KpSemanticMotionOperationStructureContract,
  type KpSemanticMotionPrecedenceSpec
} from "../domain-ir/public-api.ts";
import {
  listKpLogProductExpressionNodes,
  type KpLogProductSemanticId,
  type KpLogProductState
} from "./log-product-states.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "./log-product-transformation-compiler.ts";
import { kpLogProductAnimationId } from "./log-product-ids.ts";

const operation = kpCanonicalCompiledLogProductOperation;
const correspondenceMap = operation.transformation.correspondenceMap;
if (correspondenceMap === undefined) {
  throw new Error("Canonical log-product semantic motion requires correspondence authority.");
}

const sourceState = stateRef(operation.contract.source);
const targetState = stateRef(operation.contract.target);
const semanticIdentityIdByEntityId = Object.freeze(Object.fromEntries(
  [operation.contract.source, operation.contract.target].flatMap((state) =>
    listKpLogProductExpressionNodes(state).map((node) => [
      node.id,
      node.semanticId
    ] as const)
  )
));

export const kpCanonicalLogProductSemanticMotionSource =
  createKpSemanticMotionSourceAuthority({
    sourceId: "semantic-source.log-product.product-to-sum",
    revisionId: "revision.log-product.semantic-motion.v1",
    transformationId: operation.transformation.id,
    assetIds: [kpLogProductAnimationId],
    sourceState,
    targetState,
    correspondenceMap,
    semanticIdentityIdByEntityId
  });

export const kpCanonicalLogProductSemanticMotionRequest =
  createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: "request.log-product.product-to-sum.semantic-motion.v1",
    assetId: kpLogProductAnimationId,
    semanticSource: {
      sourceId: kpCanonicalLogProductSemanticMotionSource.sourceId,
      revisionId: kpCanonicalLogProductSemanticMotionSource.revisionId,
      operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
    },
    sourceState,
    targetState,
    operation: {
      stepId: "step.log-product.product-to-sum",
      transformationId: operation.transformation.id,
      operationId: "kp.semantic-motion.log-product",
      roleBindings: {
        "source-application": sourceIds("semantic.log-product.wrapper.source"),
        "target-applications": targetIds(
          "semantic.log-product.wrapper.target-left",
          "semantic.log-product.wrapper.target-right"
        ),
        "source-operator": sourceIds("semantic.log-product.wrapper.source.operator"),
        "target-operators": targetIds(
          "semantic.log-product.wrapper.target-left.operator",
          "semantic.log-product.wrapper.target-right.operator"
        ),
        "source-arguments": sourceIds(
          "semantic.log-product.variable.x",
          "semantic.log-product.variable.y"
        ),
        "target-arguments": targetIds(
          "semantic.log-product.variable.x",
          "semantic.log-product.variable.y"
        ),
        "source-shells": sourceIds(
          "semantic.log-product.wrapper.source.open",
          "semantic.log-product.wrapper.source.close"
        ),
        "target-shells": targetIds(
          "semantic.log-product.wrapper.target-left.open",
          "semantic.log-product.wrapper.target-left.close",
          "semantic.log-product.wrapper.target-right.open",
          "semantic.log-product.wrapper.target-right.close"
        ),
        "source-product": sourceIds("semantic.log-product.product.xy"),
        "target-sum": targetIds("semantic.log-product.sum.logs"),
        connector: targetIds("semantic.log-product.connector.plus")
      },
      correspondenceMap
    },
    rewriteFrontier: {
      sourceEntityIds: sourceState.entityIds,
      targetEntityIds: targetState.entityIds,
      contextEntityIds: []
    },
    teachingIntent: {
      kind: "cause",
      primaryEntityIds: Object.freeze([
        ...sourceIds(
          "semantic.log-product.wrapper.source",
          "semantic.log-product.product.xy"
        ),
        ...targetIds(
          "semantic.log-product.wrapper.target-left",
          "semantic.log-product.wrapper.target-right",
          "semantic.log-product.connector.plus"
        )
      ]),
      secondaryEntityIds: Object.freeze([
        ...sourceIds(
          "semantic.log-product.variable.x",
          "semantic.log-product.variable.y"
        ),
        ...targetIds(
          "semantic.log-product.variable.x",
          "semantic.log-product.variable.y"
        )
      ]),
      summary:
        "Show one persistent logarithm application deriving two applications while product arguments become ordered additive terms."
    }
  });

export const kpCanonicalLogProductSemanticMotionStructure = Object.freeze({
  operationId: "kp.semantic-motion.log-product",
  roles: Object.freeze([
    role("source-application", "exactly-one", "operator", "none"),
    role("target-applications", "one-or-more", "operator", "none"),
    role("source-operator", "exactly-one", "operator", "required"),
    role("target-operators", "one-or-more", "operator", "required"),
    role("source-arguments", "one-or-more", "material", "none"),
    role("target-arguments", "one-or-more", "material", "none"),
    role("source-shells", "one-or-more", "punctuation", "required"),
    role("target-shells", "one-or-more", "punctuation", "required"),
    role("source-product", "exactly-one", "material", "none"),
    role("target-sum", "exactly-one", "material", "none"),
    role("connector", "exactly-one", "punctuation", "required")
  ]),
  cohorts: Object.freeze([
    cohort("cohort.log-product.applications", ["source-application", "target-applications"], "ordered-application-fission"),
    cohort("cohort.log-product.operators", ["source-operator", "target-operators"], "ordered-operator-fission"),
    cohort("cohort.log-product.arguments", ["source-arguments", "target-arguments"], "ordered-argument-continuity"),
    cohort("cohort.log-product.shells", ["source-shells", "target-shells"], "ordered-shell-fission"),
    cohort("cohort.log-product.homomorphism", ["source-product", "target-sum", "connector"], "product-to-additive-structure")
  ]),
  attachments: Object.freeze([
    attachment("attachment.log-product.source-operator", "operator-argument", ["source-arguments"], ["source-operator"]),
    attachment("attachment.log-product.target-operators", "operator-argument", ["target-arguments"], ["target-operators"]),
    attachment("attachment.log-product.source-shells", "punctuation-encloses", ["source-arguments"], ["source-shells"]),
    attachment("attachment.log-product.target-shells", "punctuation-encloses", ["target-arguments"], ["target-shells"]),
    attachment("attachment.log-product.connector", "connector-between", ["target-applications"], ["connector"])
  ])
} satisfies KpSemanticMotionOperationStructureContract);

export const kpCanonicalLogProductSemanticMotionPrecedence = precedenceChain([
  event("event.log-product.orient", "orient", ["cohort.log-product.applications"]),
  event("event.log-product.depart", "departure", [
    "cohort.log-product.operators",
    "cohort.log-product.arguments",
    "cohort.log-product.shells",
    "cohort.log-product.homomorphism"
  ]),
  event("event.log-product.arrive", "arrival", [
    "cohort.log-product.applications",
    "cohort.log-product.operators",
    "cohort.log-product.arguments",
    "cohort.log-product.shells"
  ]),
  Object.freeze({
    id: "event.log-product.attach-target",
    kind: "attachment" as const,
    cohortIds: Object.freeze(["cohort.log-product.homomorphism"]),
    attachmentIds: Object.freeze([
      "attachment.log-product.target-operators",
      "attachment.log-product.target-shells",
      "attachment.log-product.connector"
    ]),
    correspondenceRecordIds: Object.freeze([]),
    summary: "Attach both target logarithm shells and place plus between the ordered applications."
  }),
  event("event.log-product.settle", "settlement", ["cohort.log-product.homomorphism"]),
  Object.freeze({
    id: "event.log-product.native-target-ready",
    kind: "native-target-ready" as const,
    cohortIds: Object.freeze([]),
    attachmentIds: Object.freeze([]),
    correspondenceRecordIds: Object.freeze([]),
    summary: "Transfer paint ownership to the settled native target."
  })
]);

// Slice 24 proves the front door reaches the intentional unsupported-operation
// boundary; slice 25 may add a reviewed recipe without changing semantic truth.
export const kpCanonicalLogProductSemanticMotionOutcome =
  compileKpSemanticMotion({
    request: kpCanonicalLogProductSemanticMotionRequest,
    source: kpCanonicalLogProductSemanticMotionSource,
    structureContract: kpCanonicalLogProductSemanticMotionStructure,
    precedenceSpec: kpCanonicalLogProductSemanticMotionPrecedence
  });

function stateRef(state: KpLogProductState) {
  return Object.freeze({
    id: state.id,
    objectIds: Object.freeze([state.id]),
    entityIds: Object.freeze(
      listKpLogProductExpressionNodes(state).map(({ id }) => id)
    )
  });
}

function sourceIds(...semanticIds: readonly KpLogProductSemanticId[]): readonly string[] {
  return semanticIds.map((semanticId) => occurrence(operation.contract.source, semanticId));
}

function targetIds(...semanticIds: readonly KpLogProductSemanticId[]): readonly string[] {
  return semanticIds.map((semanticId) => occurrence(operation.contract.target, semanticId));
}

function occurrence(state: KpLogProductState, semanticId: KpLogProductSemanticId): string {
  const matches = listKpLogProductExpressionNodes(state).filter(
    (node) => node.semanticId === semanticId
  );
  if (matches.length !== 1) {
    throw new Error(`${semanticId} must name exactly one ${state.id} occurrence.`);
  }
  return matches[0]!.id;
}

function role(
  id: string,
  cardinality: "exactly-one" | "one-or-more",
  participation: "material" | "operator" | "punctuation",
  attachmentPolicy: "required" | "none"
) {
  return Object.freeze({ id, cardinality, participation, attachment: attachmentPolicy });
}

function cohort(id: string, memberRoleIds: readonly string[], variantId: string) {
  return Object.freeze({
    id,
    memberRoleIds: Object.freeze([...memberRoleIds]),
    cohesion: Object.freeze({ scope: "family-local" as const, variantId })
  });
}

function attachment(
  id: string,
  kind: "operator-argument" | "connector-between" | "punctuation-encloses",
  anchorRoleIds: readonly string[],
  attachedRoleIds: readonly string[]
) {
  return Object.freeze({
    id,
    kind,
    anchorRoleIds: Object.freeze([...anchorRoleIds]),
    attachedRoleIds: Object.freeze([...attachedRoleIds])
  });
}

function event(
  id: string,
  kind: KpSemanticMotionEventSpec["kind"],
  cohortIds: readonly string[]
): KpSemanticMotionEventSpec {
  return Object.freeze({
    id,
    kind,
    cohortIds: Object.freeze([...cohortIds]),
    attachmentIds: Object.freeze([]),
    correspondenceRecordIds: Object.freeze([]),
    summary: `${kind} log-product semantic material.`
  });
}

function precedenceChain(
  events: readonly KpSemanticMotionEventSpec[]
): KpSemanticMotionPrecedenceSpec {
  return Object.freeze({
    events: Object.freeze([...events]),
    edges: Object.freeze(events.slice(0, -1).map((current, index) =>
      Object.freeze({
        beforeEventId: current.id,
        afterEventId: events[index + 1]!.id
      })
    ))
  });
}
