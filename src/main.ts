import "katex/dist/katex.min.css";
import "./styles.css";
import "./editor/animation-catalogue-shell.css";

import {
  createInitialEditorDocument,
  renderEditorAnimationLibraryHost,
  renderEditorDocument
} from "./editor/editor.ts";
import {
  renderKpAnimationCatalogueBootstrap
} from "./editor/animation-catalogue-bootstrap.ts";
import {
  deriveKpAnimationCatalogueHealth
} from "./editor/animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueProjection
} from "./editor/animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "./editor/animation-catalogue-route.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "./editor/animation-catalogue-selection.ts";
import {
  renderKpAnimationCatalogueResults,
  renderKpAnimationCatalogueShell
} from "./editor/animation-catalogue-shell.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability
} from "./editor/animation-catalogue-surface-hostability.ts";
import {
  createKpEditorAnimationLibrary,
  selectKpEditorAnimationDescriptor
} from "./editor/animation-library.ts";
import {
  kpEditorAnimationSelectionHref,
  readKpEditorAnimationSelection
} from "./editor/animation-selection-route.ts";
import {
  previewApiCatalogItem,
  selectApiCatalogItem
} from "./editor/api-catalog.ts";
import { compileDocumentAsset } from "./editor/compile-client.ts";
import {
  handleEquationMotionDemoKeydown,
  hydrateEquationMotionDemos,
  setEquationMotionBeat,
  setEquationMotionCollapseScale,
  setEquationMotionDuration,
  setEquationMotionProgress,
  stepEquationMotionDemo
} from "./editor/equation-motion-demo-controller.ts";
import {
  GRAPH_3D_SURFACE_MODE_IDS,
  GRAPH_3D_SURFACE_QUALITY_IDS,
  GRAPH_3D_VIEW_MODE_IDS,
  applyGraph3DLightPreset,
  findGraph3DLightPresetId,
  updateGraph3DAzimuth,
  updateGraph3DLightSetting,
  updateGraph3DOccludedAxisLightness,
  updateGraph3DShadowEnabled,
  updateGraph3DShadowOpacity,
  updateGraph3DSurfaceQuality,
  updateGraph3DSurfaceMode,
  updateGraph3DViewMode,
  updateSaddleSurfaceDenominator,
  type Graph3DLightPresetId,
  type Graph3DLightScalarSetting
} from "./editor/state.ts";
import { occludedAxisColor } from "./rendering/graph-svg.ts";
import {
  canReuseGraph3DWebGLShell,
  renderGraph3DWebGLFallback,
  renderGraph3DWebGLShell
} from "./rendering/graph-webgl.ts";
import type { KpSemanticObject } from "./semantic/document.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  type Graph3DObject,
  type Graph3DSurfaceQuality,
  type Graph3DViewMode,
  type Surface3DObject
} from "./semantic/graph.ts";
import {
  disposeKpEditorAnimationPlayers,
  hydrateKpEditorAnimationPlayers,
  KP_EDITOR_ANIMATION_FRAME_EVENT,
  KP_EDITOR_ANIMATION_LOAD_EVENT,
  applyKpEditorAnimationPresentationTuning,
  pauseKpEditorAnimationPlayers
} from "./editor/animation-player-controller.ts";
import {
  installKpAnimationHostStatus,
  markKpAnimationHostFailed,
  markKpAnimationHostLoading,
  markKpAnimationHostReady
} from "./rendering/animation-host-status.ts";
import {
  hydrateKpEditorAnimationSurfaces
} from "./editor/animation-surface-adapter-registry.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry
} from "./editor/animation-surface-adapter-registry.ts";
import {
  hydrateKpEditorAnimationLiveDiagnostics
} from "./editor/animation-live-diagnostics.ts";
import {
  createKpEditorAnimationPlayerState
} from "./editor/animation-player-state.ts";
import {
  registerKpEditorEquationSurfaceAdapter
} from "./editor/equation-surface-adapter.ts";
import { registerKpEditorGraphSvgViewportAdapter } from "./editor/graph-svg-viewport.ts";
import { registerKpEditorDiagramSvgAdapter } from "./editor/diagram-svg-adapter.ts";
import {
  disposeKpEditorEquationStageHotPathCaches
} from "./editor/equation-stage-hot-path-cache.ts";
import {
  KP_ANIMATION_WORKBENCH_VIEW,
  readKpSemanticAnimationWorkbenchRoute
} from "./editor/semantic-animation-workbench-route.ts";
import {
  writeKpSemanticAnimationWorkbenchRoute
} from "./editor/semantic-animation-workbench-route.ts";
import { loadKpAnimationAsset } from "./animation/catalog-loader.ts";
import {
  deriveKpAnimationAcceptanceBrief,
  renderKpAnimationAcceptanceBrief
} from "./editor/semantic-animation-workbench-acceptance.ts";
import type {
  KpSemanticAnimationWorkbenchIndexEntry
} from "./editor/semantic-animation-workbench-index.ts";
import {
  loadKpAnimationWorkbenchReviewEvidence
} from "./editor/semantic-animation-workbench-review-loader.ts";
import {
  renderKpAnimationWorkbenchReviewPanel
} from "./editor/semantic-animation-workbench-review.ts";
import {
  loadKpAnimationWorkbenchDevelopmentReview
} from "./editor/semantic-animation-workbench-review-capture-loader.ts";
import {
  loadKpEditorAnimationLibraryDevelopmentReview
} from "./editor/editor-animation-library-review-capture-loader.ts";
import {
  loadKpAnimationCatalogueDevelopmentReview
} from "./editor/animation-catalogue-review-capture-loader.ts";
import type {
  KpSemanticAnimationWorkbenchRoadmapRouteState
} from "./editor/semantic-animation-workbench-route.ts";
import type {
  KpSemanticAnimationWorkbenchIndex
} from "./editor/semantic-animation-workbench-index.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Expected #app root element to exist.");
}

const appRoot = app;
let editorDocument = createInitialEditorDocument();
let projectDashboardQuery = "";
let projectDashboardSelectedAgendaRowId: string | undefined;
let projectDashboardTocOnly = false;
let projectDashboardSelectedKatexFixtureId: string | undefined;
let selectedEquationAnimationId: string | undefined;
const editorAnimationDescriptors = createKpEditorAnimationLibrary();
const animationCatalogueProjection = createKpAnimationCatalogueProjection();
let selectedEditorAnimationDescriptorId = selectKpEditorAnimationDescriptor(
  editorAnimationDescriptors,
  readKpEditorAnimationSelection(window.location.search)
).id;
type Graph3DWebGLClient = typeof import("./rendering/graph-webgl-three.ts");
type ProjectDashboardDataClient = typeof import("./project-dashboard/data.ts");
type ProjectDashboardRenderClient = typeof import("./project-dashboard/render.ts");
type FtcTutorialSurfaceClient = typeof import("./tutorial/ftc-surface.ts");
type FtcTutorialEditorClient = typeof import("./editor/ftc-tutorial-editor-surface.ts");
type AnimationWorkbenchViewClient = typeof import(
  "./editor/semantic-animation-workbench-view.ts"
);
let graph3DWebGLClient: Graph3DWebGLClient | undefined;
let graph3DWebGLClientPromise: Promise<Graph3DWebGLClient> | undefined;
let projectDashboardClientPromise: Promise<{
  readonly data: ProjectDashboardDataClient;
  readonly render: ProjectDashboardRenderClient;
}> | undefined;
let ftcTutorialSurfaceClientPromise: Promise<FtcTutorialSurfaceClient> | undefined;
let ftcTutorialEditorClientPromise: Promise<FtcTutorialEditorClient> | undefined;
let animationWorkbenchViewClientPromise:
  | Promise<AnimationWorkbenchViewClient>
  | undefined;
