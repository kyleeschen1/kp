import {
  createKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime,
  type KpExactFractionQuantityRuntimeFrame,
  type KpExactFractionQuantityRuntimeSession
} from "../animation/exact-fraction-quantity-runtime.ts";
import {
  kpExactFractionQuantityAnimationId
} from "../animation/exact-fraction-quantity-adapter.ts";
import {
  KP_EXACT_FRACTION_FOLDABLE_NODE_IDS,
  compileKpExactFractionQuantityFoldProjection,
  createKpExactFractionQuantityFoldIntent,
  type KpExactFractionQuantityFoldMode
} from "../semantic/exact-fraction-quantity-evaluation-tree.ts";
import type {
  KpExactFractionQuantityViewKind
} from "../semantic/exact-fraction-quantity-view-obligations.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  renderKpExactFractionQuantityBarSvg
} from "../rendering/exact-fraction-quantity-bar-projection.ts";
import {
  renderKpExactFractionQuantityCircleSvg
} from "../rendering/exact-fraction-quantity-circle-projection.ts";
import {
  renderKpExactFractionQuantityNumberLineSvg
} from "../rendering/exact-fraction-quantity-number-line-projection.ts";
import {
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  createKpCanonicalNativeKatexSceneSession,
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexRendererSession
} from "../rendering/native-katex-scene-compositor.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import type {
  KpExactFractionSymbolicEndpoint,
  KpExactFractionSymbolicMotionInput
} from "../rendering/exact-fraction-quantity-symbolic-projection.ts";
import {
  dispatchKpEditorAnimationPlaybackAction
} from "./animation-player-controller.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  createKpExactFractionQuantityLibraryState,
  readKpExactFractionQuantityLibraryState,
  writeKpExactFractionQuantityLibraryState,
  type KpExactFractionQuantityLibraryState
} from "./exact-fraction-quantity-library-state.ts";

interface ExactSurfaceSession {
  readonly runtime: KpExactFractionQuantityRuntimeSession;
  libraryState: KpExactFractionQuantityLibraryState;
  initializedFromRoute: boolean;
  symbolicGeneration: number;
  symbolicBeatIndex?: number | undefined;
  symbolicPlayback?: KpNativeKatexRendererSession | undefined;
  symbolicFontReadiness?: ReturnType<
    typeof createKpEquationFontReadiness
  > | undefined;
  lastUrlWriteMs: number;
}

const sessions = new WeakMap<HTMLElement, ExactSurfaceSession>();

export const kpEditorExactFractionQuantitySurfaceAdapter:
KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.exact-fraction-quantity.synchronized",
  slotKind: "diagram",
  priority: 100,
  supports(state) {
    return state.animationId === kpExactFractionQuantityAnimationId;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      const routeState = readKpExactFractionQuantityLibraryState(
        player.ownerDocument.defaultView?.location.search ?? ""
      );
      session = {
        runtime: createKpExactFractionQuantityRuntimeSession(),
        libraryState: routeState,
        initializedFromRoute: false,
        symbolicGeneration: 0,
        lastUrlWriteMs: 0
      };
      sessions.set(player, session);
      mountSurface(player, slot, session);
    }
    if (!session.initializedFromRoute) {
      session.initializedFromRoute = true;
      if (session.libraryState.progress !== state.progress) {
        dispatchKpEditorAnimationPlaybackAction(player, {
          type: "seek",
          progress: session.libraryState.progress
        });
        return;
      }
    }
    session.libraryState = createKpExactFractionQuantityLibraryState({
      ...session.libraryState,
      progress: state.progress
    });
    const frame = sampleKpExactFractionQuantityRuntime({
      session: session.runtime,
      clock: {
        direction: state.direction,
        progress: state.progress
      }
    });
    syncSurface(player, slot, session, frame);
  }
};

