import {
  validateKpLlmAnimationDraftV2,
  type KpLlmAnimationDraftV2,
  type KpLlmAnimationDraftV2Issue
} from "./llm-animation-draft-v2.ts";
import {
  createKpSemanticTransitionGap,
  type KpSemanticTransitionGap
} from "../semantic/semantic-transition-gap.ts";
import {
  createKpCanonicalOperationProjectPins
} from "../semantic/canonical-operation-pack.ts";
import {
  kpCanonicalOperationRegistry,
  resolveKpCanonicalOperation
} from "../semantic/canonical-operation-registry.ts";
import type { KpCanonicalOperationId } from "../semantic/canonical-operation.ts";
import type { KpCanonicalOperationContract } from "../semantic/canonical-operation-contract.ts";
import {
  createKpEpistemicBranch,
  type KpEpistemicBranch
} from "../semantic/epistemic-branch.ts";

export type KpLlmAnimationDraftV2Patch =
  | {
      readonly kind: "replace-operation-id";
      readonly derivationId: string;
      readonly operationStepId: string;
      readonly expectedOperationId: string;
      readonly replacementOperationId: string;
    }
  | {
      readonly kind: "replace-role-binding";
      readonly derivationId: string;
      readonly operationStepId: string;
      readonly roleId: string;
      readonly expectedEntityIds: readonly string[];
      readonly replacementEntityIds: readonly string[];
    };

export interface KpLlmAnimationDraftV2CompileDiagnostic extends KpLlmAnimationDraftV2Issue {
  readonly repair: {
    readonly targetId: string;
    readonly allowedPatchKinds: readonly KpLlmAnimationDraftV2Patch["kind"][];
  };
}

export interface KpLlmAnimationDraftV2ResolvedOperation {
  readonly kind: "llm-resolved-operation";
  readonly derivationId: string;
  readonly operationStepId: string;
  readonly operationId: string;
  readonly operationPack: { readonly packId: string; readonly version: string };
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly sourceTransformType?: string | undefined;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly lineageBindings: KpLlmAnimationDraftV2["derivations"][number]["operations"][number]["lineageBindings"];
  readonly ownershipMode: KpLlmAnimationDraftV2["derivations"][number]["operations"][number]["ownershipMode"];
  readonly explanationDepth: KpLlmAnimationDraftV2["derivations"][number]["operations"][number]["explanationDepth"];
  readonly governance: {
    readonly lawIds: readonly string[];
    readonly witnessIds: readonly string[];
    readonly motifRequirementIds: readonly string[];
    readonly pacing: {
      readonly kind: "single" | "per-descendant" | "per-index" | "per-cell";
      readonly semanticUnitCount: number;
    };
    readonly reverse: {
      readonly validity: "identity" | "mathematical-inverse" | "authored-history-only";
      readonly choreographyKind: string;
      readonly causalEmphasis: string;
    };
    readonly cost: {
      readonly tokenCount: number;
      readonly simultaneousGroupCount: number;
      readonly fragmentCount: number;
      readonly shadowPolicy: "none" | "optional" | "required";
      readonly threeDPolicy: "none" | "optional";
    };
  };
}

export type KpLlmAnimationDraftV2CompileResult =
  | {
      readonly status: "accepted";
      readonly draft: KpLlmAnimationDraftV2;
      readonly fingerprint: string;
      readonly resolvedOperations: readonly KpLlmAnimationDraftV2ResolvedOperation[];
      readonly targetTrust: "validated" | "provisional" | "historical-replay";
      readonly epistemicBranches: readonly KpEpistemicBranch[];
      readonly diagnostics: readonly [];
      readonly gaps: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpLlmAnimationDraftV2CompileDiagnostic[];
      readonly gaps: readonly KpSemanticTransitionGap[];
    };

