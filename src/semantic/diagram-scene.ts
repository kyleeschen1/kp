import {
  createKpSemanticAssetObject,
  type KpSemanticAssetObject
} from "./asset.ts";
import {
  cloneCorrespondenceMap,
  validateCorrespondenceMap,
  type CorrespondenceMap
} from "./correspondence.ts";

export interface KpDiagramScene {
  readonly id: string;
  readonly kind: "diagram-scene";
  readonly title: string;
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly KpDiagramSceneNode[];
  readonly edges: readonly KpDiagramSceneEdge[];
  readonly groups: readonly KpDiagramSceneGroup[];
  readonly labels: readonly KpDiagramSceneLabel[];
}

export interface KpDiagramSceneNode {
  readonly id: string;
  readonly selectorId: string;
  readonly shape: "rectangle" | "circle";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

export interface KpDiagramSceneEdge {
  readonly id: string;
  readonly selectorId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly directed: boolean;
}

export interface KpDiagramSceneGroup {
  readonly id: string;
  readonly selectorId: string;
  readonly nodeIds: readonly string[];
  readonly label: string;
  readonly padding: number;
}

export interface KpDiagramSceneLabel {
  readonly id: string;
  readonly selectorId: string;
  readonly targetId: string;
  readonly text: string;
  readonly placement: "center" | "above" | "below";
}

export interface KpDiagramSceneTransition {
  readonly id: string;
  readonly kind: "diagram-scene-transition";
  readonly sourceSceneId: string;
  readonly targetSceneId: string;
  readonly correspondenceMap: CorrespondenceMap;
}

export interface KpDiagramSceneValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpDiagramScene(
  input: Omit<KpDiagramScene, "kind">
): KpDiagramScene {
  const scene: KpDiagramScene = {
    id: input.id,
    kind: "diagram-scene",
    title: input.title,
    width: input.width,
    height: input.height,
    nodes: input.nodes.map((node) => ({ ...node })),
    edges: input.edges.map((edge) => ({ ...edge })),
    groups: input.groups.map((group) => ({ ...group, nodeIds: [...group.nodeIds] })),
    labels: input.labels.map((label) => ({ ...label }))
  };
  const issues = validateKpDiagramScene(scene);
  if (issues.length > 0) {
    throw new Error(`Invalid diagram scene ${input.id}: ${issues[0]!.message}`);
  }
  return scene;
}

export function createKpDiagramSceneTransition(input: {
  readonly id: string;
  readonly source: KpDiagramScene;
  readonly target: KpDiagramScene;
  readonly correspondenceMap: CorrespondenceMap;
}): KpDiagramSceneTransition {
  const transition: KpDiagramSceneTransition = {
    id: input.id,
    kind: "diagram-scene-transition",
    sourceSceneId: input.source.id,
    targetSceneId: input.target.id,
    correspondenceMap: cloneCorrespondenceMap(input.correspondenceMap)
  };
  const issues = validateKpDiagramSceneTransition(transition, input.source, input.target);
  if (issues.length > 0) {
    throw new Error(`Invalid diagram scene transition ${input.id}: ${issues[0]!.message}`);
  }
  return transition;
}

export function createKpDiagramSceneSemanticObject(
  scene: KpDiagramScene
): KpSemanticAssetObject<KpDiagramScene> {
  return createKpSemanticAssetObject({
    id: scene.id,
    objectType: "diagram-scene",
    title: scene.title,
    value: scene,
    selectors: diagramSceneElements(scene).map((element) => ({
      id: element.selectorId,
      kind: element.kind,
      label: element.label
    }))
  });
}

export function validateKpDiagramScene(
  scene: KpDiagramScene
): readonly KpDiagramSceneValidationIssue[] {
  const issues: KpDiagramSceneValidationIssue[] = [];
  requireText(scene.id, "id", issues);
  requireText(scene.title, "title", issues);
  requirePositive(scene.width, "width", issues);
  requirePositive(scene.height, "height", issues);
  const elementIds = new Set<string>();
  const selectorIds = new Set<string>();
  const nodeIds = new Set(scene.nodes.map((node) => node.id));

  diagramSceneElements(scene).forEach((element) => {
    requireText(element.id, `${element.path}.id`, issues);
    requireText(element.selectorId, `${element.path}.selectorId`, issues);
    if (elementIds.has(element.id)) {
      issues.push({ path: `${element.path}.id`, message: `Duplicate diagram element id ${element.id}.` });
    }
    if (selectorIds.has(element.selectorId)) {
      issues.push({ path: `${element.path}.selectorId`, message: `Duplicate diagram selector id ${element.selectorId}.` });
    }
    elementIds.add(element.id);
    selectorIds.add(element.selectorId);
  });
  scene.nodes.forEach((node, index) => {
    requireFinite(node.x, `nodes[${index}].x`, issues);
    requireFinite(node.y, `nodes[${index}].y`, issues);
    requirePositive(node.width, `nodes[${index}].width`, issues);
    requirePositive(node.height, `nodes[${index}].height`, issues);
    requireText(node.label, `nodes[${index}].label`, issues);
  });
  scene.edges.forEach((edge, index) => {
    requireReference(edge.sourceNodeId, nodeIds, `edges[${index}].sourceNodeId`, "node", issues);
    requireReference(edge.targetNodeId, nodeIds, `edges[${index}].targetNodeId`, "node", issues);
  });
  scene.groups.forEach((group, index) => {
    requireText(group.label, `groups[${index}].label`, issues);
    if (group.padding < 0 || !Number.isFinite(group.padding)) {
      issues.push({ path: `groups[${index}].padding`, message: "Diagram group padding must be non-negative." });
    }
    group.nodeIds.forEach((nodeId, nodeIndex) =>
      requireReference(nodeId, nodeIds, `groups[${index}].nodeIds[${nodeIndex}]`, "node", issues)
    );
  });
  scene.labels.forEach((label, index) => {
    requireText(label.text, `labels[${index}].text`, issues);
    requireReference(label.targetId, elementIds, `labels[${index}].targetId`, "element", issues);
  });

  return issues;
}

export function validateKpDiagramSceneTransition(
  transition: KpDiagramSceneTransition,
  source: KpDiagramScene,
  target: KpDiagramScene
): readonly KpDiagramSceneValidationIssue[] {
  const issues: KpDiagramSceneValidationIssue[] = [];
  if (transition.sourceSceneId !== source.id) {
    issues.push({ path: "sourceSceneId", message: `Expected source scene ${source.id}.` });
  }
  if (transition.targetSceneId !== target.id) {
    issues.push({ path: "targetSceneId", message: `Expected target scene ${target.id}.` });
  }
  validateCorrespondenceMap(transition.correspondenceMap, {
    sourceSelectorIds: diagramSceneElements(source).map((element) => element.selectorId),
    targetSelectorIds: diagramSceneElements(target).map((element) => element.selectorId)
  }).forEach((issue) => issues.push({
    path: `correspondenceMap.${issue.path}`,
    message: issue.message
  }));
  return issues;
}

function diagramSceneElements(scene: KpDiagramScene): readonly {
  readonly id: string;
  readonly selectorId: string;
  readonly kind: "diagram-node" | "diagram-edge" | "diagram-group" | "diagram-label";
  readonly label: string;
  readonly path: string;
}[] {
  return [
    ...scene.nodes.map((node, index) => ({ id: node.id, selectorId: node.selectorId, kind: "diagram-node" as const, label: node.label, path: `nodes[${index}]` })),
    ...scene.edges.map((edge, index) => ({ id: edge.id, selectorId: edge.selectorId, kind: "diagram-edge" as const, label: `${edge.sourceNodeId} to ${edge.targetNodeId}`, path: `edges[${index}]` })),
    ...scene.groups.map((group, index) => ({ id: group.id, selectorId: group.selectorId, kind: "diagram-group" as const, label: group.label, path: `groups[${index}]` })),
    ...scene.labels.map((label, index) => ({ id: label.id, selectorId: label.selectorId, kind: "diagram-label" as const, label: label.text, path: `labels[${index}]` }))
  ];
}

function requireReference(id: string, ids: ReadonlySet<string>, path: string, kind: string, issues: KpDiagramSceneValidationIssue[]): void {
  if (!ids.has(id)) issues.push({ path, message: `Unknown diagram ${kind} id ${id}.` });
}

function requireText(value: string, path: string, issues: KpDiagramSceneValidationIssue[]): void {
  if (value.trim().length === 0) issues.push({ path, message: `${path} must not be empty.` });
}

function requirePositive(value: number, path: string, issues: KpDiagramSceneValidationIssue[]): void {
  if (!Number.isFinite(value) || value <= 0) issues.push({ path, message: `${path} must be positive.` });
}

function requireFinite(value: number, path: string, issues: KpDiagramSceneValidationIssue[]): void {
  if (!Number.isFinite(value)) issues.push({ path, message: `${path} must be finite.` });
}
