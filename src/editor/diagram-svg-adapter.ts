import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  projectCorrespondenceMapForPlayback,
  type SelectorCorrespondencePlaybackRecord
} from "../semantic/correspondence.ts";
import type {
  KpDiagramScene,
  KpDiagramSceneEdge,
  KpDiagramSceneGroup,
  KpDiagramSceneLabel,
  KpDiagramSceneNode
} from "../semantic/diagram-scene.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import { getKpEditorAnimationPlaybackSession } from "./animation-player-controller.ts";

export const kpEditorDiagramSvgAdapter: KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.diagram.svg",
  slotKind: "diagram",
  priority: 0,
  supports(state) {
    return state.surface.slotKinds.includes("diagram");
  },
  render({ player, slot, state }) {
    const animation = getKpEditorAnimationPlaybackSession(player)?.animation;
    if (animation === undefined) return;
    slot.innerHTML = renderDiagramAnimation(animation, state);
  }
};

export function registerKpEditorDiagramSvgAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(kpEditorDiagramSvgAdapter);
}

export function renderDiagramAnimation(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState
): string {
  const transformation = animation.transformations.find((candidate) =>
    state.runtimeFrame.activeTransformationIds.includes(candidate.id)
  );
  if (transformation?.correspondenceMap === undefined) {
    return `<p data-kp-editor-diagram-unavailable>Diagram correspondence unavailable.</p>`;
  }
  const forward = state.direction === "forward";
  const from = diagramScene(animation, forward
    ? transformation.sourceObjectIds[0]
    : transformation.targetObjectIds[0]);
  const to = diagramScene(animation, forward
    ? transformation.targetObjectIds[0]
    : transformation.sourceObjectIds[0]);
  if (from === undefined || to === undefined) {
    return `<p data-kp-editor-diagram-unavailable>Diagram scene unavailable.</p>`;
  }
  const progress = forward ? state.progress : 1 - state.progress;
  const records = projectCorrespondenceMapForPlayback(
    transformation.correspondenceMap,
    forward ? "forward" : "backward"
  );
  const fromRecord = indexRecords(records, "from");
  const toRecord = indexRecords(records, "to");

  return `<svg class="editor-diagram-stage" data-kp-editor-diagram-svg data-kp-editor-diagram-progress="${progress}" data-kp-editor-diagram-direction="${state.direction}" viewBox="0 0 ${to.width} ${to.height}" role="img" aria-label="${escapeHtml(animation.title)} diagram animation">
    <style>
      .editor-diagram-stage { width: 100%; min-height: 20rem; }
      .editor-diagram-stage [data-kp-diagram-group] rect { fill: #f4f7fb; stroke: #9db0c2; stroke-width: 1.5; stroke-dasharray: 7 5; }
      .editor-diagram-stage [data-kp-diagram-group] text { fill: #546779; font: 600 13px system-ui; }
      .editor-diagram-stage [data-kp-diagram-edge] { stroke: #527492; stroke-width: 3; }
      .editor-diagram-stage [data-kp-diagram-node] rect, .editor-diagram-stage [data-kp-diagram-node] ellipse { fill: #ffffff; stroke: #1f5f87; stroke-width: 2.5; }
      .editor-diagram-stage [data-kp-diagram-node] text { fill: #17354a; font: 600 16px system-ui; }
      .editor-diagram-stage [data-kp-diagram-label] { fill: #4d6171; font: 600 13px system-ui; }
    </style>
    <defs><marker id="kp-editor-diagram-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
    ${renderScene(from, fromRecord, 1 - progress, true)}
    ${renderScene(to, toRecord, progress, false)}
  </svg>`;
}

function renderScene(
  scene: KpDiagramScene,
  records: ReadonlyMap<string, SelectorCorrespondencePlaybackRecord>,
  progress: number,
  sourceLayer: boolean
): string {
  const renderable = (selectorId: string) => {
    const record = records.get(selectorId);
    const persistent = record?.relation === "identity" || record?.relation === "role-change";
    if (sourceLayer && persistent) return undefined;
    return { record, opacity: persistent ? 1 : progress };
  };
  return `<g data-kp-diagram-scene-id="${escapeHtml(scene.id)}" data-kp-diagram-layer="${sourceLayer ? "source" : "target"}">
    ${scene.groups.map((group) => renderGroup(scene, group, renderable(group.selectorId))).join("")}
    ${scene.edges.map((edge) => renderEdge(scene, edge, renderable(edge.selectorId))).join("")}
    ${scene.nodes.map((node) => renderNode(node, renderable(node.selectorId))).join("")}
    ${scene.labels.map((label) => renderLabel(scene, label, renderable(label.selectorId))).join("")}
  </g>`;
}