let activeView:
  | "dashboard"
  | "editor"
  | "animation-library-host"
  | "ftc-tutorial"
  | "animation-catalogue"
  | "animation-workbench" = "editor";
installKpAnimationHostStatus(window, "kp.application");
appRoot.addEventListener(KP_EDITOR_ANIMATION_LOAD_EVENT, (event) => {
  const cataloguePlayer =
    activeView === "animation-catalogue" &&
    event.target instanceof HTMLElement &&
    event.target.closest("[data-kp-animation-catalogue]") !== null;
  const editorPlayer =
    (activeView === "animation-library-host" || activeView === "editor") &&
    event.target instanceof HTMLElement &&
    event.target.dataset["kpEditorAnimationDescriptorId"] ===
      selectedEditorAnimationDescriptorId;
  if (
    !(event instanceof CustomEvent) ||
    (!cataloguePlayer && !editorPlayer) ||
    typeof event.detail !== "object" ||
    event.detail === null
  ) return;
  const detail = event.detail as {
    readonly status?: unknown;
    readonly message?: unknown;
  };
  if (detail.status === "ready") {
    markKpAnimationHostReady(window);
  } else if (detail.status === "failed") {
    markKpAnimationHostFailed(
      window,
      typeof detail.message === "string"
        ? detail.message
        : "Animation player failed to load."
    );
  }
});
appRoot.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, (event) => {
  if (
    activeView !== "animation-catalogue" ||
    !(event instanceof CustomEvent) ||
    !(event.target instanceof HTMLElement) ||
    event.target.closest("[data-kp-animation-catalogue]") === null ||
    typeof event.detail !== "object" || event.detail === null
  ) return;
  const progress = (event.detail as { readonly progress?: unknown }).progress;
  if (typeof progress !== "number") return;
  const route = readKpAnimationCatalogueRoute(window.location.search);
  const search = writeKpAnimationCatalogueRoute(window.location.search, {
    artifactId: route.artifactId,
    playhead: progress
  });
  if (search !== window.location.search) {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
  }
});
let viewRevision = 0;
let disposeAnimationDevelopmentReview:
  | (() => void)
  | undefined;
const graph3DWebGLVisibilityObservers = new WeakMap<
  HTMLElement,
  IntersectionObserver
>();
declare global {
  interface Window {
    __kpEquationMotionSetProgress?: (
      demo: HTMLElement,
      progress: number
    ) => void;
  }
}

window.__kpEquationMotionSetProgress = setEquationMotionProgress;
registerKpEditorEquationSurfaceAdapter();
registerKpEditorDiagramSvgAdapter();
registerKpEditorGraphSvgViewportAdapter();

const requestedView =
  new URLSearchParams(window.location.search).get("view");

if (requestedView === "ftc-tutorial") {
  void renderFtcTutorialView();
} else if (requestedView === "animation-library-host") {
  renderAnimationLibraryHostView();
} else if (readKpSemanticAnimationWorkbenchRoute(window.location.search).active) {
  void renderAnimationWorkbenchView();
} else if (readKpAnimationCatalogueRoute(window.location.search).active) {
  void renderAnimationCatalogueView();
} else {
  renderEditor();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseKpEditorAnimationPlayers(appRoot);
});

window.addEventListener("pagehide", () => {
  disposeAnimationDevelopmentReviewCapture();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
});

appRoot.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const livePreviewLink = event.target.closest<HTMLAnchorElement>(
    'a[data-kp-preview-link="live-animation"]'
  );

  if (livePreviewLink !== null) {
    openProjectDashboardLiveAnimationPreview(livePreviewLink, event);
    return;
  }

  const editorAnimationLink = event.target.closest<HTMLAnchorElement>(
    'a[data-kp-preview-link="editor-animation"]'
  );

  if (editorAnimationLink !== null) {
    openProjectDashboardEditorAnimation(editorAnimationLink, event);
    return;
  }

  const graphSurfaceLink = event.target.closest<HTMLAnchorElement>(
    'a[data-kp-preview-link="graph-surface-mode"]'
  );

  if (graphSurfaceLink !== null) {
    openProjectDashboardGraphSurfacePreview(graphSurfaceLink, event);
    return;
  }

  const apiCatalogLink = event.target.closest<HTMLAnchorElement>(
    'a[data-kp-preview-link="api-catalog-item"]'
  );

  if (apiCatalogLink !== null) {
    openProjectDashboardApiCatalogPreview(apiCatalogLink, event);
    return;
  }

  const button = event.target.closest<HTMLButtonElement>("button[data-action]");

  if (button === null) {
    return;
  }

  switch (button.dataset["action"]) {
    case "show-project-dashboard":
      void renderProjectDashboardView();
      return;
    case "show-editor":
      navigateToView("editor");
      renderEditor();
      return;
    case "show-animation-workbench":
      navigateToView("animation-workbench");
      void renderAnimationWorkbenchView();
      return;
    case "select-animation-workbench-result":
      void selectAnimationWorkbenchResult(button);
      return;
    case "select-animation-workbench-representation":
      void selectAnimationWorkbenchRepresentation(button);
      return;
    case "select-animation-workbench-roadmap-link":
      void selectAnimationWorkbenchRoadmapLink(button);
      return;
    case "show-ftc-tutorial":
      navigateToView("ftc-tutorial");
      void renderFtcTutorialView();
      return;
    case "load-ftc-tutorial-editor":
      void loadFtcTutorialIntoEditor();
      return;
    case "compile-document":
      void compileDocument();
      return;
    case "select-api-outline-item":
      selectApiCatalogItem(button);
      return;
    case "select-katex-transform-fixture":
      selectKatexTransformFixture(button);
      return;
    case "select-project-agenda-row":
      selectProjectAgendaRow(button);
      return;
    case "equation-motion-next":
      stepEquationMotionDemo(button, 1);
      return;
    case "equation-motion-rewind":
      stepEquationMotionDemo(button, -1);
      return;
  }
});

appRoot.addEventListener("keydown", (event) => {
  handleEquationMotionDemoKeydown(event);
});

document.addEventListener("keydown", (event) => {
  handleAnimationWorkbenchKeydown(event);
});

appRoot.addEventListener("mouseover", (event) => {
  previewApiCatalogItemFromEvent(event);
});

appRoot.addEventListener("focusin", (event) => {
  previewApiCatalogItemFromEvent(event);
});

appRoot.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLSelectElement)) {
    return;
  }

  if (event.target.dataset["action"] === "set-graph-light-preset") {
    updateGraphLightPresetFromSelect(event.target);
    return;
  }

  if (event.target.dataset["action"] === "set-graph-surface-mode") {
    updateGraphSurfaceModeFromSelect(event.target);
    return;
  }

  if (event.target.dataset["action"] === "set-graph-surface-quality") {
    updateGraphSurfaceQualityFromSelect(event.target);
    return;
  }

  if (event.target.dataset["action"] === "set-graph-view-mode") {
    updateGraphViewModeFromSelect(event.target);
    return;
  }

  if (event.target.dataset["action"] === "set-equation-motion-animation") {
    selectEquationAnimation(event.target);
    return;
  }

  if (event.target.dataset["action"] === "set-editor-animation") {
    selectEditorAnimation(event.target);
    return;
  }

  if (event.target.dataset["action"] ===
    "select-animation-catalogue-inspector") {
    selectAnimationCatalogueInspectorFromSelect(event.target);
    return;
  }

  if (event.target.dataset["action"] === "tune-animation-catalogue") {
    tuneAnimationCatalogueFromSelect(event.target);
    return;
  }

  if (event.target.dataset["action"]?.includes("animation-workbench-roadmap")) {
    void updateAnimationWorkbenchRoadmapQuery(event.target);
  }
});

