/// <reference types="vite/client" />

import {
  createKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime,
  type KpExactFractionQuantityRuntimeFrame,
  type KpExactFractionQuantityRuntimeSession
} from "../rendering/exact-fraction-quantity-runtime.ts";
import type {
  KpExactFractionQuantityAccessibleProjection
} from "../rendering/exact-fraction-quantity-accessible-projection.ts";
import {
  kpExactFractionQuantityAnimationId
} from "../animation/exact-fraction-quantity-adapter.ts";
import {
  settleKpExactFractionQuantityAccessibilityProgress,
  type KpExactFractionQuantityAccessibilityMode
} from "../animation/exact-fraction-quantity-accessibility-sampling.ts";
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
  kpExactFractionQuantityLayoutPolicy
} from "../semantic/exact-fraction-quantity-layout-policy.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  syncKpExactFractionQuantityConcreteScenes
} from "../rendering/exact-fraction-quantity-concrete-scene.ts";
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
  KpExactFractionSymbolicMotionSegment
} from "../rendering/exact-fraction-quantity-symbolic-projection.ts";
import {
  commitKpNativeSceneCandidate,
  discardKpNativeSceneCandidate,
  prepareKpNativeSceneCandidate
} from "../rendering/prepared-native-scene-host.ts";
import type {
  KpExactFractionQuantityStaticStepExport,
  KpExactFractionQuantityStaticStepFrame
} from "../tutorial/exact-fraction-quantity-static-step-export.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT,
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
  symbolicMotionSegmentId?: string | undefined;
  symbolicPendingProgress: number;
  symbolicActiveStage?: HTMLElement | undefined;
  symbolicPlayback?: KpNativeKatexRendererSession | undefined;
  symbolicFontReadiness?: ReturnType<
    typeof createKpEquationFontReadiness
  > | undefined;
  lastFrame?: KpExactFractionQuantityRuntimeFrame | undefined;
  sampleCount: number;
  repeatedFrameReuseCount: number;
  symbolicPlaybackCreatedCount: number;
  symbolicPlaybackDisposedCount: number;
  disposed: boolean;
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
        symbolicPendingProgress: 0,
        sampleCount: 0,
        repeatedFrameReuseCount: 0,
        symbolicPlaybackCreatedCount: 0,
        symbolicPlaybackDisposedCount: 0,
        disposed: false,
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
    player.dataset["kpExactInputProgressPermille"] = String(
      Math.round(state.progress * 1_000)
    );
    const accessibilityMode = exactAccessibilityMode(player);
    player.dataset["kpExactSampledAccessibilityMode"] =
      accessibilityMode;
    const frame = sampleKpExactFractionQuantityRuntime({
      session: session.runtime,
      clock: {
        direction: state.direction,
        progress: settleKpExactFractionQuantityAccessibilityProgress({
          progress: state.progress,
          mode: accessibilityMode
        })
      }
    });
    session.sampleCount += 1;
    // Permille is telemetry, not a cache key: adjacent sub-permille samples can
    // have different transforms and caused history-dependent reverse scrubs.
    const repeatedFrame =
      session.lastFrame?.clock.progress === frame.clock.progress;
    if (repeatedFrame) {
      session.repeatedFrameReuseCount += 1;
    }
    session.lastFrame = frame;
    syncResourceTelemetry(player, session, "active");
    if (repeatedFrame) return;
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
  player.dataset["kpExactSurfaceResources"] = "active";
  player.addEventListener(
    KP_EDITOR_ANIMATION_DISPOSE_EVENT,
    () => disposeExactSurface(player, session),
    { once: true }
  );
  slot.innerHTML = renderSurfaceShell(
    session.libraryState,
    session.runtime.accessibility
  );
  slot.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-exact-checkpoint-start], " +
          "[data-kp-exact-active-view], " +
          "[data-kp-exact-review-progress]"
        )
      : null;
    if (target === null) return;
    const checkpointStart = target.dataset["kpExactCheckpointStart"];
    const activeView = target.dataset["kpExactActiveView"];
    const reviewProgress = target.dataset["kpExactReviewProgress"];
    if (reviewProgress !== undefined) {
      const progress = Number(reviewProgress) / 1_000;
      const reviewView = target.dataset["kpExactReviewView"];
      session.libraryState = createKpExactFractionQuantityLibraryState({
        ...session.libraryState,
        progress,
        ...(isExactView(reviewView) ? { activeView: reviewView } : {})
      });
      writeRoute(player, session, true);
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress
      });
      return;
    }
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
      if (session.lastFrame !== undefined) {
        syncAccessibleSurface(
          slot,
          session.libraryState,
          session.lastFrame,
          session.runtime.accessibility
        );
      }
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
      player.dataset["kpExactPinnedNodeIds"] =
        session.libraryState.pinnedNodeIds.join(",");
      syncFoldControls(slot, session.libraryState);
      if (session.lastFrame !== undefined) {
        syncAccessibleSurface(
          slot,
          session.libraryState,
          session.lastFrame,
          session.runtime.accessibility
        );
      }
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
      player.dataset["kpExactPinnedNodeIds"] =
        session.libraryState.pinnedNodeIds.join(",");
      syncFoldControls(slot, session.libraryState);
      if (session.lastFrame !== undefined) {
        syncAccessibleSurface(
          slot,
          session.libraryState,
          session.lastFrame,
          session.runtime.accessibility
        );
      }
      writeRoute(player, session, true);
    }
  });
  if (import.meta.env.DEV) {
    const reviewSheet = slot.querySelector<HTMLDetailsElement>(
      "[data-kp-exact-review-sheet]"
    );
    reviewSheet?.addEventListener("toggle", () => {
      if (!reviewSheet.open) return;
      void hydrateReviewSheet(player, reviewSheet, session);
    });
  }
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
  player.dataset["kpExactVisiblePhase"] = frame.visibleOperation.phase;
  player.dataset["kpExactMotifInvocationId"] =
    frame.visibleOperation.invocationId;
  const programPhase = frame.visibleOperation.programPhase;
  if (programPhase === undefined) {
    delete player.dataset["kpExactExecutableProgramId"];
    delete player.dataset["kpExactExecutableProgramPhase"];
  } else {
    player.dataset["kpExactExecutableProgramId"] = programPhase.programId;
    player.dataset["kpExactExecutableProgramPhase"] =
      programPhase.phaseId;
  }
  player.dataset["kpExactSymbolicSegment"] =
    frame.symbolicMotion.segment.id;
  player.dataset["kpExactCheckpoint"] = checkpoint.id;
  player.dataset["kpExactProgressPermille"] =
    String(frame.projection.neutralFrame.progressPermille);
  player.dataset["kpExactPhaseProgressPermille"] = String(
    Math.round(frame.visibleOperation.phaseProgress * 1_000)
  );
  player.dataset["kpExactFocusRefs"] =
    frame.projection.neutralFrame.focusSelectionIds.join(",");
  player.dataset["kpExactPinnedNodeIds"] =
    session.libraryState.pinnedNodeIds.join(",");
  player.dataset["kpExactRendererSessionId"] = frame.rendererSessionId;
  player.dataset["kpExactPaintOwnership"] = frame.ownershipPhase;
  slot.querySelector<HTMLElement>("[data-kp-exact-phase-label]")
    ?.replaceChildren(document.createTextNode(checkpoint.label));
  slot.querySelector<HTMLElement>("[data-kp-exact-progress-label]")
    ?.replaceChildren(document.createTextNode(
      `${frame.projection.neutralFrame.progressPermille / 10}%`
    ));
  syncKpExactFractionQuantityConcreteScenes(slot, frame);
  syncActiveView(slot, session.libraryState);
  syncFoldControls(slot, session.libraryState);
  syncCheckpointControls(slot, beatIndex);
  syncReviewSheetControls(
    slot,
    frame.projection.neutralFrame.progressPermille
  );
  syncAccessibleSurface(
    slot,
    session.libraryState,
    frame,
    session.runtime.accessibility
  );
  syncSymbolicScene(slot, session, frame);
  writeRoute(player, session, stateUrlWriteIsDue(session));
}