export function registerKpEditorExactFractionQuantitySurfaceAdapter():
() => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorExactFractionQuantitySurfaceAdapter
  );
}

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  session: ExactSurfaceSession
): void {
  slot.innerHTML = renderSurfaceShell(session.libraryState);
  slot.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-exact-checkpoint-start], [data-kp-exact-active-view]"
        )
      : null;
    if (target === null) return;
    const checkpointStart = target.dataset["kpExactCheckpointStart"];
    const activeView = target.dataset["kpExactActiveView"];
    if (checkpointStart !== undefined) {
      const progress = Number(checkpointStart) / 1_000;
      session.libraryState = createKpExactFractionQuantityLibraryState({
        ...session.libraryState,
        progress
      });
      writeRoute(player, session, true);
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress
      });
      return;
    }
    if (isExactView(activeView)) {
      session.libraryState = createKpExactFractionQuantityLibraryState({
        ...session.libraryState,
        activeView
      });
      player.dataset["kpExactActiveRepresentation"] = activeView;
      syncActiveView(slot, session.libraryState);
      writeRoute(player, session, true);
    }
  });
  slot.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement &&
      target.dataset["kpExactFoldMode"] !== undefined) {
      const foldMode = target.value as KpExactFractionQuantityFoldMode;
      session.libraryState = createKpExactFractionQuantityLibraryState({
        ...session.libraryState,
        foldMode,
        ...(foldMode === "pinned"
          ? {
              pinnedNodeIds:
                session.libraryState.pinnedNodeIds.length > 0
                  ? session.libraryState.pinnedNodeIds
                  : [KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[0]]
            }
          : { pinnedNodeIds: [] })
      });
      player.dataset["kpExactFoldMode"] = session.libraryState.foldMode;
      syncFoldControls(slot, session.libraryState);
      writeRoute(player, session, true);
      return;
    }
    if (target instanceof HTMLInputElement &&
      target.dataset["kpExactPinNode"] !== undefined) {
      const pin = target.dataset["kpExactPinNode"];
      const pins = KP_EXACT_FRACTION_FOLDABLE_NODE_IDS.filter((nodeId) =>
        nodeId === pin ? target.checked :
          session.libraryState.pinnedNodeIds.includes(nodeId)
      );
      session.libraryState = createKpExactFractionQuantityLibraryState({
        ...session.libraryState,
        foldMode: "pinned",
        pinnedNodeIds: pins.length > 0
          ? pins
          : [KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[0]]
      });
      player.dataset["kpExactFoldMode"] = session.libraryState.foldMode;
      syncFoldControls(slot, session.libraryState);
      writeRoute(player, session, true);
    }
  });
}

function syncSurface(
  player: HTMLElement,
  slot: HTMLElement,
  session: ExactSurfaceSession,
  frame: KpExactFractionQuantityRuntimeFrame
): void {
  const beatIndex = frame.projection.neutralFrame.beat.index;
  const checkpoint = manifest.checkpoints[beatIndex]!;
  player.dataset["kpExactActiveRepresentation"] =
    session.libraryState.activeView;
  player.dataset["kpExactFoldMode"] = session.libraryState.foldMode;
  player.dataset["kpExactPhase"] = frame.presentationBeatId;
  player.dataset["kpExactCheckpoint"] = checkpoint.id;
  player.dataset["kpExactProgressPermille"] =
    String(frame.projection.neutralFrame.progressPermille);
  player.dataset["kpExactRendererSessionId"] = frame.rendererSessionId;
  player.dataset["kpExactPaintOwnership"] = frame.ownershipPhase;
  slot.querySelector<HTMLElement>("[data-kp-exact-phase-label]")
    ?.replaceChildren(document.createTextNode(checkpoint.label));
  slot.querySelector<HTMLElement>("[data-kp-exact-progress-label]")
    ?.replaceChildren(document.createTextNode(
      `${frame.projection.neutralFrame.progressPermille / 10}%`
    ));
  syncConcreteViews(slot, frame);
  syncActiveView(slot, session.libraryState);
  syncFoldControls(slot, session.libraryState);
  syncSymbolicScene(slot, session, frame);
  writeRoute(player, session, stateUrlWriteIsDue(session));
}

function syncConcreteViews(
  slot: HTMLElement,
  frame: KpExactFractionQuantityRuntimeFrame
): void {
  const circle = requiredView(slot, "partitioned-circle");
  const bar = requiredView(slot, "fraction-bar");
  const numberLine = requiredView(slot, "number-line");
  circle.innerHTML =
    renderKpExactFractionQuantityCircleSvg(frame.projection.circle);
  bar.innerHTML = renderKpExactFractionQuantityBarSvg(frame.projection.bar);
  numberLine.innerHTML =
    renderKpExactFractionQuantityNumberLineSvg(frame.projection.numberLine);
  for (const view of [circle, bar, numberLine]) {
    view.querySelectorAll<SVGElement>("[data-kp-selected=\"true\"]")
      .forEach((element) => {
        element.classList.add("kp-exact-selected");
        const scale = motifScaleForAtomicElement(frame, element);
        element.style.transformBox = "fill-box";
        element.style.transformOrigin = "center";
        element.style.transform = `scale(${scale})`;
      });
    view.querySelectorAll<SVGElement>("[data-kp-refinement-divider]")
      .forEach((divider) => {
        const progress = Number(divider.dataset["kpProgress"] ?? 0);
        divider.style.strokeDasharray = "100";
        divider.style.strokeDashoffset = String(100 * (1 - progress));
      });
  }
}

