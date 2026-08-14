import { observeKpNativeKatexFragments } from
  "../../rendering/native-katex-fragment-observer.ts";
import {
  kpNormalMatrixProofCheckpoints,
  projectKpNormalMatrixProofClock
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import {
  projectKpNormalMatrixProofCycleA,
  type KpNormalMatrixProofCycleAProjection,
  type KpNormalMatrixProofCycleATransmissionProjection
} from "./normal-matrix-proof-cycle-a-projection.ts";
import {
  projectKpNormalMatrixProofCycleB,
  type KpNormalMatrixProofCycleBProjection
} from "./normal-matrix-proof-cycle-b-projection.ts";

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

interface KpNormalMatrixProofCycleBTransients {
  readonly layer: HTMLElement;
  readonly zeroNorm: HTMLElement;
  readonly remainderZero: HTMLElement;
}

interface KpNormalMatrixProofControlsRuntime {
  readonly sync: (timeMs: number, checkpointId: string) => void;
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
  const transients = createCycleBTransients(stage);
  let controls: KpNormalMatrixProofControlsRuntime | undefined;
  const view = stage.ownerDocument.defaultView;
  const reducedMotion = view?.matchMedia("(prefers-reduced-motion: reduce)")
    .matches ?? false;
  const render = (requestedTimeMs: number): void => {
    const timeMs = reducedMotion
      ? projectKpNormalMatrixProofClock(requestedTimeMs).from.timeMs
      : requestedTimeMs;
    const cycleB = projectKpNormalMatrixProofCycleB(timeMs);
    if (cycleB.active) {
      renderCycleBProjection(stage, cycleB, measurements, transients);
    } else {
      renderCycleAProjection(
        stage,
        projectKpNormalMatrixProofCycleA(timeMs),
        measurements
      );
    }
    stage.dataset["kpNormalProofFragmentCount"] = String(
      activeFragmentNodes(stage).length
    );
    controls?.sync(
      Number(stage.dataset["kpNormalProofTimeMs"] ?? 0),
      stage.dataset["kpNormalProofActiveCheckpoint"] ?? "statement"
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
  const resize = (): void => {
    const timeMs = Number(stage.dataset["kpNormalProofTimeMs"] ?? 0);
    clearProjectionState(stage);
    measurements = measureSettledScenes(stage);
    render(timeMs);
  };
  view?.addEventListener("resize", resize, { passive: true });
  stage.dataset["kpNormalProofSession"] = "deterministic-seek";
  controls = mountCheckpointControls(stage, render);
  render(0);
  observeActiveFragments(stage);
  return {
    dispose: () => {
      stage.removeEventListener(kpNormalMatrixProofSeekEvent, seek);
      view?.removeEventListener("resize", resize);
      controls?.dispose();
      clearProjectionState(stage);
      transients.layer.remove();
      delete stage.dataset["kpNormalProofSession"];
      delete stage.dataset["kpNormalProofTimeMs"];
      delete stage.dataset["kpNormalProofAttentionPhase"];
    }
  };
}

function mountCheckpointControls(
  stage: HTMLElement,
  seek: (timeMs: number) => void
): KpNormalMatrixProofControlsRuntime | undefined {
  const input = stage.querySelector<HTMLInputElement>(
    "[data-kp-normal-proof-scrub]"
  );
  const status = stage.querySelector<HTMLOutputElement>(
    ".kp-nps"
  );
  if (input === null || status === null) return undefined;
  const onInput = (): void => seek(input.valueAsNumber);
  const onKeyDown = (event: KeyboardEvent): void => {
    const direction = event.key === "ArrowRight" || event.key === "PageDown"
      ? 1
      : event.key === "ArrowLeft" || event.key === "PageUp"
        ? -1
        : 0;
    if (direction !== 0) {
      event.preventDefault();
      seek(adjacentCheckpointTime(input.valueAsNumber, direction));
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      seek(event.key === "Home"
        ? kpNormalMatrixProofCheckpoints[0]!.timeMs
        : kpNormalMatrixProofCheckpoints.at(-1)!.timeMs);
    }
  };
  input.disabled = false;
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);
  return {
    sync: (timeMs, checkpointId) => {
      const checkpoint = kpNormalMatrixProofCheckpoints.find(
        ({ id }) => id === checkpointId
      ) ?? projectKpNormalMatrixProofClock(timeMs).from;
      input.value = String(timeMs);
      input.style.setProperty(
        "--kp-normal-proof-progress",
        `${timeMs / kpNormalMatrixProofCheckpoints.at(-1)!.timeMs * 100}%`
      );
      const description = `${checkpoint.label}: ${checkpoint.learnerQuestion}`;
      input.setAttribute("aria-valuetext", description);
      status.textContent = `${checkpoint.label} · ${checkpoint.learnerQuestion}`;
    },
    dispose: () => {
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKeyDown);
      input.disabled = true;
      input.style.removeProperty("--kp-normal-proof-progress");
    }
  };
}

function adjacentCheckpointTime(currentTimeMs: number, direction: 1 | -1): number {
  if (direction === 1) {
    return kpNormalMatrixProofCheckpoints.find(
      ({ timeMs }) => timeMs > currentTimeMs
    )?.timeMs ?? kpNormalMatrixProofCheckpoints.at(-1)!.timeMs;
  }
  return [...kpNormalMatrixProofCheckpoints].reverse().find(
    ({ timeMs }) => timeMs < currentTimeMs
  )?.timeMs ?? kpNormalMatrixProofCheckpoints[0]!.timeMs;
}

function renderCycleAProjection(
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

function renderCycleBProjection(
  stage: HTMLElement,
  projection: KpNormalMatrixProofCycleBProjection,
  measurements: KpNormalMatrixProofMeasurements,
  transients: KpNormalMatrixProofCycleBTransients
): void {
  clearProjectionState(stage);
  const activeScene = showScene(stage, projection.checkpointId);
  stage.dataset["kpNormalProofTimeMs"] = String(projection.timeMs);
  stage.dataset["kpNormalProofActiveCheckpoint"] = projection.checkpointId;
  if (projection.phaseKind === undefined) return;
  stage.dataset["kpNormalProofAttentionPhase"] = projection.phaseKind;
  applySalience(activeScene, projection);

  if (projection.phaseKind === "act") {
    fragments(activeScene, "matrix/eigenvalue").forEach((node) => {
      if (node.closest("[data-kp-normal-proof-evidence]") !== null) {
        node.dataset["kpNormalProofMatched"] = "true";
      }
    });
    renderCycleBInference(transients, projection, measurements);
  }
  if (projection.phaseKind === "inspect") {
    renderRecursiveHandoff(activeScene, projection.recursiveProgress, measurements);
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
    {
      node: fragment(scene, "matrix/eigenvalue", 1),
      source: leftSource,
      destination: point(measurements, "norm-equation", "matrix/eigenvalue", 1)[0]
    },
    {
      node: fragment(scene, "matrix/row-remainder", 1),
      source: leftSource,
      destination: point(measurements, "norm-equation", "matrix/row-remainder", 1)[0]
    },
    {
      node: fragment(scene, "matrix/eigenvalue", 2),
      source: rightSource,
      destination: point(measurements, "norm-equation", "matrix/eigenvalue", 2)[0]
    }
  ];
  for (const { node, source, destination } of targets) {
    if (node === undefined || source === undefined || destination === undefined) continue;
    const remaining = 1 - progress;
    node.style.transform = `translate3d(${(source.x - destination.x) * remaining}px, ${(source.y - destination.y) * remaining}px, 0)`;
    node.dataset["kpNormalProofMoving"] = "true";
    node.dataset["kpNormalProofHandoff"] = progress >= 1 ? "complete" : "moving";
  }
}

function renderCycleBInference(
  transients: KpNormalMatrixProofCycleBTransients,
  projection: KpNormalMatrixProofCycleBProjection,
  measurements: KpNormalMatrixProofMeasurements
): void {
  const squaredNorm = point(
    measurements,
    "norm-equation",
    "matrix/row-remainder",
    1
  )[0];
  const zeroNorm = point(
    measurements,
    "remainder-zero",
    "inference/norm-equality",
    0
  )[0];
  const matrixZero = point(
    measurements,
    "remainder-zero",
    "matrix/row-remainder",
    0
  )[0];
  if (squaredNorm !== undefined && zeroNorm !== undefined) {
    positionTransient(
      transients.zeroNorm,
      squaredNorm,
      zeroNorm,
      projection.zeroNormProgress
    );
  }
  if (zeroNorm !== undefined && matrixZero !== undefined) {
    positionTransient(
      transients.remainderZero,
      zeroNorm,
      matrixZero,
      projection.remainderZeroProgress
    );
  }
}

function renderRecursiveHandoff(
  scene: HTMLElement,
  progress: number,
  measurements: KpNormalMatrixProofMeasurements
): void {
  const target = fragment(scene, "proof/recursive-subproblem", 0);
  const source = point(
    measurements,
    "recursion",
    "matrix/lower-block",
    0
  )[0];
  const destination = point(
    measurements,
    "recursion",
    "proof/recursive-subproblem",
    0
  )[0];
  if (target === undefined || source === undefined || destination === undefined) return;
  if (progress <= 0) {
    target.style.visibility = "hidden";
    return;
  }
  const remaining = 1 - progress;
  target.style.transform = `translate3d(${(source.x - destination.x) * remaining}px, ${(source.y - destination.y) * remaining}px, 0)`;
  target.dataset["kpNormalProofMoving"] = "true";
  target.dataset["kpNormalProofHandoff"] = progress >= 1 ? "complete" : "moving";
}

function applySalience(
  scene: HTMLElement,
  projection: KpNormalMatrixProofCycleAProjection
    | KpNormalMatrixProofCycleBProjection
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
    delete node.dataset["kpNormalProofMatched"];
  });
  stage.querySelectorAll<HTMLElement>("[data-kp-normal-proof-transient-copy]")
    .forEach((node) => {
      node.hidden = true;
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
  const viewport = stage.querySelector<HTMLElement>(
    "[data-kp-normal-proof-stage-viewport]"
  );
  if (viewport === null) throw new Error("Normal-proof stage lacks its viewport.");
  const viewportRect = viewport.getBoundingClientRect();
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
        relativeCenter(node.getBoundingClientRect(), viewportRect)
      );
    });
  }
  states.forEach(({ scene, hidden, visibility }) => {
    scene.hidden = hidden;
    scene.style.visibility = visibility;
  });
  return measurements;
}