function syncSymbolicScene(
  slot: HTMLElement,
  session: ExactSurfaceSession,
  frame: KpExactFractionQuantityRuntimeFrame
): void {
  const { segment, segmentProgress } = frame.symbolicMotion;
  session.symbolicPendingProgress = segmentProgress;
  if (session.symbolicMotionSegmentId !== segment.id) {
    session.symbolicMotionSegmentId = segment.id;
    const generation = ++session.symbolicGeneration;
    void prepareSymbolicScene({
      slot,
      session,
      segment,
      generation,
      invocationId: frame.visibleOperation.invocationId,
      dispatch: frame.symbolicMotion.dispatch
    });
    return;
  }
  session.symbolicPlayback?.apply(segmentProgress);
}

async function prepareSymbolicScene(input: {
  readonly slot: HTMLElement;
  readonly session: ExactSurfaceSession;
  readonly segment: KpExactFractionSymbolicMotionSegment;
  readonly generation: number;
  readonly invocationId: string;
  readonly dispatch:
    KpExactFractionQuantityRuntimeFrame["symbolicMotion"]["dispatch"];
}): Promise<void> {
  const host = requiredView(input.slot, "symbolic");
  const sourceEndpoint = requireEndpoint(
    input.session.runtime,
    input.segment.sourceStateId
  );
  const targetEndpoint = requireEndpoint(
    input.session.runtime,
    input.segment.targetStateId
  );
  const stage = host.ownerDocument.createElement("div");
  stage.className = "kp-exact-symbolic-scene";
  stage.dataset["kpExactSymbolicScene"] = "";
  stage.dataset["kpExactSymbolicSegment"] = input.segment.id;
  stage.dataset["kpExactMotifInvocationId"] = input.invocationId;
  stage.innerHTML = `
    <div class="kp-exact-symbolic-material" data-kp-editor-equation-material-layer aria-hidden="true"></div>
    <div class="kp-exact-symbolic-endpoint" data-kp-exact-symbolic-source>
      ${renderSelectorAnnotatedLatexToHtml(sourceEndpoint.annotated)}
    </div>
    <div class="kp-exact-symbolic-endpoint" data-kp-exact-symbolic-target>
      ${renderSelectorAnnotatedLatexToHtml(targetEndpoint.annotated)}
    </div>`;
  host.append(stage);
  const candidate = prepareKpNativeSceneCandidate({ host, stage });
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
  if (input.segment.sourceStateId === input.segment.targetStateId) {
    sourceRoot.style.opacity = "1";
    targetRoot.style.opacity = "0";
    stage.dataset["kpExactSymbolicStatus"] = "ready";
    stage.dataset["kpExactSymbolicMode"] = "native-continuity";
    commitPreparedSymbolicScene({
      session: input.session,
      candidate,
      stage
    });
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
        presentationGroupId:
          `group.exact-fraction.source.${input.segment.id}`,
        fontReadiness
      }),
      settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "target",
        stage,
        root: targetRoot,
        semanticEntityId: targetEndpoint.stateId,
        presentationGroupId:
          `group.exact-fraction.target.${input.segment.id}`,
        fontReadiness
      })
    ]);
    if (
      input.session.symbolicGeneration !== input.generation ||
      input.session.symbolicMotionSegmentId !== input.segment.id
    ) {
      discardKpNativeSceneCandidate(candidate);
      return;
    }
    const relations = symbolicPaintRelations(input.segment);
    const canonical = createKpCanonicalNativeKatexSceneSession({
      source,
      target,
      relations,
      successorSyntheses: input.segment.successorSyntheses.map((binding) => ({
        binding,
        direction: "forward",
        motion: "full",
        legacyContinuityAuthority: "exact-fraction-quantity-v0"
      })),
      endpointDwellFraction: 0.04,
      fanInRouting: input.dispatch === "merge-fan-in",
      copyFanOutRouting: input.dispatch === "copy-fan-out"
    });
    input.session.symbolicPlaybackCreatedCount += 1;
    canonical.session.apply(input.session.symbolicPendingProgress);
    commitPreparedSymbolicScene({
      session: input.session,
      candidate,
      stage,
      playback: canonical.session
    });
    const player = input.slot.closest<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    if (player !== null) {
      syncResourceTelemetry(player, input.session, "active");
    }
    stage.dataset["kpExactSymbolicStatus"] = "ready";
    stage.dataset["kpExactProtectedTransit"] =
      canonical.protectedTransit.geometryAuthority;
  } catch (error) {
    if (
      input.session.symbolicGeneration !== input.generation ||
      input.session.symbolicMotionSegmentId !== input.segment.id
    ) {
      if (stage.isConnected) discardKpNativeSceneCandidate(candidate);
      return;
    }
    stage.dataset["kpExactSymbolicStatus"] = "error";
    stage.dataset["kpExactSymbolicError"] =
      error instanceof Error ? error.message : "unknown";
    sourceRoot.style.opacity = "0";
    targetRoot.style.opacity = "1";
    commitPreparedSymbolicScene({
      session: input.session,
      candidate,
      stage
    });
  }
}

