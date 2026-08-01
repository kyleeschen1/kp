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
  supportsKpEditorGraph3DAnimation,
  type KpEditorGraph3DHostFrame
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
  frame: KpEditorGraph3DHostFrame;
  loadPromise?: Promise<Graph3DWebGLClient> | undefined;
  observer?: IntersectionObserver | undefined;
  shell: HTMLElement;
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
    const frame = projectKpEditorGraph3DHostFrame({
      animation,
      runtimeFrame: state.runtimeFrame
    });
    let session = sessions.get(player);

    if (session === undefined) {
      const fallbackGraph = graphForFallback(frame);
      slot.innerHTML = renderGraph3DWebGLShell(
        frame.sourceObjects,
        fallbackGraph
      );
      const shell = slot.querySelector<HTMLElement>(".graph-webgl");
      if (shell === null) return;
      session = {
        disposed: false,
        fallbackMode: fallbackGraph.surfaceMode,
        frame,
        shell
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
      beginGraph3DCapabilityLoad(session);
    } else {
      session.frame = frame;
    }

    session.shell.setAttribute("aria-label", frame.description);
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-progress",
      String(frame.transitionProgress)
    );
    session.shell.setAttribute(
      "data-kp-editor-graph-3d-direction",
      frame.direction
    );
    syncGraph3DFallback(session, frame);
    if (session.client !== undefined) {
      session.client.renderGraph3DWebGLShellFrame(
        session.shell,
        frame.targetObjects,
        frame.graph,
        {
          previousObjects: frame.sourceObjects,
          transitionProgress: frame.transitionProgress
        }
      );
    }

    slot.setAttribute(
      "data-kp-editor-graph-3d-contract",
      contract.schemaVersion
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
    loadGraph3DCapability(session);
    return;
  }

  // The selected asset owns the capability request, but an offscreen stage
  // retains meaningful SVG paint without paying Three.js or GPU setup cost.
  session.observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    session.observer?.disconnect();
    session.observer = undefined;
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
    const outcome = client.hydrateGraph3DWebGLShell(
      session.shell,
      frame.targetObjects,
      {
        previousObjects: frame.sourceObjects,
        transitionProgress: frame.transitionProgress
      }
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
  session.observer?.disconnect();
  session.client?.disposeGraph3DWebGLShell(session.shell);
  sessions.delete(player);
}

function graphForFallback(frame: KpEditorGraph3DHostFrame): Graph3DObject {
  return frame.sourceObjects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  ) ?? frame.graph;
}

function syncGraph3DFallback(
  session: KpEditorGraph3DSurfaceSession,
  frame: KpEditorGraph3DHostFrame
): void {
  const useTarget = frame.transitionProgress >= 0.5;
  const objects = useTarget ? frame.targetObjects : frame.sourceObjects;
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
