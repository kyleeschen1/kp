import "./styles.css";
import "./editor/animation-catalogue-shell.css";

import {
  renderKpAnimationCatalogueBootstrap
} from "./editor/animation-catalogue-bootstrap.ts";
import {
  deriveKpAnimationCatalogueHealth
} from "./editor/animation-catalogue-health.ts";
import {
  observeKpAnimationCatalogueHost
} from "./editor/animation-catalogue-host-observation.ts";
import {
  deriveKpAnimationCatalogueHostOutcome
} from "./editor/animation-catalogue-host-outcome.ts";
import {
  createKpAnimationCatalogueProjection
} from "./editor/animation-catalogue-projection.ts";
import type {
  KpAnimationCatalogueEntry
} from "./editor/animation-catalogue-projection.ts";
import {
  decideKpAnimationCatalogueLinkNavigation,
  resolveKpAnimationCatalogueHistoryNavigation
} from "./editor/animation-catalogue-navigation.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "./editor/animation-catalogue-route.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "./editor/animation-catalogue-selection.ts";
import {
  applyKpAnimationCatalogueObservedHealth,
  renderKpAnimationCatalogueInspector,
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
import type { KpDocument } from "./semantic/document.ts";
import {
  disposeKpEditorAnimationPlayers,
  hydrateKpEditorAnimationPlayers,
  KP_EDITOR_ANIMATION_FRAME_EVENT,
  KP_EDITOR_ANIMATION_LOAD_EVENT,
  applyKpEditorAnimationPresentationTuning,
  pauseKpEditorAnimationPlayers,
  replaceKpEditorAnimationPlaybackAsset
} from "./editor/animation-player-controller.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation,
  readKpEconomicsEquilibriumParameters,
  writeKpEconomicsEquilibriumParameters
} from "./editor/economics-equilibrium-parameters.ts";
import {
  economicsEquilibriumAnimationId
} from "./animation/economics-equilibrium-adapter.ts";
import {
  createKpConstantForceWorkEnergyParameterState,
  createParameterizedConstantForceWorkEnergyAnimation,
  readKpConstantForceWorkEnergyParameters,
  writeKpConstantForceWorkEnergyParameters
} from "./editor/constant-force-work-energy-parameters.ts";
import {
  constantForceWorkEnergyAnimationId
} from "./animation/constant-force-work-energy-adapter.ts";
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
  createKpEditorAnimationPlayerState
} from "./editor/animation-player-state.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./editor/animation-player-shell.ts";
import { registerKpEditorDiagramSvgAdapter } from "./editor/diagram-svg-adapter.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities,
  type KpEditorSelectedSurfaceCapability
} from "./editor/selected-surface-capability.ts";
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
import {
  kpVerifiedGeneratedLinearSolveAnimationId
} from "./tutorial/verified-generated-linear-solve-identity.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Expected #app root element to exist.");
}

const appRoot = app;
let editorDocument: KpDocument;
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
type ProjectDashboardDataClient = typeof import("./project-dashboard/data.ts");
type ProjectDashboardRenderClient = typeof import("./project-dashboard/render.ts");
type FtcTutorialSurfaceClient = typeof import("./tutorial/ftc-surface.ts");
type FtcTutorialEditorClient = typeof import("./editor/ftc-tutorial-editor-surface.ts");
type AnimationWorkbenchViewClient = typeof import(
  "./editor/semantic-animation-workbench-view.ts"
);
type GeneratedLinearSolveReaderClient = typeof import(
  "./editor/verified-generated-linear-solve-reader.ts"
);
type EditorClient = typeof import("./editor/editor.ts");
type ApiCatalogClient = typeof import("./editor/api-catalog.ts");
type AnimationDiagnosticsCapabilityClient = typeof import(
  "./editor/animation-diagnostics-capability.ts"
);
type Graph3DEditorControllerClient = typeof import(
  "./editor/graph-3d-editor-controller.ts"
);
type Graph3DEditorController = ReturnType<
  Graph3DEditorControllerClient["createKpEditorGraph3DController"]
>;
type EquationSurfaceCapabilityClient = typeof import(
  "./editor/equation-surface-capability.ts"
);
type GraphSvgSurfaceCapabilityClient = typeof import(
  "./editor/graph-svg-surface-capability.ts"
);
type Graph3DSurfaceCapabilityClient = typeof import(
  "./editor/graph-3d-surface-capability.ts"
);
type ProgrammingSurfaceCapabilityClient = typeof import(
  "./editor/programming-surface-capability.ts"
);
let projectDashboardClientPromise: Promise<{
  readonly data: ProjectDashboardDataClient;
  readonly render: ProjectDashboardRenderClient;
}> | undefined;
let ftcTutorialSurfaceClientPromise: Promise<FtcTutorialSurfaceClient> | undefined;
let ftcTutorialEditorClientPromise: Promise<FtcTutorialEditorClient> | undefined;
let animationWorkbenchViewClientPromise:
  | Promise<AnimationWorkbenchViewClient>
  | undefined;