function motifScaleForAtomicElement(
  frame: KpExactFractionQuantityRuntimeFrame,
  element: SVGElement
): number {
  const atomicPartId = element.dataset["kpAtomicPartId"];
  const motif = frame.motifFrame;
  if (atomicPartId === undefined || motif === undefined) return 1;
  const candidate = [...motif.sources, ...motif.targets].find(
    ({ entityId }) => entityId === atomicPartId
  );
  if (candidate !== undefined) return candidate.scale;
  const selection = frame.projection.selectionCorrespondences.find(
    ({ atomicPartIds }) => atomicPartIds.includes(atomicPartId)
  );
  const group = [...motif.sources, ...motif.targets].find(
    ({ entityId }) => entityId === selection?.selectionId
  );
  return group?.scale ?? 1;
}

function syncSymbolicScene(
  slot: HTMLElement,
  session: ExactSurfaceSession,
  frame: KpExactFractionQuantityRuntimeFrame
): void {
  const beatIndex = frame.projection.neutralFrame.beat.index;
  if (session.symbolicBeatIndex !== beatIndex) {
    session.symbolicBeatIndex = beatIndex;
    session.symbolicPlayback?.dispose();
    session.symbolicPlayback = undefined;
    const generation = ++session.symbolicGeneration;
    void prepareSymbolicScene({
      slot,
      session,
      beatIndex,
      generation,
      localProgress: frame.projection.neutralFrame.beat.localProgress
    });
    return;
  }
  session.symbolicPlayback?.apply(
    frame.projection.neutralFrame.beat.localProgress
  );
}

async function prepareSymbolicScene(input: {
  readonly slot: HTMLElement;
  readonly session: ExactSurfaceSession;
  readonly beatIndex: number;
  readonly generation: number;
  readonly localProgress: number;
}): Promise<void> {
  const host = requiredView(input.slot, "symbolic");
  const motion = input.session.runtime.symbolic.motionInputs[input.beatIndex]!;
  const sourceEndpoint = requireEndpoint(
    input.session.runtime,
    motion.sourceStateId
  );
  const targetEndpoint = requireEndpoint(
    input.session.runtime,
    motion.targetStateId
  );
  host.innerHTML = `
    <div class="kp-exact-symbolic-scene" data-kp-exact-symbolic-scene>
      <div class="kp-exact-symbolic-material" data-kp-editor-equation-material-layer aria-hidden="true"></div>
      <div class="kp-exact-symbolic-endpoint" data-kp-exact-symbolic-source>
        ${renderSelectorAnnotatedLatexToHtml(sourceEndpoint.annotated)}
      </div>
      <div class="kp-exact-symbolic-endpoint" data-kp-exact-symbolic-target>
        ${renderSelectorAnnotatedLatexToHtml(targetEndpoint.annotated)}
      </div>
    </div>`;
  const stage = required<HTMLElement>(
    host,
    "[data-kp-exact-symbolic-scene]"
  );
  stage.style.opacity = "0";
  const sourceRoot = required<HTMLElement>(
    stage,
    "[data-kp-exact-symbolic-source]"
  );
  const targetRoot = required<HTMLElement>(
    stage,
    "[data-kp-exact-symbolic-target]"
  );
  bindEndpointOwnership(sourceRoot, sourceEndpoint, "source");
  bindEndpointOwnership(targetRoot, targetEndpoint, "target");
  if (motion.sourceStateId === motion.targetStateId) {
    sourceRoot.style.opacity = "1";
    targetRoot.style.opacity = "0";
    stage.style.opacity = "1";
    stage.dataset["kpExactSymbolicStatus"] = "ready";
    stage.dataset["kpExactSymbolicMode"] = "native-continuity";
    return;
  }
  const fontReadiness = createKpEquationFontReadiness(host.ownerDocument);
  input.session.symbolicFontReadiness?.dispose();
  input.session.symbolicFontReadiness = fontReadiness;
  try {
    const [source, target] = await Promise.all([
      settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "source",
        stage,
        root: sourceRoot,
        semanticEntityId: sourceEndpoint.stateId,
        presentationGroupId: `group.exact-fraction.source.${input.beatIndex}`,
        fontReadiness
      }),
      settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "target",
        stage,
        root: targetRoot,
        semanticEntityId: targetEndpoint.stateId,
        presentationGroupId: `group.exact-fraction.target.${input.beatIndex}`,
        fontReadiness
      })
    ]);
    if (
      input.session.symbolicGeneration !== input.generation ||
      input.session.symbolicBeatIndex !== input.beatIndex
    ) return;
    const relations = symbolicPaintRelations(motion);
    const canonical = createKpCanonicalNativeKatexSceneSession({
      source,
      target,
      relations,
      fanInRouting: motion.selectorTransitions.some(
        ({ lifecycle }) => lifecycle === "fusion"
      )
    });
    input.session.symbolicPlayback = canonical.session;
    canonical.session.apply(input.localProgress);
    stage.style.opacity = "1";
    stage.dataset["kpExactSymbolicStatus"] = "ready";
    stage.dataset["kpExactProtectedTransit"] =
      canonical.protectedTransit.geometryAuthority;
  } catch (error) {
    if (input.session.symbolicGeneration !== input.generation) return;
    stage.dataset["kpExactSymbolicStatus"] = "error";
    stage.dataset["kpExactSymbolicError"] =
      error instanceof Error ? error.message : "unknown";
    stage.style.opacity = "1";
    sourceRoot.style.opacity = "0";
    targetRoot.style.opacity = "1";
  }
}

