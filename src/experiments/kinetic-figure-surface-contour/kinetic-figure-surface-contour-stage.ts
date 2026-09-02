import {
  add,
  constant,
  multiply,
  power,
  variable
} from "../../math/expression.ts";
import type { KpSemanticObject } from "../../semantic/document.ts";
import {
  createAxis3DObject,
  createGraph3DObject,
  graph3DSurfaceResolution,
  type Graph3DObject,
  type GraphPoint3D,
  type Surface3DObject
} from "../../semantic/graph.ts";
import {
  createKpGraph3DRuntimeFrame,
  type KpGraph3DResolvedVisualRoles,
  type KpGraph3DRuntimeFrame
} from "../../rendering/graph-3d-runtime-protocol.ts";
import {
  planKpGraph3DSweptFit,
  type KpGraph3DSweptFitPlan
} from "../../rendering/graph-3d-swept-fit.ts";
import {
  projectGraphPoint3DToWebGLScreen,
  renderGraph3DWebGLFallback,
  renderGraph3DWebGLShell
} from "../../rendering/graph-webgl.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  checkKpStageFitObservation,
  createKpStageFitContract,
  unionKpStageFitRects,
  type KpStageFitContractV1
} from "../../rendering/stage-fit-contract.ts";
import {
  kpSurfaceContourEntityIds,
  kpSurfaceContourIdentityId,
  sampleKpSurfaceContourLevelSet,
  type KpSurfaceContourModelV1,
  type KpSurfaceContourSceneProjectionV1
} from "./kinetic-figure-surface-contour-model.ts";

const GRAPH_WIDTH = 520;
const GRAPH_HEIGHT = 300;
const CONTEXT_LEVELS = [0.8, 1.4, 2.2, 3, 4] as const;

export const kpSurfaceContourFitContract = createKpStageFitContract({
  id: "fit-contract.calculus.surface-contour-focus-card.v1",
  geometryPolicy: "swept-contain",
  cropPolicy: "explicit-only",
  passageOverflowPolicy: "typed-repair",
  safeInsets: Object.freeze({ top: 14, right: 26, bottom: 14, left: 26 }),
  readability: Object.freeze({
    minimumPassageTextPx: 15,
    minimumMathTextPx: 10
  })
});

type SurfaceContourRuntimeFrame = KpGraph3DRuntimeFrame<
  readonly KpSemanticObject[]
>;
type Graph3DWebGLClient = typeof import("../../rendering/graph-webgl-three.ts");

export interface KpSurfaceContourStageAuthority {
  readonly graph3d: Graph3DObject;
  readonly graphTopDown: Graph3DObject;
  readonly scene3d: readonly KpSemanticObject[];
  readonly sceneTopDown: readonly KpSemanticObject[];
  readonly fitContract: KpStageFitContractV1;
  readonly fitPlan: KpGraph3DSweptFitPlan;
}

export interface KpSurfaceContourStageSession {
  project(
    projection: KpSurfaceContourSceneProjectionV1,
    direction?: "forward" | "rewind"
  ): void;
  dispose(): void;
}

