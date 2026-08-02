import {
  occludedAxisColor
} from "../rendering/graph-svg.ts";
import {
  canReuseGraph3DWebGLShell,
  renderGraph3DWebGLFallback,
  renderGraph3DWebGLShell
} from "../rendering/graph-webgl.ts";
import type {
  KpDocument,
  KpSemanticObject
} from "../semantic/document.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  type Graph3DObject,
  type Graph3DSurfaceQuality,
  type Graph3DViewMode,
  type Surface3DObject
} from "../semantic/graph.ts";
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
  updateGraph3DSurfaceMode,
  updateGraph3DSurfaceQuality,
  updateGraph3DViewMode,
  updateSaddleSurfaceDenominator,
  type Graph3DLightPresetId,
  type Graph3DLightScalarSetting
} from "./state.ts";

type Graph3DWebGLClient = typeof import("../rendering/graph-webgl-three.ts");

export interface KpEditorGraph3DController {
  dispose(root: ParentNode): void;
  findPreview(graphId: string): HTMLElement | undefined;
  handleChange(select: HTMLSelectElement): boolean;
  handleInput(input: HTMLInputElement): boolean;
  hydrate(
    root: ParentNode,
    objects: readonly KpSemanticObject[],
    previousObjects?: readonly KpSemanticObject[]
  ): void;
  setSurfaceMode(graphId: string, surfaceMode: string): boolean;
}