function bindEndpointOwnership(
  root: HTMLElement,
  endpoint: KpExactFractionSymbolicEndpoint,
  side: "source" | "target"
): void {
  const rootGroup = `group.exact-fraction.${side}.${endpoint.stateId}`;
  root.dataset["kpSemanticEntityId"] = endpoint.stateId;
  root.dataset["kpPresentationGroupId"] = rootGroup;
  for (const annotation of endpoint.annotated.annotations) {
    const element = root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
    );
    if (element === null) {
      throw new Error(
        `Exact-fraction KaTeX omitted selector ${annotation.selectorId}.`
      );
    }
    element.dataset["kpSemanticEntityId"] = annotation.selectorId;
    element.dataset["kpPresentationGroupId"] =
      `${rootGroup}.selector.${annotation.selectorId}`;
    element.dataset["kpSemanticSelectorId"] = annotation.selectorId;
  }
  const rules = [...root.querySelectorAll<HTMLElement>(".frac-line")];
  if (rules.length !== endpoint.structuralAnchors.length) {
    throw new Error(
      `Exact-fraction endpoint ${endpoint.stateId} has ${rules.length} ` +
      `rules for ${endpoint.structuralAnchors.length} anchors.`
    );
  }
  endpoint.structuralAnchors.forEach((anchor, index) => {
    const rule = rules[index]!;
    rule.dataset["kpSemanticEntityId"] = anchor.id;
    rule.dataset["kpPresentationGroupId"] =
      `${rootGroup}.structure.${anchor.id}`;
  });
}

function symbolicPaintRelations(
  motion: KpExactFractionSymbolicMotionInput
) {
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [
      ...motion.selectorTransitions,
      ...motion.structuralTransitions
    ].map((transition, index) => ({
      id: `${motion.beatId}.${index}`,
      kind: transition.lifecycle === "fusion"
        ? "many-to-one" as const
        : transition.lifecycle === "fission"
          ? "one-to-many" as const
          : "one-to-one" as const,
      sourceEntityIds: transition.sourceIds,
      targetEntityIds: transition.targetIds
    }))
  });
}

function syncActiveView(
  slot: HTMLElement,
  state: KpExactFractionQuantityLibraryState
): void {
  slot.dataset["kpExactActiveView"] = state.activeView;
  slot.querySelector<HTMLElement>("[data-kp-exact-quantity-surface]")
    ?.setAttribute("data-kp-exact-active-view", state.activeView);
  slot.querySelectorAll<HTMLElement>("[data-kp-exact-active-view]")
    .forEach((button) => button.setAttribute(
      "aria-pressed",
      String(button.dataset["kpExactActiveView"] === state.activeView)
    ));
}

