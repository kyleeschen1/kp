import {
  createKpAnimationAsset,
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  validateKpLlmAnimationDraftSchema,
  type KpLlmAnimationDraft,
  type KpLlmAnimationDraftSchemaIssue
} from "./llm-animation-draft.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../rendering/semantic-equation-transition-compiler.ts";
import type { KpEquationTransitionIr } from "../rendering/equation-transition-ir.ts";

export type KpLlmAnimationDraftCompileDiagnosticCode =
  | KpLlmAnimationDraftSchemaIssue["code"]
  | "draft.duplicate-id"
  | "draft.invalid-reference"
  | "draft.invalid-correspondence"
  | "draft.incomplete-lifecycle"
  | "draft.invalid-animation"
  | "draft.compile-failed";

export interface KpLlmAnimationDraftCompileDiagnostic {
  readonly severity: "error";
  readonly code: KpLlmAnimationDraftCompileDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpLlmAnimationDraftCompileSuccess {
  readonly status: "accepted";
  readonly animation: KpAnimationAsset;
  readonly transitionIrs: readonly KpEquationTransitionIr[];
  readonly diagnostics: readonly [];
}

export interface KpLlmAnimationDraftCompileFailure {
  readonly status: "rejected";
  readonly diagnostics: readonly KpLlmAnimationDraftCompileDiagnostic[];
}

export type KpLlmAnimationDraftCompileResult =
  | KpLlmAnimationDraftCompileSuccess
  | KpLlmAnimationDraftCompileFailure;

export function compileKpLlmAnimationDraft(
  value: unknown
): KpLlmAnimationDraftCompileResult {
  const schemaIssues = validateKpLlmAnimationDraftSchema(value);
  if (schemaIssues.length > 0) {
    return reject(schemaIssues.map((issue) => ({
      ...issue,
      severity: "error" as const
    })));
  }

  const draft = value as KpLlmAnimationDraft;
  const semanticIssues = validateDraftSemanticClosure(draft);
  if (semanticIssues.length > 0) return reject(semanticIssues);

  try {
    return compileValidatedDraft(draft);
  } catch (error) {
    return reject([{
      severity: "error",
      code: "draft.compile-failed",
      path: "$",
      message: error instanceof Error ? error.message : String(error)
    }]);
  }
}

function compileValidatedDraft(
  draft: KpLlmAnimationDraft
): KpLlmAnimationDraftCompileResult {
  const bundle = createKpAssetBundle({
    id: `${draft.id}.bundle`,
    title: `${draft.title} semantic states`,
    objects: draft.objects.map((object) => createKpSemanticAssetObject({
      id: object.id,
      objectType: "equation",
      title: object.title,
      value: { latex: object.latex },
      selectors: object.selectors.map((selector) => ({
        id: selector.id,
        kind: selector.kind,
        ...(selector.label === undefined ? {} : { label: selector.label }),
        ...(selector.summary === undefined ? {} : { summary: selector.summary })
      })),
      provenance: {
        kind: "authored",
        sourceIds: [draft.id],
        summary: `Compiled from ${draft.schemaVersion}.`
      },
      metadata: { latex: object.latex }
    }))
  });
  const transformations = draft.transformations.map((transformation) =>
    createKpSemanticTransformation({
      id: transformation.id,
      transformType: transformation.transformType,
      title: transformation.title,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      correspondenceMap: transformation.correspondenceMap,
      ...(transformation.assumptions === undefined
        ? {}
        : { assumptions: transformation.assumptions })
    })
  );
  const transitionResults = transformations.map((transformation) =>
    compileKpSemanticEquationTransitionResult({ transformation, bundle })
  );
  const transitionIssues = transitionResults.flatMap((result, index) => {
    if (result.status === "semantic") return [];
    return result.diagnostics.map((diagnostic) => ({
      severity: "error" as const,
      code: diagnostic.code === "semantic-transition.incomplete-lifecycle"
        ? "draft.incomplete-lifecycle" as const
        : "draft.invalid-correspondence" as const,
      path: `$.transformations[${index}].correspondenceMap`,
      message: diagnostic.message
    }));
  });
  if (transitionIssues.length > 0) return reject(transitionIssues);

  const transformationById = new Map(
    transformations.map((transformation) => [transformation.id, transformation])
  );
  const orderedTransformations = draft.sequence.map((id) =>
    transformationById.get(id)!
  );
  const tree = createSemanticTransformationSequence({
    id: `diagram.${draft.id}.sequence`,
    label: `${draft.title} sequence`,
    children: orderedTransformations.map(transformationLeaf)
  });
  const objectIds = draft.objects.map((object) => object.id);
  const animation = createKpAnimationAsset({
    id: draft.id,
    title: draft.title,
    bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root: tree }),
    ...(draft.timeline === undefined ? {} : { timeline: draft.timeline }),
    layout: {
      id: `layout.${draft.id}`,
      kind: "single",
      targetId: draft.renderTarget.id
    },
    renderTargets: [{
      id: draft.renderTarget.id,
      kind: "equation",
      objectIds,
      selectorIds: draft.objects.flatMap((object) =>
        object.selectors.map((selector) => selector.id)
      ),
      transformationIds: [...draft.sequence],
      ...(draft.timeline === undefined ? {} : { timelineId: draft.timeline.id }),
      summary: `Equation surface compiled from ${draft.schemaVersion}.`
    }],
    checks: [
      {
        id: `check.${draft.id}.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: draft.id
      },
      {
        id: `check.${draft.id}.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: tree.id
      }
    ],
    metadata: {
      authoringSchemaVersion: draft.schemaVersion,
      authoringSource: "llm-draft"
    }
  });
  const animationIssues = validateKpAnimationAsset(animation);
  if (animationIssues.length > 0) {
    return reject(animationIssues.map((issue) => ({
      severity: "error" as const,
      code: "draft.invalid-animation" as const,
      path: `$.${issue.path}`,
      message: issue.message
    })));
  }

  return {
    status: "accepted",
    animation,
    transitionIrs: transitionResults.map((result) => result.ir!),
    diagnostics: []
  };
}

