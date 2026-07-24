import type { KpDiagramScene } from "./diagram-scene.ts";
import {
  createKpSemanticDisplayFragment,
  createKpSemanticEntity,
  createKpSemanticEntityRegistry,
  type KpSemanticEntityRegistry
} from "./semantic-entity-provenance.ts";
import type { KpSemanticLineageGraph } from "./semantic-lineage-graph.ts";
import {
  cloneCorrespondenceMap,
  type CorrespondenceMap
} from "./correspondence.ts";
import type {
  KpEquationTransitionIr,
  KpEquationTransitionIrState
} from "../domain-ir/public-api.ts";

export interface KpSemanticSceneRelation {
  readonly id: string;
  readonly relationKind: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly label?: string | undefined;
}

export interface KpSemanticSceneGroup {
  readonly id: string;
  readonly memberEntityIds: readonly string[];
  readonly label: string;
}

export interface KpSemanticSceneRegion {
  readonly id: string;
  readonly role: "source" | "target" | "context" | "workspace";
  readonly entityIds: readonly string[];
  readonly label: string;
}

export interface KpSemanticScene {
  readonly id: string;
  readonly kind: "semantic-scene";
  readonly surfaceKind: "equation" | "diagram" | "mixed";
  readonly title: string;
  readonly registry: KpSemanticEntityRegistry;
  readonly relations: readonly KpSemanticSceneRelation[];
  readonly groups: readonly KpSemanticSceneGroup[];
  readonly regions: readonly KpSemanticSceneRegion[];
}

export interface KpSemanticSceneTransition {
  readonly id: string;
  readonly kind: "semantic-scene-transition";
  readonly sourceSceneId: string;
  readonly targetSceneId: string;
  readonly correspondenceMap: CorrespondenceMap;
  readonly lineageGraph: KpSemanticLineageGraph;
}

export function createKpSemanticScene(input: {
  readonly id: string;
  readonly surfaceKind: KpSemanticScene["surfaceKind"];
  readonly title: string;
  readonly registry: KpSemanticEntityRegistry;
  readonly relations?: readonly KpSemanticSceneRelation[] | undefined;
  readonly groups?: readonly KpSemanticSceneGroup[] | undefined;
  readonly regions?: readonly KpSemanticSceneRegion[] | undefined;
}): KpSemanticScene {
  const entityIds = new Set(input.registry.entities.map((entity) => entity.id));
  const relations = input.relations ?? [];
  const groups = input.groups ?? [];
  const regions = input.regions ?? [];
  relations.forEach((relation) => {
    requireEntityRefs(
      [...relation.sourceEntityIds, ...relation.targetEntityIds],
      entityIds,
      `Semantic scene relation ${relation.id}`
    );
  });
  groups.forEach((group) =>
    requireEntityRefs(group.memberEntityIds, entityIds, `Semantic scene group ${group.id}`)
  );
  regions.forEach((region) =>
    requireEntityRefs(region.entityIds, entityIds, `Semantic scene region ${region.id}`)
  );
  return {
    id: input.id,
    kind: "semantic-scene",
    surfaceKind: input.surfaceKind,
    title: input.title,
    registry: input.registry,
    relations: relations.map((relation) => ({
      ...relation,
      sourceEntityIds: [...relation.sourceEntityIds],
      targetEntityIds: [...relation.targetEntityIds]
    })),
    groups: groups.map((group) => ({
      ...group,
      memberEntityIds: [...group.memberEntityIds]
    })),
    regions: regions.map((region) => ({ ...region, entityIds: [...region.entityIds] }))
  };
}

export function createKpSemanticSceneTransition(input: {
  readonly id: string;
  readonly source: KpSemanticScene;
  readonly target: KpSemanticScene;
  readonly correspondenceMap: CorrespondenceMap;
  readonly lineageGraph: KpSemanticLineageGraph;
}): KpSemanticSceneTransition {
  const sourceIds = new Set(input.source.registry.entities.map((entity) => entity.id));
  const targetIds = new Set(input.target.registry.entities.map((entity) => entity.id));
  requireEntityRefs(input.lineageGraph.sourceEntityIds, sourceIds, `Scene transition ${input.id} source lineage`);
  requireEntityRefs(input.lineageGraph.targetEntityIds, targetIds, `Scene transition ${input.id} target lineage`);
  return {
    id: input.id,
    kind: "semantic-scene-transition",
    sourceSceneId: input.source.id,
    targetSceneId: input.target.id,
    correspondenceMap: cloneCorrespondenceMap(input.correspondenceMap),
    lineageGraph: input.lineageGraph
  };
}