appRoot.addEventListener("input", (event) => {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }

  switch (event.target.dataset["action"]) {
    case "set-graph-azimuth":
      updateGraphAzimuthFromInput(event.target);
      return;
    case "set-graph-occluded-axis-lightness":
      updateGraphOccludedAxisLightnessFromInput(event.target);
      return;
    case "set-graph-light-setting":
      updateGraphLightSettingFromInput(event.target);
      return;
    case "set-graph-shadow-enabled":
      updateGraphShadowEnabledFromInput(event.target);
      return;
    case "set-graph-shadow-opacity":
      updateGraphShadowOpacityFromInput(event.target);
      return;
    case "set-saddle-denominator":
      updateSaddleDenominatorFromInput(event.target);
      return;
    case "set-equation-motion-beat":
      setEquationMotionBeat(event.target);
      return;
    case "set-equation-motion-duration":
      setEquationMotionDuration(event.target);
      return;
    case "set-equation-motion-collapse-scale":
      setEquationMotionCollapseScale(event.target);
      return;
    case "filter-project-dashboard":
      void filterProjectDashboardFromInput(event.target);
      return;
    case "toggle-project-dashboard-toc":
      toggleProjectDashboardTocFromInput(event.target);
      return;
    case "filter-animation-workbench":
      void filterAnimationWorkbenchFromInput(event.target);
      return;
    case "filter-animation-catalogue":
      filterAnimationCatalogueFromInput(event.target);
      return;
  }
});

async function compileDocument(): Promise<void> {
  const compiledSource = appRoot.querySelector<HTMLPreElement>("#compiled-source");

  try {
    const html = await compileDocumentAsset(editorDocument);

    if (compiledSource !== null) {
      compiledSource.textContent = html;
    }
  } catch (error: unknown) {
    if (compiledSource !== null) {
      compiledSource.textContent =
        error instanceof Error ? error.message : "Compile request failed.";
    }
  }
}

function renderEditor(): void {
  activeView = "editor";
  markKpAnimationHostLoading(
    window,
    `editor.${selectedEditorAnimationDescriptorId}`
  );
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
  disposeGraph3DWebGL(appRoot);
  appRoot.innerHTML = renderEditorDocument(editorDocument, {
    equationAnimationId: selectedEquationAnimationId,
    editorAnimationDescriptorId: selectedEditorAnimationDescriptorId
  });
  // Surface listeners attach first so the controller's initial runtime frame
  // is observable without an extra synthetic playback tick.
  hydrateKpEditorAnimationSurfaces(appRoot);
  hydrateKpEditorAnimationLiveDiagnostics(appRoot);
  hydrateKpEditorAnimationPlayers(appRoot);
  hydrateEquationMotionDemos(appRoot);
  hydrateGraph3DWebGL(appRoot, editorDocument.objects);
  void mountEditorAnimationLibraryReviewCapture(revision);
}

async function renderAnimationCatalogueView(): Promise<void> {
  activeView = "animation-catalogue";
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
  disposeGraph3DWebGL(appRoot);
  const route = readKpAnimationCatalogueRoute(window.location.search);
  const selection = resolveKpAnimationCatalogueSelection({
    projection: animationCatalogueProjection,
    artifactId: route.artifactId
  });

  if (selection.status === "not-found") {
    appRoot.innerHTML = renderKpAnimationCatalogueBootstrap({
      status: "not-found",
      animationId: selection.requestedArtifactId
    });
    markKpAnimationHostReady(window);
    return;
  }
  const { entry } = selection;
  markKpAnimationHostLoading(window, `catalogue.${entry.animationId}`);
  appRoot.innerHTML = renderKpAnimationCatalogueBootstrap({
    status: "loading",
    animationId: entry.animationId,
    title: entry.title
  });
  try {
    const loaded = await loadKpAnimationAsset(entry.animationId);
    if (activeView !== "animation-catalogue" || revision !== viewRevision) {
      return;
    }
    if (
      loaded.animation.id !== entry.animationId ||
      loaded.packId !== entry.packId
    ) {
      throw new Error(
        `Loaded catalogue asset ${loaded.animation.id} from ${loaded.packId}; ` +
        `expected ${entry.animationId} from ${entry.packId}.`
      );
    }
    const descriptor = editorAnimationDescriptors.find(
      ({ id }) => id === entry.primaryDescriptorId
    );
    if (descriptor === undefined) {
      throw new Error(
        `Catalogue entry ${entry.animationId} is missing descriptor ` +
        `${entry.primaryDescriptorId}.`
      );
    }
    const playerState = createKpEditorAnimationPlayerState({
      descriptor,
      animation: loaded.animation,
      catalog: loaded.catalog,
      progress: route.playhead ?? 0
    });
    const hostability = inspectKpAnimationCatalogueSurfaceHostability({
      state: playerState,
      registry: kpEditorAnimationSurfaceAdapterRegistry
    });
    const health = deriveKpAnimationCatalogueHealth({
      hostability,
      hostObservation: { status: "not-observed" }
    });
    appRoot.innerHTML = renderKpAnimationCatalogueShell({
      entry,
      health,
      entries: animationCatalogueProjection.entries,
      descriptor,
      player: playerState
    });
    // Preserve the established listener order so the first sampled frame
    // reaches its surface adapter before the controller announces readiness.
    hydrateKpEditorAnimationSurfaces(appRoot);
    hydrateKpEditorAnimationLiveDiagnostics(appRoot);
    hydrateKpEditorAnimationPlayers(appRoot);
    void mountAnimationCatalogueReviewCapture(revision);
  } catch (error: unknown) {
    if (activeView !== "animation-catalogue" || revision !== viewRevision) {
      return;
    }
    const message = error instanceof Error
      ? error.message
      : "The selected catalogue asset failed to load.";
    appRoot.innerHTML = renderKpAnimationCatalogueBootstrap({
      status: "error",
      animationId: entry.animationId,
      message
    });
    markKpAnimationHostFailed(window, message);
  }
}

function filterAnimationCatalogueFromInput(input: HTMLInputElement): void {
  const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
  const results = shell?.querySelector<HTMLOListElement>(
    "[data-kp-animation-catalogue-results]"
  );
  const selectedAnimationId = shell?.dataset["kpAnimationCatalogueSelection"];
  const selectedStatus = shell
    ?.dataset["kpAnimationCatalogueSelectedHealth"];
  if (
    results === undefined || results === null ||
    selectedAnimationId === undefined ||
    (selectedStatus !== "ready" &&
      selectedStatus !== "review" &&
      selectedStatus !== "broken")
  ) {
    return;
  }

  results.outerHTML = renderKpAnimationCatalogueResults({
    entries: animationCatalogueProjection.entries,
    selectedAnimationId,
    selectedHealth: {
      schemaVersion: "kp.animation-catalogue-health.v1",
      kind: "animation-catalogue-health",
      animationId: selectedAnimationId,
      status: selectedStatus,
      reasons: []
    },
    query: input.value
  });
}

function selectAnimationCatalogueInspectorFromSelect(
  select: HTMLSelectElement
): void {
  const view = select.closest<HTMLElement>(
    "[data-kp-animation-catalogue-inspector-view]"
  );
  if (
    view === null ||
    (select.value !== "details" &&
      select.value !== "parameters" &&
      select.value !== "tuning")
  ) return;
  view.dataset["kpAnimationCatalogueInspectorView"] = select.value;
  view.querySelectorAll<HTMLElement>(
    "[data-kp-animation-catalogue-inspector-panel]"
  ).forEach((panel) => {
    panel.hidden = panel.dataset["kpAnimationCatalogueInspectorPanel"] !==
      select.value;
  });
}

