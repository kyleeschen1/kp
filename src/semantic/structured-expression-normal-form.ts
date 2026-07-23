import type { KpStructuredExpressionRoleBindingSet } from "./structured-expression-role-binding.ts";
import {
  verifyKpDistributionRewrite,
  type KpStructuredExpressionRewriteDiagnostic,
  type KpStructuredExpressionRewriteLineage
} from "./structured-expression-rewrite.ts";

export interface KpStructuredExpressionNormalFormIntent {
  readonly schemaVersion: "kp.structured-expression-normal-form-intent.v1";
  readonly id: string;
  readonly targetForm: "distributed-sum";
  readonly rewriteLawId: "kp.algebra.distribute.v1";
  readonly sourceRootId: string;
  readonly targetRootId: string;
  readonly requiredSourceSubtreeIds: readonly string[];
}

export interface KpCompiledStructuredExpressionNormalForm {
  readonly schemaVersion: "kp.compiled-structured-expression-normal-form.v1";
  readonly intentId: string;
  readonly targetForm: "distributed-sum";
  readonly rewriteLawId: "kp.algebra.distribute.v1";
  readonly sourceRootId: string;
  readonly targetRootId: string;
  readonly lineage: readonly KpStructuredExpressionRewriteLineage[];
}

export interface KpStructuredExpressionNormalFormDiagnostic {
  readonly code:
    | "unsupported-normal-form"
    | "source-root-mismatch"
    | "target-root-mismatch"
    | "missing-required-lineage"
    | KpStructuredExpressionRewriteDiagnostic["code"];
  readonly path: string;
  readonly message: string;
}

export type KpStructuredExpressionNormalFormCompilationResult =
  | {
      readonly ok: true;
      readonly plan: KpCompiledStructuredExpressionNormalForm;
      readonly diagnostics: readonly [];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly KpStructuredExpressionNormalFormDiagnostic[];
    };

export function createKpStructuredExpressionNormalFormIntent(input: {
  readonly id: string;
  readonly targetForm: "distributed-sum";
  readonly rewriteLawId: "kp.algebra.distribute.v1";
  readonly sourceRootId: string;
  readonly targetRootId: string;
  readonly requiredSourceSubtreeIds?: readonly string[] | undefined;
}): KpStructuredExpressionNormalFormIntent {
  requireText(input.id, "Normal-form intent id");
  requireText(input.sourceRootId, `Normal-form intent ${input.id} source root id`);
  requireText(input.targetRootId, `Normal-form intent ${input.id} target root id`);
  const requiredSourceSubtreeIds = [...(input.requiredSourceSubtreeIds ?? [])];
  requiredSourceSubtreeIds.forEach((id, index) =>
    requireText(id, `Normal-form intent ${input.id} required source subtree ${index}`)
  );
  if (new Set(requiredSourceSubtreeIds).size !== requiredSourceSubtreeIds.length) {
    throw new Error(`Normal-form intent ${input.id} repeats a required source subtree id.`);
  }
  // Copy only the semantic vocabulary. Extra renderer-shaped properties on an
  // untrusted input never cross into the compiler-owned intent.
  return Object.freeze({
    schemaVersion: "kp.structured-expression-normal-form-intent.v1" as const,
    id: input.id,
    targetForm: input.targetForm,
    rewriteLawId: input.rewriteLawId,
    sourceRootId: input.sourceRootId,
    targetRootId: input.targetRootId,
    requiredSourceSubtreeIds: Object.freeze(requiredSourceSubtreeIds)
  });
}

export function compileKpStructuredExpressionNormalForm(input: {
  readonly intent: KpStructuredExpressionNormalFormIntent;
  readonly bindings: KpStructuredExpressionRoleBindingSet;
}): KpStructuredExpressionNormalFormCompilationResult {
  if (
    input.intent.targetForm !== "distributed-sum" ||
    input.intent.rewriteLawId !== "kp.algebra.distribute.v1"
  ) {
    return failure([{
      code: "unsupported-normal-form",
      path: "intent.targetForm",
      message:
        `Normal form ${String(input.intent.targetForm)} with law ${String(input.intent.rewriteLawId)} is not registered.`
    }]);
  }

  const rewrite = verifyKpDistributionRewrite(input.bindings);
  if (!rewrite.ok) {
    return failure(rewrite.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      path: `rewrite.${diagnostic.path}`
    })));
  }

  const diagnostics: KpStructuredExpressionNormalFormDiagnostic[] = [];
  if (input.intent.sourceRootId !== rewrite.verification.sourceRootId) {
    diagnostics.push({
      code: "source-root-mismatch",
      path: "intent.sourceRootId",
      message:
        `Intent source root ${input.intent.sourceRootId} does not match verified root ` +
        `${rewrite.verification.sourceRootId}.`
    });
  }
  if (input.intent.targetRootId !== rewrite.verification.targetRootId) {
    diagnostics.push({
      code: "target-root-mismatch",
      path: "intent.targetRootId",
      message:
        `Intent target root ${input.intent.targetRootId} does not match verified root ` +
        `${rewrite.verification.targetRootId}.`
    });
  }
  const lineageSources = new Set(
    rewrite.verification.lineage.flatMap((entry) => entry.sourceSubtreeIds)
  );
  input.intent.requiredSourceSubtreeIds.forEach((subtreeId, index) => {
    if (!lineageSources.has(subtreeId)) {
      diagnostics.push({
        code: "missing-required-lineage",
        path: `intent.requiredSourceSubtreeIds[${index}]`,
        message: `Required source subtree ${subtreeId} has no verified target lineage.`
      });
    }
  });
  if (diagnostics.length > 0) return failure(diagnostics);

  return Object.freeze({
    ok: true as const,
    diagnostics: Object.freeze([]) as readonly [],
    plan: Object.freeze({
      schemaVersion: "kp.compiled-structured-expression-normal-form.v1" as const,
      intentId: input.intent.id,
      targetForm: input.intent.targetForm,
      rewriteLawId: input.intent.rewriteLawId,
      sourceRootId: rewrite.verification.sourceRootId,
      targetRootId: rewrite.verification.targetRootId,
      lineage: rewrite.verification.lineage
    })
  });
}

function failure(
  diagnostics: readonly KpStructuredExpressionNormalFormDiagnostic[]
): KpStructuredExpressionNormalFormCompilationResult {
  return Object.freeze({
    ok: false as const,
    diagnostics: Object.freeze(diagnostics.map((diagnostic) => Object.freeze({ ...diagnostic })))
  });
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
