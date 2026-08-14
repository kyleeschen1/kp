import { observeKpNativeKatexFragments } from
  "../../rendering/native-katex-fragment-observer.ts";
import {
  projectKpNormalMatrixProofCycleA,
  type KpNormalMatrixProofCycleAProjection,
  type KpNormalMatrixProofCycleATransmissionProjection
} from "./normal-matrix-proof-cycle-a-projection.ts";

export const kpNormalMatrixProofSeekEvent = "kp:normal-proof-seek";

export function mountKpNormalMatrixProofStageCapability(
  document: Document
): () => void {
  const publication = document.querySelector<HTMLElement>(
    "[data-kp-normal-proof-publication]"
  );
  if (publication === null) return () => undefined;
  publication.dataset["kpNormalProofCapability"] = "ready";
  const stage = publication.querySelector<HTMLElement>(
    "[data-kp-normal-proof-stage]"
  );
  stage?.setAttribute("data-kp-normal-proof-native-owner", "settled-katex");
  let disposed = false;
  let runtime: KpNormalMatrixProofStageRuntime | undefined;
  if (stage !== null) {
    void prepareStage(stage).then((prepared) => {
      if (disposed) return;
      runtime = prepared;
      stage.dataset["kpNormalProofGeometry"] = "settled";
    }).catch((error: unknown) => {
      if (disposed) return;
      stage.dataset["kpNormalProofGeometry"] = "failed";
      stage.dataset["kpNormalProofGeometryError"] = error instanceof Error
        ? error.message
        : String(error);
    });
  }
  return () => {
    disposed = true;
    runtime?.dispose();
    delete publication.dataset["kpNormalProofCapability"];
    stage?.removeAttribute("data-kp-normal-proof-native-owner");
    delete stage?.dataset["kpNormalProofFragmentCount"];
    delete stage?.dataset["kpNormalProofGeometry"];
    delete stage?.dataset["kpNormalProofGeometryError"];
  };
}

interface KpNormalMatrixProofStageRuntime {
  readonly dispose: () => void;
}

interface KpNormalMatrixProofMeasuredPoint {
  readonly x: number;
  readonly y: number;
}

type KpNormalMatrixProofMeasurements = ReadonlyMap<string, KpNormalMatrixProofMeasuredPoint>;

async function prepareStage(
  stage: HTMLElement
): Promise<KpNormalMatrixProofStageRuntime> {
  await (stage.ownerDocument.fonts?.ready ?? Promise.resolve());
  await new Promise<void>((resolve) => {
    (stage.ownerDocument.defaultView?.requestAnimationFrame ?? requestAnimationFrame)(
      () => resolve()
    );
  });
  let measurements = measureSettledScenes(stage);
  const render = (timeMs: number): void => {
    renderProjection(stage, projectKpNormalMatrixProofCycleA(timeMs), measurements);
    stage.dataset["kpNormalProofFragmentCount"] = String(
      activeFragmentNodes(stage).length
    );
  };
  // The event is only a local input seam for controls and tests. The proof
  // clock remains the sole authority; this capability never starts a loop.
  const seek = (event: Event): void => {
    const detail = (event as CustomEvent<{ readonly timeMs?: unknown }>).detail;
    if (typeof detail?.timeMs !== "number") return;
    render(detail.timeMs);
  };
  stage.addEventListener(kpNormalMatrixProofSeekEvent, seek);
  const view = stage.ownerDocument.defaultView;
  const resize = (): void => {
    const timeMs = Number(stage.dataset["kpNormalProofTimeMs"] ?? 0);
    clearProjectionState(stage);
    measurements = measureSettledScenes(stage);
    render(timeMs);
  };
  view?.addEventListener("resize", resize, { passive: true });
  stage.dataset["kpNormalProofSession"] = "deterministic-seek";
  render(0);
  observeActiveFragments(stage);
  return {
    dispose: () => {
      stage.removeEventListener(kpNormalMatrixProofSeekEvent, seek);
      view?.removeEventListener("resize", resize);
      clearProjectionState(stage);
      delete stage.dataset["kpNormalProofSession"];
      delete stage.dataset["kpNormalProofTimeMs"];
      delete stage.dataset["kpNormalProofAttentionPhase"];
    }
  };
}