function tuneAnimationCatalogueFromSelect(select: HTMLSelectElement): void {
  const kind = select.dataset["kpAnimationCatalogueTuning"];
  if (kind !== "gestalt-style" && kind !== "focus-experiment") return;
  const player = appRoot.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue] [data-kp-editor-animation-player]"
  );
  if (player === null) return;
  applyKpEditorAnimationPresentationTuning(
    player,
    kind,
    select.value
  );
}

function renderAnimationLibraryHostView(): void {
  activeView = "animation-library-host";
  markKpAnimationHostLoading(
    window,
    `editor-animation-library.${selectedEditorAnimationDescriptorId}`
  );
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
  disposeGraph3DWebGL(appRoot);
  appRoot.innerHTML = renderEditorAnimationLibraryHost(
    selectedEditorAnimationDescriptorId
  );
  // This host is a projection of the existing player, so it follows the same
  // hydration order and observes the same initial runtime frame.
  hydrateKpEditorAnimationSurfaces(appRoot);
  hydrateKpEditorAnimationLiveDiagnostics(appRoot);
  hydrateKpEditorAnimationPlayers(appRoot);
  if (
    window.frameElement?.hasAttribute(
      "data-animation-library-frame"
    ) !== true
  ) {
    void mountEditorAnimationLibraryReviewCapture(revision);
  }
}

async function renderAnimationWorkbenchView(): Promise<void> {
  activeView = "animation-workbench";
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
  disposeGraph3DWebGL(appRoot);
  const client = await loadAnimationWorkbenchViewClient();
  if (activeView !== "animation-workbench" || revision !== viewRevision) return;
  const route = readKpSemanticAnimationWorkbenchRoute(
    window.location.search
  );
  const projection = client.renderKpSemanticAnimationWorkbenchView({
    route,
    descriptors: editorAnimationDescriptors
  });
  const selectedEntry = projection.selectedEntry;
  appRoot.innerHTML = projection.html;
  hydrateKpEditorAnimationSurfaces(appRoot);
  hydrateKpEditorAnimationLiveDiagnostics(appRoot);
  hydrateKpEditorAnimationPlayers(appRoot);
  void mountAnimationWorkbenchReviewCapture(revision);
  if (selectedEntry !== undefined) {
    void hydrateAnimationWorkbenchAcceptance(
      appRoot,
      selectedEntry,
      revision
    );
    void hydrateAnimationWorkbenchReview(
      appRoot,
      selectedEntry,
      client.kpSemanticAnimationWorkbenchIndex,
      revision
    );
  }
}

async function updateAnimationWorkbenchRoadmapQuery(
  select: HTMLSelectElement
): Promise<void> {
  const route = readKpSemanticAnimationWorkbenchRoute(
    window.location.search
  );
  let roadmap = route.roadmap;
  switch (select.dataset["action"]) {
    case "sort-animation-workbench-roadmap":
      roadmap = { ...roadmap, sortBy: select.value as typeof roadmap.sortBy };
      break;
    case "set-animation-workbench-roadmap-direction":
      roadmap = {
        ...roadmap,
        direction: select.value as typeof roadmap.direction
      };
      break;
    case "filter-animation-workbench-roadmap-topic":
      {
        const { topic: _topic, ...withoutTopic } = roadmap;
        roadmap = select.value === ""
          ? withoutTopic
          : { ...withoutTopic, topic: select.value };
      }
      break;
    case "filter-animation-workbench-roadmap-horizon":
      {
        const { horizon: _horizon, ...withoutHorizon } = roadmap;
        roadmap = select.value === ""
          ? withoutHorizon
          : {
              ...withoutHorizon,
              horizon: select.value as NonNullable<
                KpSemanticAnimationWorkbenchRoadmapRouteState["horizon"]
              >
            };
      }
      break;
    case "filter-animation-workbench-roadmap-state":
      {
        const { state: _state, ...withoutState } = roadmap;
        roadmap = select.value === ""
          ? withoutState
          : {
              ...withoutState,
              state: select.value as NonNullable<
                KpSemanticAnimationWorkbenchRoadmapRouteState["state"]
              >
            };
      }
      break;
  }
  window.history.replaceState(
    null,
    "",
    writeKpSemanticAnimationWorkbenchRoute(window.location.search, {
      query: route.query,
      ...(route.animationId === undefined
        ? {}
        : { animationId: route.animationId }),
      ...(route.representationId === undefined
        ? {}
        : { representationId: route.representationId }),
      roadmap
    })
  );
  const action = select.dataset["action"];
  await renderAnimationWorkbenchView();
  if (action !== undefined) {
    appRoot
      .querySelector<HTMLSelectElement>(`select[data-action="${action}"]`)
      ?.focus();
  }
}

async function mountAnimationWorkbenchReviewCapture(
  revision: number
): Promise<void> {
  if (loadKpAnimationWorkbenchDevelopmentReview === undefined) return;
  const client = await loadKpAnimationWorkbenchDevelopmentReview();
  if (activeView !== "animation-workbench" || revision !== viewRevision) {
    return;
  }
  disposeAnimationDevelopmentReviewCapture();
  disposeAnimationDevelopmentReview =
    client.mountKpAnimationWorkbenchDevReview(window);
}

async function mountAnimationCatalogueReviewCapture(
  revision: number
): Promise<void> {
  if (loadKpAnimationCatalogueDevelopmentReview === undefined) return;
  const client = await loadKpAnimationCatalogueDevelopmentReview();
  if (activeView !== "animation-catalogue" || revision !== viewRevision) {
    return;
  }
  disposeAnimationDevelopmentReviewCapture();
  disposeAnimationDevelopmentReview =
    client.mountKpAnimationCatalogueDevReview(window);
}

async function mountEditorAnimationLibraryReviewCapture(
  revision: number
): Promise<void> {
  if (loadKpEditorAnimationLibraryDevelopmentReview === undefined) return;
  const client = await loadKpEditorAnimationLibraryDevelopmentReview();
  if (
    (activeView !== "editor" &&
      activeView !== "animation-library-host") ||
    revision !== viewRevision
  ) return;
  disposeAnimationDevelopmentReviewCapture();
  disposeAnimationDevelopmentReview =
    client.mountKpEditorAnimationLibraryDevReview(window);
}

function disposeAnimationDevelopmentReviewCapture(): void {
  disposeAnimationDevelopmentReview?.();
  disposeAnimationDevelopmentReview = undefined;
}

async function hydrateAnimationWorkbenchAcceptance(
  root: ParentNode,
  entry: KpSemanticAnimationWorkbenchIndexEntry,
  revision: number
): Promise<void> {
  const container = root.querySelector<HTMLElement>(
    "[data-kp-animation-workbench-acceptance]"
  );
  if (container === null || entry.lifecycle.playability !== "playable") {
    return;
  }
  try {
    const { animation } = await loadKpAnimationAsset(
      entry.identity.animationId
    );
    if (revision !== viewRevision || !container.isConnected) return;
    container.outerHTML = renderKpAnimationAcceptanceBrief(
      deriveKpAnimationAcceptanceBrief({
        entry,
        lawChecks: animation.checks,
        lawEvidence: "available"
      })
    );
  } catch {
    if (revision !== viewRevision || !container.isConnected) return;
    container.outerHTML = renderKpAnimationAcceptanceBrief(
      deriveKpAnimationAcceptanceBrief({
        entry,
        lawEvidence: "unavailable"
      })
    );
  }
}