let generatedLinearSolveReaderClientPromise:
  | Promise<GeneratedLinearSolveReaderClient>
  | undefined;
let editorClientPromise: Promise<EditorClient> | undefined;
let apiCatalogClientPromise: Promise<ApiCatalogClient> | undefined;
let animationDiagnosticsCapabilityPromise:
  | Promise<AnimationDiagnosticsCapabilityClient>
  | undefined;
let graph3DEditorControllerClientPromise:
  | Promise<Graph3DEditorControllerClient>
  | undefined;
let graph3DEditorController: Graph3DEditorController | undefined;
let equationSurfaceCapabilityPromise:
  | Promise<EquationSurfaceCapabilityClient>
  | undefined;
let graphSvgSurfaceCapabilityPromise:
  | Promise<GraphSvgSurfaceCapabilityClient>
  | undefined;
let graph3DSurfaceCapabilityPromise:
  | Promise<Graph3DSurfaceCapabilityClient>
  | undefined;
let programmingSurfaceCapabilityPromise:
  | Promise<ProgrammingSurfaceCapabilityClient>
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
let disposeAnimationCatalogueHostEvidence:
  | (() => void)
  | undefined;
declare global {
  interface Window {
    __kpEquationMotionSetProgress?: (
      demo: HTMLElement,
      progress: number
    ) => void;
  }
}

window.__kpEquationMotionSetProgress = setEquationMotionProgress;
registerKpEditorDiagramSvgAdapter();

renderViewFromLocation();

window.addEventListener("popstate", () => {
  const decision = resolveKpAnimationCatalogueHistoryNavigation({
    projection: animationCatalogueProjection,
    href: window.location.href
  });
  const shell = appRoot.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue]"
  );
  if (
    decision.action === "select" &&
    activeView === "animation-catalogue" &&
    shell !== null
  ) {
    void renderAnimationCatalogueSelectionInShell({
      shell,
      entry: decision.entry,
      playhead: decision.playhead
    });
    return;
  }
  renderViewFromLocation();
});

function renderViewFromLocation(): void {
  const requestedView = new URLSearchParams(window.location.search).get(
    "view"
  );
  if (requestedView === "ftc-tutorial") {
    void renderFtcTutorialView();
  } else if (requestedView === "animation-library-host") {
    void renderAnimationLibraryHostView();
  } else if (
    readKpSemanticAnimationWorkbenchRoute(window.location.search).active
  ) {
    void renderAnimationWorkbenchView();
  } else if (readKpAnimationCatalogueRoute(window.location.search).active) {
    void renderAnimationCatalogueView();
  } else {
    void renderEditor();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseKpEditorAnimationPlayers(appRoot);
});

window.addEventListener("pagehide", () => {
  disposeAnimationDevelopmentReviewCapture();
  disposeAnimationCatalogueHostEvidenceObserver();
  disposeKpEditorAnimationPlayers(appRoot);
  disposeKpEditorEquationStageHotPathCaches(appRoot);
});

appRoot.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const catalogueLink = event.target.closest<HTMLAnchorElement>(
    "a.kp-animation-catalogue-shell__result-link"
  );
  const catalogueShell = catalogueLink?.closest<HTMLElement>(
    "[data-kp-animation-catalogue]"
  );
  const currentAnimationId =
    catalogueShell?.dataset["kpAnimationCatalogueSelection"];
  if (
    activeView === "animation-catalogue" &&
    catalogueLink !== null && catalogueLink !== undefined &&
    catalogueShell !== null && catalogueShell !== undefined &&
    currentAnimationId !== undefined
  ) {
    const decision = decideKpAnimationCatalogueLinkNavigation({
      projection: animationCatalogueProjection,
      currentAnimationId,
      currentHref: window.location.href,
      href: catalogueLink.href,
      event: {
        defaultPrevented: event.defaultPrevented,
        button: event.button,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      },
      target: catalogueLink.target,
      download: catalogueLink.hasAttribute("download")
    });
    if (decision.action === "native") return;
    event.preventDefault();
    if (decision.action === "stay") return;
    window.history.pushState(null, "", decision.href);
    void renderAnimationCatalogueSelectionInShell({
      shell: catalogueShell,
      entry: decision.entry,
      playhead: decision.playhead
    });
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
    void openProjectDashboardGraphSurfacePreview(graphSurfaceLink, event);
    return;
  }

  const apiCatalogLink = event.target.closest<HTMLAnchorElement>(
    'a[data-kp-preview-link="api-catalog-item"]'
  );

  if (apiCatalogLink !== null) {
    void openProjectDashboardApiCatalogPreview(apiCatalogLink, event);
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
      void selectApiCatalogItemOnDemand(button);
      return;
    case "toggle-animation-catalogue-overlay":
      toggleAnimationCatalogueOverlay(button);
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
  if (event.key === "Escape" && closeAnimationCatalogueOverlay(event.target)) {
    event.preventDefault();
    return;
  }
  handleEquationMotionDemoKeydown(event);
});