function createCycleBTransients(
  stage: HTMLElement
): KpNormalMatrixProofCycleBTransients {
  const viewport = stage.querySelector<HTMLElement>(
    "[data-kp-normal-proof-stage-viewport]"
  );
  const sourceScene = stage.querySelector<HTMLElement>(
    '[data-kp-normal-proof-settled-scene="remainder-zero"]'
  );
  if (viewport === null || sourceScene === null) {
    throw new Error("Normal-proof cycle B lacks native transient sources.");
  }
  const layer = stage.ownerDocument.createElement("div");
  layer.className = "kp-normal-proof-stage__transients";
  layer.dataset["kpNormalProofTransientLayer"] = "cycle-b";
  layer.setAttribute("aria-hidden", "true");
  const zeroNorm = cloneTransientFragment(
    fragment(sourceScene, "inference/norm-equality", 0),
    "zero-norm"
  );
  const remainderZero = cloneTransientFragment(
    fragment(sourceScene, "inference/remainder-zero", 0),
    "remainder-zero"
  );
  layer.append(zeroNorm, remainderZero);
  viewport.append(layer);
  return { layer, zeroNorm, remainderZero };
}

function cloneTransientFragment(
  source: HTMLElement | undefined,
  id: string
): HTMLElement {
  if (source === undefined) throw new Error(`Missing native transient source ${id}.`);
  const clone = source.cloneNode(true) as HTMLElement;
  clone.dataset["kpNormalProofTransientCopy"] = id;
  clone.hidden = true;
  [clone, ...clone.querySelectorAll<HTMLElement>("[data-kp-motion-id]")]
    .forEach((node, index) => {
      node.dataset["kpMotionId"] = `normal-proof.transient.${id}.${index}`;
    });
  return clone;
}

function positionTransient(
  node: HTMLElement,
  source: KpNormalMatrixProofMeasuredPoint,
  destination: KpNormalMatrixProofMeasuredPoint,
  progress: number
): void {
  if (progress <= 0) {
    node.hidden = true;
    return;
  }
  node.hidden = false;
  node.style.left = `${source.x + (destination.x - source.x) * progress}px`;
  node.style.top = `${source.y + (destination.y - source.y) * progress}px`;
  node.style.transform = "translate3d(-50%, -50%, 0)";
  node.dataset["kpNormalProofMoving"] = "true";
  node.dataset["kpNormalProofHandoff"] = progress >= 1 ? "complete" : "moving";
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

function relativeCenter(
  rect: DOMRect,
  viewport: DOMRect
): KpNormalMatrixProofMeasuredPoint {
  const absolute = center(rect);
  return { x: absolute.x - viewport.left, y: absolute.y - viewport.top };
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