function commitPreparedSymbolicScene(input: {
  readonly session: ExactSurfaceSession;
  readonly candidate: ReturnType<typeof prepareKpNativeSceneCandidate>;
  readonly stage: HTMLElement;
  readonly playback?: KpNativeKatexRendererSession | undefined;
}): void {
  const previousPlayback = input.session.symbolicPlayback;
  commitKpNativeSceneCandidate({
    candidate: input.candidate,
    previousStage: input.session.symbolicActiveStage
  });
  input.session.symbolicActiveStage = input.stage;
  input.session.symbolicPlayback = input.playback;
  if (previousPlayback !== undefined) {
    previousPlayback.dispose();
    input.session.symbolicPlaybackDisposedCount += 1;
  }
}

function disposeExactSurface(
  player: HTMLElement,
  session: ExactSurfaceSession
): void {
  // Incrementing the generation makes any in-flight font measurement retire
  // without publishing a session after this player has left the library.
  session.symbolicGeneration += 1;
  session.disposed = true;
  releaseSymbolicPlayback(session);
  session.symbolicFontReadiness?.dispose();
  session.symbolicFontReadiness = undefined;
  sessions.delete(player);
  syncResourceTelemetry(player, session, "disposed");
}

async function hydrateReviewSheet(
  player: HTMLElement,
  details: HTMLDetailsElement,
  session: ExactSurfaceSession
): Promise<void> {
  const host = required<HTMLElement>(
    details,
    "[data-kp-exact-review-sheet-content]"
  );
  if (
    host.dataset["kpExactReviewSheetStatus"] === "ready" ||
    host.dataset["kpExactReviewSheetStatus"] === "loading"
  ) return;
  host.dataset["kpExactReviewSheetStatus"] = "loading";
  details.setAttribute("aria-busy", "true");
  const { createKpExactFractionQuantityStaticStepExport } =
    await import(
      "../tutorial/exact-fraction-quantity-static-step-export.ts"
    );
  if (session.disposed || !player.isConnected) return;
  const sequence = createKpExactFractionQuantityStaticStepExport();
  host.innerHTML = renderReviewSheet(sequence);
  host.dataset["kpExactReviewSheetStatus"] = "ready";
  details.removeAttribute("aria-busy");
  if (session.lastFrame !== undefined) {
    syncReviewSheetControls(
      details,
      session.lastFrame.projection.neutralFrame.progressPermille
    );
  }
}

