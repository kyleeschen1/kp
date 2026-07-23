import {
  createKpGovernedSemanticAuthoringRequest,
  kpGovernedSemanticAuthoringSchemaVersion,
  validateKpGovernedSemanticAuthoringRequest,
  type KpGovernedNormalFormId,
  type KpGovernedSemanticAuthoringRequest,
  type KpGovernedSemanticAuthoringSchemaIssue
} from "./governed-semantic-request.ts";
import type { KpCanonicalOperationId } from "../semantic/canonical-operation.ts";
import type { KpCanonicalOperationContract } from "../semantic/canonical-operation-contract.ts";
import {
  createKpCanonicalOperationProjectPins
} from "../semantic/canonical-operation-pack.ts";
import {
  kpCanonicalOperationRegistry,
  resolveKpCanonicalOperation
} from "../semantic/canonical-operation-registry.ts";
import {
  validateCorrespondenceMap
} from "../semantic/correspondence.ts";

export const kpGovernedSemanticCompilerVersion =
  "kp.governed-semantic-compiler.v1" as const;

export interface KpGovernedSemanticSourceAuthority {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly entityIds: readonly string[];
  readonly expressionIds: readonly string[];
  readonly supportedNormalFormIds: readonly KpGovernedNormalFormId[];
  readonly evidenceIds: readonly string[];
}

export interface KpGovernedProviderProvenance {
  readonly providerId: string;
  readonly modelId: string;
  readonly responseId: string;
}

export type KpGovernedSemanticRepairPatch =
  | {
      readonly kind: "replace-source-revision";
      readonly expectedRevisionId: string;
      readonly replacementRevisionId: string;
    }
  | {
      readonly kind: "replace-operation-id";
      readonly expectedOperationId: string;
      readonly replacementOperationId: string;
    }
  | {
      readonly kind: "replace-role-binding";
      readonly roleId: string;
      readonly expectedEntityIds: readonly string[];
      readonly replacementEntityIds: readonly string[];
    }
  | {
      readonly kind: "replace-normal-form";
      readonly expectedNormalFormId: KpGovernedNormalFormId;
      readonly replacementNormalFormId: KpGovernedNormalFormId;
    };

export type KpGovernedSemanticCompileDiagnosticCode =
  | KpGovernedSemanticAuthoringSchemaIssue["code"]
  | "governed-compile.provenance"
  | "governed-compile.source"
  | "governed-compile.reference"
  | "governed-compile.pack"
  | "governed-compile.operation"
  | "governed-compile.role"
  | "governed-compile.correspondence"
  | "governed-compile.normal-form";

export interface KpGovernedSemanticCompileDiagnostic {
  readonly code: KpGovernedSemanticCompileDiagnosticCode;
  readonly path: string;
  readonly message: string;
  readonly repair: {
    readonly targetId: string;
    readonly allowedPatchKinds: readonly KpGovernedSemanticRepairPatch["kind"][];
    readonly suggestedPatch?: KpGovernedSemanticRepairPatch | undefined;
  };
}