async function hydrateAnimationWorkbenchReview(
  root: ParentNode,
  entry: KpSemanticAnimationWorkbenchIndexEntry,
  index: KpSemanticAnimationWorkbenchIndex,
  revision: number
): Promise<void> {
  const reviewContainer = root.querySelector<HTMLElement>(
    "[data-kp-animation-workbench-review]"
  );
  if (reviewContainer === null) return;
  if (loadKpAnimationWorkbenchReviewEvidence === undefined) {
    reviewContainer.outerHTML = renderKpAnimationWorkbenchReviewPanel({
      animationId: entry.identity.animationId,
      state: "unavailable"
    });
    return;
  }
  try {
    const result = await loadKpAnimationWorkbenchReviewEvidence({
      identities: index.entries.map(
        ({ identity }) => identity
      ),
      relationships: index.entries.flatMap(
        ({ representations }) => representations
      )
    });
    if (revision !== viewRevision || !reviewContainer.isConnected) return;
    const projection = result.projections.find(
      (candidate) =>
        candidate.animationId === entry.identity.animationId
    );
    const reviewedEntry: KpSemanticAnimationWorkbenchIndexEntry =
      projection === undefined
        ? entry
        : {
            ...entry,
            lifecycle: {
              ...entry.lifecycle,
              review: projection.state
            },
            review: projection
          };
    reviewContainer.outerHTML = renderKpAnimationWorkbenchReviewPanel({
      animationId: entry.identity.animationId,
      state: "available",
      ...(projection === undefined ? {} : { projection })
    });
    updateAnimationWorkbenchReviewFacet(root, reviewedEntry);
    await refreshAnimationWorkbenchAcceptance(
      root,
      reviewedEntry,
      revision
    );
  } catch {
    if (revision !== viewRevision || !reviewContainer.isConnected) return;
    reviewContainer.outerHTML = renderKpAnimationWorkbenchReviewPanel({
      animationId: entry.identity.animationId,
      state: "error"
    });
  }
}

function updateAnimationWorkbenchReviewFacet(
  root: ParentNode,
  entry: KpSemanticAnimationWorkbenchIndexEntry
): void {
  const facet = root.querySelector<HTMLElement>(
    '[data-kp-animation-workbench-lifecycle-facet="review"]'
  );
  if (facet === null) return;
  facet.dataset["state"] = entry.lifecycle.review;
  facet.setAttribute("aria-label", `Review: ${entry.lifecycle.review}`);
  const value = facet.querySelector("dd");
  if (value !== null) value.textContent = entry.lifecycle.review;
}

async function refreshAnimationWorkbenchAcceptance(
  root: ParentNode,
  entry: KpSemanticAnimationWorkbenchIndexEntry,
  revision: number
): Promise<void> {
  const container = root.querySelector<HTMLElement>(
    "[data-kp-animation-workbench-acceptance]"
  );
  if (container === null) return;
  let lawChecks;
  if (entry.lifecycle.playability === "playable") {
    try {
      lawChecks = (await loadKpAnimationAsset(entry.identity.animationId))
        .animation.checks;
    } catch {
      lawChecks = undefined;
    }
  }
  if (revision !== viewRevision || !container.isConnected) return;
  container.outerHTML = renderKpAnimationAcceptanceBrief(
    deriveKpAnimationAcceptanceBrief({
      entry,
      ...(lawChecks === undefined ? {} : { lawChecks }),
      lawEvidence:
        lawChecks !== undefined
          ? "available"
          : "unavailable"
    })
  );
}

async function filterAnimationWorkbenchFromInput(
  input: HTMLInputElement
): Promise<void> {
  const route = readKpSemanticAnimationWorkbenchRoute(
    window.location.search
  );
  const selectedAnimationId =
    route.animationId ??
    appRoot
      .querySelector<HTMLElement>(
        "[data-kp-animation-workbench-selection]"
      )
      ?.dataset["kpAnimationWorkbenchSelection"];
  window.history.replaceState(
    null,
    "",
    writeKpSemanticAnimationWorkbenchRoute(window.location.search, {
      query: input.value,
      ...(selectedAnimationId === undefined
        ? {}
        : { animationId: selectedAnimationId }),
      ...(route.representationId === undefined
        ? {}
        : { representationId: route.representationId }),
      roadmap: route.roadmap
    })
  );
  const client = await loadAnimationWorkbenchViewClient();
  if (activeView !== "animation-workbench" || !input.isConnected) return;
  const resultsContainer = appRoot.querySelector<HTMLElement>(
    "[data-kp-animation-workbench-results]"
  );
  if (resultsContainer === null) {
    await renderAnimationWorkbenchView();
    return;
  }
  resultsContainer.outerHTML =
    client.renderKpSemanticAnimationWorkbenchQueryResults(
      input.value,
      selectedAnimationId
    );
}

async function selectAnimationWorkbenchResult(
  button: HTMLButtonElement
): Promise<void> {
  const animationId = button.dataset["kpAnimationId"];
  if (animationId === undefined) return;
  const route = readKpSemanticAnimationWorkbenchRoute(
    window.location.search
  );
  window.history.replaceState(
    null,
    "",
    writeKpSemanticAnimationWorkbenchRoute(window.location.search, {
      query: route.query,
      animationId,
      roadmap: route.roadmap
    })
  );
  await renderAnimationWorkbenchView();
  appRoot
    .querySelector<HTMLButtonElement>(
      `[data-action="select-animation-workbench-result"][data-kp-animation-id="${animationId}"]`
    )
    ?.focus();
}

async function selectAnimationWorkbenchRepresentation(
  button: HTMLButtonElement
): Promise<void> {
  const representationId = button.dataset["kpRepresentationId"];
  if (representationId === undefined) return;
  const route = readKpSemanticAnimationWorkbenchRoute(
    window.location.search
  );
  const animationId =
    route.animationId ??
    button
      .closest<HTMLElement>("[data-kp-animation-workbench-selection]")
      ?.dataset["kpAnimationWorkbenchSelection"];
  if (animationId === undefined) return;
  window.history.replaceState(
    null,
    "",
    writeKpSemanticAnimationWorkbenchRoute(window.location.search, {
      query: route.query,
      animationId,
      representationId,
      roadmap: route.roadmap
    })
  );
  await renderAnimationWorkbenchView();
  appRoot
    .querySelector<HTMLButtonElement>(
      `[data-action="select-animation-workbench-representation"][data-kp-representation-id="${representationId}"]`
    )
    ?.focus();
}

async function selectAnimationWorkbenchRoadmapLink(
  button: HTMLButtonElement
): Promise<void> {
  const animationId = button.dataset["kpAnimationId"];
  const representationId = button.dataset["kpRepresentationId"];
  if (animationId === undefined || representationId === undefined) return;
  const route = readKpSemanticAnimationWorkbenchRoute(
    window.location.search
  );
  window.history.replaceState(
    null,
    "",
    writeKpSemanticAnimationWorkbenchRoute(window.location.search, {
      query: "",
      animationId,
      representationId,
      roadmap: route.roadmap
    })
  );
  await renderAnimationWorkbenchView();
}

function loadAnimationWorkbenchViewClient(): Promise<
  AnimationWorkbenchViewClient
> {
  // Workbench search and roadmap projection belong to their optional route,
  // not the shared editor and Animation Library host closure.
  return animationWorkbenchViewClientPromise ??= import(
    "./editor/semantic-animation-workbench-view.ts"
  );
}