document.addEventListener("keydown", (event) => {
  handleAnimationWorkbenchKeydown(event);
});

appRoot.addEventListener("mouseover", (event) => {
  void previewApiCatalogItemFromEvent(event);
});

appRoot.addEventListener("focusin", (event) => {
  void previewApiCatalogItemFromEvent(event);
});

appRoot.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLSelectElement)) {
    return;
  }

  if (graph3DEditorController?.handleChange(event.target) === true) {
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

  if (graph3DEditorController?.handleInput(event.target) === true) return;

  switch (event.target.dataset["action"]) {
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
    case "set-economics-demand-intercept":
      updateEconomicsDemandInterceptFromInput(event.target);
      return;
    case "set-physics-net-force":
      updatePhysicsNetForceFromInput(event.target);
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

async function renderEditor(): Promise<void> {
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
  const [client, graph3DController] = await Promise.all([
    loadEditorClient(),
    loadGraph3DEditorController()
  ]);
  if (activeView !== "editor" || revision !== viewRevision) return;
  editorDocument ??= client.createInitialEditorDocument();
  appRoot.innerHTML = client.renderEditorDocument(editorDocument, {
    equationAnimationId: selectedEquationAnimationId,
    editorAnimationDescriptorId: selectedEditorAnimationDescriptorId
  });
  // Static stage labels are in the document before optional typography loads.
  // Player hydration waits so its one initial frame reaches the selected
  // adapter instead of racing a missing registration.
  void hydrateSelectedAnimationPlayers(appRoot, revision, "editor");
  hydrateEquationMotionDemos(appRoot);
  graph3DController.hydrate(appRoot, editorDocument.objects);
  void mountEditorAnimationLibraryReviewCapture(revision);
}

async function renderAnimationCatalogueView(): Promise<void> {
  activeView = "animation-catalogue";
  const revision = ++viewRevision;
  disposeAnimationDevelopmentReviewCapture();
  disposeAnimationCatalogueHostEvidenceObserver();
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
    const prepared = await prepareAnimationCatalogueSelection({
      entry,
      playhead: route.playhead
    });
    if (activeView !== "animation-catalogue" || revision !== viewRevision) {
      return;
    }
    appRoot.innerHTML = renderKpAnimationCatalogueShell({
      entry,
      health: prepared.health,
      entries: animationCatalogueProjection.entries,
      descriptor: prepared.descriptor,
      player: prepared.player,
      economicsParameters: prepared.economicsParameters,
      physicsParameters: prepared.physicsParameters,
      readerCompanion: prepared.readerCompanion
    });
    const shell = appRoot.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    if (shell === null) {
      throw new Error("Catalogue shell did not mount.");
    }
    hydrateAnimationCatalogueSelection({
      shell,
      entry,
      hostability: prepared.hostability,
      animation: prepared.animation
    });
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

async function renderAnimationCatalogueSelectionInShell(input: {
  readonly shell: HTMLElement;
  readonly entry: KpAnimationCatalogueEntry;
  readonly playhead?: number | undefined;
}): Promise<void> {
  const revision = ++viewRevision;
  const stage = input.shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-stage]"
  );
  const inspector = input.shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-region=\"inspector\"]"
  );
  const results = input.shell.querySelector<HTMLOListElement>(
    "[data-kp-animation-catalogue-results]"
  );
  const search = input.shell.querySelector<HTMLInputElement>(
    '[data-action="filter-animation-catalogue"]'
  );
  const inspectorMode = input.shell.querySelector<HTMLSelectElement>(
    '[data-action="select-animation-catalogue-inspector"]'
  )?.value;
  const focusSnapshot = captureAnimationCatalogueFocus(input.shell);
  const resultsViewport = results?.closest<HTMLElement>(
    ".kp-animation-catalogue-shell__rail-results"
  );
  const resultsScrollTop = resultsViewport?.scrollTop;
  if (stage === null || inspector === null || results === null) {
    window.location.assign(window.location.href);
    return;
  }

  markKpAnimationHostLoading(window, `catalogue.${input.entry.animationId}`);
  disposeAnimationCatalogueHostEvidenceObserver();
  disposeKpEditorAnimationPlayers(stage);
  disposeKpEditorEquationStageHotPathCaches(stage);
  disposeGraph3DWebGL(stage);
  setAnimationCatalogueStageMessage(
    stage,
    `Loading ${input.entry.title}…`,
    "loading"
  );

  try {
    const prepared = await prepareAnimationCatalogueSelection(input);
    if (
      activeView !== "animation-catalogue" ||
      revision !== viewRevision ||
      !input.shell.isConnected
    ) return;

    input.shell.dataset["kpAnimationCatalogueSelection"] =
      input.entry.animationId;
    input.shell.dataset["kpAnimationCatalogueSelectedHealth"] =
      prepared.health.status;
    input.shell.dataset["kpAnimationCatalogueHumanDisposition"] =
      input.entry.humanDisposition;
    if (prepared.economicsParameters === undefined) {
      delete input.shell.dataset["kpEconomicsDemandIntercept"];
    } else {
      input.shell.dataset["kpEconomicsDemandIntercept"] = String(
        prepared.economicsParameters.demandInterceptAfter
      );
    }
    if (prepared.physicsParameters === undefined) {
      delete input.shell.dataset["kpPhysicsNetForceNewtons"];
    } else {
      input.shell.dataset["kpPhysicsNetForceNewtons"] = String(
        prepared.physicsParameters.netForceNewtons
      );
    }
    delete input.shell.dataset["kpAnimationCatalogueHostOutcome"];
    stage.removeAttribute("aria-busy");
    stage.dataset["kpAnimationCatalogueStageState"] = "selected";
    stage.innerHTML = renderKpEditorAnimationPlayerShell({
      descriptor: prepared.descriptor,
      player: prepared.player,
      chrome: "catalogue"
    });
    inspector.innerHTML = renderKpAnimationCatalogueInspector({
      entry: input.entry,
      health: prepared.health,
      economicsParameters: prepared.economicsParameters,
      physicsParameters: prepared.physicsParameters,
      readerCompanion: prepared.readerCompanion
    });
    const nextInspectorSelect = inspector.querySelector<HTMLSelectElement>(
      '[data-action="select-animation-catalogue-inspector"]'
    );
    if (
      nextInspectorSelect !== null &&
      (inspectorMode === "details" || inspectorMode === "parameters" ||
        inspectorMode === "tuning" || inspectorMode === "explanation")
    ) {
      nextInspectorSelect.value = inspectorMode;
      selectAnimationCatalogueInspectorFromSelect(nextInspectorSelect);
    }
    results.outerHTML = renderKpAnimationCatalogueResults({
      entries: animationCatalogueProjection.entries,
      selectedAnimationId: input.entry.animationId,
      selectedHealth: prepared.health,
      query: search?.value ?? ""
    });
    if (resultsViewport !== null && resultsViewport !== undefined) {
      resultsViewport.scrollTop = resultsScrollTop ?? 0;
    }
    hydrateAnimationCatalogueSelection({
      shell: input.shell,
      entry: input.entry,
      hostability: prepared.hostability,
      animation: prepared.animation
    });
    restoreAnimationCatalogueFocus(input.shell, focusSnapshot);
    if (disposeAnimationDevelopmentReview === undefined) {
      void mountAnimationCatalogueReviewCapture(revision);
    }
  } catch (error: unknown) {
    if (
      activeView !== "animation-catalogue" ||
      revision !== viewRevision ||
      !input.shell.isConnected
    ) return;
    const message = error instanceof Error
      ? error.message
      : "The selected catalogue asset failed to load.";
    setAnimationCatalogueStageMessage(stage, message, "error");
    markKpAnimationHostFailed(window, message);
  }
}