function renderReviewSheet(
  sequence: KpExactFractionQuantityStaticStepExport
): string {
  return `
    <section aria-labelledby="kp-exact-wide-review-title">
      <h5 id="kp-exact-wide-review-title">Wide · four synchronized views</h5>
      <div class="kp-exact-review-sheet__grid kp-exact-review-sheet__grid--wide">
        ${sequence.steps.map(({ frame }, index) =>
          renderReviewCard(frame, index, "wide")
        ).join("")}
      </div>
    </section>
    <section aria-labelledby="kp-exact-phone-review-title">
      <h5 id="kp-exact-phone-review-title">Phone · one focused view</h5>
      <div class="kp-exact-review-sheet__grid kp-exact-review-sheet__grid--phone">
        ${sequence.steps.map(({ frame }, index) =>
          renderReviewCard(frame, index, "phone")
        ).join("")}
      </div>
    </section>`;
}

function renderReviewCard(
  frame: KpExactFractionQuantityStaticStepFrame,
  index: number,
  profile: "wide" | "phone"
): string {
  const progressPermille = Math.round(frame.progress * 1_000);
  const phoneView =
    manifest.review.phoneViewSequence[index]! as
      KpExactFractionQuantityViewKind;
  const preview = profile === "wide"
    ? (manifest.viewObligations as readonly KpExactFractionQuantityViewKind[])
        .map((view) => `
          <span class="kp-exact-review-sheet__view" data-kp-exact-review-preview-view="${view}">
            ${staticRepresentationHtml(frame, view)}
          </span>`)
        .join("")
    : `<span class="kp-exact-review-sheet__view" data-kp-exact-review-preview-view="${phoneView}">
        ${staticRepresentationHtml(frame, phoneView)}
      </span>`;
  return `
    <article class="kp-exact-review-sheet__card" data-kp-exact-review-card-profile="${profile}">
      <button type="button"
        data-kp-exact-review-progress="${progressPermille}"
        ${profile === "phone"
          ? `data-kp-exact-review-view="${phoneView}"`
          : ""}
        aria-label="${escapeHtml(
          `${profile} checkpoint ${index + 1}: ${frame.state.description}`
        )}">
        <span class="kp-exact-review-sheet__meta">
          <b>${String(index + 1).padStart(2, "0")}</b>
          <span>${escapeHtml(frame.state.description)}</span>
          <code>${progressPermille / 10}%</code>
        </span>
        <span class="kp-exact-review-sheet__preview kp-exact-review-sheet__preview--${profile}" aria-hidden="true">
          ${preview}
        </span>
      </button>
    </article>`;
}