function syncFoldControls(
  slot: HTMLElement,
  state: KpExactFractionQuantityLibraryState
): void {
  const select = slot.querySelector<HTMLSelectElement>(
    "[data-kp-exact-fold-mode]"
  );
  if (select !== null) select.value = state.foldMode;
  slot.querySelectorAll<HTMLInputElement>("[data-kp-exact-pin-node]")
    .forEach((input) => {
      input.checked = state.pinnedNodeIds.includes(
        input.dataset["kpExactPinNode"]!
      );
    });
  const projection = compileKpExactFractionQuantityFoldProjection({
    intent: createKpExactFractionQuantityFoldIntent({
      mode: state.foldMode,
      ...(state.foldMode === "pinned"
        ? { pinnedNodeIds: state.pinnedNodeIds }
        : {})
    }),
    detailBudget: "balanced"
  });
  slot.querySelector<HTMLElement>("[data-kp-exact-fold-summary]")
    ?.replaceChildren(document.createTextNode(
      projection.collapsedNodeIds.length === 0
        ? "All causal beats visible"
        : `${projection.collapsedNodeIds.length} group` +
          `${projection.collapsedNodeIds.length === 1 ? "" : "s"} folded`
    ));
}

function writeRoute(
  player: HTMLElement,
  session: ExactSurfaceSession,
  enabled: boolean
): void {
  if (!enabled) return;
  const view = player.ownerDocument.defaultView;
  if (view === null) return;
  const search = writeKpExactFractionQuantityLibraryState({
    search: view.location.search,
    state: session.libraryState
  });
  view.history.replaceState(
    null,
    "",
    `${view.location.pathname}${search}${view.location.hash}`
  );
  session.lastUrlWriteMs = performance.now();
}

function stateUrlWriteIsDue(session: ExactSurfaceSession): boolean {
  return performance.now() - session.lastUrlWriteMs >= 125;
}