export function createKpSurfaceContourStageAuthority():
KpSurfaceContourStageAuthority {
  const graphDraft = createGraph3DObject({
    id: "graph.calculus.surface-contour.3d",
    label: "Paraboloid rotating into its contour-map view",
    xAxisId: "axis.calculus.surface-contour.3d.x",
    yAxisId: "axis.calculus.surface-contour.3d.y",
    zAxisId: "axis.calculus.surface-contour.3d.z",
    xDomain: [-2.05, 2.05],
    yDomain: [-1.5, 1.5],
    zDomain: [0, 7.4],
    width: GRAPH_WIDTH,
    height: GRAPH_HEIGHT,
    surfaceMode: "mesh",
    surfaceQuality: "interactive",
    viewMode: "3d",
    camera: {
      azimuthDegrees: 38,
      elevationDegrees: 27,
      scale: 46,
      origin: [GRAPH_WIDTH * 0.51, GRAPH_HEIGHT * 0.71]
    },
    shadow: { enabled: false, opacity: 0 },
    light: {
      ambient: 0.54,
      diffuse: 0.28,
      specular: 0.06,
      rim: 0.08,
      depthHaze: 0.72
    }
  });
  const resolution = graph3DSurfaceResolution(graphDraft.surfaceQuality);
  const surface: Surface3DObject = {
    id: kpSurfaceContourEntityIds.surface,
    type: "surface-3d",
    graphId: graphDraft.id,
    label: "z = x^2 + 2y^2",
    equation: "z = x^2 + 2y^2",
    latexProvenance: {
      kind: "exact",
      latex: "z=x^2+2y^2",
      sourceKind: "authored"
    },
    expression: add(
      power(variable("x"), 2),
      multiply(constant(2), power(variable("y"), 2))
    ),
    xDomain: graphDraft.xDomain,
    yDomain: graphDraft.yDomain,
    xSampleCount: resolution.xSampleCount,
    ySampleCount: resolution.ySampleCount
  };
  const axes = ([
    [graphDraft.xAxisId, "x", graphDraft.xDomain],
    [graphDraft.yAxisId, "y", graphDraft.yDomain],
    [graphDraft.zAxisId, "z", graphDraft.zDomain]
  ] as const).map(([id, orientation, domain]) => createAxis3DObject({
    id,
    graphId: graphDraft.id,
    label: orientation,
    orientation,
    domain,
    tickStep: 1
  }));
  const fitPlan = planKpGraph3DSweptFit({
    id: "fit.calculus.surface-contour.swept-subject.v1",
    graph: graphDraft,
    contract: kpSurfaceContourFitContract,
    sourceCamera: graphDraft.camera,
    targetCamera: {
      azimuthDegrees: 0,
      elevationDegrees: -90,
      scale: 58,
      origin: [GRAPH_WIDTH / 2, GRAPH_HEIGHT * 0.66]
    },
    pointsAtProgress: (progress) => surfaceContourFitPoints({
      graph: graphDraft,
      surface,
      progress
    }),
    progressSampleCount: 21,
    minimumCameraScale: 20
  });
  const graph3d: Graph3DObject = Object.freeze({
    ...graphDraft,
    camera: fitPlan.sourceCamera
  });
  const graphTopDown: Graph3DObject = Object.freeze({
    ...graphDraft,
    viewMode: "xy",
    camera: fitPlan.targetCamera
  });
  const scene3d = Object.freeze([
    graph3d,
    ...axes,
    surface
  ] as KpSemanticObject[]);
  return Object.freeze({
    graph3d,
    graphTopDown,
    scene3d,
    sceneTopDown: Object.freeze(replaceGraph(scene3d, graphTopDown)),
    fitContract: kpSurfaceContourFitContract,
    fitPlan
  });
}

export function renderKpSurfaceContourStage(input: {
  readonly model: KpSurfaceContourModelV1;
  readonly authority: KpSurfaceContourStageAuthority;
}): string {
  const { model, authority } = input;
  return `<figure class="kp-surface-contour-stage" data-kp-surface-contour-stage data-kp-stage-fit-contract="${authority.fitContract.schemaVersion}" data-kp-stage-fit-status="${authority.fitPlan.status}" data-kp-stage-fit-safe-frame="${escapeAttribute(JSON.stringify(authority.fitPlan.safeRect))}" data-kp-stage-fit-swept-bounds="${escapeAttribute(JSON.stringify(authority.fitPlan.sweptBounds))}" aria-labelledby="kp-surface-contour-stage-caption">
    <figcaption id="kp-surface-contour-stage-caption" class="kp-surface-contour-visually-hidden" data-kp-surface-contour-stage-caption>A horizontal plane intersects a paraboloid. The scene then rotates until that same intersection can be read as a contour.</figcaption>
    <header class="kp-surface-contour-stage__header">
      <span data-kp-surface-contour-view-label>Surface</span>
      <span class="kp-surface-contour-stage__equations" aria-hidden="true">
        <span data-kp-surface-contour-equation="surface">${math(model.equationLatex)}</span>
        <span data-kp-surface-contour-equation="level-set" hidden>${math(model.levelSetLatex)}</span>
      </span>
    </header>
    <div class="kp-surface-contour-stage__plot" data-kp-surface-contour-view="continuous" aria-label="Surface view">
      <div class="kp-surface-contour-stage__base" data-kp-surface-contour-entity="${model.entityIds.surface}">
        ${renderGraph3DWebGLShell(authority.scene3d, authority.graph3d)}
      </div>
      <svg class="kp-surface-contour-overlay" viewBox="0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}" aria-hidden="true">
        <g class="kp-surface-contour-map__context" data-kp-surface-contour-context data-kp-surface-contour-entity="${model.entityIds.contextContours}">
          ${CONTEXT_LEVELS.map((level) => `<path data-kp-context-level="${level}" />`).join("")}
        </g>
        <polygon data-kp-surface-contour-plane data-kp-surface-contour-entity="${model.entityIds.slicingPlane}" />
        <path data-kp-surface-contour-level-set data-kp-cross-view-members="member.calculus.surface-contour.intersection-3d member.calculus.surface-contour.contour-2d" data-kp-semantic-identity="${kpSurfaceContourIdentityId}" />
      </svg>
      <span class="kp-surface-contour-plane-label" data-kp-surface-contour-plane-label data-kp-surface-contour-entity="${model.entityIds.slicingPlane}">${math("z=c")}</span>
      ${renderAxisLabels()}
    </div>
    <label class="kp-surface-contour-level-control" data-kp-surface-contour-entity="${model.entityIds.levelParameter}">
      <span>${math("c")}</span>
      <input type="range" min="${model.level.min}" max="${model.level.max}" step="0.01" value="${model.level.initial}" data-kp-surface-contour-level aria-label="Level-set height">
      <output data-kp-surface-contour-level-output>${formatLevel(model.level.initial)}</output>
    </label>
  </figure>`;
}