export function createKpEditorGraph3DController(input: {
  readonly root: ParentNode;
  readonly readDocument: () => KpDocument;
  readonly writeDocument: (document: KpDocument) => void;
}): KpEditorGraph3DController {
  let graph3DWebGLClient: Graph3DWebGLClient | undefined;
  let graph3DWebGLClientPromise: Promise<Graph3DWebGLClient> | undefined;
  const visibilityObservers = new WeakMap<HTMLElement, IntersectionObserver>();

  const readDocument = input.readDocument;
  const writeDocument = input.writeDocument;

  function hydrate(
    root: ParentNode,
    objects: readonly KpSemanticObject[],
    previousObjects?: readonly KpSemanticObject[]
  ): void {
    root.querySelectorAll<HTMLElement>(".graph-webgl").forEach((shell) =>
      hydrateShell(shell, objects, previousObjects)
    );
  }

  function hydrateShell(
    shell: HTMLElement,
    objects: readonly KpSemanticObject[],
    previousObjects?: readonly KpSemanticObject[]
  ): void {
    stopVisibilityObserver(shell);
    if (typeof IntersectionObserver === "undefined") {
      hydrateVisibleShell(shell, objects, previousObjects);
      return;
    }
    // Mounted editor previews can remain below the fold; semantic SVG is
    // sufficient until the rich surface approaches the viewport.
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      stopVisibilityObserver(shell);
      hydrateVisibleShell(shell, objects, previousObjects);
    }, { rootMargin: "160px" });
    visibilityObservers.set(shell, observer);
    observer.observe(shell);
  }

  function dispose(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>(".graph-webgl")
      .forEach(stopVisibilityObserver);
    graph3DWebGLClient?.disposeGraph3DWebGLShells(root);
  }

  function disposeShell(shell: HTMLElement): void {
    stopVisibilityObserver(shell);
    graph3DWebGLClient?.disposeGraph3DWebGLShell(shell);
  }

  function hydrateVisibleShell(
    shell: HTMLElement,
    objects: readonly KpSemanticObject[],
    previousObjects?: readonly KpSemanticObject[]
  ): void {
    void loadWebGLClient().then((client) => {
      if (!shell.isConnected) return;
      client.hydrateGraph3DWebGLShell(shell, objects, { previousObjects });
    });
  }

  function stopVisibilityObserver(shell: HTMLElement): void {
    visibilityObservers.get(shell)?.disconnect();
    visibilityObservers.delete(shell);
  }

  function loadWebGLClient(): Promise<Graph3DWebGLClient> {
    return graph3DWebGLClientPromise ??= import(
      "../rendering/graph-webgl-three.ts"
    ).then((client) => {
      graph3DWebGLClient = client;
      return client;
    });
  }

  function updateAzimuth(control: HTMLInputElement): void {
    const graphId = control.dataset["graphId"];
    const azimuthDegrees = Number(control.value);
    if (graphId === undefined || !Number.isFinite(azimuthDegrees)) return;
    writeDocument(updateGraph3DAzimuth(
      readDocument(),
      graphId,
      azimuthDegrees
    ));
    renderPreview(graphId);
    control.closest(".graph-control")
      ?.querySelector<HTMLOutputElement>(".graph-control__value")
      ?.replaceChildren(
        control.ownerDocument.createTextNode(`${formatNumber(azimuthDegrees)} deg`)
      );
  }

  function updateOccludedAxisLightness(control: HTMLInputElement): void {
    const graphId = control.dataset["graphId"];
    const lightness = Number(control.value);
    if (graphId === undefined || !Number.isFinite(lightness)) return;
    writeDocument(updateGraph3DOccludedAxisLightness(
      readDocument(),
      graphId,
      lightness
    ));
    renderPreview(graphId);
    const graph = findGraph3D(graphId);
    if (graph === undefined) return;
    const next = graph.occludedAxisLightness ??
      DEFAULT_OCCLUDED_AXIS_LIGHTNESS;
    control.value = formatNumber(next);
    control.closest(".graph-control")
      ?.querySelector<HTMLOutputElement>(".graph-control__value")
      ?.replaceChildren(
        control.ownerDocument.createTextNode(occludedAxisColor(next))
      );
  }

  function updateLightPreset(control: HTMLSelectElement): void {
    const graphId = control.dataset["graphId"];
    if (graphId === undefined || !isLightPresetId(control.value)) return;
    writeDocument(applyGraph3DLightPreset(
      readDocument(),
      graphId,
      control.value
    ));
    renderPreview(graphId);
    syncLightControls(graphId);
  }

  function setSurfaceMode(
    graphId: string,
    surfaceMode: string
  ): boolean {
    if (!isSurfaceMode(surfaceMode)) return false;
    writeDocument(updateGraph3DSurfaceMode(
      readDocument(),
      graphId,
      surfaceMode
    ));
    return true;
  }

  function updateSurfaceMode(control: HTMLSelectElement): void {
    const graphId = control.dataset["graphId"];
    if (graphId === undefined || !isSurfaceMode(control.value)) return;
    const previousObjects = readDocument().objects;
    if (!setSurfaceMode(graphId, control.value)) return;
    renderPreview(graphId, previousObjects);
    control.dataset["kpGraphSurfaceMode"] = control.value;
    setControlOutput(control, control.value);
  }

  function updateSurfaceQuality(control: HTMLSelectElement): void {
    const graphId = control.dataset["graphId"];
    if (graphId === undefined || !isSurfaceQuality(control.value)) return;
    writeDocument(updateGraph3DSurfaceQuality(
      readDocument(),
      graphId,
      control.value
    ));
    renderPreview(graphId);
    control.dataset["kpGraphSurfaceQuality"] = control.value;
    setControlOutput(control, control.value);
  }

  function updateViewMode(control: HTMLSelectElement): void {
    const graphId = control.dataset["graphId"];
    if (graphId === undefined || !isViewMode(control.value)) return;
    const previousObjects = readDocument().objects;
    writeDocument(updateGraph3DViewMode(
      readDocument(),
      graphId,
      control.value
    ));
    renderPreview(graphId, previousObjects);
    control.dataset["kpGraphViewMode"] = control.value;
    setControlOutput(control, control.value);
  }

  function updateLightSetting(control: HTMLInputElement): void {
    const graphId = control.dataset["graphId"];
    const setting = control.dataset["kpGraphLightSetting"];
    const value = Number(control.value);
    if (
      graphId === undefined || !isLightScalarSetting(setting) ||
      !Number.isFinite(value)
    ) return;
    writeDocument(updateGraph3DLightSetting(
      readDocument(),
      graphId,
      setting,
      value
    ));
    renderPreview(graphId);
    syncLightControls(graphId);
  }

  function updateShadowEnabled(control: HTMLInputElement): void {
    const graphId = control.dataset["graphId"];
    if (graphId === undefined) return;
    writeDocument(updateGraph3DShadowEnabled(
      readDocument(),
      graphId,
      control.checked
    ));
    renderPreview(graphId);
    setControlOutput(control, control.checked ? "on" : "off");
  }

  function updateShadowOpacity(control: HTMLInputElement): void {
    const graphId = control.dataset["graphId"];
    const opacity = Number(control.value);
    if (graphId === undefined || !Number.isFinite(opacity)) return;
    writeDocument(updateGraph3DShadowOpacity(
      readDocument(),
      graphId,
      opacity
    ));
    renderPreview(graphId);
    const next = findGraph3D(graphId)?.shadow.opacity;
    if (next === undefined) return;
    control.value = formatNumber(next);
    setControlOutput(control, control.value);
  }

  function updateSaddleDenominator(control: HTMLInputElement): void {
    const graphId = control.dataset["graphId"];
    const surfaceId = control.dataset["surfaceId"];
    const denominator = Number(control.value);
    if (
      graphId === undefined || surfaceId === undefined ||
      !Number.isFinite(denominator)
    ) return;
    writeDocument(updateSaddleSurfaceDenominator(
      readDocument(),
      surfaceId,
      denominator
    ));
    renderPreview(graphId);
    const next = findSaddleSurface(surfaceId)?.parameterization?.denominator;
    if (next === undefined) return;
    control.value = formatNumber(next);
    setControlOutput(control, control.value);
  }

  function renderPreview(
    graphId: string,
    previousObjects?: readonly KpSemanticObject[]
  ): void {
    const graph = findGraph3D(graphId);
    const graphContainer = findPreview(graphId)
      ?.querySelector<HTMLElement>(".object-preview__graph");
    if (graph === undefined || graphContainer === null ||
      graphContainer === undefined) return;
    const existingShell = graphContainer.querySelector<HTMLElement>(
      ".graph-webgl"
    );
    if (
      existingShell !== null &&
      canReuseGraph3DWebGLShell(existingShell.dataset["kpWebglStatus"])
    ) {
      const fallback = existingShell.querySelector<HTMLElement>(
        ".graph-webgl__fallback"
      );
      if (fallback !== null) {
        fallback.innerHTML = renderGraph3DWebGLFallback(
          readDocument().objects,
          graph
        );
      }
      hydrateShell(existingShell, readDocument().objects, previousObjects);
      return;
    }
    if (existingShell !== null) disposeShell(existingShell);
    graphContainer.innerHTML = renderGraph3DWebGLShell(
      readDocument().objects,
      graph
    );
    hydrate(graphContainer, readDocument().objects, previousObjects);
  }

  function findGraph3D(graphId: string): Graph3DObject | undefined {
    return readDocument().objects.find(
      (object): object is Graph3DObject =>
        object.type === "graph-3d" && object.id === graphId
    );
  }

  function findSaddleSurface(surfaceId: string): Surface3DObject | undefined {
    return readDocument().objects.find(
      (object): object is Surface3DObject =>
        object.type === "surface-3d" && object.id === surfaceId &&
        object.parameterization?.kind === "saddle"
    );
  }

  function syncLightControls(graphId: string): void {
    const graph = findGraph3D(graphId);
    const preview = findPreview(graphId);
    if (graph === undefined || preview === undefined) return;
    preview.querySelectorAll<HTMLInputElement>(
      '[data-action="set-graph-light-setting"]'
    ).forEach((control) => {
      const setting = control.dataset["kpGraphLightSetting"];
      if (!isLightScalarSetting(setting)) return;
      control.value = formatNumber(graph.light[setting]);
      setControlOutput(control, control.value);
    });
    const selectedPreset = findGraph3DLightPresetId(graph.light) ?? "custom";
    const select = preview.querySelector<HTMLSelectElement>(
      '[data-action="set-graph-light-preset"]'
    );
    if (select === null) return;
    select.value = selectedPreset;
    select.dataset["kpGraphLightPreset"] = selectedPreset;
    setControlOutput(select, selectedPreset);
  }

  function setControlOutput(
    control: HTMLInputElement | HTMLSelectElement,
    value: string
  ): void {
    control.closest(".graph-control")
      ?.querySelector<HTMLOutputElement>(".graph-control__value")
      ?.replaceChildren(control.ownerDocument.createTextNode(value));
  }

  function findPreview(graphId: string): HTMLElement | undefined {
    return [...input.root.querySelectorAll<HTMLElement>(".object-preview")]
      .find((element) =>
        element.dataset["kpObject"] === graphId &&
        element.dataset["kpType"] === "graph-3d"
      );
  }

  function handleChange(control: HTMLSelectElement): boolean {
    switch (control.dataset["action"]) {
      case "set-graph-light-preset": updateLightPreset(control); return true;
      case "set-graph-surface-mode": updateSurfaceMode(control); return true;
      case "set-graph-surface-quality": updateSurfaceQuality(control); return true;
      case "set-graph-view-mode": updateViewMode(control); return true;
      default: return false;
    }
  }

  function handleInput(control: HTMLInputElement): boolean {
    switch (control.dataset["action"]) {
      case "set-graph-azimuth": updateAzimuth(control); return true;
      case "set-graph-occluded-axis-lightness":
        updateOccludedAxisLightness(control); return true;
      case "set-graph-light-setting": updateLightSetting(control); return true;
      case "set-graph-shadow-enabled": updateShadowEnabled(control); return true;
      case "set-graph-shadow-opacity": updateShadowOpacity(control); return true;
      case "set-saddle-denominator": updateSaddleDenominator(control); return true;
      default: return false;
    }
  }

  return Object.freeze({
    dispose,
    findPreview,
    handleChange,
    handleInput,
    hydrate,
    setSurfaceMode
  });
}

function isLightPresetId(value: string): value is Graph3DLightPresetId {
  return value === "studio" || value === "raking" || value === "flat";
}

function isLightScalarSetting(
  value: string | undefined
): value is Graph3DLightScalarSetting {
  return value === "ambient" || value === "diffuse" ||
    value === "depthHaze" || value === "specular" || value === "rim";
}

function isSurfaceMode(
  value: string | undefined
): value is typeof GRAPH_3D_SURFACE_MODE_IDS[number] {
  return value !== undefined && GRAPH_3D_SURFACE_MODE_IDS.includes(
    value as typeof GRAPH_3D_SURFACE_MODE_IDS[number]
  );
}

function isSurfaceQuality(
  value: string | undefined
): value is Graph3DSurfaceQuality {
  return value !== undefined && GRAPH_3D_SURFACE_QUALITY_IDS.includes(
    value as Graph3DSurfaceQuality
  );
}

function isViewMode(value: string | undefined): value is Graph3DViewMode {
  return value !== undefined && GRAPH_3D_VIEW_MODE_IDS.includes(
    value as Graph3DViewMode
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}
