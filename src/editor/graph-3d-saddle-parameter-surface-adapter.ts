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

export const KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID =
  "editor-animation-surface.graph.webgl-3d-saddle" as const;

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
    slot.dataset["kpEditorGraph3DContract"] = contract.schemaVersion;
    slot.dataset["kpEditorGraph3DRuntimeProtocol"] = frame.schemaVersion;
    session.shell.dataset["kpEditorGraph3DTheme"] = frame.theme.id;
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
  session.shell.dataset["kpEditorGraph3DCapability"] = "loading";
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
    session.shell.dataset["kpEditorGraph3DCapability"] = outcome.status;
  }).catch((error: unknown) => {
    if (session.disposed) return;
    session.shell.dataset["kpEditorGraph3DCapability"] = "fallback";
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
  session.shell.dataset["kpEditorGraph3DProgress"] =
    String(frame.clock.visualProgress);
  session.shell.dataset["kpEditorGraph3DDirection"] = frame.clock.direction;
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
  session.shell.dataset["kpEditorGraph3DVisibility"] = visibility;
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