export function mountKpSurfaceContourStage(input: {
  readonly root: ParentNode;
  readonly authority: KpSurfaceContourStageAuthority;
  readonly initialProjection: KpSurfaceContourSceneProjectionV1;
}): KpSurfaceContourStageSession {
  const shell = requiredElement<HTMLElement>(input.root, ".graph-webgl");
  let projection = input.initialProjection;
  let previousViewProgress = projection.viewProgress;
  let client: Graph3DWebGLClient | undefined;
  let fallbackView: "3d" | "xy" = "3d";
  let disposed = false;
  const fitAudit = mountSurfaceContourFitAudit(input.root, input.authority);

  const project = (
    next: KpSurfaceContourSceneProjectionV1,
    direction: "forward" | "rewind" =
      next.viewProgress >= previousViewProgress ? "forward" : "rewind"
  ): void => {
    projection = next;
    previousViewProgress = next.viewProgress;
    projectKpSurfaceContourStageDom({
      root: input.root,
      authority: input.authority,
      projection: next
    });
    const frame = createSurfaceContourRuntimeFrame({
      authority: input.authority,
      projection: next,
      direction
    });
    shell.setAttribute("aria-label", frame.accessibility.description);
    syncFallback(shell, input.authority, next.viewProgress, fallbackView);
    fallbackView = next.viewProgress >= 0.5 ? "xy" : "3d";
    client?.renderKpGraph3DWebGLRuntimeFrame(shell, frame);
    fitAudit.schedule();
  };

  project(projection);
  void import("../../rendering/graph-webgl-three.ts").then((loaded) => {
    if (disposed || !shell.isConnected) return;
    client = loaded;
    const frame = createSurfaceContourRuntimeFrame({
      authority: input.authority,
      projection,
      direction: "forward"
    });
    const outcome = loaded.hydrateKpGraph3DWebGLRuntimeFrame(shell, frame);
    shell.dataset["kpSurfaceContourCapability"] = outcome.status;
  }).catch((error: unknown) => {
    if (disposed) return;
    shell.dataset["kpSurfaceContourCapability"] = "fallback";
    shell.dataset["kpWebglStatus"] = "fallback";
    shell.dataset["kpWebglError"] = error instanceof Error
      ? error.message
      : "The 3D capability failed to load.";
  });

  return Object.freeze({
    project,
    dispose() {
      if (disposed) return;
      disposed = true;
      client?.disposeGraph3DWebGLShell(shell);
      fitAudit.dispose();
    }
  });
}