type AnimationCatalogueFocusSnapshot = {
  readonly element: HTMLElement;
  readonly target:
    | { readonly kind: "player" }
    | { readonly kind: "inspector-view" }
    | { readonly kind: "tuning"; readonly tuning: string }
    | { readonly kind: "row"; readonly animationId: string };
};

function captureAnimationCatalogueFocus(
  shell: HTMLElement
): AnimationCatalogueFocusSnapshot | undefined {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement) || !shell.contains(element)) {
    return undefined;
  }
  if (element.closest("[data-kp-editor-animation-player]") !== null) {
    return { element, target: { kind: "player" } };
  }
  if (element.matches('[data-action="select-animation-catalogue-inspector"]')) {
    return { element, target: { kind: "inspector-view" } };
  }
  const tuning = element.dataset["kpAnimationCatalogueTuning"];
  if (tuning !== undefined) {
    return { element, target: { kind: "tuning", tuning } };
  }
  const row = element.closest<HTMLElement>(
    "[data-kp-animation-catalogue-row]"
  );
  const animationId = row?.dataset["kpAnimationCatalogueRow"];
  return animationId === undefined
    ? undefined
    : { element, target: { kind: "row", animationId } };
}

function restoreAnimationCatalogueFocus(
  shell: HTMLElement,
  snapshot: AnimationCatalogueFocusSnapshot | undefined
): void {
  if (
    snapshot === undefined || snapshot.element.isConnected ||
    (document.activeElement !== document.body &&
      document.activeElement !== appRoot)
  ) return;
  const target = snapshot.target.kind === "player"
    ? shell.querySelector<HTMLElement>("[data-kp-editor-animation-player]")
    : snapshot.target.kind === "inspector-view"
    ? shell.querySelector<HTMLElement>(
      '[data-action="select-animation-catalogue-inspector"]'
    )
    : snapshot.target.kind === "tuning"
    ? shell.querySelector<HTMLElement>(
      `[data-kp-animation-catalogue-tuning="${snapshot.target.tuning}"]`
    )
    : shell.querySelector<HTMLElement>(
      `[data-kp-animation-catalogue-row="${snapshot.target.animationId}"] a`
    );
  target?.focus({ preventScroll: true });
}