export function compileKpLlmAnimationDraftV2(
  draft: KpLlmAnimationDraftV2
): KpLlmAnimationDraftV2CompileResult {
  const issues = validateKpLlmAnimationDraftV2(draft);
  if (issues.length === 0) {
    const targetTrust = draft.authoringContext.historicalReplayRequested
      ? "historical-replay" as const
      : draft.authoringContext.targetMathAuthority === "trusted-source-evidence"
        ? "validated" as const
        : "provisional" as const;
    return {
      status: "accepted",
      draft,
      fingerprint: stableStringify(draft),
      resolvedOperations: resolveDraftOperations(draft),
      targetTrust,
      epistemicBranches: targetTrust === "validated"
        ? []
        : compileEpistemicBranches(draft),
      diagnostics: [],
      gaps: []
    };
  }
  const diagnostics = issues.map((issue) => diagnosticForIssue(draft, issue));
  return {
    status: "repair-required",
    diagnostics,
    gaps: diagnostics.map((diagnostic) => createKpSemanticTransitionGap({
      transformationId: diagnostic.repair.targetId,
      reason: diagnostic.code === "draft-v2.operation"
        ? diagnostic.path.includes("roleBindings")
          ? "missing-definition-binding"
          : "unsupported-operation"
        : diagnostic.code === "draft-v2.reference"
          ? "invalid-reference"
          : "compile-failed",
      diagnostics: [{
        code: diagnostic.code,
        severity: "error",
        message: `${diagnostic.path}: ${diagnostic.message}`
      }]
    }))
  };
}

function resolveDraftOperations(
  draft: KpLlmAnimationDraftV2
): readonly KpLlmAnimationDraftV2ResolvedOperation[] {
  const pins = createKpCanonicalOperationProjectPins(draft.operationPacks);
  return draft.derivations.flatMap((derivation) =>
    derivation.operations.map((operation) => {
      const resolution = resolveKpCanonicalOperation({
        registry: kpCanonicalOperationRegistry,
        pins,
        operationId: operation.operationId
      });
      // Validation owns repair diagnostics, so an accepted draft reaching this
      // branch must resolve without introducing a second fallback path.
      if (resolution.status !== "resolved") {
        throw new Error(resolution.message);
      }
      return {
        kind: "llm-resolved-operation" as const,
        derivationId: derivation.id,
        operationStepId: operation.id,
        operationId: operation.operationId,
        operationPack: {
          packId: resolution.pack.id,
          version: resolution.pack.version
        },
        canonicalComposition: [...resolution.entry.canonicalComposition],
        ...(resolution.entry.sourceTransformType === undefined
          ? {}
          : { sourceTransformType: resolution.entry.sourceTransformType }),
        roleBindings: Object.fromEntries(
          Object.entries(operation.roleBindings).map(([roleId, ids]) => [
            roleId,
            [...ids]
          ])
        ),
        lineageBindings: operation.lineageBindings.map((lineage) => ({
          ...lineage,
          sourceEntityIds: [...lineage.sourceEntityIds],
          targetEntityIds: [...lineage.targetEntityIds]
        })),
        ownershipMode: operation.ownershipMode,
        explanationDepth: operation.explanationDepth,
        governance: governanceForOperation(
          operation,
          resolution.entry.contract
        )
      };
    })
  );
}

function compileEpistemicBranches(
  draft: KpLlmAnimationDraftV2
): readonly KpEpistemicBranch[] {
  return draft.derivations.map((derivation) => {
    const trustedStateId = derivation.sourceStateIds[0]!;
    const proposedStateId = derivation.targetStateIds[0]!;
    const target = draft.states.find((state) => state.id === proposedStateId)!;
    return createKpEpistemicBranch({
      id: `branch.${derivation.id}`,
      origin: draft.authoringContext.source,
      trustedStateId,
      proposedStateId,
      transitionId: derivation.id,
      annotation: target.epistemic,
      ...(draft.authoringContext.historicalReplayRequested
        ? { historicalReplayRequested: true }
        : {})
    });
  });
}