function handleAnimationWorkbenchKeydown(event: KeyboardEvent): boolean {
  if (activeView !== "animation-workbench") return false;
  const query = appRoot.querySelector<HTMLInputElement>(
    "[data-kp-animation-workbench-query]"
  );
  const target = event.target;
  const focusShortcut =
    (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
    (event.key === "/" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !isEditableTarget(target));
  if (focusShortcut) {
    event.preventDefault();
    query?.focus();
    query?.select();
    return true;
  }
  if (!(target instanceof HTMLElement)) return false;
  if (target === query) {
    if (event.key === "ArrowDown" || event.key === "Enter") {
      const firstResult = animationWorkbenchButtons(
        "select-animation-workbench-result"
      )[0];
      if (firstResult !== undefined) {
        event.preventDefault();
        firstResult.focus();
        return true;
      }
    }
    return false;
  }
  if (target.dataset["action"] === "select-animation-workbench-result") {
    return moveAnimationWorkbenchFocus(
      event,
      animationWorkbenchButtons("select-animation-workbench-result"),
      query
    );
  }
  if (
    target.dataset["action"] ===
    "select-animation-workbench-representation"
  ) {
    return moveAnimationWorkbenchFocus(
      event,
      animationWorkbenchButtons(
        "select-animation-workbench-representation"
      ),
      query,
      true
    );
  }
  return false;
}

function animationWorkbenchButtons(
  action:
    | "select-animation-workbench-result"
    | "select-animation-workbench-representation"
): readonly HTMLButtonElement[] {
  return [
    ...appRoot.querySelectorAll<HTMLButtonElement>(
      `[data-action="${action}"]`
    )
  ];
}

function moveAnimationWorkbenchFocus(
  event: KeyboardEvent,
  buttons: readonly HTMLButtonElement[],
  query: HTMLInputElement | null,
  horizontal = false
): boolean {
  const target = event.target;
  const currentIndex =
    target instanceof HTMLButtonElement ? buttons.indexOf(target) : -1;
  const previousKey = horizontal ? "ArrowLeft" : "ArrowUp";
  const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
  let nextIndex: number | undefined;
  if (event.key === previousKey) {
    nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  } else if (event.key === nextKey) {
    nextIndex = (currentIndex + 1) % buttons.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = buttons.length - 1;
  } else if (event.key === "Escape") {
    event.preventDefault();
    query?.focus();
    return true;
  }
  if (nextIndex === undefined || buttons[nextIndex] === undefined) {
    return false;
  }
  event.preventDefault();
  buttons[nextIndex]?.focus();
  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

async function renderFtcTutorialView(): Promise<void> {
  activeView = "ftc-tutorial";
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
  disposeGraph3DWebGL(appRoot);
  appRoot.innerHTML = `<main class="kp-ftc-learner-view" data-kp-ftc-learner-loading aria-busy="true"><p>Loading FTC tutorial…</p></main>`;
  const client = await loadFtcTutorialSurfaceClient();
  if (activeView !== "ftc-tutorial" || revision !== viewRevision) return;
  appRoot.innerHTML = `<main class="kp-ftc-learner-view" data-kp-ftc-learner-view>
    <nav><button type="button" data-action="show-editor">Back to editor</button></nav>
    ${client.renderKpFtcTutorialSurface()}
  </main>`;
  client.hydrateKpFtcTutorialSurfaces(appRoot);
}

async function loadFtcTutorialIntoEditor(): Promise<void> {
  const launcher = appRoot.querySelector<HTMLElement>(
    "[data-kp-ftc-editor-launcher]"
  );
  if (launcher === null) return;
  launcher.setAttribute("aria-busy", "true");
  const [editorClient, surfaceClient] = await Promise.all([
    loadFtcTutorialEditorClient(),
    loadFtcTutorialSurfaceClient()
  ]);
  launcher.outerHTML = editorClient.renderKpFtcTutorialEditorSurface();
  surfaceClient.hydrateKpFtcTutorialSurfaces(appRoot);
}

function loadFtcTutorialSurfaceClient(): Promise<FtcTutorialSurfaceClient> {
  ftcTutorialSurfaceClientPromise ??= import("./tutorial/ftc-surface.ts");
  return ftcTutorialSurfaceClientPromise;
}

function loadFtcTutorialEditorClient(): Promise<FtcTutorialEditorClient> {
  ftcTutorialEditorClientPromise ??= import(
    "./editor/ftc-tutorial-editor-surface.ts"
  );
  return ftcTutorialEditorClientPromise;
}

function navigateToView(
  view: "editor" | "ftc-tutorial" | "animation-workbench"
): void {
  const url = new URL(window.location.href);
  if (view === "ftc-tutorial") url.searchParams.set("view", view);
  else if (view === "animation-workbench") {
    url.searchParams.set("view", KP_ANIMATION_WORKBENCH_VIEW);
  }
  else url.searchParams.set("view", "editor");
  window.history.replaceState(null, "", url);
}

function selectEditorAnimation(select: HTMLSelectElement): void {
  selectedEditorAnimationDescriptorId = select.value;
  window.history.replaceState(
    null,
    "",
    kpEditorAnimationSelectionHref({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      descriptorId: selectedEditorAnimationDescriptorId
    })
  );
  renderEditor();
}

function selectEquationAnimation(select: HTMLSelectElement): void {
  selectedEquationAnimationId = select.value;
  renderEditor();
}

async function renderProjectDashboardView(
  query = projectDashboardQuery
): Promise<void> {
  activeView = "dashboard";
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  projectDashboardQuery = query;
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
  disposeGraph3DWebGL(appRoot);
  const client = await loadProjectDashboardClient();
  if (activeView !== "dashboard" || revision !== viewRevision) return;
  appRoot.innerHTML = client.render.renderProjectDashboard(
    client.data.projectDashboardData,
    {
      query,
      selectedAgendaRowId: projectDashboardSelectedAgendaRowId,
      tocOnly: projectDashboardTocOnly,
      selectedKatexFixtureId: projectDashboardSelectedKatexFixtureId
    }
  );
}

function loadProjectDashboardClient(): Promise<{
  readonly data: ProjectDashboardDataClient;
  readonly render: ProjectDashboardRenderClient;
}> {
  if (projectDashboardClientPromise === undefined) {
    // The dashboard imports every showcase family. Keep that authoring surface
    // behind an explicit navigation boundary so the editor starts with only
    // the capability pack selected for playback.
    projectDashboardClientPromise = Promise.all([
      import("./project-dashboard/data.ts"),
      import("./project-dashboard/render.ts")
    ]).then(([data, render]) => ({ data, render }));
  }

  return projectDashboardClientPromise;
}

function selectKatexTransformFixture(button: HTMLButtonElement): void {
  projectDashboardSelectedKatexFixtureId =
    button.dataset["kpKatexTransformFixture"];
  void renderProjectDashboardView(projectDashboardQuery);
}

function selectProjectAgendaRow(button: HTMLButtonElement): void {
  projectDashboardSelectedAgendaRowId = button.dataset["kpSelectAgendaRow"];
  void renderProjectDashboardView(projectDashboardQuery);
}

async function filterProjectDashboardFromInput(
  input: HTMLInputElement
): Promise<void> {
  const client = await loadProjectDashboardClient();
  const query = client.render.getProjectDashboardSearchQuery(input);

  await renderProjectDashboardView(query);

  const nextInput = appRoot.querySelector<HTMLInputElement>(
    "[data-kp-project-dashboard-search]"
  );

  if (nextInput !== null) {
    nextInput.focus();
    nextInput.setSelectionRange(query.length, query.length);
  }
}

function toggleProjectDashboardTocFromInput(input: HTMLInputElement): void {
  projectDashboardTocOnly = input.checked;
  void renderProjectDashboardView(projectDashboardQuery);
}

function openProjectDashboardLiveAnimationPreview(
  link: HTMLAnchorElement,
  event: Event
): void {
  event.preventDefault();

  selectedEquationAnimationId = link.dataset["kpPreviewLiveAnimation"];
  projectDashboardSelectedKatexFixtureId =
    link.dataset["kpPreviewKatexTransformFixture"] ??
    projectDashboardSelectedKatexFixtureId;
  projectDashboardTocOnly = false;
  void renderProjectDashboardView("").then(() => {
    document
      .getElementById("project-dashboard-animation-layout-title")
      ?.scrollIntoView({ block: "start" });
  });
}

function openProjectDashboardEditorAnimation(
  link: HTMLAnchorElement,
  event: Event
): void {
  event.preventDefault();
  const requestedId = link.dataset["kpPreviewEditorAnimation"];
  const selected = selectKpEditorAnimationDescriptor(
    createKpEditorAnimationLibrary(),
    requestedId
  );

  selectedEditorAnimationDescriptorId = selected.id;
  window.history.replaceState(
    null,
    "",
    kpEditorAnimationSelectionHref({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: "#editor-animation-library-title",
      descriptorId: selected.id
    })
  );
  renderEditor();
  document
    .getElementById("editor-animation-library-title")
    ?.scrollIntoView({ block: "start" });
}

function openProjectDashboardGraphSurfacePreview(
  link: HTMLAnchorElement,
  event: Event
): void {
  event.preventDefault();

  const graphId = link.dataset["kpPreviewGraphId"];
  const surfaceMode = link.dataset["kpPreviewGraphSurfaceMode"];

  if (graphId === undefined || !isGraph3DSurfaceMode(surfaceMode)) {
    return;
  }

  editorDocument = updateGraph3DSurfaceMode(
    editorDocument,
    graphId,
    surfaceMode
  );
  renderEditor();
  findGraphPreview(graphId)?.scrollIntoView({ block: "start" });
}

function openProjectDashboardApiCatalogPreview(
  link: HTMLAnchorElement,
  event: Event
): void {
  event.preventDefault();

  const itemId = link.dataset["kpPreviewApiItem"];

  if (itemId === undefined) {
    return;
  }

  renderEditor();

  const item = Array.from(
    appRoot.querySelectorAll<HTMLButtonElement>("[data-kp-api-outline-item]")
  ).find((candidate) => candidate.dataset["kpApiOutlineItem"] === itemId);

  if (item === undefined) {
    return;
  }

  item.closest("details")?.setAttribute("open", "");
  selectApiCatalogItem(item);
  item.scrollIntoView({ block: "center" });
}

function previewApiCatalogItemFromEvent(event: Event): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  const item = event.target.closest<HTMLElement>("[data-kp-api-outline-item]");

  if (item !== null) {
    previewApiCatalogItem(item);
  }
}

function hydrateGraph3DWebGL(
  root: ParentNode,
  objects: readonly KpSemanticObject[],
  previousObjects?: readonly KpSemanticObject[]
): void {
  root.querySelectorAll<HTMLElement>(".graph-webgl").forEach((shell) =>
    hydrateGraph3DWebGLShell(shell, objects, previousObjects)
  );
}

function hydrateGraph3DWebGLShell(
  shell: HTMLElement,
  objects: readonly KpSemanticObject[],
  previousObjects?: readonly KpSemanticObject[]
): void {
  stopGraph3DWebGLVisibilityObserver(shell);

  if (typeof IntersectionObserver === "undefined") {
    hydrateVisibleGraph3DWebGLShell(shell, objects, previousObjects);
    return;
  }

  // The editor keeps rich previews mounted below the fold. Loading Three for a
  // mounted but unseen shell defeats capability splitting and spends GPU setup
  // work before the learner has requested that surface.
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    stopGraph3DWebGLVisibilityObserver(shell);
    hydrateVisibleGraph3DWebGLShell(shell, objects, previousObjects);
  }, { rootMargin: "160px" });
  graph3DWebGLVisibilityObservers.set(shell, observer);
  observer.observe(shell);
}