async function prepareAnimationCatalogueSelection(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly playhead?: number | undefined;
}) {
  const loaded = await loadKpAnimationAsset(input.entry.animationId);
  if (
    loaded.animation.id !== input.entry.animationId ||
    loaded.packId !== input.entry.packId
  ) {
    throw new Error(
      `Loaded catalogue asset ${loaded.animation.id} from ${loaded.packId}; ` +
      `expected ${input.entry.animationId} from ${input.entry.packId}.`
    );
  }
  const descriptor = editorAnimationDescriptors.find(
    ({ id }) => id === input.entry.primaryDescriptorId
  );
  if (descriptor === undefined) {
    throw new Error(
      `Catalogue entry ${input.entry.animationId} is missing descriptor ` +
      `${input.entry.primaryDescriptorId}.`
    );
  }
  const economicsParameters = input.entry.animationId ===
      economicsEquilibriumAnimationId
    ? readKpEconomicsEquilibriumParameters(window.location.search)
    : undefined;
  const physicsParameters = input.entry.animationId ===
      constantForceWorkEnergyAnimationId
    ? readKpConstantForceWorkEnergyParameters(window.location.search)
    : undefined;
  const animation = economicsParameters !== undefined
    ? createParameterizedEconomicsEquilibriumAnimation(economicsParameters)
        .animation
    : physicsParameters !== undefined
      ? createParameterizedConstantForceWorkEnergyAnimation(physicsParameters)
          .animation
      : loaded.animation;
  const readerCompanion = input.entry.animationId ===
      kpVerifiedGeneratedLinearSolveAnimationId
    ? (await loadGeneratedLinearSolveReaderClient())
        .createKpVerifiedGeneratedLinearSolveReaderCompanion()
    : undefined;
  const catalog = loaded.catalog.some(({ id }) => id === animation.id)
    ? loaded.catalog.map((candidate) =>
        candidate.id === animation.id ? animation : candidate
      )
    : [...loaded.catalog, animation];
  const player = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    progress: input.playhead ?? 0
  });
  await loadSelectedSurfaceCapabilities({
    animationId: player.animationId,
    slotKinds: player.surface.slotKinds
  });
  const hostability = inspectKpAnimationCatalogueSurfaceHostability({
    state: player,
    registry: kpEditorAnimationSurfaceAdapterRegistry
  });
  return {
    animation,
    descriptor,
    player,
    economicsParameters,
    physicsParameters,
    readerCompanion,
    hostability,
    health: deriveKpAnimationCatalogueHealth({
      hostability,
      hostObservation: { status: "not-observed" }
    })
  } as const;
}