export interface KpGovernedSemanticCompiledPlan {
  readonly kind: "governed-semantic-plan";
  readonly schemaVersion: typeof kpGovernedSemanticCompilerVersion;
  readonly requestId: string;
  readonly title: string;
  readonly source: {
    readonly sourceId: string;
    readonly revisionId: string;
    readonly entityIds: readonly string[];
    readonly expressionIds: readonly string[];
  };
  readonly operation: {
    readonly operationId: string;
    readonly operationPack: {
      readonly packId: string;
      readonly version: string;
    };
    readonly canonicalComposition: readonly KpCanonicalOperationId[];
    readonly roleBindings: Readonly<Record<string, readonly string[]>>;
    readonly correspondence: KpGovernedSemanticAuthoringRequest["operationIntent"]["correspondence"];
    readonly governance: {
      readonly authority: KpCanonicalOperationContract["authority"];
      readonly ownershipMode: KpCanonicalOperationContract["ownershipMode"];
      readonly lawIds: readonly string[];
      readonly witnessIds: readonly string[];
      readonly motifRequirementIds: readonly string[];
      readonly pacing: {
        readonly kind: KpCanonicalOperationContract["pacing"]["kind"];
        readonly semanticUnitCount: number;
      };
    };
  };
  readonly focusIntent: KpGovernedSemanticAuthoringRequest["focusIntent"];
  readonly cadenceIntent: KpGovernedSemanticAuthoringRequest["cadenceIntent"];
  readonly normalFormIntent: KpGovernedSemanticAuthoringRequest["normalFormIntent"];
  readonly compressionIntent: KpGovernedSemanticAuthoringRequest["compressionIntent"];
  readonly provenance: {
    readonly source: {
      readonly sourceId: string;
      readonly revisionId: string;
      readonly evidenceIds: readonly string[];
    };
    readonly provider: KpGovernedProviderProvenance;
    readonly compiler: {
      readonly compilerVersion: typeof kpGovernedSemanticCompilerVersion;
      readonly requestSchemaVersion: typeof kpGovernedSemanticAuthoringSchemaVersion;
    };
  };
}

export type KpGovernedSemanticCompileResult =
  | {
      readonly status: "accepted";
      readonly request: KpGovernedSemanticAuthoringRequest;
      readonly plan: KpGovernedSemanticCompiledPlan;
      readonly fingerprint: string;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpGovernedSemanticCompileDiagnostic[];
    };

export function compileKpGovernedSemanticAuthoring(input: {
  readonly request: unknown;
  readonly sources: readonly KpGovernedSemanticSourceAuthority[];
  readonly provenance: KpGovernedProviderProvenance;
}): KpGovernedSemanticCompileResult {
  const schemaIssues = validateKpGovernedSemanticAuthoringRequest(input.request);
  if (schemaIssues.length > 0) {
    return repairRequired(schemaIssues.map((issue) => diagnosticForSchemaIssue(input.request, issue)));
  }
  const request = createKpGovernedSemanticAuthoringRequest(input.request);
  const diagnostics: KpGovernedSemanticCompileDiagnostic[] = [];
  validateProvenance(input.provenance, request.id, diagnostics);

  const matchingSource = input.sources.find((source) =>
    source.sourceId === request.source.sourceId &&
    source.revisionId === request.source.revisionId
  );
  if (matchingSource === undefined) {
    const currentSource = input.sources.find((source) => source.sourceId === request.source.sourceId);
    diagnostics.push(diagnostic({
      code: "governed-compile.source",
      path: "$.source.revisionId",
      message: currentSource === undefined
        ? `Unknown verified semantic source ${request.source.sourceId}.`
        : `Verified source ${request.source.sourceId} is available at revision ${currentSource.revisionId}, not ${request.source.revisionId}.`,
      targetId: request.id,
      allowedPatchKinds: currentSource === undefined ? [] : ["replace-source-revision"],
      ...(currentSource === undefined ? {} : {
        suggestedPatch: {
          kind: "replace-source-revision",
          expectedRevisionId: request.source.revisionId,
          replacementRevisionId: currentSource.revisionId
        }
      })
    }));
  }
  const source = matchingSource;
  if (source !== undefined) {
    validateSourceReferences(request, source, diagnostics);
  }

  let resolution: ReturnType<typeof resolveKpCanonicalOperation> | undefined;
  try {
    const pins = createKpCanonicalOperationProjectPins(request.source.operationPacks);
    resolution = resolveKpCanonicalOperation({
      registry: kpCanonicalOperationRegistry,
      pins,
      operationId: request.operationIntent.operationId
    });
    if (resolution.status !== "resolved") {
      diagnostics.push(diagnostic({
        code: resolution.status === "unknown-operation"
          ? "governed-compile.operation"
          : "governed-compile.pack",
        path: resolution.status === "unknown-operation"
          ? "$.operationIntent.operationId"
          : "$.source.operationPacks",
        message: resolution.message,
        targetId: request.id,
        allowedPatchKinds: resolution.status === "unknown-operation"
          ? ["replace-operation-id"]
          : []
      }));
    }
  } catch (error) {
    diagnostics.push(diagnostic({
      code: "governed-compile.pack",
      path: "$.source.operationPacks",
      message: error instanceof Error ? error.message : String(error),
      targetId: request.id,
      allowedPatchKinds: []
    }));
  }

  if (resolution?.status === "resolved") {
    validateOperationIntent(request, resolution.entry.contract, diagnostics);
  }
  if (diagnostics.length > 0 || source === undefined || resolution?.status !== "resolved") {
    return repairRequired(diagnostics);
  }

  const plan = createCompiledPlan({
    request,
    source,
    provenance: input.provenance,
    pack: resolution.pack,
    operation: resolution.entry
  });
  return deepFreeze({
    status: "accepted" as const,
    request,
    plan,
    fingerprint: fingerprint(plan),
    diagnostics: [] as const
  });
}

