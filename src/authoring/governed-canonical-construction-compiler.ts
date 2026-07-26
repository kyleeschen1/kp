import {
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import type { KpCanonicalOperationPackPin } from "../semantic/canonical-operation-pack.ts";
import {
  validateCorrespondenceMap
} from "../semantic/correspondence.ts";
import {
  createKpCanonicalAnimationConstruction,
  type KpCanonicalAnimationConstructionArtifact,
  type KpCanonicalConstructionOperationRef
} from "./canonical-animation-construction.ts";
import {
  createKpGovernedCanonicalConstructionRequest,
  validateKpGovernedCanonicalConstructionRequest,
  type KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";

export interface KpGovernedConstructionSourceAuthority {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  readonly animation: KpAnimationAsset;
}

export interface KpGovernedConstructionVerificationIssue {
  readonly code:
    | "governed-verification.request"
    | "governed-verification.source"
    | "governed-verification.pack"
    | "governed-verification.asset"
    | "governed-verification.object"
    | "governed-verification.operation"
    | "governed-verification.closure"
    | "governed-verification.definition"
    | "governed-verification.law"
    | "governed-verification.lineage";
  readonly path: string;
  readonly message: string;
}

export interface KpGovernedConstructionOperationEvidence {
  readonly operationId: string;
  readonly definitionId: string;
  readonly strictLawIds: readonly string[];
  readonly sourceTruth: {
    readonly objectIds: readonly string[];
    readonly expressionIds: readonly string[];
  };
  readonly targetTruth: {
    readonly objectIds: readonly string[];
    readonly expressionIds: readonly string[];
  };
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly lineageIds: readonly string[];
}

export interface KpVerifiedGovernedCanonicalConstruction {
  readonly kind: "verified-governed-canonical-construction";
  readonly requestId: string;
  readonly construction: KpCanonicalAnimationConstructionArtifact;
  readonly mathematicalVerification: {
    readonly sourceId: string;
    readonly revisionId: string;
    readonly operationPacks: readonly KpCanonicalOperationPackPin[];
    readonly operations: readonly KpGovernedConstructionOperationEvidence[];
  };
}

export class KpGovernedConstructionVerificationError extends Error {
  readonly issues: readonly KpGovernedConstructionVerificationIssue[];

  constructor(issues: readonly KpGovernedConstructionVerificationIssue[]) {
    super(issues.map(({ path, message }) => `${path}: ${message}`).join("\n"));
    this.name = "KpGovernedConstructionVerificationError";
    this.issues = Object.freeze([...issues]);
  }
}

/**
 * Verifies provider-selected references against compiler-owned semantic truth.
 * The request never contributes expressions, roles, lineage, definitions, or
 * laws; all of those are projected from the accepted animation authority.
 */
export function validateKpGovernedCanonicalConstructionCompilation(input: {
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly authority: KpGovernedConstructionSourceAuthority;
}): readonly KpGovernedConstructionVerificationIssue[] {
  const { request, authority } = input;
  const issues: KpGovernedConstructionVerificationIssue[] = [];
  validateKpGovernedCanonicalConstructionRequest(request).forEach((requestIssue) => {
    issues.push(issue(
      "governed-verification.request",
      requestIssue.path,
      requestIssue.message
    ));
  });
  if (request.source.sourceId !== authority.sourceId) {
    issues.push(issue(
      "governed-verification.source",
      "$.source.sourceId",
      `Requested source ${request.source.sourceId} does not match verified source ${authority.sourceId}.`
    ));
  }
  if (request.source.revisionId !== authority.revisionId) {
    issues.push(issue(
      "governed-verification.source",
      "$.source.revisionId",
      `Requested revision ${request.source.revisionId} does not match verified revision ${authority.revisionId}.`
    ));
  }
  if (!samePins(request.source.operationPacks, authority.operationPacks)) {
    issues.push(issue(
      "governed-verification.pack",
      "$.source.operationPacks",
      "Requested operation-pack pins do not exactly match the verified source."
    ));
  }
  validateKpAnimationAsset(authority.animation).forEach((assetIssue) => {
    issues.push(issue(
      "governed-verification.asset",
      `$.authority.animation.${assetIssue.path}`,
      assetIssue.message
    ));
  });

  const objects = new Map(
    authority.animation.bundle.objects.map((object) => [object.id, object])
  );
  const operations = new Map(
    authority.animation.transformations.map((operation) => [
      operation.id,
      operation
    ])
  );
  const approvedObjectIds = new Set(request.approvedObjectIds);
  request.approvedObjectIds.forEach((objectId, index) => {
    if (!objects.has(objectId)) {
      issues.push(issue(
        "governed-verification.object",
        `$.approvedObjectIds[${index}]`,
        `Unknown verified object ${objectId}.`
      ));
    }
  });
  request.approvedOperationIds.forEach((operationId, index) => {
    if (!operations.has(operationId)) {
      issues.push(issue(
        "governed-verification.operation",
        `$.approvedOperationIds[${index}]`,
        `Unknown verified operation ${operationId}.`
      ));
    }
  });

  request.compositionIntent.operationIds.forEach((operationId) => {
    const operation = operations.get(operationId);
    if (operation === undefined) return;
    const operationPath =
      `$.authority.animation.transformations.${operationId}`;
    [...operation.sourceObjectIds, ...operation.targetObjectIds].forEach(
      (objectId) => {
        if (!approvedObjectIds.has(objectId)) {
          issues.push(issue(
            "governed-verification.closure",
            `${operationPath}.objectIds`,
            `Operation ${operationId} requires approved object ${objectId}.`
          ));
        }
      }
    );
    if (operation.definitionId === undefined) {
      issues.push(issue(
        "governed-verification.definition",
        `${operationPath}.definitionId`,
        `Operation ${operationId} has no verified transformation definition.`
      ));
    }
    const strictLawIds = operation.lawRefs
      ?.filter(({ level }) => level === "strict")
      .map(({ id }) => id) ?? [];
    if (strictLawIds.length === 0) {
      issues.push(issue(
        "governed-verification.law",
        `${operationPath}.lawRefs`,
        `Operation ${operationId} has no strict mathematical law evidence.`
      ));
    }
    if (
      operation.correspondenceMap === undefined ||
      operation.correspondenceMap.records.length === 0
    ) {
      issues.push(issue(
        "governed-verification.lineage",
        `${operationPath}.correspondenceMap`,
        `Operation ${operationId} has no verified lineage.`
      ));
    } else {
      validateCorrespondenceMap(operation.correspondenceMap).forEach(
        (lineageIssue) => {
          issues.push(issue(
            "governed-verification.lineage",
            `${operationPath}.correspondenceMap.${lineageIssue.path}`,
            lineageIssue.message
          ));
        }
      );
    }
  });
  return Object.freeze(issues);
}

export function compileKpGovernedCanonicalConstruction(input: {
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly authority: KpGovernedConstructionSourceAuthority;
}): KpVerifiedGovernedCanonicalConstruction {
  const issues = validateKpGovernedCanonicalConstructionCompilation(input);
  if (issues.length > 0) {
    throw new KpGovernedConstructionVerificationError(issues);
  }
  const request = createKpGovernedCanonicalConstructionRequest(input.request);
  const objectById = new Map(
    input.authority.animation.bundle.objects.map((object) => [object.id, object])
  );
  const operationById = new Map(
    input.authority.animation.transformations.map((operation) => [
      operation.id,
      operation
    ])
  );
  const operationRefs = request.compositionIntent.operationIds.map(
    (operationId) => compileOperation(operationById.get(operationId)!)
  );
  const stepIdByOperationId = new Map(operationRefs.map((operation) => [
    operation.transformationId,
    operation.stepId
  ]));
  const purposeObjectIds = request.explanationPurpose.objectIds.length > 0
    ? request.explanationPurpose.objectIds
    : unique(operationRefs.flatMap((operation) => [
        ...operation.sourceObjectIds,
        ...operation.targetObjectIds
      ]));
  const purposeOperationIds =
    request.explanationPurpose.operationIds.length > 0
      ? request.explanationPurpose.operationIds
      : request.compositionIntent.operationIds;
  const purposeEntityIds = unique(purposeObjectIds.flatMap(
    (objectId) => objectById.get(objectId)!.selectors.map(({ id }) => id)
  ));
  const construction = createKpCanonicalAnimationConstruction({
    id: `construction.${request.id}`,
    title: input.authority.animation.title,
    semanticSource: {
      sourceId: input.authority.sourceId,
      revisionId: input.authority.revisionId,
      operationPacks: input.authority.operationPacks
    },
    objects: request.approvedObjectIds.map((objectId) => {
      const object = objectById.get(objectId)!;
      return {
        objectId,
        entityIds: object.selectors.map(({ id }) => id),
        expressionIds: [objectId]
      };
    }),
    operations: operationRefs,
    explanationIntents: [{
      id: `intent.${request.id}`,
      kind: request.explanationPurpose.kind,
      operationStepIds: purposeOperationIds.map(
        (operationId) => stepIdByOperationId.get(operationId)!
      ),
      entityIds: purposeEntityIds,
      detail: request.detailLevel
    }],
    composition: {
      id: `composition.${request.id}`,
      kind: request.compositionIntent.kind,
      operationStepIds: operationRefs.map(({ stepId }) => stepId)
    },
    checkpoints: compileCheckpoints(
      request.id,
      request.compositionIntent.kind,
      operationRefs
    )
  });
  const operationEvidence = operationRefs.map((operation) => {
    const source = operation.sourceObjectIds.flatMap(
      (objectId) => [objectById.get(objectId)!]
    );
    const target = operation.targetObjectIds.flatMap(
      (objectId) => [objectById.get(objectId)!]
    );
    const verified = operationById.get(operation.transformationId)!;
    return Object.freeze({
      operationId: operation.transformationId,
      definitionId: operation.definitionId,
      strictLawIds: Object.freeze(
        verified.lawRefs!
          .filter(({ level }) => level === "strict")
          .map(({ id }) => id)
      ),
      sourceTruth: Object.freeze({
        objectIds: Object.freeze([...operation.sourceObjectIds]),
        expressionIds: Object.freeze(source.map(({ id }) => id))
      }),
      targetTruth: Object.freeze({
        objectIds: Object.freeze([...operation.targetObjectIds]),
        expressionIds: Object.freeze(target.map(({ id }) => id))
      }),
      roleBindings: operation.roleBindings,
      lineageIds: Object.freeze(operation.lineage.map(({ id }) => id))
    });
  });
  return Object.freeze({
    kind: "verified-governed-canonical-construction" as const,
    requestId: request.id,
    construction,
    mathematicalVerification: Object.freeze({
      sourceId: input.authority.sourceId,
      revisionId: input.authority.revisionId,
      operationPacks: Object.freeze(
        input.authority.operationPacks.map((pin) => Object.freeze({ ...pin }))
      ),
      operations: Object.freeze(operationEvidence)
    })
  });
}

function compileOperation(
  operation: KpAnimationAsset["transformations"][number]
): KpCanonicalConstructionOperationRef {
  const lineage = operation.correspondenceMap!.records.map((record) => ({
    id: record.id,
    relation: record.relation,
    sourceEntityIds: record.sourceSelectorIds,
    targetEntityIds: record.targetSelectorIds
  }));
  return {
    stepId: `step.${operation.id}`,
    transformationId: operation.id,
    definitionId: operation.definitionId!,
    sourceObjectIds: operation.sourceObjectIds,
    targetObjectIds: operation.targetObjectIds,
    roleBindings: Object.fromEntries(lineage.map((record) => [
      `correspondence.${record.id}`,
      unique([...record.sourceEntityIds, ...record.targetEntityIds])
    ])),
    lineage
  };
}

function compileCheckpoints(
  requestId: string,
  kind: KpGovernedCanonicalConstructionRequest["compositionIntent"]["kind"],
  operations: readonly KpCanonicalConstructionOperationRef[]
) {
  const allStepIds = operations.map(({ stepId }) => stepId);
  if (kind === "sequence") {
    return [
      {
        id: `checkpoint.${requestId}.source`,
        kind: "source" as const,
        afterOperationStepIds: [],
        objectIds: operations[0]!.sourceObjectIds,
        focusEntityIds: []
      },
      ...operations.map((operation, index) => ({
        id: `checkpoint.${requestId}.${index + 1}`,
        kind: index === operations.length - 1
          ? "target" as const
          : "operation" as const,
        afterOperationStepIds: allStepIds.slice(0, index + 1),
        objectIds: operation.targetObjectIds,
        focusEntityIds: []
      }))
    ];
  }
  return [
    {
      id: `checkpoint.${requestId}.source`,
      kind: "source" as const,
      afterOperationStepIds: [],
      objectIds: unique(operations.flatMap(({ sourceObjectIds }) =>
        sourceObjectIds
      )),
      focusEntityIds: []
    },
    {
      id: `checkpoint.${requestId}.target`,
      kind: "target" as const,
      afterOperationStepIds: allStepIds,
      objectIds: unique(operations.flatMap(({ targetObjectIds }) =>
        targetObjectIds
      )),
      focusEntityIds: []
    }
  ];
}

function samePins(
  left: readonly KpCanonicalOperationPackPin[],
  right: readonly KpCanonicalOperationPackPin[]
): boolean {
  const keys = (pins: readonly KpCanonicalOperationPackPin[]) =>
    pins.map(({ packId, version }) => `${packId}@${version}`).sort();
  return JSON.stringify(keys(left)) === JSON.stringify(keys(right));
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function issue(
  code: KpGovernedConstructionVerificationIssue["code"],
  path: string,
  message: string
): KpGovernedConstructionVerificationIssue {
  return Object.freeze({ code, path, message });
}
