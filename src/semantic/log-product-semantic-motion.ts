import {
  compileKpSemanticMotion,
  createKpSemanticMotionCompilerRequestV1,
  createKpSemanticMotionSourceAuthority,
  kpSemanticMotionCompilerRequestSchemaVersion,
  type KpCompiledSemanticMotionChoreography,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionEventSpec,
  type KpSemanticMotionOperationStructureContract,
  type KpSemanticMotionPrecedenceSpec,
  type KpSemanticMotionSourceAuthorityV1
} from "../domain-ir/public-api.ts";
import {
  listKpLogProductExpressionNodes,
  type KpLogProductSemanticId,
  type KpLogProductState
} from "./log-product-states.ts";
import {
  kpCanonicalCompiledLogProductOperation,
  kpLogProductCompiledOperations,
  kpMultiFactorCompiledLogProductOperation,
  type KpCompiledLogProductOperation
} from "./log-product-transformation-compiler.ts";

export interface KpCompiledLogProductSemanticMotionBundle {
  readonly operation: KpCompiledLogProductOperation;
  readonly source: KpSemanticMotionSourceAuthorityV1;
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly structure: KpSemanticMotionOperationStructureContract;
  readonly precedence: KpSemanticMotionPrecedenceSpec;
  readonly choreography: KpCompiledSemanticMotionChoreography;
}

export function compileKpLogProductSemanticMotion(
  operation: KpCompiledLogProductOperation
): KpCompiledLogProductSemanticMotionBundle {
  const correspondenceMap = operation.transformation.correspondenceMap;
  if (correspondenceMap === undefined) {
    throw new Error("Log-product semantic motion requires correspondence authority.");
  }
  const { contract } = operation;
  const { family } = contract;
  const sourceState = stateRef(contract.source);
  const targetState = stateRef(contract.target);
  const factorKey = family.factors.map(({ name }) => name).join("");
  const semanticIdentityIdByEntityId = Object.freeze(Object.fromEntries(
    [contract.source, contract.target].flatMap((state) =>
      listKpLogProductExpressionNodes(state).map((node) => [
        node.id,
        node.semanticId
      ] as const)
    )
  ));
  const source = createKpSemanticMotionSourceAuthority({
    sourceId: `semantic-source.log-product.${factorKey}-to-sum`,
    revisionId: `revision.log-product.${factorKey}.semantic-motion.v1`,
    transformationId: operation.transformation.id,
    assetIds: [contract.animationId],
    sourceState,
    targetState,
    correspondenceMap,
    semanticIdentityIdByEntityId
  });
  const sourceIds = (...semanticIds: readonly KpLogProductSemanticId[]) =>
    semanticIds.map((semanticId) => occurrence(contract.source, semanticId));
  const targetIds = (...semanticIds: readonly KpLogProductSemanticId[]) =>
    semanticIds.map((semanticId) => occurrence(contract.target, semanticId));
  const targetWrapperSemanticIds = family.factors.map(({ targetWrapper }) =>
    targetWrapper
  );
  const request = createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: `request.log-product.${factorKey}-to-sum.semantic-motion.v1`,
    assetId: contract.animationId,
    semanticSource: {
      sourceId: source.sourceId,
      revisionId: source.revisionId,
      operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
    },
    sourceState,
    targetState,
    operation: {
      stepId: `step.log-product.${factorKey}-to-sum`,
      transformationId: operation.transformation.id,
      operationId: "kp.semantic-motion.log-product",
      roleBindings: {
        "source-application": sourceIds(family.sourceWrapper.application),
        "target-applications": targetIds(
          ...targetWrapperSemanticIds.map(({ application }) => application)
        ),
        "source-operator": sourceIds(family.sourceWrapper.operator),
        "target-operators": targetIds(
          ...targetWrapperSemanticIds.map(({ operator }) => operator)
        ),
        "source-arguments": sourceIds(
          ...family.factors.map(({ semanticId }) => semanticId)
        ),
        "target-arguments": targetIds(
          ...family.factors.map(({ semanticId }) => semanticId)
        ),
        "source-shells": sourceIds(
          family.sourceWrapper.open,
          family.sourceWrapper.close
        ),
        "target-shells": targetIds(
          ...targetWrapperSemanticIds.flatMap(({ open, close }) => [open, close])
        ),
        "source-product": sourceIds(family.sourceProductSemanticId),
        "target-sum": targetIds(family.targetSumSemanticId),
        connector: targetIds(...family.connectorSemanticIds)
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
          family.sourceWrapper.application,
          family.sourceProductSemanticId
        ),
        ...targetIds(
          ...targetWrapperSemanticIds.map(({ application }) => application),
          ...family.connectorSemanticIds
        )
      ]),
      secondaryEntityIds: Object.freeze([
        ...sourceIds(...family.factors.map(({ semanticId }) => semanticId)),
        ...targetIds(...family.factors.map(({ semanticId }) => semanticId))
      ]),
      summary:
        `Show one logarithm deriving ${family.factors.length} applications while ` +
        "ordered factors preserve identity as target arguments."
    }
  });
  const structure = createStructure();
  const precedence = coordinatedFissionPrecedence([
    event(
      "event.log-product.orient",
      "orient",
      ["cohort.log-product.applications"],
      ["correspondence.log-product.application-fission"]
    ),
    event("event.log-product.arrive", "arrival", [
      "cohort.log-product.arguments"
    ], family.factors.map(({ name }) =>
      `correspondence.log-product.${name}-argument-continuity`
    )),
    event(
      "event.log-product.release-shells",
      "clearance",
      ["cohort.log-product.shells"],
      [
        "correspondence.log-product.open-shell-fission",
        "correspondence.log-product.close-shell-fission"
      ]
    ),
    event("event.log-product.depart", "departure", [
      "cohort.log-product.operators"
    ], ["correspondence.log-product.operator-fission"]),
    Object.freeze({
      id: "event.log-product.attach-target",
      kind: "attachment" as const,
      cohortIds: Object.freeze(["cohort.log-product.homomorphism"]),
      attachmentIds: Object.freeze([
        "attachment.log-product.target-operators",
        "attachment.log-product.target-shells",
        "attachment.log-product.connector"
      ]),
      correspondenceRecordIds: Object.freeze([
        "correspondence.log-product.product-derives-sum"
      ]),
      summary: "Attach every target logarithm shell and place plus between ordered applications."
    }),
    event("event.log-product.settle", "settlement", [
      "cohort.log-product.homomorphism"
    ]),
    Object.freeze({
      id: "event.log-product.native-target-ready",
      kind: "native-target-ready" as const,
      cohortIds: Object.freeze([]),
      attachmentIds: Object.freeze([]),
      correspondenceRecordIds: Object.freeze([]),
      summary: "Transfer paint ownership to the settled native target."
    })
  ]);
  const compiled = compileKpSemanticMotion({
    request,
    source,
    structureContract: structure,
    precedenceSpec: precedence
  });
  if (compiled.status !== "compiled") {
    throw new Error(
      `Log-product ${factorKey} semantic motion failed closed with ${compiled.status}.`
    );
  }
  return Object.freeze({
    operation,
    source,
    request,
    structure,
    precedence,
    choreography: compiled.choreography
  });
}