export function composeKpSemanticScenes(input: {
  readonly id: string;
  readonly title: string;
  readonly scenes: readonly KpSemanticScene[];
}): KpSemanticScene {
  if (input.scenes.length < 2) {
    throw new Error("A mixed semantic scene requires at least two component scenes.");
  }
  const registry = createKpSemanticEntityRegistry({
    entities: input.scenes.flatMap((scene) => scene.registry.entities),
    displayFragments: input.scenes.flatMap((scene) => scene.registry.displayFragments)
  });
  // Composition joins semantic registries only; layout remains owned by each
  // surface adapter and cannot become model-authored scene authority here.
  return createKpSemanticScene({
    id: input.id,
    surfaceKind: "mixed",
    title: input.title,
    registry,
    relations: input.scenes.flatMap((scene) => scene.relations),
    groups: input.scenes.flatMap((scene) => scene.groups),
    regions: input.scenes.flatMap((scene) => scene.regions)
  });
}

export function projectKpEquationTransitionStateToSemanticScene(input: {
  readonly ir: KpEquationTransitionIr;
  readonly side: "source" | "target";
}): KpSemanticScene {
  const states = input.ir[input.side];
  const selectors = states.flatMap((state) => state.selectors.map((selector) => ({ state, selector })));
  const registry = createKpSemanticEntityRegistry({
    entities: selectors.map(({ state, selector }) => createKpSemanticEntity({
      id: selector.id,
      semanticKind: selector.semanticKind ?? selector.kind,
      label: selector.label ?? selector.id,
      provenance: { kind: "authored", sourceId: state.objectId }
    })),
    displayFragments: selectors.map(({ selector }, index) => createKpSemanticDisplayFragment({
      id: `${input.ir.id}.${input.side}.fragment.${index}`,
      semanticEntityId: selector.id,
      fragmentRole: "primary",
      ordinal: 0
    }))
  });
  return createKpSemanticScene({
    id: `${input.ir.id}.${input.side}.scene`,
    surfaceKind: "equation",
    title: `${input.ir.title} ${input.side}`,
    registry,
    groups: states.map((state) => equationStateGroup(state)),
    regions: [{
      id: `${input.ir.id}.${input.side}.region`,
      role: input.side,
      entityIds: registry.entities.map((entity) => entity.id),
      label: `${input.side} equation state`
    }]
  });
}

export function projectKpDiagramSceneToSemanticScene(scene: KpDiagramScene): KpSemanticScene {
  const elements = [
    ...scene.nodes.map((node) => ({ id: node.selectorId, semanticKind: "diagram-node", label: node.label })),
    ...scene.edges.map((edge) => ({ id: edge.selectorId, semanticKind: "diagram-edge", label: edge.id })),
    ...scene.groups.map((group) => ({ id: group.selectorId, semanticKind: "diagram-group", label: group.label })),
    ...scene.labels.map((label) => ({ id: label.selectorId, semanticKind: "diagram-label", label: label.text }))
  ];
  const registry = createKpSemanticEntityRegistry({
    entities: elements.map((element) => createKpSemanticEntity({
      id: element.id,
      semanticKind: element.semanticKind,
      label: element.label,
      provenance: { kind: "authored", sourceId: scene.id }
    })),
    displayFragments: elements.map((element, index) => createKpSemanticDisplayFragment({
      id: `${scene.id}.fragment.${index}`,
      semanticEntityId: element.id,
      fragmentRole: "primary",
      ordinal: 0
    }))
  });
  const nodeSelectorById = new Map(scene.nodes.map((node) => [node.id, node.selectorId]));
  return createKpSemanticScene({
    id: `${scene.id}.semantic-scene`,
    surfaceKind: "diagram",
    title: scene.title,
    registry,
    relations: scene.edges.map((edge) => ({
      id: edge.selectorId,
      relationKind: edge.directed ? "directed-edge" : "undirected-edge",
      sourceEntityIds: [nodeSelectorById.get(edge.sourceNodeId)!],
      targetEntityIds: [nodeSelectorById.get(edge.targetNodeId)!]
    })),
    groups: scene.groups.map((group) => ({
      id: group.selectorId,
      memberEntityIds: group.nodeIds.map((nodeId) => nodeSelectorById.get(nodeId)!),
      label: group.label
    })),
    regions: [{
      id: `${scene.id}.workspace`,
      role: "workspace",
      entityIds: elements.map((element) => element.id),
      label: scene.title
    }]
  });
}

function equationStateGroup(state: KpEquationTransitionIrState): KpSemanticSceneGroup {
  return {
    id: `${state.objectId}.group`,
    memberEntityIds: state.selectors.map((selector) => selector.id),
    label: state.objectId
  };
}

function requireEntityRefs(
  references: readonly string[],
  entityIds: ReadonlySet<string>,
  label: string
): void {
  references.forEach((id) => {
    if (!entityIds.has(id)) throw new Error(`${label} references missing semantic entity ${id}.`);
  });
}