function governanceForOperation(
  operation: KpLlmAnimationDraftV2["derivations"][number]["operations"][number],
  contract: KpCanonicalOperationContract
): KpLlmAnimationDraftV2ResolvedOperation["governance"] {
  const roleCount = (roleIds: readonly string[]): number => roleIds.reduce(
    (count, roleId) => count + (operation.roleBindings[roleId]?.length ?? 0),
    0
  );
  return {
    lawIds: [...contract.lawIds],
    witnessIds: [...contract.witnessIds],
    motifRequirementIds: [...contract.motifRequirementIds],
    pacing: {
      kind: contract.pacing.kind,
      semanticUnitCount: contract.pacing.unitRoleId === undefined
        ? 1
        : operation.roleBindings[contract.pacing.unitRoleId]?.length ?? 0
    },
    reverse: {
      validity: contract.reverse.validity,
      choreographyKind: contract.reverse.choreography.kind,
      causalEmphasis: contract.reverse.choreography.causalEmphasis
    },
    cost: {
      tokenCount: roleCount(contract.cost.tokenRoleIds),
      simultaneousGroupCount: roleCount(contract.cost.simultaneousGroupRoleIds),
      fragmentCount: roleCount(contract.cost.fragmentRoleIds),
      shadowPolicy: contract.cost.shadowPolicy,
      threeDPolicy: contract.cost.threeDPolicy
    }
  };
}

export function applyKpLlmAnimationDraftV2Patch(input: {
  readonly draft: KpLlmAnimationDraftV2;
  readonly patch: KpLlmAnimationDraftV2Patch;
}): KpLlmAnimationDraftV2 {
  const derivationIndex = input.draft.derivations.findIndex(
    (derivation) => derivation.id === input.patch.derivationId
  );
  if (derivationIndex < 0) throw new Error(`Unknown derivation ${input.patch.derivationId}.`);
  const derivation = input.draft.derivations[derivationIndex]!;
  const operationIndex = derivation.operations.findIndex(
    (operation) => operation.id === input.patch.operationStepId
  );
  if (operationIndex < 0) throw new Error(`Unknown operation step ${input.patch.operationStepId}.`);
  const operation = derivation.operations[operationIndex]!;
  const patchedOperation = input.patch.kind === "replace-operation-id"
    ? replaceOperationId(operation, input.patch)
    : replaceRoleBinding(operation, input.patch);
  const patchedDerivation = {
    ...derivation,
    operations: derivation.operations.map((candidate, index) =>
      index === operationIndex ? patchedOperation : candidate
    )
  };
  return {
    ...input.draft,
    derivations: input.draft.derivations.map((candidate, index) =>
      index === derivationIndex ? patchedDerivation : candidate
    )
  };
}

function replaceOperationId(
  operation: KpLlmAnimationDraftV2["derivations"][number]["operations"][number],
  patch: Extract<KpLlmAnimationDraftV2Patch, { readonly kind: "replace-operation-id" }>
) {
  if (operation.operationId !== patch.expectedOperationId) {
    throw new Error(
      `Operation patch expected ${patch.expectedOperationId}, received ${operation.operationId}.`
    );
  }
  return { ...operation, operationId: patch.replacementOperationId };
}

function replaceRoleBinding(
  operation: KpLlmAnimationDraftV2["derivations"][number]["operations"][number],
  patch: Extract<KpLlmAnimationDraftV2Patch, { readonly kind: "replace-role-binding" }>
) {
  const current = operation.roleBindings[patch.roleId] ?? [];
  if (!arraysEqual(current, patch.expectedEntityIds)) {
    throw new Error(`Role patch expected ${patch.roleId}=${patch.expectedEntityIds.join(",")}.`);
  }
  return {
    ...operation,
    roleBindings: {
      ...operation.roleBindings,
      [patch.roleId]: [...patch.replacementEntityIds]
    }
  };
}

function diagnosticForIssue(
  draft: KpLlmAnimationDraftV2,
  issue: KpLlmAnimationDraftV2Issue
): KpLlmAnimationDraftV2CompileDiagnostic {
  const match = /^\$\.derivations\[(\d+)\]/.exec(issue.path);
  const targetId = match === null
    ? draft.id
    : draft.derivations[Number(match[1])]?.id ?? draft.id;
  return {
    ...issue,
    repair: {
      targetId,
      allowedPatchKinds: issue.path.includes("roleBindings")
        ? ["replace-role-binding"]
        : issue.path.includes("operationId")
          ? ["replace-operation-id"]
          : []
    }
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value !== "object" || value === null) return JSON.stringify(value) ?? "null";
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
    .join(",")}}`;
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