export const kpLogProductSemanticMotionBundles:
readonly KpCompiledLogProductSemanticMotionBundle[] = Object.freeze(
  kpLogProductCompiledOperations.map(compileKpLogProductSemanticMotion)
);
export const kpCanonicalLogProductSemanticMotionBundle =
  kpLogProductSemanticMotionBundles[0]!;
export const kpMultiFactorLogProductSemanticMotionBundle =
  kpLogProductSemanticMotionBundles[1]!;

export const kpCanonicalLogProductSemanticMotionSource =
  kpCanonicalLogProductSemanticMotionBundle.source;
export const kpCanonicalLogProductSemanticMotionRequest =
  kpCanonicalLogProductSemanticMotionBundle.request;
export const kpCanonicalLogProductSemanticMotionStructure =
  kpCanonicalLogProductSemanticMotionBundle.structure;
export const kpCanonicalLogProductSemanticMotionPrecedence =
  kpCanonicalLogProductSemanticMotionBundle.precedence;
export const kpCanonicalCompiledLogProductSemanticMotion =
  kpCanonicalLogProductSemanticMotionBundle.choreography;
export const kpMultiFactorCompiledLogProductSemanticMotion =
  kpMultiFactorLogProductSemanticMotionBundle.choreography;

function createStructure(): KpSemanticMotionOperationStructureContract {
  return Object.freeze({
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
      role("connector", "one-or-more", "punctuation", "required")
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
  });
}

function stateRef(state: KpLogProductState) {
  return Object.freeze({
    id: state.id,
    objectIds: Object.freeze([state.id]),
    entityIds: Object.freeze(
      listKpLogProductExpressionNodes(state).map(({ id }) => id)
    )
  });
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
  cohortIds: readonly string[],
  correspondenceRecordIds: readonly string[] = []
): KpSemanticMotionEventSpec {
  return Object.freeze({
    id,
    kind,
    cohortIds: Object.freeze([...cohortIds]),
    attachmentIds: Object.freeze([]),
    correspondenceRecordIds: Object.freeze([...correspondenceRecordIds]),
    summary: `${kind} log-product semantic material.`
  });
}

function coordinatedFissionPrecedence(
  events: readonly KpSemanticMotionEventSpec[]
): KpSemanticMotionPrecedenceSpec {
  const [orient, arrive, releaseShells, depart, attach, settle, nativeReady] =
    events;
  if (
    orient === undefined || arrive === undefined ||
    releaseShells === undefined || depart === undefined ||
    attach === undefined || settle === undefined || nativeReady === undefined
  ) {
    throw new Error("Log-product fission precedence requires seven events.");
  }
  return Object.freeze({
    events: Object.freeze([...events]),
    // These cohorts are semantically simultaneous; attachment supplies the
    // only ordering boundary instead of renderer-specific sequencing.
    edges: Object.freeze([
      arrive,
      releaseShells,
      depart
    ].flatMap((fissionEvent) => [
      Object.freeze({ beforeEventId: orient.id, afterEventId: fissionEvent.id }),
      Object.freeze({ beforeEventId: fissionEvent.id, afterEventId: attach.id })
    ]).concat([
      Object.freeze({ beforeEventId: attach.id, afterEventId: settle.id }),
      Object.freeze({ beforeEventId: settle.id, afterEventId: nativeReady.id })
    ]))
  });
}

// Keep the named operations visibly tied to their bundles at module load.
void kpCanonicalCompiledLogProductOperation;
void kpMultiFactorCompiledLogProductOperation;