export function applyKpGovernedSemanticRepairPatch(
  request: KpGovernedSemanticAuthoringRequest,
  patch: KpGovernedSemanticRepairPatch
): KpGovernedSemanticAuthoringRequest {
  switch (patch.kind) {
    case "replace-source-revision":
      requireExpected(
        request.source.revisionId,
        patch.expectedRevisionId,
        "$.source.revisionId"
      );
      return {
        ...request,
        source: { ...request.source, revisionId: patch.replacementRevisionId }
      };
    case "replace-operation-id":
      requireExpected(
        request.operationIntent.operationId,
        patch.expectedOperationId,
        "$.operationIntent.operationId"
      );
      return {
        ...request,
        operationIntent: {
          ...request.operationIntent,
          operationId: patch.replacementOperationId
        }
      };
    case "replace-role-binding": {
      const current = request.operationIntent.roleBindings[patch.roleId] ?? [];
      requireExpectedList(current, patch.expectedEntityIds, `$.operationIntent.roleBindings.${patch.roleId}`);
      return {
        ...request,
        operationIntent: {
          ...request.operationIntent,
          roleBindings: {
            ...request.operationIntent.roleBindings,
            [patch.roleId]: [...patch.replacementEntityIds]
          }
        }
      };
    }
    case "replace-normal-form":
      requireExpected(
        request.normalFormIntent.normalFormId,
        patch.expectedNormalFormId,
        "$.normalFormIntent.normalFormId"
      );
      return {
        ...request,
        normalFormIntent: {
          ...request.normalFormIntent,
          normalFormId: patch.replacementNormalFormId
        }
      };
  }
}

function validateProvenance(
  provenance: KpGovernedProviderProvenance,
  requestId: string,
  diagnostics: KpGovernedSemanticCompileDiagnostic[]
): void {
  (["providerId", "modelId", "responseId"] as const).forEach((key) => {
    if (typeof provenance[key] !== "string" || provenance[key].trim().length === 0) {
      diagnostics.push(diagnostic({
        code: "governed-compile.provenance",
        path: `$.provenance.${key}`,
        message: `Compiler provenance ${key} must be a non-empty string.`,
        targetId: requestId,
        allowedPatchKinds: []
      }));
    }
  });
}

