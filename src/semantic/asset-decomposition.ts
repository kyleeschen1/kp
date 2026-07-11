import {
  validateKpAssetBundle,
  type KpAssetBundle
} from "./asset.ts";
import type { KpBehavior } from "./asset-behavior.ts";
import type { KpBehaviorInspection } from "./asset-inspection.ts";
import type { KpSemanticDiagram } from "./asset-diagram.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";

export interface KpTransformationDrillDownHook<TFrame = unknown> {
  readonly id: string;
  readonly kind: "transformation-drill-down-hook";
  readonly transformationId: string;
  readonly title: string;
  readonly summary?: string | undefined;
  readonly asset: KpAssetBundle;
  readonly diagram?: KpSemanticDiagram | undefined;
  readonly behavior?: KpBehavior<TFrame> | undefined;
}

export interface CreateKpTransformationDrillDownHookInput<TFrame = unknown> {
  readonly id: string;
  readonly transformationId: string;
  readonly title: string;
  readonly summary?: string | undefined;
  readonly asset: KpAssetBundle;
  readonly diagram?: KpSemanticDiagram | undefined;
  readonly behavior?: KpBehavior<TFrame> | undefined;
}

export interface ResolveKpTransformationDrillDownsInput<
  TInspectionFrame,
  TDrillDownFrame = unknown
> {
  readonly inspection: KpBehaviorInspection<TInspectionFrame>;
  readonly hooks: readonly KpTransformationDrillDownHook<TDrillDownFrame>[];
}

export interface ValidateKpTransformationDrillDownHooksContext {
  readonly transformations: readonly KpSemanticTransformation[];
}

export interface KpTransformationDrillDownValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpTransformationDrillDownHook<TFrame>(
  input: CreateKpTransformationDrillDownHookInput<TFrame>
): KpTransformationDrillDownHook<TFrame> {
  assertNonEmpty(input.id, "Drill-down hook id");
  assertNonEmpty(
    input.transformationId,
    `Drill-down hook ${input.id} transformationId`
  );
  assertNonEmpty(input.title, `Drill-down hook ${input.id} title`);

  return {
    id: input.id,
    kind: "transformation-drill-down-hook",
    transformationId: input.transformationId,
    title: input.title,
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    asset: input.asset,
    ...(input.diagram === undefined ? {} : { diagram: input.diagram }),
    ...(input.behavior === undefined ? {} : { behavior: input.behavior })
  };
}

export function resolveKpTransformationDrillDowns<
  TInspectionFrame,
  TDrillDownFrame
>(
  input: ResolveKpTransformationDrillDownsInput<
    TInspectionFrame,
    TDrillDownFrame
  >
): readonly KpTransformationDrillDownHook<TDrillDownFrame>[] {
  const hooksByTransformationId = new Map<
    string,
    KpTransformationDrillDownHook<TDrillDownFrame>
  >();

  input.hooks.forEach((hook) => {
    if (!hooksByTransformationId.has(hook.transformationId)) {
      hooksByTransformationId.set(hook.transformationId, hook);
    }
  });

  return input.inspection.activeTransformationIds.flatMap((transformationId) => {
    const hook = hooksByTransformationId.get(transformationId);

    return hook === undefined ? [] : [hook];
  });
}

export function validateKpTransformationDrillDownHooks<TFrame>(
  hooks: readonly KpTransformationDrillDownHook<TFrame>[],
  context: ValidateKpTransformationDrillDownHooksContext
): readonly KpTransformationDrillDownValidationIssue[] {
  const issues: KpTransformationDrillDownValidationIssue[] = [];
  const hookIds = new Set<string>();
  const hookedTransformationIds = new Set<string>();
  const transformationIds = new Set(
    context.transformations.map((transformation) => transformation.id)
  );

  hooks.forEach((hook, index) => {
    const hookPath = `hooks[${index}]`;

    if (hookIds.has(hook.id)) {
      issues.push({
        path: `${hookPath}.id`,
        message: `Duplicate drill-down hook id: ${hook.id}.`
      });
    } else {
      hookIds.add(hook.id);
    }

    if (hookedTransformationIds.has(hook.transformationId)) {
      issues.push({
        path: `${hookPath}.transformationId`,
        message: `Duplicate drill-down hook for transformation ${hook.transformationId}.`
      });
    } else {
      hookedTransformationIds.add(hook.transformationId);
    }

    if (!transformationIds.has(hook.transformationId)) {
      issues.push({
        path: `${hookPath}.transformationId`,
        message: `Drill-down hook ${hook.id} references missing transformation ${hook.transformationId}.`
      });
    }

    validateKpAssetBundle(hook.asset).forEach((assetIssue) => {
      issues.push({
        path: `${hookPath}.asset.${assetIssue.path}`,
        message: assetIssue.message
      });
    });
  });

  return issues;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