function renderProjection(
  stage: HTMLElement,
  projection: KpNormalMatrixProofCycleAProjection,
  measurements: KpNormalMatrixProofMeasurements
): void {
  clearProjectionState(stage);
  const activeScene = showScene(stage, projection.checkpointId);
  stage.dataset["kpNormalProofTimeMs"] = String(projection.timeMs);
  stage.dataset["kpNormalProofActiveCheckpoint"] = projection.checkpointId;
  if (!projection.active || projection.phaseKind === undefined) return;
  stage.dataset["kpNormalProofAttentionPhase"] = projection.phaseKind;
  applySalience(activeScene, projection);
  if (projection.phaseKind === "act") {
    projection.transmissions.forEach((transmission) =>
      renderTransmission(activeScene, transmission, measurements)
    );
  }
  if (projection.phaseKind === "settle") {
    renderEquationSettlement(activeScene, projection.equationProgress, measurements);
  }
}

function renderTransmission(
  scene: HTMLElement,
  transmission: KpNormalMatrixProofCycleATransmissionProjection,
  measurements: KpNormalMatrixProofMeasurements
): void {
  const target = fragment(scene, transmission.targetPath, 0);
  if (target === undefined) return;
  const source = averagePoint(
    transmission.sourcePaths.flatMap((path) =>
      point(measurements, "row-column-norms", path, 0)
    )
  );
  const destination = point(
    measurements,
    "row-column-norms",
    transmission.targetPath,
    0
  )[0];
  if (source === undefined || destination === undefined) return;
  if (transmission.progress <= 0) {
    target.style.visibility = "hidden";
    return;
  }
  const remaining = 1 - transmission.progress;
  target.style.visibility = "visible";
  target.style.transform = `translate3d(${(source.x - destination.x) * remaining}px, ${(source.y - destination.y) * remaining}px, 0)`;
  target.dataset["kpNormalProofMoving"] = "true";
  target.dataset["kpNormalProofHandoff"] = transmission.handoffComplete
    ? "complete"
    : "moving";
}

function renderEquationSettlement(
  scene: HTMLElement,
  progress: number,
  measurements: KpNormalMatrixProofMeasurements
): void {
  const leftSource = point(
    measurements,
    "row-column-norms",
    "product-left/first-entry",
    0
  )[0];
  const rightSource = point(
    measurements,
    "row-column-norms",
    "product-right/first-entry",
    0
  )[0];
  const targets = [
    { node: fragment(scene, "matrix/eigenvalue", 1), source: leftSource },
    { node: fragment(scene, "matrix/row-remainder", 1), source: leftSource },
    { node: fragment(scene, "matrix/eigenvalue", 2), source: rightSource }
  ];
  for (const { node, source } of targets) {
    if (node === undefined || source === undefined) continue;
    const rect = node.getBoundingClientRect();
    const destination = center(rect);
    const remaining = 1 - progress;
    node.style.transform = `translate3d(${(source.x - destination.x) * remaining}px, ${(source.y - destination.y) * remaining}px, 0)`;
    node.dataset["kpNormalProofMoving"] = "true";
    node.dataset["kpNormalProofHandoff"] = progress >= 1 ? "complete" : "moving";
  }
}

function applySalience(
  scene: HTMLElement,
  projection: KpNormalMatrixProofCycleAProjection
): void {
  for (const path of projection.contextPaths) {
    fragments(scene, path).forEach((node) => {
      node.dataset["kpNormalProofSalience"] = "context";
    });
  }
  for (const path of projection.targetPaths) {
    fragments(scene, path).forEach((node) => {
      node.dataset["kpNormalProofSalience"] = "target";
    });
  }
  if (projection.phaseKind === "inspect") {
    fragments(scene, "matrix/eigenvalue").forEach((node) => {
      if (node.closest("[data-kp-normal-proof-evidence]") !== null) {
        node.dataset["kpNormalProofSalience"] = "target";
      }
    });
    fragments(scene, "matrix/row-remainder").forEach((node) => {
      if (node.closest("[data-kp-normal-proof-evidence]") !== null) {
        node.dataset["kpNormalProofInspection"] = "unmatched";
      }
    });
  }
}

function showScene(stage: HTMLElement, checkpointId: string): HTMLElement {
  const scenes = [
    ...stage.querySelectorAll<HTMLElement>("[data-kp-normal-proof-settled-scene]")
  ];
  let active: HTMLElement | undefined;
  for (const scene of scenes) {
    const selected = scene.dataset["kpNormalProofSettledScene"] === checkpointId;
    scene.hidden = !selected;
    scene.setAttribute("aria-hidden", selected ? "false" : "true");
    if (selected) active = scene;
  }
  if (active === undefined) throw new Error(`Missing settled proof scene ${checkpointId}.`);
  return active;
}