export function projectKpSurfaceContourStageDom(input: {
  readonly root: ParentNode;
  readonly authority: KpSurfaceContourStageAuthority;
  readonly projection: KpSurfaceContourSceneProjectionV1;
}): void {
  const { root, authority, projection } = input;
  const cameraGraph = graphAtViewProgress(
    authority.graph3d,
    authority.graphTopDown,
    projection.viewProgress
  );
  const levelPoints = sampleKpSurfaceContourLevelSet({
    level: projection.level,
    sampleCount: 97
  });
  const flattenedPoints = levelPoints.map((point) => ({
    ...point,
    z: point.z * (1 - projection.viewProgress)
  }));
  requiredElement<SVGPolygonElement>(root, "[data-kp-surface-contour-plane]")
    .setAttribute("points", planePolygon(
      cameraGraph,
      projection.level * (1 - projection.viewProgress)
    ));
  requiredElement<SVGPathElement>(root, "[data-kp-surface-contour-level-set]")
    .setAttribute("d", projectedPath(flattenedPoints.map((point) =>
      projectGraphPoint3DToWebGLScreen(cameraGraph, point))));

  root.querySelectorAll<SVGPathElement>("[data-kp-context-level]")
    .forEach((path) => {
      const level = Number(path.dataset["kpContextLevel"]);
      path.setAttribute("d", topDownContourPath(authority.graphTopDown, level));
    });

  for (const state of Object.values(projection.entities)) {
    root.querySelectorAll<HTMLElement | SVGElement>(
      `[data-kp-surface-contour-entity="${state.entityId}"]`
    ).forEach((element) => applyEntityVisualState(element, state));
  }

  const ids = kpSurfaceContourEntityIds;
  const intersection = projection.entities[ids.intersection3d];
  const contour = projection.entities[ids.contour2d];
  const levelSet = requiredElement<SVGPathElement>(root,
    "[data-kp-surface-contour-level-set]");
  // One paint owner carries the identity through the representation change;
  // semantic membership changes, but the learner never watches a duplicate.
  const levelSetPresence = clamp(intersection.presence + contour.presence, 0, 1);
  const levelSetAttention = clamp(intersection.attention + contour.attention, 0, 1);
  applyVisualState(levelSet, levelSetPresence, levelSetAttention);

  const plane = projection.entities[ids.slicingPlane];
  const planeAlpha = plane.presence * (1 - projection.mapProgress);
  applyVisualState(requiredElement(root, "[data-kp-surface-contour-plane]"),
    planeAlpha, plane.attention);
  applyVisualState(requiredElement(root, "[data-kp-surface-contour-plane-label]"),
    planeAlpha, plane.attention);
  const planeLabel = requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-plane-label]");
  const planeLabelPoint = projectGraphPoint3DToWebGLScreen(cameraGraph, {
    x: -1.62,
    y: -1.06,
    z: projection.level * (1 - projection.viewProgress)
  });
  planeLabel.style.left = `${planeLabelPoint.x / cameraGraph.width * 100}%`;
  planeLabel.style.top = `${planeLabelPoint.y / cameraGraph.height * 100}%`;

  const surfaceLayerAlpha = 1 - projection.mapProgress * 0.86;
  const surface = projection.entities[ids.surface];
  const surfaceBase = requiredElement<HTMLElement>(root,
    ".kp-surface-contour-stage__base");
  surfaceBase.style.setProperty("--kp-sc-surface-alpha", (
    surface.presence * surfaceLayerAlpha * (0.62 + surface.attention * 0.38)
  ).toFixed(4));

  projectAxisLabels(root, cameraGraph, projection.viewProgress);
  projectStageHeader(root, projection);

  const stage = requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-stage]");
  const slider = requiredElement<HTMLInputElement>(root,
    "[data-kp-surface-contour-level]");
  const output = requiredElement<HTMLOutputElement>(root,
    "[data-kp-surface-contour-level-output]");
  const available = projection.levelControl >= 0.75;
  slider.disabled = !available;
  slider.value = projection.level.toFixed(2);
  output.value = formatLevel(projection.level);
  stage.dataset["kpSurfaceContourCurrentLevel"] = projection.level.toFixed(4);
  stage.dataset["kpSurfaceContourLevelControl"] = available
    ? "available"
    : "context";
  stage.dataset["kpSurfaceContourViewProgress"] =
    projection.viewProgress.toFixed(4);
  stage.dataset["kpSurfaceContourMapProgress"] =
    projection.mapProgress.toFixed(4);
  stage.style.setProperty("--kp-sc-map-progress",
    projection.mapProgress.toFixed(4));
  requiredElement<HTMLElement>(root,
    ".kp-surface-contour-level-control").style.setProperty(
      "--kp-sc-level-control-alpha",
      (0.42 + projection.levelControl * 0.58).toFixed(4)
    );
  requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-view]").setAttribute(
      "aria-label",
      `${viewLabel(projection)} at level c equals ${formatLevel(projection.level)}`
    );
}