function hydrateAnimationCatalogueSelection(input: {
  readonly shell: HTMLElement;
  readonly entry: KpAnimationCatalogueEntry;
  readonly hostability: ReturnType<
    typeof inspectKpAnimationCatalogueSurfaceHostability
  >;
  readonly animation: Awaited<
    ReturnType<typeof loadKpAnimationAsset>
  >["animation"];
}): void {
  disposeAnimationCatalogueHostEvidenceObserver();
  // Surface listeners attach first so the controller's initial runtime frame
  // is observable without an extra synthetic playback tick.
  hydrateKpEditorAnimationSurfaces(input.shell);
  const cataloguePlayer = input.shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
  );
  const catalogueStage = input.shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-stage]"
  );
  let hostEvidenceObserver: MutationObserver | undefined;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    hostEvidenceObserver?.disconnect();
    cataloguePlayer?.removeEventListener(
      KP_EDITOR_ANIMATION_FRAME_EVENT,
      publishTerminalHostEvidence
    );
    if (disposeAnimationCatalogueHostEvidence === dispose) {
      disposeAnimationCatalogueHostEvidence = undefined;
    }
  };
  const publishTerminalHostEvidence = () => {
    if (
      input.shell.dataset["kpAnimationCatalogueSelection"] !==
        input.entry.animationId
    ) return;
    const hostObservation = observeKpAnimationCatalogueHost(input.shell);
    const hostOutcome = deriveKpAnimationCatalogueHostOutcome({
      entry: input.entry,
      hostability: input.hostability,
      hostObservation
    });
    if (hostOutcome === undefined) return;
    dispose();
    applyKpAnimationCatalogueObservedHealth({
      shell: input.shell,
      entry: input.entry,
      health: deriveKpAnimationCatalogueHealth({
        hostability: input.hostability,
        hostObservation
      })
    });
    input.shell.dataset["kpAnimationCatalogueHostOutcome"] =
      hostOutcome.status;
  };
  if (catalogueStage !== null) {
    // Generic adapters paint synchronously while specialized adapters may
    // settle after font measurement. One bounded observer covers both.
    hostEvidenceObserver = new MutationObserver(publishTerminalHostEvidence);
    hostEvidenceObserver.observe(catalogueStage, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
  cataloguePlayer?.addEventListener(
    KP_EDITOR_ANIMATION_FRAME_EVENT,
    publishTerminalHostEvidence,
    { once: true }
  );
  disposeAnimationCatalogueHostEvidence = dispose;
  hydrateKpEditorAnimationPlayers(input.shell, {
    animationOverrides: [input.animation]
  });
}

function disposeAnimationCatalogueHostEvidenceObserver(): void {
  disposeAnimationCatalogueHostEvidence?.();
  disposeAnimationCatalogueHostEvidence = undefined;
}

function setAnimationCatalogueStageMessage(
  stage: HTMLElement,
  message: string,
  state: "loading" | "error"
): void {
  stage.dataset["kpAnimationCatalogueStageState"] = state;
  stage.setAttribute("aria-busy", String(state === "loading"));
  const status = document.createElement("p");
  status.className = "kp-animation-catalogue-shell__stage-status";
  status.setAttribute("role", state === "error" ? "alert" : "status");
  status.textContent = message;
  stage.replaceChildren(status);
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

function toggleAnimationCatalogueOverlay(button: HTMLButtonElement): void {
  const shell = button.closest<HTMLElement>("[data-kp-animation-catalogue]");
  const target = button.dataset["kpAnimationCatalogueOverlayTarget"];
  if (
    shell === null ||
    (target !== "rail" && target !== "inspector")
  ) return;
  const next = shell.dataset["kpAnimationCatalogueOverlay"] === target
    ? undefined
    : target;
  if (next === undefined) {
    delete shell.dataset["kpAnimationCatalogueOverlay"];
  } else {
    shell.dataset["kpAnimationCatalogueOverlay"] = next;
  }
  shell.querySelectorAll<HTMLButtonElement>(
    '[data-action="toggle-animation-catalogue-overlay"]'
  ).forEach((candidate) => {
    candidate.setAttribute(
      "aria-expanded",
      String(candidate.dataset["kpAnimationCatalogueOverlayTarget"] === next)
    );
  });
  if (next !== undefined) {
    const panel = shell.querySelector<HTMLElement>(
      next === "rail"
        ? "#kp-animation-catalogue-rail"
        : "#kp-animation-catalogue-inspector"
    );
    const focusTarget = panel?.querySelector<HTMLElement>(
      "input, select, button, a"
    );
    // Defer past the button's native click focus and the off-canvas visibility
    // change; otherwise the browser restores focus to the trigger.
    setTimeout(() => focusTarget?.focus(), 0);
  }
}

function closeAnimationCatalogueOverlay(
  target: EventTarget | null
): boolean {
  if (!(target instanceof Element)) return false;
  const shell = target.closest<HTMLElement>("[data-kp-animation-catalogue]");
  if (
    shell === null ||
    shell.dataset["kpAnimationCatalogueOverlay"] === undefined
  ) return false;
  const openTarget = shell.dataset["kpAnimationCatalogueOverlay"];
  delete shell.dataset["kpAnimationCatalogueOverlay"];
  shell.querySelectorAll<HTMLButtonElement>(
    '[data-action="toggle-animation-catalogue-overlay"]'
  ).forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    // On narrow screens the closed panel is inert, so restore focus to its
    // stage-level trigger instead of leaving focus inside hidden content.
    if (button.dataset["kpAnimationCatalogueOverlayTarget"] === openTarget) {
      button.focus();
    }
  });
  return true;
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
      select.value !== "tuning" &&
      select.value !== "explanation")
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

