import "katex/dist/katex.min.css";
import "./styles.css";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "./editor/editor.ts";
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
import { projectDashboardData } from "./project-dashboard/data.ts";
import {
  getProjectDashboardSearchQuery,
  renderProjectDashboard
} from "./project-dashboard/render.ts";
import {
  disposeKpEditorAnimationPlayers,
  hydrateKpEditorAnimationPlayers,
  pauseKpEditorAnimationPlayers
} from "./editor/animation-player-controller.ts";
import {
  hydrateKpEditorAnimationSurfaces
} from "./editor/animation-surface-adapter-registry.ts";
import {
  hydrateKpEditorAnimationLiveDiagnostics
} from "./editor/animation-live-diagnostics.ts";
import {
  registerKpEditorEquationSurfaceAdapter
} from "./editor/equation-surface-adapter.ts";
import { registerKpEditorGraphSvgViewportAdapter } from "./editor/graph-svg-viewport.ts";
import { registerKpEditorDiagramSvgAdapter } from "./editor/diagram-svg-adapter.ts";

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
let selectedEditorAnimationDescriptorId = selectKpEditorAnimationDescriptor(
  createKpEditorAnimationLibrary(),
  readKpEditorAnimationSelection(window.location.search)
).id;
type Graph3DWebGLClient = typeof import("./rendering/graph-webgl-three.ts");
let graph3DWebGLClient: Graph3DWebGLClient | undefined;
let graph3DWebGLClientPromise: Promise<Graph3DWebGLClient> | undefined;

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

renderEditor();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseKpEditorAnimationPlayers(appRoot);
});

window.addEventListener("pagehide", () => {
  disposeKpEditorAnimationPlayers(appRoot);
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
      renderProjectDashboardView();
      return;
    case "show-editor":
      renderEditor();
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
      filterProjectDashboardFromInput(event.target);
      return;
    case "toggle-project-dashboard-toc":
      toggleProjectDashboardTocFromInput(event.target);
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
  disposeKpEditorAnimationPlayers(appRoot);
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

function renderProjectDashboardView(
  query = projectDashboardQuery
): void {
  projectDashboardQuery = query;
  disposeKpEditorAnimationPlayers(appRoot);
  disposeGraph3DWebGL(appRoot);
  appRoot.innerHTML = renderProjectDashboard(projectDashboardData, {
    query,
    selectedAgendaRowId: projectDashboardSelectedAgendaRowId,
    tocOnly: projectDashboardTocOnly,
    selectedKatexFixtureId: projectDashboardSelectedKatexFixtureId
  });
}

function selectKatexTransformFixture(button: HTMLButtonElement): void {
  projectDashboardSelectedKatexFixtureId =
    button.dataset["kpKatexTransformFixture"];
  renderProjectDashboardView(projectDashboardQuery);
}

function selectProjectAgendaRow(button: HTMLButtonElement): void {
  projectDashboardSelectedAgendaRowId = button.dataset["kpSelectAgendaRow"];
  renderProjectDashboardView(projectDashboardQuery);
}

function filterProjectDashboardFromInput(input: HTMLInputElement): void {
  const query = getProjectDashboardSearchQuery(input);

  renderProjectDashboardView(query);

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
  renderProjectDashboardView(projectDashboardQuery);
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
  renderProjectDashboardView("");

  document
    .getElementById("project-dashboard-animation-layout-title")
    ?.scrollIntoView({ block: "start" });
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
  const rootNode = root instanceof Node ? root : undefined;

  void loadGraph3DWebGLClient().then((client) => {
    if (rootNode !== undefined && !rootNode.isConnected) {
      return;
    }

    client.hydrateGraph3DWebGLShells(root, objects, { previousObjects });
  });
}

function hydrateGraph3DWebGLShell(
  shell: HTMLElement,
  objects: readonly KpSemanticObject[],
  previousObjects?: readonly KpSemanticObject[]
): void {
  void loadGraph3DWebGLClient().then((client) => {
    if (!shell.isConnected) {
      return;
    }

    client.hydrateGraph3DWebGLShell(shell, objects, { previousObjects });
  });
}

function disposeGraph3DWebGL(root: ParentNode): void {
  graph3DWebGLClient?.disposeGraph3DWebGLShells(root);
}

function disposeGraph3DWebGLShell(shell: HTMLElement): void {
  graph3DWebGLClient?.disposeGraph3DWebGLShell(shell);
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
