/// <reference types="vite/client" />

import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT,
  getKpEditorAnimationPlaybackSession
} from "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  createKpEditorGraph3DHostContract,
  projectKpEditorGraph3DHostFrame,
  projectKpEditorGraph3DRuntimeFrame,
  supportsKpEditorGraph3DAnimation,
  type KpEditorGraph3DRuntimeFrame
} from "./graph-3d-surface-contract.ts";
import {
  renderGraph3DWebGLFallback,
  renderGraph3DWebGLShell
} from "../rendering/graph-webgl.ts";
import type {
  Graph3DObject,
  Graph3DSurfaceMode
} from "../semantic/graph.ts";

type Graph3DWebGLClient = typeof import("../rendering/graph-webgl-three.ts");

interface KpEditorGraph3DSurfaceSession {
  client?: Graph3DWebGLClient | undefined;
  disposed: boolean;
  fallbackMode: Graph3DSurfaceMode;
  frame: KpEditorGraph3DRuntimeFrame;
  loadPromise?: Promise<Graph3DWebGLClient> | undefined;
  observer?: IntersectionObserver | undefined;
  shell: HTMLElement;
  visibility: "offscreen" | "near" | "visible";
}

const sessions = new WeakMap<HTMLElement, KpEditorGraph3DSurfaceSession>();

export const kpEditorGraph3DSurfaceAdapter: KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.graph.webgl-3d",
  slotKind: "graph",
  priority: 100,
  supports(state) {
    return state.surface.slotKinds.includes("graph") &&
      supportsKpEditorGraph3DAnimation(state.animationId);
  },
  render({ player, slot, state }) {
    const animation = getKpEditorAnimationPlaybackSession(player)?.animation;
    if (animation === undefined) return;
    const contract = createKpEditorGraph3DHostContract(animation);
    const frame = projectKpEditorGraph3DRuntimeFrame(
      projectKpEditorGraph3DHostFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      })
    );
    let session = sessions.get(player);

    if (session === undefined) {
      const fallbackGraph = graphForFallback(frame);
      slot.innerHTML = renderGraph3DWebGLShell(
        frame.scene.source,
        fallbackGraph
      );
      const shell = slot.querySelector<HTMLElement>(".graph-webgl");
      if (shell === null) return;
      session = {
        disposed: false,
        fallbackMode: fallbackGraph.surfaceMode,
        frame,
        shell,
        visibility: "near"
      };
      shell.setAttribute(
        "data-kp-editor-graph-3d-fallback-mode",
        fallbackGraph.surfaceMode
      );
      sessions.set(player, session);
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeKpEditorGraph3DSurface(player, session!),
        { once: true }
      );
      setGraph3DVisibility(session, "near");
      beginGraph3DCapabilityLoad(session);
    } else {
      session.frame = frame;
    }

    session.shell.setAttribute(
      "aria-label",
      frame.accessibility.description
    );
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-progress",
      String(frame.clock.visualProgress)
    );
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-direction",
      frame.clock.direction
    );
    syncGraph3DFallback(session, frame);
    if (session.client !== undefined) {
      session.client.renderKpGraph3DWebGLRuntimeFrame(
        session.shell,
        frame
      );
    }

    slot.setAttribute(
      "data-kp-editor-graph-3d-contract",
      contract.schemaVersion
    );
    slot.setAttribute(
      "data-kp-editor-graph-3d-runtime-protocol",
      frame.schemaVersion
    );
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-theme",
      frame.theme.id
    );
  }
};

export function registerKpEditorGraph3DSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorGraph3DSurfaceAdapter
  );
}

function beginGraph3DCapabilityLoad(
  session: KpEditorGraph3DSurfaceSession
): void {
  if (typeof IntersectionObserver === "undefined") {
    setGraph3DVisibility(session, "visible");
    loadGraph3DCapability(session);
    return;
  }

  // The selected asset owns the capability request, but an offscreen stage
  // retains meaningful SVG paint without paying Three.js or GPU setup cost.
  session.observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    session.observer?.disconnect();
    session.observer = undefined;
    setGraph3DVisibility(session, "visible");
    loadGraph3DCapability(session);
  }, { rootMargin: "160px" });
  session.observer.observe(session.shell);
}

function loadGraph3DCapability(session: KpEditorGraph3DSurfaceSession): void {
  if (session.loadPromise !== undefined || session.disposed) return;
  session.shell.setAttribute("data-kp-editor-graph-3d-capability", "loading");
  session.loadPromise = import("../rendering/graph-webgl-three.ts");
  void session.loadPromise.then((client) => {
    if (session.disposed || !session.shell.isConnected) return;
    session.client = client;
    const frame = session.frame;
    const outcome = client.hydrateKpGraph3DWebGLRuntimeFrame(
      session.shell,
      frame
    );
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-capability",
      outcome.status
    );
  }).catch((error: unknown) => {
    if (session.disposed) return;
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-capability",
      "fallback"
    );
    session.shell.dataset["kpWebglStatus"] = "fallback";
    session.shell.dataset["kpWebglError"] = error instanceof Error
      ? error.message
      : "The 3D capability failed to load.";
    session.shell.querySelector<HTMLElement>(
      "[data-kp-webgl-accessible-status]"
    )?.replaceChildren(
      session.shell.ownerDocument.createTextNode(
        "Static graph shown because the 3D view is unavailable."
      )
    );
  });
}

function disposeKpEditorGraph3DSurface(
  player: HTMLElement,
  session: KpEditorGraph3DSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  setGraph3DVisibility(session, "offscreen");
  session.observer?.disconnect();
  session.client?.disposeGraph3DWebGLShell(session.shell);
  sessions.delete(player);
}

function graphForFallback(frame: KpEditorGraph3DRuntimeFrame): Graph3DObject {
  return frame.scene.source.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  ) ?? requireTargetGraph(frame);
}

function syncGraph3DFallback(
  session: KpEditorGraph3DSurfaceSession,
  frame: KpEditorGraph3DRuntimeFrame
): void {
  const useTarget = frame.clock.visualProgress >= 0.5;
  const objects = useTarget ? frame.scene.target : frame.scene.source;
  const graph = objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  if (graph === undefined || graph.surfaceMode === session.fallbackMode) return;
  const fallback = session.shell.querySelector<HTMLElement>(
    ".graph-webgl__fallback"
  );
  if (fallback === null) return;

  // SVG is the static and context-loss paint owner. Recompute only when the
  // nearest semantic endpoint changes, never on every animation frame.
  fallback.innerHTML = renderGraph3DWebGLFallback(objects, graph);
  session.fallbackMode = graph.surfaceMode;
  session.shell.setAttribute(
    "data-kp-editor-graph-3d-fallback-mode",
    graph.surfaceMode
  );
}

function requireTargetGraph(frame: KpEditorGraph3DRuntimeFrame): Graph3DObject {
  const graph = frame.scene.target.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === frame.identity.graphId
  );
  if (graph === undefined) {
    throw new Error(
      `Graph3D runtime target lacks ${frame.identity.graphId}.`
    );
  }
  return graph;
}

function setGraph3DVisibility(
  session: KpEditorGraph3DSurfaceSession,
  visibility: KpEditorGraph3DSurfaceSession["visibility"]
): void {
  session.visibility = visibility;
  session.shell.setAttribute(
    "data-kp-editor-graph-3d-visibility",
    visibility
  );
}