function updateEconomicsDemandInterceptFromInput(
  input: HTMLInputElement
): void {
  const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
  if (
    shell?.dataset["kpAnimationCatalogueSelection"] !==
      economicsEquilibriumAnimationId
  ) return;
  const player = shell.querySelector<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  if (player === null) return;

  const state = createKpEconomicsEquilibriumParameterState(input.value);
  const parameterized =
    createParameterizedEconomicsEquilibriumAnimation(state);
  replaceKpEditorAnimationPlaybackAsset(player, parameterized.animation);
  input.value = String(state.demandInterceptAfter);
  shell.dataset["kpEconomicsDemandIntercept"] = String(
    state.demandInterceptAfter
  );
  input.closest("[data-kp-economics-parameters]")
    ?.querySelector<HTMLOutputElement>(
      "[data-kp-economics-demand-intercept-output]"
    )
    ?.replaceChildren(document.createTextNode(String(state.demandInterceptAfter)));

  const search = writeKpEconomicsEquilibriumParameters({
    search: window.location.search,
    state
  });
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${search}${window.location.hash}`
  );
}

function updatePhysicsNetForceFromInput(input: HTMLInputElement): void {
  const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
  if (
    shell?.dataset["kpAnimationCatalogueSelection"] !==
      constantForceWorkEnergyAnimationId
  ) return;
  const player = shell.querySelector<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  if (player === null) return;

  const state = createKpConstantForceWorkEnergyParameterState(input.value);
  const parameterized =
    createParameterizedConstantForceWorkEnergyAnimation(state);
  replaceKpEditorAnimationPlaybackAsset(player, parameterized.animation);
  input.value = String(state.netForceNewtons);
  shell.dataset["kpPhysicsNetForceNewtons"] = String(
    state.netForceNewtons
  );
  input.closest("[data-kp-physics-work-energy-parameters]")
    ?.querySelector<HTMLOutputElement>(
      "[data-kp-physics-net-force-output]"
    )
    ?.replaceChildren(
      document.createTextNode(`${state.netForceNewtons} N`)
    );

  const search = writeKpConstantForceWorkEnergyParameters({
    search: window.location.search,
    state
  });
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${search}${window.location.hash}`
  );
}

async function renderAnimationLibraryHostView(): Promise<void> {
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
  const client = await loadEditorClient();
  if (activeView !== "animation-library-host" || revision !== viewRevision) {
    return;
  }
  appRoot.innerHTML = client.renderEditorAnimationLibraryHost(
    selectedEditorAnimationDescriptorId
  );
  void hydrateSelectedAnimationPlayers(
    appRoot,
    revision,
    "animation-library-host"
  );
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
  await loadSelectedSurfaceCapabilitiesForRoot(appRoot);
  if (activeView !== "animation-workbench" || revision !== viewRevision) return;
  hydrateKpEditorAnimationSurfaces(appRoot);
  await hydrateOptionalAnimationDiagnostics(appRoot);
  if (activeView !== "animation-workbench" || revision !== viewRevision) return;
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

function loadGeneratedLinearSolveReaderClient(): Promise<
  GeneratedLinearSolveReaderClient
> {
  // Explanation compilation and inline KaTeX belong to the selected generated
  // artifact; unrelated catalogue rows must not inherit that closure.
  return generatedLinearSolveReaderClientPromise ??= import(
    "./editor/verified-generated-linear-solve-reader.ts"
  );
}

function loadEditorClient(): Promise<EditorClient> {
  // The editor renderer owns equation previews and KaTeX. Catalogue selections
  // must not import it merely because both views share this entry module.
  return editorClientPromise ??= import("./editor/editor.ts");
}

async function loadGraph3DEditorController(): Promise<
  Graph3DEditorController
> {
  const client = await (graph3DEditorControllerClientPromise ??= import(
    "./editor/graph-3d-editor-controller.ts"
  ));
  return graph3DEditorController ??= client.createKpEditorGraph3DController({
    root: appRoot,
    readDocument: () => editorDocument,
    writeDocument: (document) => {
      editorDocument = document;
    }
  });
}

function disposeGraph3DWebGL(root: ParentNode): void {
  graph3DEditorController?.dispose(root);
}

function loadApiCatalogClient(): Promise<ApiCatalogClient> {
  // The API inventory is an editor/dashboard inspector. Catalogue playback
  // never needs its data merely to host a selected animation.
  return apiCatalogClientPromise ??= import("./editor/api-catalog.ts");
}

async function hydrateOptionalAnimationDiagnostics(
  root: ParentNode
): Promise<void> {
  if (root.querySelector("[data-kp-editor-animation-diagnostics]") === null) {
    return;
  }
  const client = await (animationDiagnosticsCapabilityPromise ??= import(
    "./editor/animation-diagnostics-capability.ts"
  ));
  client.hydrateKpEditorAnimationDiagnosticsCapability(root);
}

async function selectApiCatalogItemOnDemand(
  item: HTMLButtonElement
): Promise<void> {
  (await loadApiCatalogClient()).selectApiCatalogItem(item);
}

async function hydrateSelectedAnimationPlayers(
  root: ParentNode,
  revision: number,
  expectedView: typeof activeView
): Promise<void> {
  await loadSelectedSurfaceCapabilitiesForRoot(root);
  if (revision !== viewRevision || activeView !== expectedView) return;
  await hydrateOptionalAnimationDiagnostics(root);
  if (revision !== viewRevision || activeView !== expectedView) return;
  // The listener must exist before the controller emits its initial frame.
  hydrateKpEditorAnimationSurfaces(root);
  hydrateKpEditorAnimationPlayers(root);
}

async function loadSelectedSurfaceCapabilitiesForRoot(
  root: ParentNode
): Promise<void> {
  const capabilities = new Set<KpEditorSelectedSurfaceCapability>();
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      const animationId = player.dataset["kpEditorAnimationId"];
      if (animationId === undefined) return;
      const slotKinds: Parameters<
        typeof deriveKpEditorSelectedSurfaceCapabilities
      >[0]["slotKinds"] = [...player.querySelectorAll<HTMLElement>(
        "[data-kp-editor-animation-surface-slot]"
      )].flatMap((slot): Parameters<
        typeof deriveKpEditorSelectedSurfaceCapabilities
      >[0]["slotKinds"] => {
        const slotKind = slot.dataset["kpEditorAnimationSurfaceSlot"];
        return slotKind === "equation" || slotKind === "diagram" ||
          slotKind === "graph" || slotKind === "programming"
          ? [slotKind]
          : [];
      });
      deriveKpEditorSelectedSurfaceCapabilities({
        animationId,
        slotKinds
      }).forEach((capability) => capabilities.add(capability));
    });
  await Promise.all([...capabilities].map(loadSelectedSurfaceCapability));
}