function validateSourceReferences(
  request: KpGovernedSemanticAuthoringRequest,
  source: KpGovernedSemanticSourceAuthority,
  diagnostics: KpGovernedSemanticCompileDiagnostic[]
): void {
  validateReferences(
    request.source.entityIds,
    source.entityIds,
    "$.source.entityIds",
    request.id,
    diagnostics
  );
  validateReferences(
    request.source.expressionIds,
    source.expressionIds,
    "$.source.expressionIds",
    request.id,
    diagnostics
  );
  const declaredEntities = new Set(request.source.entityIds);
  const referencedEntities = [
    ...Object.values(request.operationIntent.roleBindings).flat(),
    ...request.operationIntent.correspondence.flatMap((entry) => [
      ...entry.sourceEntityIds,
      ...entry.targetEntityIds
    ]),
    ...focusEntityIds(request.focusIntent),
    ...request.cadenceIntent.branchEntityIds
  ];
  validateReferences(
    referencedEntities,
    [...declaredEntities],
    "$.source.entityIds",
    request.id,
    diagnostics,
    "Provider intent references an entity not declared by its source envelope"
  );
  validateReferences(
    [
      request.normalFormIntent.sourceExpressionId,
      request.normalFormIntent.targetExpressionId
    ],
    request.source.expressionIds,
    "$.normalFormIntent",
    request.id,
    diagnostics,
    "Normal-form intent references an expression not declared by its source envelope"
  );
  if (!source.supportedNormalFormIds.includes(request.normalFormIntent.normalFormId)) {
    diagnostics.push(diagnostic({
      code: "governed-compile.normal-form",
      path: "$.normalFormIntent.normalFormId",
      message:
        `Verified source ${source.sourceId}@${source.revisionId} does not support ` +
        `${request.normalFormIntent.normalFormId}.`,
      targetId: request.id,
      allowedPatchKinds: ["replace-normal-form"],
      ...(source.supportedNormalFormIds.length === 0 ? {} : {
        suggestedPatch: {
          kind: "replace-normal-form",
          expectedNormalFormId: request.normalFormIntent.normalFormId,
          replacementNormalFormId: source.supportedNormalFormIds[0]!
        }
      })
    }));
  }
}

function validateOperationIntent(
  request: KpGovernedSemanticAuthoringRequest,
  contract: KpCanonicalOperationContract,
  diagnostics: KpGovernedSemanticCompileDiagnostic[]
): void {
  const rolesById = new Map(contract.roles.map((role) => [role.id, role]));
  const boundEntityIds = Object.values(request.operationIntent.roleBindings).flat();
  Object.entries(request.operationIntent.roleBindings).forEach(([roleId, entityIds]) => {
    const role = rolesById.get(roleId);
    if (role === undefined) {
      diagnostics.push(diagnostic({
        code: "governed-compile.role",
        path: `$.operationIntent.roleBindings.${roleId}`,
        message: `Operation ${request.operationIntent.operationId} does not declare role ${roleId}.`,
        targetId: request.id,
        allowedPatchKinds: ["replace-role-binding"]
      }));
      return;
    }
    if (role.cardinality === "exactly-one" && entityIds.length !== 1) {
      diagnostics.push(roleCardinalityDiagnostic(request, roleId, "exactly one"));
    }
    if (role.cardinality === "one-or-more" && entityIds.length < 1) {
      diagnostics.push(roleCardinalityDiagnostic(request, roleId, "one or more"));
    }
  });
  contract.roles.forEach((role) => {
    if (request.operationIntent.roleBindings[role.id] === undefined) {
      diagnostics.push(diagnostic({
        code: "governed-compile.role",
        path: `$.operationIntent.roleBindings.${role.id}`,
        message: `Operation ${request.operationIntent.operationId} requires role ${role.id}.`,
        targetId: request.id,
        allowedPatchKinds: ["replace-role-binding"]
      }));
    }
  });
  request.operationIntent.correspondence.forEach((entry, index) => {
    if (!contract.lineageRelationIds.includes(entry.relation)) {
      diagnostics.push(diagnostic({
        code: "governed-compile.correspondence",
        path: `$.operationIntent.correspondence[${index}].relation`,
        message:
          `Operation ${request.operationIntent.operationId} does not allow ` +
          `${entry.relation} correspondence.`,
        targetId: request.id,
        allowedPatchKinds: []
      }));
    }
    validateReferences(
      [...entry.sourceEntityIds, ...entry.targetEntityIds],
      boundEntityIds,
      `$.operationIntent.correspondence[${index}]`,
      request.id,
      diagnostics,
      "Operation correspondence references an entity outside its role bindings"
    );
    validateCorrespondenceMap({
      id: `${request.id}.correspondence.${index}`,
      records: [{
        id: `${request.id}.correspondence.${index}.record`,
        relation: entry.relation,
        sourceSelectorIds: entry.sourceEntityIds,
        targetSelectorIds: entry.targetEntityIds,
        summary: `Governed correspondence for ${request.operationIntent.operationId}.`
      }]
    }).forEach((issue) => {
      diagnostics.push(diagnostic({
        code: "governed-compile.correspondence",
        path: `$.operationIntent.correspondence[${index}]`,
        message: issue.message,
        targetId: request.id,
        allowedPatchKinds: []
      }));
    });
  });
}