function disposeGraph3DWebGL(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".graph-webgl")
    .forEach(stopGraph3DWebGLVisibilityObserver);
  graph3DWebGLClient?.disposeGraph3DWebGLShells(root);
}

function disposeGraph3DWebGLShell(shell: HTMLElement): void {
  stopGraph3DWebGLVisibilityObserver(shell);
  graph3DWebGLClient?.disposeGraph3DWebGLShell(shell);
}

function hydrateVisibleGraph3DWebGLShell(
  shell: HTMLElement,
  objects: readonly KpSemanticObject[],
  previousObjects?: readonly KpSemanticObject[]
): void {
  void loadGraph3DWebGLClient().then((client) => {
    if (!shell.isConnected) return;
    client.hydrateGraph3DWebGLShell(shell, objects, { previousObjects });
  });
}

function stopGraph3DWebGLVisibilityObserver(shell: HTMLElement): void {
  graph3DWebGLVisibilityObservers.get(shell)?.disconnect();
  graph3DWebGLVisibilityObservers.delete(shell);
}

function loadGraph3DWebGLClient(): Promise<Graph3DWebGLClient> {
  if (graph3DWebGLClientPromise === undefined) {
    graph3DWebGLClientPromise = import("./rendering/graph-webgl-three.ts").then(
      (client) => {
        graph3DWebGLClient = client;

        return client;
      }
    );
  }

  return graph3DWebGLClientPromise;
}

function updateGraphAzimuthFromInput(input: HTMLInputElement): void {
  const graphId = input.dataset["graphId"];
  const azimuthDegrees = Number(input.value);

  if (graphId === undefined || !Number.isFinite(azimuthDegrees)) {
    return;
  }

  editorDocument = updateGraph3DAzimuth(
    editorDocument,
    graphId,
    azimuthDegrees
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);
  input
    .closest(".graph-control")
    ?.querySelector<HTMLOutputElement>(".graph-control__value")
    ?.replaceChildren(
      document.createTextNode(`${formatNumber(azimuthDegrees)} deg`)
    );
}

function updateGraphOccludedAxisLightnessFromInput(input: HTMLInputElement): void {
  const graphId = input.dataset["graphId"];
  const lightness = Number(input.value);

  if (graphId === undefined || !Number.isFinite(lightness)) {
    return;
  }

  editorDocument = updateGraph3DOccludedAxisLightness(
    editorDocument,
    graphId,
    lightness
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);

  const graph = findGraph3D(graphId);
  if (graph === undefined) {
    return;
  }

  const occludedAxisLightness =
    graph.occludedAxisLightness ?? DEFAULT_OCCLUDED_AXIS_LIGHTNESS;

  input.value = formatNumber(occludedAxisLightness);
  input
    .closest(".graph-control")
    ?.querySelector<HTMLOutputElement>(".graph-control__value")
    ?.replaceChildren(
      document.createTextNode(occludedAxisColor(occludedAxisLightness))
  );
}

function updateGraphLightPresetFromSelect(select: HTMLSelectElement): void {
  const graphId = select.dataset["graphId"];
  const presetId = select.value;

  if (
    graphId === undefined ||
    !isGraph3DLightPresetId(presetId)
  ) {
    return;
  }

  editorDocument = applyGraph3DLightPreset(editorDocument, graphId, presetId);
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);
  syncGraphLightControls(graphId);
}

function updateGraphSurfaceModeFromSelect(select: HTMLSelectElement): void {
  const graphId = select.dataset["graphId"];
  const surfaceMode = select.value;

  if (
    graphId === undefined ||
    !isGraph3DSurfaceMode(surfaceMode)
  ) {
    return;
  }

  const previousObjects = editorDocument.objects;

  editorDocument = updateGraph3DSurfaceMode(
    editorDocument,
    graphId,
    surfaceMode
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId, previousObjects);
  select.dataset["kpGraphSurfaceMode"] = surfaceMode;
  setGraphControlOutput(select, surfaceMode);
}

function updateGraphSurfaceQualityFromSelect(select: HTMLSelectElement): void {
  const graphId = select.dataset["graphId"];
  const surfaceQuality = select.value;

  if (
    graphId === undefined ||
    !isGraph3DSurfaceQuality(surfaceQuality)
  ) {
    return;
  }

  editorDocument = updateGraph3DSurfaceQuality(
    editorDocument,
    graphId,
    surfaceQuality
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);
  select.dataset["kpGraphSurfaceQuality"] = surfaceQuality;
  setGraphControlOutput(select, surfaceQuality);
}

