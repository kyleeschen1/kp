import {
  createKpAnimationAsset,
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  validateKpLlmAnimationDraftSchema,
  type KpLlmAnimationDraft,
  type KpLlmDiagramDraftScene,
  type KpLlmAnimationDraftSchemaIssue
} from "./llm-animation-draft.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpDiagramScene,
  createKpDiagramSceneSemanticObject,
  createKpDiagramSceneTransition,
  type KpDiagramScene,
  type KpDiagramSceneTransition
} from "../semantic/diagram-scene.ts";
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
import type { KpEquationTransitionIr } from "../domain-ir/public-api.ts";
import type { KpSemanticTransitionGap } from "../semantic/semantic-transition-gap.ts";

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
  readonly promotion: {
    readonly status: "candidate";
    readonly promotable: false;
    readonly requiredGate: "generated-animation-promotion";
  };
  readonly animation: KpAnimationAsset;
  readonly transitionIrs: readonly KpEquationTransitionIr[];
  readonly diagramTransitions: readonly KpDiagramSceneTransition[];
  readonly diagnostics: readonly [];
}

export interface KpLlmAnimationDraftCompileFailure {
  readonly status: "rejected";
  readonly diagnostics: readonly KpLlmAnimationDraftCompileDiagnostic[];
  readonly gaps: readonly KpSemanticTransitionGap[];
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
  const compiledObjects = draft.objects.map((object) =>
    "latex" in object
      ? createKpSemanticAssetObject({
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
          provenance: authoredProvenance(draft),
          metadata: { latex: object.latex }
        })
      : createKpDiagramSceneSemanticObject(createKpDiagramScene({
          id: object.id,
          title: object.title,
          ...layoutDiagramDraftScene(object.scene)
        }))
  );
  const bundle = createKpAssetBundle({
    id: `${draft.id}.bundle`,
    title: `${draft.title} semantic states`,
    objects: compiledObjects
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
  const generatedTransitionResults = draft.renderTarget.kind === "equation"
    ? transformations.map((transformation) =>
        compileKpSemanticEquationTransitionResult({
          transformation,
          bundle,
          unsupportedPolicy: "typed-gap"
        })
      )
    : [];
  const transitionIssues = generatedTransitionResults.flatMap((result, index) => {
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
  if (transitionIssues.length > 0) {
    return reject(
      transitionIssues,
      generatedTransitionResults.flatMap((result) => result.gap === undefined ? [] : [result.gap])
    );
  }
  const diagramTransitions = draft.renderTarget.kind === "diagram"
    ? transformations.map((transformation) => {
        const source = diagramSceneForObjectId(compiledObjects, transformation.sourceObjectIds[0]!);
        const target = diagramSceneForObjectId(compiledObjects, transformation.targetObjectIds[0]!);
        return createKpDiagramSceneTransition({
          id: `diagram-transition.${transformation.id}`,
          source,
          target,
          correspondenceMap: transformation.correspondenceMap!
        });
      })
    : [];

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
      kind: draft.renderTarget.kind,
      objectIds,
      selectorIds: compiledObjects.flatMap((object) =>
        object.selectors.map((selector) => selector.id)
      ),
      transformationIds: [...draft.sequence],
      ...(draft.timeline === undefined ? {} : { timelineId: draft.timeline.id }),
      summary: `${draft.renderTarget.kind} surface compiled from ${draft.schemaVersion}.`
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
    dashboard: {
      rowId: draft.id.replaceAll(".", "-"),
      tags: ["animation", draft.renderTarget.kind, "generated", "llm-authored"],
      sourceRefIds: [draft.id]
    },
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
    promotion: {
      status: "candidate",
      promotable: false,
      requiredGate: "generated-animation-promotion"
    },
    animation,
    transitionIrs: generatedTransitionResults.map((result) => result.ir!),
    diagramTransitions,
    diagnostics: []
  };
}

function authoredProvenance(draft: KpLlmAnimationDraft) {
  return {
    kind: "authored" as const,
    sourceIds: [draft.id],
    summary: `Compiled from ${draft.schemaVersion}.`
  };
}

function layoutDiagramDraftScene(
  scene: KpLlmDiagramDraftScene
): Omit<KpDiagramScene, "id" | "kind" | "title"> {
  const width = 680;
  const height = 320;
  const nodeWidth = 120;
  const nodeHeight = 64;
  const left = 70;
  const available = width - left * 2 - nodeWidth;
  const step = scene.nodes.length <= 1 ? 0 : available / (scene.nodes.length - 1);

  // Layout is deterministic compiler policy, never model-authored SVG geometry.
  return {
    width,
    height,
    nodes: scene.nodes.map((node, index) => ({
      ...node,
      x: left + step * index,
      y: 120,
      width: nodeWidth,
      height: nodeHeight
    })),
    edges: scene.edges.map((edge) => ({ ...edge })),
    groups: scene.groups.map((group) => ({
      ...group,
      nodeIds: [...group.nodeIds],
      padding: 30
    })),
    labels: scene.labels.map((label) => ({ ...label }))
  };
}

function diagramSceneForObjectId(
  objects: readonly KpSemanticAssetObject[],
  objectId: string
): KpDiagramScene {
  const object = objects.find((candidate) => candidate.id === objectId);
  if (object?.objectType !== "diagram-scene") {
    throw new Error(`Diagram draft references non-diagram object ${objectId}.`);
  }
  return object.value as KpDiagramScene;
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
    draft.objects.flatMap(draftObjectSelectorIds),
    "$.objects[*].selectors",
    issues
  );
  const transformationIds = collectUniqueIds(
    draft.transformations.map((transformation) => transformation.id),
    "$.transformations",
    issues
  );
  draft.objects.forEach((object, index) => {
    const actualKind = "latex" in object ? "equation" : "diagram";
    if (actualKind !== draft.renderTarget.kind) {
      issues.push({
        severity: "error",
        code: "draft.invalid-reference",
        path: `$.objects[${index}]`,
        message: `${draft.renderTarget.kind} drafts cannot contain ${actualKind} objects.`
      });
    }
  });

  draft.transformations.forEach((transformation, index) => {
    const path = `$.transformations[${index}]`;
    validateReferences(transformation.sourceObjectIds, objectIds, `${path}.sourceObjectIds`, "object", issues);
    validateReferences(transformation.targetObjectIds, objectIds, `${path}.targetObjectIds`, "object", issues);
    if (
      draft.renderTarget.kind === "diagram" &&
      (transformation.sourceObjectIds.length !== 1 || transformation.targetObjectIds.length !== 1)
    ) {
      issues.push({
        severity: "error",
        code: "draft.invalid-reference",
        path,
        message: "Diagram transformations require exactly one source scene and one target scene."
      });
    }
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

function draftObjectSelectorIds(
  object: KpLlmAnimationDraft["objects"][number]
): readonly string[] {
  if ("latex" in object) return object.selectors.map((selector) => selector.id);
  return [
    ...object.scene.nodes.map((node) => node.selectorId),
    ...object.scene.edges.map((edge) => edge.selectorId),
    ...object.scene.groups.map((group) => group.selectorId),
    ...object.scene.labels.map((label) => label.selectorId)
  ];
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
  diagnostics: readonly KpLlmAnimationDraftCompileDiagnostic[],
  gaps: readonly KpSemanticTransitionGap[] = []
): KpLlmAnimationDraftCompileFailure {
  return { status: "rejected", diagnostics, gaps };
}