function clearProjectionState(stage: HTMLElement): void {
  delete stage.dataset["kpNormalProofAttentionPhase"];
  stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]").forEach((node) => {
    node.style.removeProperty("transform");
    node.style.removeProperty("visibility");
    delete node.dataset["kpNormalProofMoving"];
    delete node.dataset["kpNormalProofHandoff"];
    delete node.dataset["kpNormalProofSalience"];
    delete node.dataset["kpNormalProofInspection"];
  });
}

function measureSettledScenes(stage: HTMLElement): KpNormalMatrixProofMeasurements {
  const measurements = new Map<string, KpNormalMatrixProofMeasuredPoint>();
  const scenes = [
    ...stage.querySelectorAll<HTMLElement>("[data-kp-normal-proof-settled-scene]")
  ];
  const states = scenes.map((scene) => ({
    scene,
    hidden: scene.hidden,
    visibility: scene.style.visibility
  }));
  // Measure authored endpoints once so every seek is a pure transform write;
  // KaTeX structure is never inspected to infer semantic identity.
  for (const scene of scenes) {
    scene.hidden = false;
    scene.style.visibility = "hidden";
    const counts = new Map<string, number>();
    scene.querySelectorAll<HTMLElement>(
      "[data-kp-motion-id][data-kp-normal-proof-path]"
    ).forEach((node) => {
      const path = stripAddress(node.dataset["kpNormalProofPath"]!);
      const index = counts.get(path) ?? 0;
      counts.set(path, index + 1);
      measurements.set(
        measurementKey(scene.dataset["kpNormalProofSettledScene"]!, path, index),
        center(node.getBoundingClientRect())
      );
    });
  }
  states.forEach(({ scene, hidden, visibility }) => {
    scene.hidden = hidden;
    scene.style.visibility = visibility;
  });
  return measurements;
}

function observeActiveFragments(stage: HTMLElement): number {
  const nodes = activeFragmentNodes(stage);
  const observation = observeKpNativeKatexFragments({
    stage,
    fontRevision: 0,
    bindings: nodes.map((node, index) => ({
      id: `normal-proof.active-fragment.${index}`,
      semanticEntityId: node.dataset["kpNormalProofPath"]!,
      motionId: node.dataset["kpMotionId"]!,
      glyphKey: node.dataset["kpNormalProofGlyphKey"]!
    }))
  });
  stage.dataset["kpNormalProofFragmentCount"] = String(observation.fragments.length);
  return observation.fragments.length;
}

function activeFragmentNodes(stage: HTMLElement): readonly HTMLElement[] {
  return [...stage.querySelectorAll<HTMLElement>(
    "[data-kp-normal-proof-context] [data-kp-motion-id][data-kp-normal-proof-path], [data-kp-normal-proof-settled-scene]:not([hidden]) [data-kp-motion-id][data-kp-normal-proof-path]"
  )];
}

function fragments(
  scene: HTMLElement,
  path: string
): readonly HTMLElement[] {
  return [...scene.querySelectorAll<HTMLElement>(
    `[data-kp-motion-id][data-kp-normal-proof-path="normal-proof/${path}"]`
  )];
}

function fragment(
  scene: HTMLElement,
  path: string,
  index: number
): HTMLElement | undefined {
  return fragments(scene, path)[index];
}

function point(
  measurements: KpNormalMatrixProofMeasurements,
  sceneId: string,
  path: string,
  index: number
): readonly KpNormalMatrixProofMeasuredPoint[] {
  const found = measurements.get(measurementKey(sceneId, path, index));
  return found === undefined ? [] : [found];
}

function measurementKey(sceneId: string, path: string, index: number): string {
  return `${sceneId}:${path}:${index}`;
}

function stripAddress(address: string): string {
  return address.startsWith("normal-proof/")
    ? address.slice("normal-proof/".length)
    : address;
}

function center(rect: DOMRect): KpNormalMatrixProofMeasuredPoint {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function averagePoint(
  points: readonly KpNormalMatrixProofMeasuredPoint[]
): KpNormalMatrixProofMeasuredPoint | undefined {
  if (points.length === 0) return undefined;
  return {
    x: points.reduce((sum, candidate) => sum + candidate.x, 0) / points.length,
    y: points.reduce((sum, candidate) => sum + candidate.y, 0) / points.length
  };
}