function transformationLeaf(transformation: KpSemanticTransformation) {
  return createSemanticTransformationLeaf(createSemanticTransformationRef({
    id: transformation.id,
    kind: transformation.transformType,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    summary: transformation.title
  }));
}

function validateDraftSemanticClosure(
  draft: KpLlmAnimationDraft
): readonly KpLlmAnimationDraftCompileDiagnostic[] {
  const issues: KpLlmAnimationDraftCompileDiagnostic[] = [];
  const objectIds = collectUniqueIds(
    draft.objects.map((object) => object.id),
    "$.objects",
    issues
  );
  const selectorIds = collectUniqueIds(
    draft.objects.flatMap((object) => object.selectors.map((selector) => selector.id)),
    "$.objects[*].selectors",
    issues
  );
  const transformationIds = collectUniqueIds(
    draft.transformations.map((transformation) => transformation.id),
    "$.transformations",
    issues
  );

  draft.transformations.forEach((transformation, index) => {
    const path = `$.transformations[${index}]`;
    validateReferences(transformation.sourceObjectIds, objectIds, `${path}.sourceObjectIds`, "object", issues);
    validateReferences(transformation.targetObjectIds, objectIds, `${path}.targetObjectIds`, "object", issues);
    transformation.correspondenceMap.records.forEach((record, recordIndex) => {
      const recordPath = `${path}.correspondenceMap.records[${recordIndex}]`;
      validateReferences(record.sourceSelectorIds, selectorIds, `${recordPath}.sourceSelectorIds`, "selector", issues);
      validateReferences(record.targetSelectorIds, selectorIds, `${recordPath}.targetSelectorIds`, "selector", issues);
    });
  });
  validateReferences(draft.sequence, transformationIds, "$.sequence", "transformation", issues);
  transformationIds.forEach((id) => {
    const appearances = draft.sequence.filter((candidate) => candidate === id).length;
    if (appearances !== 1) {
      issues.push({
        severity: "error",
        code: "draft.invalid-reference",
        path: "$.sequence",
        message: `Transformation ${id} must appear exactly once in sequence; received ${appearances}.`
      });
    }
  });

  return issues;
}

function collectUniqueIds(
  ids: readonly string[],
  path: string,
  issues: KpLlmAnimationDraftCompileDiagnostic[]
): ReadonlySet<string> {
  const unique = new Set<string>();
  ids.forEach((id) => {
    if (unique.has(id)) {
      issues.push({
        severity: "error",
        code: "draft.duplicate-id",
        path,
        message: `Duplicate id ${id}.`
      });
    }
    unique.add(id);
  });
  return unique;
}

function validateReferences(
  ids: readonly string[],
  available: ReadonlySet<string>,
  path: string,
  kind: string,
  issues: KpLlmAnimationDraftCompileDiagnostic[]
): void {
  ids.forEach((id, index) => {
    if (!available.has(id)) {
      issues.push({
        severity: "error",
        code: "draft.invalid-reference",
        path: `${path}[${index}]`,
        message: `Unknown ${kind} id ${id}.`
      });
    }
  });
}

function reject(
  diagnostics: readonly KpLlmAnimationDraftCompileDiagnostic[]
): KpLlmAnimationDraftCompileFailure {
  return { status: "rejected", diagnostics };
}