function staticRepresentationHtml(
  frame: KpExactFractionQuantityStaticStepFrame,
  view: KpExactFractionQuantityViewKind
): string {
  switch (view) {
    case "symbolic":
      return frame.representations.symbolic.htmlAndMathml;
    case "partitioned-circle":
      return frame.representations.partitionedCircle.svg;
    case "fraction-bar":
      return frame.representations.fractionBar.svg;
    case "number-line":
      return frame.representations.numberLine.svg;
  }
}

function syncReviewSheetControls(
  root: ParentNode,
  progressPermille: number
): void {
  root.querySelectorAll<HTMLElement>("[data-kp-exact-review-progress]")
    .forEach((button) => {
      if (
        Number(button.dataset["kpExactReviewProgress"]) ===
        progressPermille
      ) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });
}

function releaseSymbolicPlayback(session: ExactSurfaceSession): void {
  if (session.symbolicPlayback === undefined) return;
  session.symbolicPlayback.dispose();
  session.symbolicPlayback = undefined;
  session.symbolicPlaybackDisposedCount += 1;
}

function syncResourceTelemetry(
  player: HTMLElement,
  session: ExactSurfaceSession,
  status: "active" | "disposed"
): void {
  player.dataset["kpExactSurfaceResources"] = status;
  player.dataset["kpExactSampleCount"] = String(session.sampleCount);
  player.dataset["kpExactRepeatedFrameReuseCount"] = String(
    session.repeatedFrameReuseCount
  );
  player.dataset["kpExactSymbolicPlaybackCreatedCount"] = String(
    session.symbolicPlaybackCreatedCount
  );
  player.dataset["kpExactSymbolicPlaybackDisposedCount"] = String(
    session.symbolicPlaybackDisposedCount
  );
  player.dataset["kpExactSymbolicPlaybackActiveCount"] = String(
    session.symbolicPlayback === undefined ? 0 : 1
  );
  player.dataset["kpExactWebglLeaseCount"] = "0";
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
    const envelope = endpoint.groupEnvelopes.find(
      ({ memberSelectorIds }) =>
        memberSelectorIds.includes(annotation.selectorId)
    );
    element.dataset["kpPresentationGroupId"] =
      envelope === undefined
        ? `${rootGroup}.selector.${annotation.selectorId}`
        : `${rootGroup}.envelope.${envelope.id}`;
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
      `${rootGroup}.envelope.${anchor.ownerNodeId}`;
  });
}