function createSurfaceContourRuntimeFrame(input: {
  readonly authority: KpSurfaceContourStageAuthority;
  readonly projection: KpSurfaceContourSceneProjectionV1;
  readonly direction: "forward" | "rewind";
}): SurfaceContourRuntimeFrame {
  const { authority, projection } = input;
  const graph = authority.graphTopDown;
  return createKpGraph3DRuntimeFrame({
    identity: {
      animationId: "animation.calculus.surface-contour.projection.v1",
      frameId: `frame.calculus.surface-contour.${projection.viewProgress.toFixed(4)}`,
      graphId: graph.id
    },
    clock: {
      direction: input.direction,
      requestedProgress: projection.viewProgress,
      visualProgress: projection.viewProgress
    },
    stage: {
      width: graph.width,
      height: graph.height,
      anchors: {
        plotOrigin: graph.camera.origin,
        cameraTarget: [0, 0, 0]
      }
    },
    camera: {
      projection: "orthographic",
      azimuthDegrees: graph.camera.azimuthDegrees,
      elevationDegrees: graph.camera.elevationDegrees,
      scale: graph.camera.scale
    },
    theme: {
      id: "kp.graph.surface-contour-paper.v1",
      roles: visualRoles(projection)
    },
    scene: {
      source: authority.scene3d,
      target: authority.sceneTopDown
    },
    accessibility: {
      description: `${viewLabel(projection)} of z equals x squared plus twice y squared, at c equals ${formatLevel(projection.level)}.`
    }
  });
}

function visualRoles(
  projection: KpSurfaceContourSceneProjectionV1
): KpGraph3DResolvedVisualRoles {
  const surface = projection.entities[kpSurfaceContourEntityIds.surface];
  const surfaceOpacity = 0.82 * surface.presence *
    (1 - projection.mapProgress * 0.86) *
    (0.62 + surface.attention * 0.38);
  return Object.freeze({
    background: role("#fffdf8", 1, 0),
    axis: role("#455361", 0.76, 1),
    "axis-accent": role("#455361", 0.9, 1.1),
    "axis-occluded": role("#c5c9c8", 0.46, 1),
    surface: role("#7faabd", surfaceOpacity, 0),
    "surface-grid": role("#53798a", surfaceOpacity * 0.72, 0.9),
    "surface-border": role("#315e6d", surfaceOpacity, 1.05),
    shadow: role("#0f172a", 0, 0)
  });
}

function syncFallback(
  shell: HTMLElement,
  authority: KpSurfaceContourStageAuthority,
  viewProgress: number,
  currentView: "3d" | "xy"
): void {
  const nextView = viewProgress >= 0.5 ? "xy" : "3d";
  if (nextView === currentView) return;
  const fallback = shell.querySelector<HTMLElement>(".graph-webgl__fallback");
  if (fallback === null) return;
  if (nextView === "3d") {
    fallback.innerHTML = renderGraph3DWebGLFallback(
      authority.scene3d,
      authority.graph3d
    );
  } else {
    fallback.innerHTML = renderGraph3DWebGLFallback(
      authority.sceneTopDown,
      authority.graphTopDown
    );
  }
  shell.dataset["kpSurfaceContourFallbackView"] = nextView;
}

function projectStageHeader(
  root: ParentNode,
  projection: KpSurfaceContourSceneProjectionV1
): void {
  const label = requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-view-label]");
  label.textContent = viewLabel(projection);
  const surfaceEquation = requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-equation=\"surface\"]");
  const levelEquation = requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-equation=\"level-set\"]");
  const showLevelSet = projection.mapProgress >= 0.5;
  surfaceEquation.hidden = showLevelSet;
  levelEquation.hidden = !showLevelSet;
}