function roleCardinalityDiagnostic(
  request: KpGovernedSemanticAuthoringRequest,
  roleId: string,
  cardinality: string
): KpGovernedSemanticCompileDiagnostic {
  return diagnostic({
    code: "governed-compile.role",
    path: `$.operationIntent.roleBindings.${roleId}`,
    message: `Operation ${request.operationIntent.operationId} role ${roleId} requires ${cardinality} entity.`,
    targetId: request.id,
    allowedPatchKinds: ["replace-role-binding"]
  });
}

function validateReferences(
  values: readonly string[],
  allowedValues: readonly string[],
  path: string,
  requestId: string,
  diagnostics: KpGovernedSemanticCompileDiagnostic[],
  prefix = "Verified semantic source does not contain"
): void {
  const allowed = new Set(allowedValues);
  [...new Set(values)].forEach((value) => {
    if (!allowed.has(value)) {
      diagnostics.push(diagnostic({
        code: "governed-compile.reference",
        path,
        message: `${prefix} ${value}.`,
        targetId: requestId,
        allowedPatchKinds: []
      }));
    }
  });
}

function createCompiledPlan(input: {
  readonly request: KpGovernedSemanticAuthoringRequest;
  readonly source: KpGovernedSemanticSourceAuthority;
  readonly provenance: KpGovernedProviderProvenance;
  readonly pack: { readonly id: string; readonly version: string };
  readonly operation: {
    readonly id: string;
    readonly canonicalComposition: readonly KpCanonicalOperationId[];
    readonly contract: KpCanonicalOperationContract;
  };
}): KpGovernedSemanticCompiledPlan {
  const pacingRoleId = input.operation.contract.pacing.unitRoleId;
  const semanticUnitCount = pacingRoleId === undefined
    ? 1
    : input.request.operationIntent.roleBindings[pacingRoleId]?.length ?? 0;
  return deepFreeze({
    kind: "governed-semantic-plan" as const,
    schemaVersion: kpGovernedSemanticCompilerVersion,
    requestId: input.request.id,
    title: input.request.title,
    source: {
      sourceId: input.source.sourceId,
      revisionId: input.source.revisionId,
      entityIds: [...input.request.source.entityIds],
      expressionIds: [...input.request.source.expressionIds]
    },
    operation: {
      operationId: input.operation.id,
      operationPack: {
        packId: input.pack.id,
        version: input.pack.version
      },
      canonicalComposition: [...input.operation.canonicalComposition],
      roleBindings: Object.fromEntries(Object.entries(input.request.operationIntent.roleBindings)
        .map(([roleId, entityIds]) => [roleId, [...entityIds]])),
      correspondence: input.request.operationIntent.correspondence.map((entry) => ({
        relation: entry.relation,
        sourceEntityIds: [...entry.sourceEntityIds],
        targetEntityIds: [...entry.targetEntityIds]
      })),
      governance: {
        authority: { ...input.operation.contract.authority },
        ownershipMode: input.operation.contract.ownershipMode,
        lawIds: [...input.operation.contract.lawIds],
        witnessIds: [...input.operation.contract.witnessIds],
        motifRequirementIds: [...input.operation.contract.motifRequirementIds],
        pacing: {
          kind: input.operation.contract.pacing.kind,
          semanticUnitCount
        }
      }
    },
    focusIntent: cloneFocus(input.request.focusIntent),
    cadenceIntent: {
      kind: input.request.cadenceIntent.kind,
      branchEntityIds: [...input.request.cadenceIntent.branchEntityIds]
    },
    normalFormIntent: { ...input.request.normalFormIntent },
    compressionIntent: {
      level: input.request.compressionIntent.level,
      preserve: [...input.request.compressionIntent.preserve]
    },
    provenance: {
      source: {
        sourceId: input.source.sourceId,
        revisionId: input.source.revisionId,
        evidenceIds: [...input.source.evidenceIds]
      },
      provider: { ...input.provenance },
      compiler: {
        compilerVersion: kpGovernedSemanticCompilerVersion,
        requestSchemaVersion: kpGovernedSemanticAuthoringSchemaVersion
      }
    }
  });
}