function symbolicPaintRelations(
  motion: KpExactFractionSymbolicMotionSegment
) {
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [
      ...motion.selectorTransitions,
      ...motion.structuralTransitions
    ].map((transition, index) => ({
      id: `${motion.id}.${index}`,
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

function syncCheckpointControls(
  slot: HTMLElement,
  beatIndex: number
): void {
  slot.querySelectorAll<HTMLElement>("[data-kp-exact-checkpoint-start]")
    .forEach((button, index) => {
      if (index === beatIndex) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });
}

function syncAccessibleSurface(
  slot: HTMLElement,
  state: KpExactFractionQuantityLibraryState,
  frame: KpExactFractionQuantityRuntimeFrame,
  projection: KpExactFractionQuantityAccessibleProjection
): void {
  const step = frame.projection.neutralFrame.beat.index;
  const current = projection.steps[step]!;
  const host = required<HTMLElement>(
    slot,
    "[data-kp-exact-accessible-state]"
  );
  const stateKey = [
    current.checkpointId,
    state.activeView,
    state.foldMode,
    state.pinnedNodeIds.join(",")
  ].join("|");
  if (host.dataset["kpExactAccessibleStateKey"] === stateKey) return;
  host.dataset["kpExactAccessibleStateKey"] = stateKey;
  host.dataset["kpExactAccessibleCheckpoint"] = current.checkpointId;
  host.dataset["kpExactAccessibleView"] = state.activeView;
  host.dataset["kpExactAccessibleFoldMode"] = state.foldMode;
  host.innerHTML = `
    <h4>Current exact-quantity checkpoint</h4>
    <div data-kp-exact-accessible-math>${current.nativeHtmlAndMathml}</div>
    <p>${escapeHtml(current.label)}. ${escapeHtml(current.description)}</p>
    ${state.activeView === "symbolic"
      ? ""
      : `<p>${escapeHtml(accessibleViewSummary(frame, state.activeView))}</p>`}
    <p>Visual representation: ${escapeHtml(
      state.activeView.replaceAll("-", " ")
    )}. Evaluation detail: ${escapeHtml(state.foldMode)}. Folding changes disclosure only.</p>
    <p>Focused quantities: ${current.focusSelectionIds.map(
      (selectionId) =>
        `<a href="#${escapeHtml(`transcript.selection.${selectionId}`)}">${escapeHtml(selectionLabel(selectionId))}</a>`
    ).join(", ")}.</p>`;
  slot.querySelectorAll<HTMLElement>("[data-kp-exact-transcript-step]")
    .forEach((item, index) => {
      if (index === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
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

function exactAccessibilityMode(
  player: HTMLElement
): KpExactFractionQuantityAccessibilityMode {
  const value = player.dataset["kpEditorAnimationAccessibilityMode"];
  return value === "reduced-motion" ||
    value === "static" ||
    value === "narrated"
    ? value
    : "full-motion";
}

function accessibleViewSummary(
  frame: KpExactFractionQuantityRuntimeFrame,
  view: KpExactFractionQuantityViewKind
): string {
  switch (view) {
    case "symbolic":
      return "";
    case "partitioned-circle":
      return frame.projection.circle.accessibleSummary;
    case "fraction-bar":
      return frame.projection.bar.accessibleSummary;
    case "number-line":
      return frame.projection.numberLine.accessibleSummary;
  }
}

function renderAccessibleTranscript(
  projection: KpExactFractionQuantityAccessibleProjection
): string {
  const transcriptRefs = [...new Set(
    projection.steps.flatMap(({ transcriptRefIds }) => transcriptRefIds)
  )];
  return `
    <details class="kp-exact-quantity__transcript" data-kp-exact-transcript>
      <summary>Accessible transcript: all five operations</summary>
      <p>${escapeHtml(projection.introduction)}</p>
      <ol>
        ${projection.steps.map((step) => `
          <li data-kp-exact-transcript-step="${escapeHtml(step.beatId)}">
            <strong>${escapeHtml(step.label)}.</strong>
            ${escapeHtml(step.description)}
          </li>`
        ).join("")}
      </ol>
      <p>${escapeHtml(projection.finalStatement)}</p>
      <dl class="kp-exact-sr-only" data-kp-exact-transcript-references>
        ${transcriptRefs.map((transcriptRefId) => {
          const selectionId = transcriptRefId.replace(
            "transcript.selection.",
            ""
          );
          return `<div id="${escapeHtml(transcriptRefId)}"><dt>${escapeHtml(selectionLabel(selectionId))}</dt><dd>${escapeHtml(selectionId)}</dd></div>`;
        }).join("")}
      </dl>
    </details>`;
}

function selectionLabel(selectionId: string): string {
  switch (selectionId) {
    case "selection.addend.one-third":
      return "one-third addend";
    case "selection.addend.one-third-as-two-sixths":
      return "same one-third addend as two sixths";
    case "selection.addend.one-sixth":
      return "one-sixth addend";
    case "selection.sum.three-sixths":
      return "merged three-sixths result";
    case "selection.result.one-half":
      return "same result regrouped as one half";
    default:
      return "selected exact quantity";
  }
}

function renderSurfaceShell(
  state: KpExactFractionQuantityLibraryState,
  accessibility: KpExactFractionQuantityAccessibleProjection
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
        .kp-exact-quantity__canvas svg path, .kp-exact-quantity__canvas svg rect { fill:#edf2f4; stroke:#577181; stroke-width:2; vector-effect:non-scaling-stroke; }
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
        .kp-exact-sr-only { position:absolute !important; width:1px !important; height:1px !important; padding:0 !important; margin:-1px !important; overflow:hidden !important; clip:rect(0,0,0,0) !important; white-space:nowrap !important; border:0 !important; }
        .kp-exact-quantity__transcript { margin-block:1rem 0; }
        .kp-exact-quantity__transcript li[aria-current="step"] { font-weight:700; }
        ${import.meta.env.DEV ? reviewSheetStyles() : ""}
        @media (max-width:${kpExactFractionQuantityLayoutPolicy.wideMinWidthPx - 1}px) {
          .kp-exact-quantity__grid { grid-template-columns:1fr; min-height:18rem; }
          .kp-exact-quantity__view { display:none; min-height:18rem; }
          .kp-exact-quantity[data-kp-exact-active-view="symbolic"] [data-kp-exact-view="symbolic"],
          .kp-exact-quantity[data-kp-exact-active-view="partitioned-circle"] [data-kp-exact-view="partitioned-circle"],
          .kp-exact-quantity[data-kp-exact-active-view="fraction-bar"] [data-kp-exact-view="fraction-bar"],
          .kp-exact-quantity[data-kp-exact-active-view="number-line"] [data-kp-exact-view="number-line"] { display:grid; }
        }
        @media (min-width:${kpExactFractionQuantityLayoutPolicy.wideMinWidthPx}px) { .kp-exact-quantity__views { display:none; } }
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
      <section class="kp-exact-sr-only" data-kp-exact-accessible-state aria-live="polite" aria-atomic="true"></section>
      <div class="kp-exact-quantity__grid" aria-hidden="true">
        ${viewShell("symbolic", "Symbolic")}
        ${viewShell("partitioned-circle", "Partitioned circle")}
        ${viewShell("fraction-bar", "Fraction bar")}
        ${viewShell("number-line", "Number line")}
      </div>
      ${renderAccessibleTranscript(accessibility)}
      ${import.meta.env.DEV ? renderReviewSheetShell() : ""}
    </section>`;
}

function renderReviewSheetShell(): string {
  return `
    <details class="kp-exact-review-sheet" data-kp-exact-review-sheet>
      <summary>Visual checkpoint review · wide + phone</summary>
      <div class="kp-exact-review-sheet__content" data-kp-exact-review-sheet-content data-kp-exact-review-sheet-status="idle">
        <p>Open this review sheet to load the five static checkpoints. Select any card to seek the live animation; the Review box remains available for comments.</p>
      </div>
    </details>`;
}

function reviewSheetStyles(): string {
  return `
    .kp-exact-review-sheet { margin-block:1rem 0; border-top:1px solid color-mix(in srgb,var(--kp-exact-ink) 18%,transparent); padding-block-start:.8rem; }
    .kp-exact-review-sheet > summary { cursor:pointer; font-weight:700; }
    .kp-exact-review-sheet__content > p { color:#577181; }
    .kp-exact-review-sheet__content section + section { margin-block-start:1.25rem; }
    .kp-exact-review-sheet__content h5 { margin:.75rem 0 .5rem; font:700 .78rem/1.2 system-ui; letter-spacing:.05em; text-transform:uppercase; }
    .kp-exact-review-sheet__grid { display:grid; gap:.65rem; }
    .kp-exact-review-sheet__grid--wide { grid-template-columns:repeat(auto-fit,minmax(18rem,1fr)); }
    .kp-exact-review-sheet__grid--phone { grid-template-columns:repeat(auto-fit,minmax(12rem,1fr)); }
    .kp-exact-review-sheet__card { min-width:0; }
    .kp-exact-review-sheet__card > button { display:grid; width:100%; height:100%; padding:0; overflow:hidden; border:1px solid color-mix(in srgb,var(--kp-exact-ink) 22%,transparent); border-radius:.65rem; background:white; color:var(--kp-exact-ink); text-align:start; }
    .kp-exact-review-sheet__card > button[aria-current="step"] { outline:3px solid color-mix(in srgb,var(--kp-exact-accent) 45%,transparent); outline-offset:2px; }
    .kp-exact-review-sheet__meta { display:grid; grid-template-columns:auto 1fr auto; gap:.5rem; align-items:start; padding:.55rem .65rem; border-bottom:1px solid color-mix(in srgb,var(--kp-exact-ink) 12%,transparent); font:.72rem/1.25 system-ui; }
    .kp-exact-review-sheet__meta b, .kp-exact-review-sheet__meta code { color:var(--kp-exact-accent); }
    .kp-exact-review-sheet__preview { display:grid; gap:.3rem; padding:.45rem; pointer-events:none; }
    .kp-exact-review-sheet__preview--wide { grid-template-columns:repeat(2,minmax(0,1fr)); min-height:12rem; }
    .kp-exact-review-sheet__preview--phone { min-height:12rem; }
    .kp-exact-review-sheet__view { display:grid; place-items:center; min-width:0; overflow:hidden; border-radius:.35rem; background:#f7fafb; font-size:.8rem; }
    .kp-exact-review-sheet__view svg { display:block; width:100%; max-height:5.5rem; }`;
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
  const endpoint = [
    ...session.symbolic.endpoints,
    ...session.symbolic.transientEndpoints
  ].find(
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
