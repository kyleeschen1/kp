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
  createKpEditorGraph3DSaddleHostContract,
  projectKpEditorGraph3DSaddleHostFrame,
  supportsKpEditorGraph3DSaddleAnimation
} from "./graph-3d-saddle-parameter-host-contract.ts";
import {
  projectKpGraph3DSaddlePaintRuntimeFrame,
  renderKpGraph3DSaddleKatexLabels,
  renderKpGraph3DSaddlePaintShell,
  renderKpGraph3DSaddleSvgFallback,
  type KpGraph3DSaddlePaintRuntimeFrame
} from "../rendering/graph-3d-saddle-parameter-paint.ts";

type KpGraph3DSaddleWebGLClient = typeof import(
  "../rendering/graph-3d-saddle-parameter-ports.ts"
);

interface KpEditorGraph3DSaddleSurfaceSession {
  client?: KpGraph3DSaddleWebGLClient | undefined;
  disposed: boolean;
  frame: KpGraph3DSaddlePaintRuntimeFrame;
  loadPromise?: Promise<KpGraph3DSaddleWebGLClient> | undefined;
  observer?: IntersectionObserver | undefined;
  shell: HTMLElement;
  stage: HTMLElement;
  visibility: "offscreen" | "near" | "visible";
}

const sessions = new WeakMap<
  HTMLElement,
  KpEditorGraph3DSaddleSurfaceSession
>();

import { KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID } from "./graph-3d-saddle-adapter-identity.ts";
export { KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID } from "./graph-3d-saddle-adapter-identity.ts";

export const kpEditorGraph3DSaddleSurfaceAdapter = Object.freeze({
  id: KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID,
  slotKind: "graph",
  priority: 110,
  supports(state) {
    return state.surface.slotKinds.includes("graph") &&
      supportsKpEditorGraph3DSaddleAnimation(state.animationId);
  },
  render({ player, slot, state }) {
    const animation = getKpEditorAnimationPlaybackSession(player)?.animation;
    if (animation === undefined) return;
    const contract = createKpEditorGraph3DSaddleHostContract(animation);
    const frame = projectKpGraph3DSaddlePaintRuntimeFrame({
      hostFrame: projectKpEditorGraph3DSaddleHostFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      })
    });
    let session = sessions.get(player);

    if (session === undefined) {
      slot.innerHTML = renderKpGraph3DSaddlePaintShell(frame);
      const stage = slot.querySelector<HTMLElement>(
        "[data-kp-graph-3d-saddle-paint]"
      );
      const shell = stage?.querySelector<HTMLElement>(".graph-webgl");
      if (stage === null || shell === null || shell === undefined) return;
      const created: KpEditorGraph3DSaddleSurfaceSession = {
        disposed: false,
        frame,
        shell,
        stage,
        visibility: "near"
      };
      sessions.set(player, created);
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeKpEditorGraph3DSaddleSurface(player, created),
        { once: true }
      );
      setVisibility(created, "near");
      beginCapabilityLoad(created);
      session = created;
    } else {
      session.frame = frame;
    }

    syncStaticPaint(session, frame);
    if (session.client !== undefined) {
      session.client.renderKpGraph3DSaddleWebGLFrame(session.shell, frame);
    }
    // Explicit attribute spelling keeps Graph3D as one protocol token; DOM
    // dataset serialization would emit graph3-d and break host diagnostics.
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
} satisfies KpEditorAnimationSurfaceAdapter);

export function registerKpEditorGraph3DSaddleSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorGraph3DSaddleSurfaceAdapter
  );
}

function beginCapabilityLoad(
  session: KpEditorGraph3DSaddleSurfaceSession
): void {
  if (typeof IntersectionObserver === "undefined") {
    setVisibility(session, "visible");
    loadCapability(session);
    return;
  }
  // Semantic SVG remains complete while the selected stage is offscreen;
  // Three and a scarce context become eligible only near actual visibility.
  session.observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    session.observer?.disconnect();
    session.observer = undefined;
    setVisibility(session, "visible");
    loadCapability(session);
  }, { rootMargin: "160px" });
  session.observer.observe(session.shell);
}

function loadCapability(session: KpEditorGraph3DSaddleSurfaceSession): void {
  if (session.loadPromise !== undefined || session.disposed) return;
  session.shell.setAttribute(
    "data-kp-editor-graph-3d-capability",
    "loading"
  );
  session.loadPromise = import(
    "../rendering/graph-3d-saddle-parameter-ports.ts"
  );
  void session.loadPromise.then((client) => {
    if (session.disposed || !session.shell.isConnected) return;
    session.client = client;
    const outcome = client.hydrateKpGraph3DSaddleWebGL(
      session.shell,
      session.frame
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
      : "The saddle 3D capability failed to load.";
    session.shell.querySelector<HTMLElement>(
      "[data-kp-webgl-accessible-status]"
    )?.replaceChildren(session.shell.ownerDocument.createTextNode(
      "Static saddle graph shown because the 3D view is unavailable."
    ));
  });
}

function syncStaticPaint(
  session: KpEditorGraph3DSaddleSurfaceSession,
  frame: KpGraph3DSaddlePaintRuntimeFrame
): void {
  session.stage.dataset["kpSaddleDenominator"] = currentDenominator(frame);
  session.shell.setAttribute("aria-label", frame.accessibility.description);
  session.shell.setAttribute(
    "data-kp-editor-graph-3d-progress",
    String(frame.clock.visualProgress)
  );
  session.shell.setAttribute(
    "data-kp-editor-graph-3d-direction",
    frame.clock.direction
  );
  const fallback = session.shell.querySelector<HTMLElement>(
    ".graph-webgl__fallback"
  );
  if (fallback !== null) fallback.innerHTML =
    renderKpGraph3DSaddleSvgFallback(frame);
  const labels = session.stage.querySelector<HTMLElement>(
    "[data-kp-graph-3d-saddle-labels]"
  );
  if (labels !== null) labels.innerHTML =
    renderKpGraph3DSaddleKatexLabels(frame);
}

function disposeKpEditorGraph3DSaddleSurface(
  player: HTMLElement,
  session: KpEditorGraph3DSaddleSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  setVisibility(session, "offscreen");
  session.observer?.disconnect();
  session.client?.disposeKpGraph3DSaddleWebGL(session.shell);
  sessions.delete(player);
}

function setVisibility(
  session: KpEditorGraph3DSaddleSurfaceSession,
  visibility: KpEditorGraph3DSaddleSurfaceSession["visibility"]
): void {
  session.visibility = visibility;
  session.shell.setAttribute(
    "data-kp-editor-graph-3d-visibility",
    visibility
  );
}

function currentDenominator(
  frame: KpGraph3DSaddlePaintRuntimeFrame
): string {
  const surface = frame.scene.target.find((object) =>
    object.type === "surface-3d"
  );
  if (surface?.type !== "surface-3d" ||
      surface.parameterization?.kind !== "saddle") throw new Error(
    "Graph3D saddle adapter lost its current denominator."
  );
  return String(surface.parameterization.denominator);
}