function renderSurfaceShell(
  state: KpExactFractionQuantityLibraryState
): string {
  return `
    <section class="kp-exact-quantity" data-kp-exact-quantity-surface>
      <style>
        .kp-exact-quantity { --kp-exact-ink:#183247; --kp-exact-accent:#1f7893; color:var(--kp-exact-ink); }
        .kp-exact-quantity__header { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:.75rem; margin-block-end:.75rem; }
        .kp-exact-quantity__header p { margin:0; }
        .kp-exact-quantity__views, .kp-exact-quantity__checkpoints { display:flex; gap:.35rem; flex-wrap:wrap; }
        .kp-exact-quantity button[aria-pressed="true"] { background:var(--kp-exact-ink); color:white; }
        .kp-exact-quantity__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; min-height:32rem; }
        .kp-exact-quantity__view { position:relative; display:grid; place-items:center; min-width:0; min-height:14rem; overflow:hidden; border:1px solid color-mix(in srgb,var(--kp-exact-ink) 18%,transparent); border-radius:.75rem; background:#fbfcfd; }
        .kp-exact-quantity__view h4 { position:absolute; inset:.6rem auto auto .75rem; margin:0; z-index:3; font:600 .72rem/1 system-ui; letter-spacing:.06em; text-transform:uppercase; }
        .kp-exact-quantity__canvas { width:100%; min-width:0; }
        .kp-exact-quantity__canvas svg { display:block; width:100%; max-height:12rem; overflow:visible; }
        .kp-exact-quantity__canvas svg path, .kp-exact-quantity__canvas svg rect { fill:#edf2f4; stroke:#577181; stroke-width:2; vector-effect:non-scaling-stroke; transition:transform 90ms linear; }
        .kp-exact-quantity__canvas svg line { stroke:#577181; stroke-width:2; vector-effect:non-scaling-stroke; }
        .kp-exact-quantity__canvas svg text { fill:var(--kp-exact-ink); font:14px system-ui; }
        .kp-exact-quantity__canvas svg .kp-exact-selected { fill:#9ed9e6; stroke:var(--kp-exact-accent); stroke-width:3; }
        .kp-exact-symbolic-scene { position:relative; display:grid; place-items:center; width:100%; min-height:9rem; font-size:1.5rem; }
        .kp-exact-symbolic-material { position:absolute; inset:0; z-index:2; pointer-events:none; }
        .kp-exact-symbolic-material .editor-equation-stage__material-owner { position:absolute; display:block; transform-origin:top left; }
        .kp-exact-symbolic-endpoint { position:absolute; inset:0; display:grid; place-items:center; width:100%; }
        .kp-exact-quantity__outline { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; margin-block:.7rem; }
        .kp-exact-quantity__outline label { display:flex; gap:.3rem; align-items:center; }
        .kp-exact-quantity__pins { display:flex; gap:.65rem; flex-wrap:wrap; }
        @media (max-width:759px) {
          .kp-exact-quantity__grid { grid-template-columns:1fr; min-height:18rem; }
          .kp-exact-quantity__view { display:none; min-height:18rem; }
          .kp-exact-quantity[data-kp-exact-active-view="symbolic"] [data-kp-exact-view="symbolic"],
          .kp-exact-quantity[data-kp-exact-active-view="partitioned-circle"] [data-kp-exact-view="partitioned-circle"],
          .kp-exact-quantity[data-kp-exact-active-view="fraction-bar"] [data-kp-exact-view="fraction-bar"],
          .kp-exact-quantity[data-kp-exact-active-view="number-line"] [data-kp-exact-view="number-line"] { display:grid; }
        }
        @media (min-width:760px) { .kp-exact-quantity__views { display:none; } }
      </style>
      <header class="kp-exact-quantity__header">
        <p><strong data-kp-exact-phase-label>Exact fraction quantity</strong><br><span data-kp-exact-progress-label>0%</span></p>
        <div class="kp-exact-quantity__views" role="group" aria-label="Active representation">
          ${viewButtons(state.activeView)}
        </div>
      </header>
      <nav class="kp-exact-quantity__checkpoints" aria-label="Animation checkpoint starts">
        ${manifest.checkpoints.map((checkpoint, index) =>
          `<button type="button" data-kp-exact-checkpoint-start="${manifest.pacing[index]!.startPermille}">${escapeHtml(checkpoint.label)}</button>`
        ).join("")}
      </nav>
      <div class="kp-exact-quantity__outline">
        <label>Evaluation detail
          <select data-kp-exact-fold-mode>
            ${(["automatic", "expanded", "collapsed", "pinned"] as const).map(
              (mode) => `<option value="${mode}"${mode === state.foldMode ? " selected" : ""}>${mode}</option>`
            ).join("")}
          </select>
        </label>
        <span data-kp-exact-fold-summary></span>
        <div class="kp-exact-quantity__pins" role="group" aria-label="Pinned evaluation groups">
          ${KP_EXACT_FRACTION_FOLDABLE_NODE_IDS.map((nodeId, index) =>
            `<label><input type="checkbox" data-kp-exact-pin-node="${nodeId}"${state.pinnedNodeIds.includes(nodeId) ? " checked" : ""}>${index === 0 ? "common sixths" : "compose half"}</label>`
          ).join("")}
        </div>
      </div>
      <div class="kp-exact-quantity__grid">
        ${viewShell("symbolic", "Symbolic")}
        ${viewShell("partitioned-circle", "Partitioned circle")}
        ${viewShell("fraction-bar", "Fraction bar")}
        ${viewShell("number-line", "Number line")}
      </div>
    </section>`;
}

function viewButtons(active: KpExactFractionQuantityViewKind): string {
  return (manifest.viewObligations as readonly KpExactFractionQuantityViewKind[])
    .map((view) =>
      `<button type="button" data-kp-exact-active-view="${view}" aria-pressed="${view === active}">${escapeHtml(view.replaceAll("-", " "))}</button>`
    ).join("");
}

function viewShell(
  view: KpExactFractionQuantityViewKind,
  label: string
): string {
  return `<article class="kp-exact-quantity__view" data-kp-exact-view="${view}"><h4>${label}</h4><div class="kp-exact-quantity__canvas" data-kp-exact-view-canvas="${view}"></div></article>`;
}

function requiredView(
  root: ParentNode,
  view: KpExactFractionQuantityViewKind
): HTMLElement {
  return required(
    root,
    `[data-kp-exact-view-canvas="${view}"]`
  );
}

function requireEndpoint(
  session: KpExactFractionQuantityRuntimeSession,
  stateId: string
): KpExactFractionSymbolicEndpoint {
  const endpoint = session.symbolic.endpoints.find(
    (candidate) => candidate.stateId === stateId
  );
  if (endpoint === undefined) {
    throw new Error(`Missing exact-fraction endpoint ${stateId}.`);
  }
  return endpoint;
}

function required<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const result = root.querySelector<T>(selector);
  if (result === null) throw new Error(`Missing exact surface ${selector}.`);
  return result;
}

function isExactView(
  value: string | undefined
): value is KpExactFractionQuantityViewKind {
  return value !== undefined &&
    (manifest.viewObligations as readonly string[]).includes(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