function projectAxisLabels(
  root: ParentNode,
  graph: Graph3DObject,
  viewProgress: number
): void {
  const plot = requiredElement<HTMLElement>(root,
    ".kp-surface-contour-stage__plot");
  const endpoints: Readonly<Record<string, GraphPoint3D>> = {
    x: { x: graph.xDomain[1], y: 0, z: 0 },
    y: { x: 0, y: graph.yDomain[1], z: 0 },
    z: { x: 0, y: 0, z: graph.zDomain[1] * (1 - viewProgress) }
  };
  for (const [axis, point] of Object.entries(endpoints)) {
    const label = requiredElement<HTMLElement>(root,
      `[data-kp-surface-contour-axis="${axis}"]`);
    // The graph is responsive but the KaTeX label is sized in CSS pixels.
    // Clamp its realized ink box, not only its semantic anchor, so compact
    // cards retain the same stage-fit contract without shrinking the graph.
    const opticalEdgePadPx = 1;
    const halfWidthPercent = (label.offsetWidth / 2 + opticalEdgePadPx) /
      Math.max(1, plot.clientWidth) * 100;
    const halfHeightPercent = (label.offsetHeight / 2 + opticalEdgePadPx) /
      Math.max(1, plot.clientHeight) * 100;
    const horizontalMinimum =
      kpSurfaceContourFitContract.safeInsets.left / graph.width * 100 +
      halfWidthPercent;
    const horizontalMaximum =
      (graph.width - kpSurfaceContourFitContract.safeInsets.right) /
      graph.width * 100 - halfWidthPercent;
    const verticalMinimum =
      kpSurfaceContourFitContract.safeInsets.top / graph.height * 100 +
      halfHeightPercent;
    const verticalMaximum =
      (graph.height - kpSurfaceContourFitContract.safeInsets.bottom) /
      graph.height * 100 - halfHeightPercent;
    const projected = projectGraphPoint3DToWebGLScreen(graph, point);
    label.style.left = `${clamp(
      projected.x / graph.width * 100,
      horizontalMinimum,
      horizontalMaximum
    ).toFixed(3)}%`;
    label.style.top = `${clamp(
      projected.y / graph.height * 100,
      verticalMinimum,
      verticalMaximum
    ).toFixed(3)}%`;
    label.style.opacity = axis === "z"
      ? (1 - viewProgress).toFixed(4)
      : "1";
  }
}

function renderAxisLabels(): string {
  return ["x", "y", "z"].map((axis) =>
    `<span class="kp-surface-contour-axis-label" data-kp-surface-contour-axis="${axis}">${math(axis)}</span>`
  ).join("");
}

function graphAtViewProgress(
  source: Graph3DObject,
  target: Graph3DObject,
  viewProgress: number
): Graph3DObject {
  const progress = clamp(viewProgress, 0, 1);
  return {
    ...target,
    viewMode: "xy",
    camera: {
      azimuthDegrees: interpolate(
        source.camera.azimuthDegrees,
        target.camera.azimuthDegrees,
        progress
      ),
      elevationDegrees: interpolate(
        source.camera.elevationDegrees,
        target.camera.elevationDegrees,
        progress
      ),
      scale: interpolate(source.camera.scale, target.camera.scale, progress),
      origin: [
        interpolate(source.camera.origin[0], target.camera.origin[0], progress),
        interpolate(source.camera.origin[1], target.camera.origin[1], progress)
      ]
    }
  };
}

function planePolygon(graph: Graph3DObject, z: number): string {
  const x = 1.84;
  const y = 1.36;
  return [
    { x: -x, y: -y, z },
    { x, y: -y, z },
    { x, y, z },
    { x: -x, y, z }
  ].map((point) => projectGraphPoint3DToWebGLScreen(graph, point))
    .map(({ x: px, y: py }) => `${px.toFixed(3)},${py.toFixed(3)}`)
    .join(" ");
}

function topDownContourPath(graph: Graph3DObject, level: number): string {
  return projectedPath(sampleKpSurfaceContourLevelSet({
    level,
    sampleCount: 97
  }).map(({ x, y }) => projectGraphPoint3DToWebGLScreen(
    graph,
    { x, y, z: 0 }
  )));
}