function diagnosticForSchemaIssue(
  value: unknown,
  issue: KpGovernedSemanticAuthoringSchemaIssue
): KpGovernedSemanticCompileDiagnostic {
  const requestId = isRecord(value) && typeof value["id"] === "string"
    ? value["id"]
    : "governed-semantic-request";
  const allowedPatchKinds: KpGovernedSemanticRepairPatch["kind"][] =
    issue.path.includes("roleBindings")
      ? ["replace-role-binding"]
      : issue.path.endsWith(".operationId")
        ? ["replace-operation-id"]
        : issue.path.endsWith(".revisionId")
          ? ["replace-source-revision"]
          : issue.path.endsWith(".normalFormId")
            ? ["replace-normal-form"]
            : [];
  return diagnostic({
    ...issue,
    targetId: requestId,
    allowedPatchKinds
  });
}

function diagnostic(input: {
  readonly code: KpGovernedSemanticCompileDiagnosticCode;
  readonly path: string;
  readonly message: string;
  readonly targetId: string;
  readonly allowedPatchKinds: readonly KpGovernedSemanticRepairPatch["kind"][];
  readonly suggestedPatch?: KpGovernedSemanticRepairPatch | undefined;
}): KpGovernedSemanticCompileDiagnostic {
  return deepFreeze({
    code: input.code,
    path: input.path,
    message: input.message,
    repair: {
      targetId: input.targetId,
      allowedPatchKinds: [...input.allowedPatchKinds],
      ...(input.suggestedPatch === undefined ? {} : { suggestedPatch: input.suggestedPatch })
    }
  });
}

function repairRequired(
  diagnostics: readonly KpGovernedSemanticCompileDiagnostic[]
): KpGovernedSemanticCompileResult {
  return deepFreeze({
    status: "repair-required" as const,
    diagnostics: [...diagnostics]
  });
}

function focusEntityIds(
  focus: KpGovernedSemanticAuthoringRequest["focusIntent"]
): readonly string[] {
  switch (focus.kind) {
    case "notice":
      return focus.targetEntityIds;
    case "compare":
      return [...focus.leftEntityIds, ...focus.rightEntityIds];
    case "transmit":
      return [...focus.sourceEntityIds, ...focus.targetEntityIds];
  }
}

function cloneFocus(
  focus: KpGovernedSemanticAuthoringRequest["focusIntent"]
): KpGovernedSemanticAuthoringRequest["focusIntent"] {
  switch (focus.kind) {
    case "notice":
      return { kind: focus.kind, targetEntityIds: [...focus.targetEntityIds] };
    case "compare":
      return {
        kind: focus.kind,
        leftEntityIds: [...focus.leftEntityIds],
        rightEntityIds: [...focus.rightEntityIds]
      };
    case "transmit":
      return {
        kind: focus.kind,
        sourceEntityIds: [...focus.sourceEntityIds],
        targetEntityIds: [...focus.targetEntityIds]
      };
  }
}

function requireExpected(actual: string, expected: string, path: string): void {
  if (actual !== expected) {
    throw new Error(`Repair precondition failed at ${path}: expected ${expected}, received ${actual}.`);
  }
}

function requireExpectedList(
  actual: readonly string[],
  expected: readonly string[],
  path: string
): void {
  if (actual.length !== expected.length ||
      actual.some((value, index) => value !== expected[index])) {
    throw new Error(`Repair precondition failed at ${path}.`);
  }
}

function fingerprint(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0xcbf29ce484222325n;
  for (const character of input) {
    hash ^= BigInt(character.codePointAt(0)!);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value !== "object" || value === null) return JSON.stringify(value) ?? "null";
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
    .join(",")}}`;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