function updateGraphViewModeFromSelect(select: HTMLSelectElement): void {
  const graphId = select.dataset["graphId"];
  const viewMode = select.value;

  if (
    graphId === undefined ||
    !isGraph3DViewMode(viewMode)
  ) {
    return;
  }

  const previousObjects = editorDocument.objects;

  editorDocument = updateGraph3DViewMode(editorDocument, graphId, viewMode);
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId, previousObjects);
  select.dataset["kpGraphViewMode"] = viewMode;
  setGraphControlOutput(select, viewMode);
}

function updateGraphLightSettingFromInput(input: HTMLInputElement): void {
  const graphId = input.dataset["graphId"];
  const setting = input.dataset["kpGraphLightSetting"];
  const value = Number(input.value);

  if (
    graphId === undefined ||
    !isGraph3DLightScalarSetting(setting) ||
    !Number.isFinite(value)
  ) {
    return;
  }

  editorDocument = updateGraph3DLightSetting(
    editorDocument,
    graphId,
    setting,
    value
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);
  syncGraphLightControls(graphId);
}

function updateGraphShadowEnabledFromInput(input: HTMLInputElement): void {
  const graphId = input.dataset["graphId"];

  if (graphId === undefined) {
    return;
  }

  editorDocument = updateGraph3DShadowEnabled(
    editorDocument,
    graphId,
    input.checked
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);
  setGraphControlOutput(input, input.checked ? "on" : "off");
}

function updateGraphShadowOpacityFromInput(input: HTMLInputElement): void {
  const graphId = input.dataset["graphId"];
  const opacity = Number(input.value);

  if (graphId === undefined || !Number.isFinite(opacity)) {
    return;
  }

  editorDocument = updateGraph3DShadowOpacity(
    editorDocument,
    graphId,
    opacity
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);

  const graph = findGraph3D(graphId);
  const nextOpacity = graph?.shadow.opacity;

  if (nextOpacity === undefined) {
    return;
  }

  const value = formatNumber(nextOpacity);
  input.value = value;
  setGraphControlOutput(input, value);
}

function updateSaddleDenominatorFromInput(input: HTMLInputElement): void {
  const graphId = input.dataset["graphId"];
  const surfaceId = input.dataset["surfaceId"];
  const denominator = Number(input.value);

  if (
    graphId === undefined ||
    surfaceId === undefined ||
    !Number.isFinite(denominator)
  ) {
    return;
  }

  editorDocument = updateSaddleSurfaceDenominator(
    editorDocument,
    surfaceId,
    denominator
  );
  syncEditorDocumentDebug();
  renderGraph3DPreview(graphId);

  const surface = findSaddleSurface(surfaceId);
  const nextDenominator = surface?.parameterization?.denominator;

  if (nextDenominator === undefined) {
    return;
  }

  input.value = formatNumber(nextDenominator);
  input
    .closest(".graph-control")
    ?.querySelector<HTMLOutputElement>(".graph-control__value")
    ?.replaceChildren(document.createTextNode(formatNumber(nextDenominator)));
}

function syncEditorDocumentDebug(): void {
  // The editor no longer renders a raw JSON column; keep this hook as the
  // place where future inspector/debug surfaces can mirror document changes.
}

function renderGraph3DPreview(
  graphId: string,
  previousObjects?: readonly KpSemanticObject[]
): void {
  const graph = findGraph3D(graphId);
  const preview = findGraphPreview(graphId);
  const graphContainer = preview?.querySelector<HTMLElement>(".object-preview__graph");

  if (graph === undefined || graphContainer === undefined || graphContainer === null) {
    return;
  }

  const existingShell = graphContainer.querySelector<HTMLElement>(".graph-webgl");

  if (
    existingShell !== null &&
    canReuseGraph3DWebGLShell(existingShell.dataset["kpWebglStatus"])
  ) {
    const fallback = existingShell.querySelector<HTMLElement>(
      ".graph-webgl__fallback"
    );

    if (fallback !== null) {
      // The fallback is hidden while WebGL is ready, but it remains the semantic
      // SVG source for metadata, accessibility, and screenshot verification.
      fallback.innerHTML = renderGraph3DWebGLFallback(
        editorDocument.objects,
        graph
      );
    }

    hydrateGraph3DWebGLShell(
      existingShell,
      editorDocument.objects,
      previousObjects
    );
    return;
  }

  if (existingShell !== null) {
    disposeGraph3DWebGLShell(existingShell);
  }

  graphContainer.innerHTML = renderGraph3DWebGLShell(
    editorDocument.objects,
    graph
  );
  hydrateGraph3DWebGL(graphContainer, editorDocument.objects, previousObjects);
}

function findGraph3D(graphId: string): Graph3DObject | undefined {
  return editorDocument.objects.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graphId
  );
}

function findSaddleSurface(surfaceId: string): Surface3DObject | undefined {
  return editorDocument.objects.find(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" &&
      object.id === surfaceId &&
      object.parameterization?.kind === "saddle"
  );
}

function syncGraphLightControls(graphId: string): void {
  const graph = findGraph3D(graphId);
  const preview = findGraphPreview(graphId);

  if (graph === undefined || preview === undefined) {
    return;
  }

  preview
    .querySelectorAll<HTMLInputElement>('[data-action="set-graph-light-setting"]')
    .forEach((input) => {
      const setting = input.dataset["kpGraphLightSetting"];

      if (!isGraph3DLightScalarSetting(setting)) {
        return;
      }

      const value = formatNumber(graph.light[setting]);
      input.value = value;
      setGraphControlOutput(input, value);
    });

  const selectedPreset = findGraph3DLightPresetId(graph.light) ?? "custom";
  const select = preview.querySelector<HTMLSelectElement>(
    '[data-action="set-graph-light-preset"]'
  );

  if (select !== null) {
    select.value = selectedPreset;
    select.dataset["kpGraphLightPreset"] = selectedPreset;
    setGraphControlOutput(select, selectedPreset);
  }
}

function setGraphControlOutput(
  control: HTMLInputElement | HTMLSelectElement,
  value: string
): void {
  control
    .closest(".graph-control")
    ?.querySelector<HTMLOutputElement>(".graph-control__value")
    ?.replaceChildren(document.createTextNode(value));
}

function findGraphPreview(graphId: string): HTMLElement | undefined {
  return Array.from(appRoot.querySelectorAll<HTMLElement>(".object-preview")).find(
    (element) =>
      element.dataset["kpObject"] === graphId &&
      element.dataset["kpType"] === "graph-3d"
  );
}

function isGraph3DLightPresetId(
  value: string | undefined
): value is Graph3DLightPresetId {
  return value === "studio" || value === "raking" || value === "flat";
}

function isGraph3DLightScalarSetting(
  value: string | undefined
): value is Graph3DLightScalarSetting {
  return (
    value === "ambient" ||
    value === "diffuse" ||
    value === "depthHaze" ||
    value === "specular" ||
    value === "rim"
  );
}

function isGraph3DSurfaceMode(
  value: string | undefined
): value is typeof GRAPH_3D_SURFACE_MODE_IDS[number] {
  return (
    value !== undefined &&
    GRAPH_3D_SURFACE_MODE_IDS.includes(
      value as typeof GRAPH_3D_SURFACE_MODE_IDS[number]
    )
  );
}

function isGraph3DSurfaceQuality(
  value: string | undefined
): value is Graph3DSurfaceQuality {
  return (
    value !== undefined &&
    GRAPH_3D_SURFACE_QUALITY_IDS.includes(value as Graph3DSurfaceQuality)
  );
}

function isGraph3DViewMode(
  value: string | undefined
): value is Graph3DViewMode {
  return (
    value !== undefined &&
    GRAPH_3D_VIEW_MODE_IDS.includes(value as Graph3DViewMode)
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}