function surfaceContourFitPoints(input: {
  readonly graph: Graph3DObject;
  readonly surface: Surface3DObject;
  readonly progress: number;
}): readonly GraphPoint3D[] {
  const progress = clamp(input.progress, 0, 1);
  const zScale = 1 - progress;
  const points: GraphPoint3D[] = [];
  const sampleCount = 25;
  for (let row = 0; row < sampleCount; row += 1) {
    const y = interpolate(
      input.surface.yDomain[0],
      input.surface.yDomain[1],
      row / (sampleCount - 1)
    );
    for (let column = 0; column < sampleCount; column += 1) {
      const x = interpolate(
        input.surface.xDomain[0],
        input.surface.xDomain[1],
        column / (sampleCount - 1)
      );
      points.push({ x, y, z: (x * x + 2 * y * y) * zScale });
    }
  }
  points.push(
    { x: input.graph.xDomain[0], y: 0, z: 0 },
    { x: input.graph.xDomain[1], y: 0, z: 0 },
    { x: 0, y: input.graph.yDomain[0], z: 0 },
    { x: 0, y: input.graph.yDomain[1], z: 0 },
    { x: 0, y: 0, z: input.graph.zDomain[1] * zScale }
  );
  for (const level of [...CONTEXT_LEVELS, 1.6, 3.6]) {
    points.push(...sampleKpSurfaceContourLevelSet({
      level,
      sampleCount: 33
    }).map((point) => ({ ...point, z: point.z * zScale })));
  }
  for (const level of [1.6, 3.6]) {
    const z = level * zScale;
    points.push(
      { x: -1.84, y: -1.36, z },
      { x: 1.84, y: -1.36, z },
      { x: 1.84, y: 1.36, z },
      { x: -1.84, y: 1.36, z }
    );
  }
  return Object.freeze(points);
}

function mountSurfaceContourFitAudit(
  root: ParentNode,
  authority: KpSurfaceContourStageAuthority
): { readonly schedule: () => void; readonly dispose: () => void } {
  const stage = requiredElement<HTMLElement>(root,
    "[data-kp-surface-contour-stage]");
  const ownerWindow = stage.ownerDocument.defaultView;
  let frameId: number | undefined;
  let disposed = false;

  const measure = (): void => {
    frameId = undefined;
    if (disposed || !stage.isConnected) return;
    const passages = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-surface-contour-beat]"
    )].map((passage) => {
      const page = requiredElement<HTMLElement>(passage,
        ".kp-focus-deck__passage-page");
      const prose = requiredElement<HTMLElement>(page, "p:last-child");
      return Object.freeze({
        id: passage.dataset["kpSurfaceContourBeat"] ?? "unknown-passage",
        viewportHeight: page.clientHeight,
        contentHeight: page.scrollHeight,
        textPx: Number.parseFloat(ownerWindow?.getComputedStyle(prose).fontSize ?? "NaN")
      });
    });
    const math = [...stage.querySelectorAll<HTMLElement>(".katex")]
      .filter((element) => !element.closest("[hidden]"))
      .map((element, index) => Object.freeze({
        id: element.closest<HTMLElement>(
          "[data-kp-surface-contour-axis], " +
          "[data-kp-surface-contour-equation], " +
          "[data-kp-surface-contour-plane-label]"
        )?.dataset["kpSurfaceContourAxis"] ?? `stage-math-${index}`,
        textPx: Number.parseFloat(
          ownerWindow?.getComputedStyle(element).fontSize ?? "NaN"
        )
      }));
    const requiredGeometryBounds = observedSurfaceContourGeometryBounds({
      root,
      authority,
      ownerWindow
    });
    const gaps = [
      ...(authority.fitPlan.gap === undefined ? [] : [authority.fitPlan.gap]),
      ...checkKpStageFitObservation({
        contract: authority.fitContract,
        observation: {
          stageRect: { left: 0, top: 0, width: GRAPH_WIDTH, height: GRAPH_HEIGHT },
          requiredGeometryBounds,
          passages,
          math
        }
      })
    ];
    stage.dataset["kpStageFitStatus"] = gaps.length === 0
      ? "satisfied"
      : "repair-gap";
    stage.dataset["kpStageFitObservedBounds"] =
      JSON.stringify(requiredGeometryBounds);
    stage.dataset["kpStageFitRepairGaps"] = JSON.stringify(gaps.map((gap) => ({
      code: gap.code,
      subjectId: gap.subjectId
    })));
    if (root instanceof HTMLElement) {
      root.dataset["kpStageFitStatus"] = stage.dataset["kpStageFitStatus"];
    }
  };
  const schedule = (): void => {
    if (disposed || frameId !== undefined || ownerWindow === null) return;
    frameId = ownerWindow.requestAnimationFrame(measure);
  };
  const ResizeObserverConstructor = ownerWindow?.ResizeObserver;
  const observer = ResizeObserverConstructor === undefined
    ? undefined
    : new ResizeObserverConstructor(schedule);
  observer?.observe(stage);
  root.querySelectorAll<HTMLElement>("[data-kp-surface-contour-beat]")
    .forEach((passage) => observer?.observe(passage));
  void stage.ownerDocument.fonts?.ready.then(schedule);
  schedule();

  return Object.freeze({
    schedule,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      if (frameId !== undefined && ownerWindow !== null) {
        ownerWindow.cancelAnimationFrame(frameId);
      }
    }
  });
}