async function loadSelectedSurfaceCapabilities(input: {
  readonly animationId: string;
  readonly slotKinds: Parameters<
    typeof deriveKpEditorSelectedSurfaceCapabilities
  >[0]["slotKinds"];
}): Promise<void> {
  await Promise.all(
    deriveKpEditorSelectedSurfaceCapabilities(input)
      .map(loadSelectedSurfaceCapability)
  );
}

function loadSelectedSurfaceCapability(
  capability: KpEditorSelectedSurfaceCapability
): Promise<unknown> {
  if (capability === "equation-katex") {
    return equationSurfaceCapabilityPromise ??= import(
      "./editor/equation-surface-capability.ts"
    ).then((client) => {
      if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
        ({ id }) => id === "editor-animation-surface.equation.katex"
      )) {
        client.registerKpEditorEquationSurfaceCapability();
      }
      return client;
    });
  }
  if (capability === "graph-webgl-3d") {
    return graph3DSurfaceCapabilityPromise ??= import(
      "./editor/graph-3d-surface-capability.ts"
    ).then((client) => {
      if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
        ({ id }) => id === "editor-animation-surface.graph.webgl-3d"
      )) {
        client.registerKpEditorGraph3DSurfaceCapability();
      }
      return client;
    });
  }
  if (capability === "programming-trace") {
    return programmingSurfaceCapabilityPromise ??= import(
      "./editor/programming-surface-capability.ts"
    ).then((client) => {
      if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
        ({ id }) => id === "editor-animation-surface.programming.trace"
      )) {
        client.registerKpEditorProgrammingSurfaceCapability();
      }
      return client;
    });
  }
  return graphSvgSurfaceCapabilityPromise ??= import(
    "./editor/graph-svg-surface-capability.ts"
  ).then((client) => {
    if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
      ({ id }) => id === "editor-animation-surface.graph.svg"
    )) {
      client.registerKpEditorGraphSvgSurfaceCapability();
    }
    return client;
  });
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

async function openProjectDashboardGraphSurfacePreview(
  link: HTMLAnchorElement,
  event: Event
): Promise<void> {
  event.preventDefault();

  const graphId = link.dataset["kpPreviewGraphId"];
  const surfaceMode = link.dataset["kpPreviewGraphSurfaceMode"];
  if (graphId === undefined || surfaceMode === undefined) return;
  const [editorClient, controller] = await Promise.all([
    loadEditorClient(),
    loadGraph3DEditorController()
  ]);
  editorDocument ??= editorClient.createInitialEditorDocument();
  if (!controller.setSurfaceMode(graphId, surfaceMode)) return;
  await renderEditor();
  controller.findPreview(graphId)?.scrollIntoView({ block: "start" });
}

async function openProjectDashboardApiCatalogPreview(
  link: HTMLAnchorElement,
  event: Event
): Promise<void> {
  event.preventDefault();

  const itemId = link.dataset["kpPreviewApiItem"];

  if (itemId === undefined) {
    return;
  }

  await renderEditor();

  const item = Array.from(
    appRoot.querySelectorAll<HTMLButtonElement>("[data-kp-api-outline-item]")
  ).find((candidate) => candidate.dataset["kpApiOutlineItem"] === itemId);

  if (item === undefined) {
    return;
  }

  item.closest("details")?.setAttribute("open", "");
  (await loadApiCatalogClient()).selectApiCatalogItem(item);
  item.scrollIntoView({ block: "center" });
}

async function previewApiCatalogItemFromEvent(event: Event): Promise<void> {
  if (!(event.target instanceof Element)) {
    return;
  }

  const item = event.target.closest<HTMLElement>("[data-kp-api-outline-item]");

  if (item !== null) {
    (await loadApiCatalogClient()).previewApiCatalogItem(item);
  }
}