function renderNode(
  node: KpDiagramSceneNode,
  lifecycle: LifecycleRender | undefined
): string {
  if (lifecycle === undefined) return "";
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  const shape = node.shape === "circle"
    ? `<ellipse cx="${centerX}" cy="${centerY}" rx="${node.width / 2}" ry="${node.height / 2}" />`
    : `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="14" />`;
  return `<g data-kp-diagram-node="${escapeHtml(node.id)}" ${lifecycleAttributes(node.selectorId, lifecycle)} transform="translate(${(1 - lifecycle.opacity) * 12} 0) scale(${0.92 + lifecycle.opacity * 0.08})" transform-origin="${centerX}px ${centerY}px">
    ${shape}<text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(node.label)}</text>
  </g>`;
}

function renderEdge(
  scene: KpDiagramScene,
  edge: KpDiagramSceneEdge,
  lifecycle: LifecycleRender | undefined
): string {
  if (lifecycle === undefined) return "";
  const source = scene.nodes.find((node) => node.id === edge.sourceNodeId)!;
  const target = scene.nodes.find((node) => node.id === edge.targetNodeId)!;
  return `<line data-kp-diagram-edge="${escapeHtml(edge.id)}" ${lifecycleAttributes(edge.selectorId, lifecycle)} x1="${source.x + source.width}" y1="${source.y + source.height / 2}" x2="${target.x}" y2="${target.y + target.height / 2}"${edge.directed ? ' marker-end="url(#kp-editor-diagram-arrow)"' : ""} />`;
}

function renderGroup(
  scene: KpDiagramScene,
  group: KpDiagramSceneGroup,
  lifecycle: LifecycleRender | undefined
): string {
  if (lifecycle === undefined) return "";
  const nodes = group.nodeIds.map((id) => scene.nodes.find((node) => node.id === id)!);
  const left = Math.min(...nodes.map((node) => node.x)) - group.padding;
  const top = Math.min(...nodes.map((node) => node.y)) - group.padding;
  const right = Math.max(...nodes.map((node) => node.x + node.width)) + group.padding;
  const bottom = Math.max(...nodes.map((node) => node.y + node.height)) + group.padding;
  return `<g data-kp-diagram-group="${escapeHtml(group.id)}" ${lifecycleAttributes(group.selectorId, lifecycle)}><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="20" /><text x="${left + 12}" y="${top + 20}">${escapeHtml(group.label)}</text></g>`;
}

function renderLabel(
  scene: KpDiagramScene,
  label: KpDiagramSceneLabel,
  lifecycle: LifecycleRender | undefined
): string {
  if (lifecycle === undefined) return "";
  const [x, y] = targetCenter(scene, label.targetId);
  const offset = label.placement === "above" ? -16 : label.placement === "below" ? 22 : 0;
  return `<text data-kp-diagram-label="${escapeHtml(label.id)}" ${lifecycleAttributes(label.selectorId, lifecycle)} x="${x}" y="${y + offset}" text-anchor="middle">${escapeHtml(label.text)}</text>`;
}

function targetCenter(scene: KpDiagramScene, targetId: string): readonly [number, number] {
  const node = scene.nodes.find((candidate) => candidate.id === targetId);
  if (node !== undefined) return [node.x + node.width / 2, node.y + node.height / 2];
  const edge = scene.edges.find((candidate) => candidate.id === targetId);
  if (edge !== undefined) {
    const source = scene.nodes.find((candidate) => candidate.id === edge.sourceNodeId)!;
    const target = scene.nodes.find((candidate) => candidate.id === edge.targetNodeId)!;
    return [(source.x + source.width + target.x) / 2, (source.y + target.y) / 2 + source.height / 2];
  }
  return [scene.width / 2, scene.height / 2];
}

interface LifecycleRender {
  readonly record?: SelectorCorrespondencePlaybackRecord | undefined;
  readonly opacity: number;
}

function lifecycleAttributes(selectorId: string, lifecycle: LifecycleRender): string {
  return `data-kp-diagram-selector-id="${escapeHtml(selectorId)}" data-kp-diagram-relation="${lifecycle.record?.relation ?? "unmapped"}" data-kp-diagram-opacity="${lifecycle.opacity}" opacity="${lifecycle.opacity}"`;
}

function indexRecords(
  records: readonly SelectorCorrespondencePlaybackRecord[],
  side: "from" | "to"
): ReadonlyMap<string, SelectorCorrespondencePlaybackRecord> {
  return new Map(records.flatMap((record) =>
    (side === "from" ? record.fromSelectorIds : record.toSelectorIds)
      .map((selectorId) => [selectorId, record] as const)
  ));
}

function diagramScene(
  animation: KpAnimationAsset,
  objectId: string | undefined
): KpDiagramScene | undefined {
  const object = animation.bundle.objects.find((candidate) => candidate.id === objectId);
  return object?.objectType === "diagram-scene"
    ? object.value as KpDiagramScene
    : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