function observedSurfaceContourGeometryBounds(input: {
  readonly root: ParentNode;
  readonly authority: KpSurfaceContourStageAuthority;
  readonly ownerWindow: Window | null;
}) {
  const plot = requiredElement<HTMLElement>(input.root,
    ".kp-surface-contour-stage__plot");
  const plotRect = plot.getBoundingClientRect();
  if (plotRect.width <= 0 || plotRect.height <= 0) {
    return Object.freeze({ left: 0, top: 0, width: 0, height: 0 });
  }
  // The mathematical subject is fitted in graph coordinates, while KaTeX
  // labels are realized DOM paint. Measuring both prevents a nominally fitted
  // scene from shipping with its notation clipped outside the safe frame.
  const labelBounds = [...plot.querySelectorAll<HTMLElement>(
    "[data-kp-surface-contour-axis], [data-kp-surface-contour-plane-label]"
  )].filter((label) => {
    const style = input.ownerWindow?.getComputedStyle(label);
    return style !== undefined &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number.parseFloat(style.opacity) > 0.01;
  }).map((label) => {
    const rect = label.getBoundingClientRect();
    return Object.freeze({
      left: (rect.left - plotRect.left) / plotRect.width * GRAPH_WIDTH,
      top: (rect.top - plotRect.top) / plotRect.height * GRAPH_HEIGHT,
      width: rect.width / plotRect.width * GRAPH_WIDTH,
      height: rect.height / plotRect.height * GRAPH_HEIGHT
    });
  });
  return unionKpStageFitRects([
    input.authority.fitPlan.sweptBounds,
    ...labelBounds
  ]);
}

function projectedPath(
  points: readonly { readonly x: number; readonly y: number }[]
): string {
  return points.map((point, index) =>
    `${index === 0 ? "M" : "L"}${point.x.toFixed(3)} ${point.y.toFixed(3)}`
  ).join(" ") + " Z";
}

function applyEntityVisualState(
  element: HTMLElement | SVGElement,
  state: { readonly presence: number; readonly attention: number }
): void {
  applyVisualState(element, state.presence, state.attention);
}

function applyVisualState(
  element: HTMLElement | SVGElement,
  presence: number,
  attention: number
): void {
  const alpha = presence * (0.38 + attention * 0.62);
  element.style.setProperty("--kp-sc-presence", presence.toFixed(4));
  element.style.setProperty("--kp-sc-attention", attention.toFixed(4));
  element.style.setProperty("--kp-sc-visual-alpha", alpha.toFixed(4));
  element.setAttribute("data-kp-surface-contour-presence", presence.toFixed(4));
  element.setAttribute("data-kp-surface-contour-attention", attention.toFixed(4));
}

function viewLabel(projection: KpSurfaceContourSceneProjectionV1): string {
  if (projection.mapProgress >= 0.5) return "Contour map";
  if (projection.viewProgress >= 0.5) return "Top-down view";
  return "Surface";
}

function role(color: string, opacity: number, apparentWidth: number) {
  return Object.freeze({ color, opacity, apparentWidth });
}

function replaceGraph(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject
): readonly KpSemanticObject[] {
  return objects.map((object) => object.id === graph.id ? graph : object);
}

function math(latex: string): string {
  return renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
}

function formatLevel(level: number): string {
  return level.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing surface-contour element ${selector}.`);
  return element;
}
