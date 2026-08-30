import "katex/dist/katex.min.css";
import "../../styles.css";
import "./kinetic-figure-log-product.css";

import { createKpEditorAnimationLibrary } from
  "../../editor/animation-library.ts";
import {
  dispatchKpEditorAnimationPlaybackAction,
  disposeKpEditorAnimationPlayers,
  hydrateKpEditorAnimationPlayers,
  KP_EDITOR_ANIMATION_FRAME_EVENT
} from "../../editor/animation-player-controller.ts";
import { renderKpEditorAnimationPlayerShell } from
  "../../editor/animation-player-shell.ts";
import {
  hydrateKpEditorAnimationSurfaces,
  kpEditorAnimationSurfaceAdapterRegistry
} from "../../editor/animation-surface-adapter-registry.ts";
import { registerKpEditorLogProductSurfaceCapability } from
  "../../editor/log-product-surface-capability.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { kpCanonicalLogProductNativeEndpoints } from
  "../../rendering/log-product-native-endpoints.ts";
import { applyKpSemanticVisualDomTheme } from
  "../../rendering/semantic-visual-dom-theme.ts";
import { kpCanonicalLogProductFamily } from
  "../../semantic/log-product-states.ts";
import { KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID } from
  "../../semantic/log-product-equivalence-frame.ts";
import { KpTutorialPageScrollCoordinator } from
  "../../tutorial/kp-tutorial-page-scroll-coordinator.ts";
import {
  projectKpFocusDeckControl,
  renderKpFocusDeckControlIcon
} from "../focus-deck-control-icons.ts";
import {
  adjacentKpLogProductFocusDeckBeat,
  kpLogProductFocusDeckBeatIds,
  kpLogProductFocusDeckBeats,
  kpLogProductFocusDeckHash,
  readKpLogProductFocusDeckBeat,
  readKpLogProductFocusDeckBeatFromHash,
  type KpLogProductFocusDeckBeat,
  type KpLogProductFocusDeckBeatId
} from "./kinetic-figure-log-product-focus-deck.ts";
import {
  kpLogProductGlanceScrollytellingCorridor,
  kpLogProductGlanceScrollytellingReadingLineViewportRatio,
  kpLogProductGlanceScrollytellingUrlIds,
  projectKpLogProductGlanceScrollytellingNode,
  projectKpLogProductGlanceScrollytellingScroll,
  readKpLogProductGlanceScrollytellingUrlState,
  type KpLogProductGlanceScrollytellingProjection
} from "./kinetic-figure-log-product-glance-scrollytelling.ts";
import {
  kpLogProductMicroStationCanonicalTravel,
  kpLogProductMicroStationCorridor,
  projectKpLogProductMicroStation,
  type KpLogProductMicroStationProjection
} from "./kinetic-figure-log-product-micro-station.ts";
import {
  kpLogProductStackedStationCorridor,
  kpLogProductStackedStationReadingLineViewportRatio,
  kpLogProductStackedStationUrlIds,
  projectKpLogProductStackedStationDock,
  projectKpLogProductStackedStationNode,
  projectKpLogProductStackedStationScroll,
  readKpLogProductStackedStationUrlState
} from "./kinetic-figure-log-product-stacked-station.ts";
import {
  kpLogProductKineticFigureStates,
  readKpLogProductKineticFigureState,
  type KpLogProductKineticFigurePose,
  type KpLogProductKineticFigureState,
  type KpLogProductKineticFigureStateId
} from "./kinetic-figure-log-product-model.ts";

const expressionDescriptorId =
  "editor-animation.animation.algebra.log-product.product-to-sum";
const equivalenceDescriptorId =
  `editor-animation.${KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID}`;
const poseProgress: Record<KpLogProductKineticFigurePose, number> = {
  source: 0,
  target: 1
};
const progressTolerance = 0.004;
type KpLogProductKineticFigureProjection =
  | "focus-deck"
  | "local-split"
  | "glance-scrollytelling"
  | "micro-station"
  | "stacked-station";

export interface KpLogProductKineticFigureSession {
  dispose(): void;
}

export function mountKpLogProductKineticFigure(input: {
  readonly root: HTMLElement;
}): KpLogProductKineticFigureSession {
  const projection = resolveProjection(window);
  const descriptorId = projection === "focus-deck"
    ? equivalenceDescriptorId
    : expressionDescriptorId;
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === descriptorId
  );
  if (descriptor === undefined) {
    throw new Error(`Missing Kinetic Figure descriptor ${descriptorId}.`);
  }

  const isFocusDeck = projection === "focus-deck";
  const isMicroStation = projection === "micro-station";
  const isGlanceScrollytelling = projection === "glance-scrollytelling";
  const isStackedStation = projection === "stacked-station";
  const isPassageScrollProjection = isGlanceScrollytelling ||
    isStackedStation;
  const isScrollProjection = isMicroStation || isPassageScrollProjection;
  if (isFocusDeck) {
    // Deck chrome consumes the shared light palette without changing the
    // animation renderer's existing semantic paint ownership.
    applyKpSemanticVisualDomTheme({ root: input.root, theme: "light" });
  }
  input.root.innerHTML = renderPage(descriptor, projection);
  const article = requiredElement<HTMLElement>(
    input.root,
    "[data-kp-kinetic-figure]"
  );
  const corridorAnchor = requiredElement<HTMLElement>(
    input.root,
    "[data-kp-kinetic-figure-corridor-anchor]"
  );
  const player = requiredElement<HTMLElement>(
    article,
    "[data-kp-editor-animation-player]"
  );
  const figureStage = requiredElement<HTMLElement>(
    article,
    ".kp-kinetic-figure__figure"
  );
  const stackedNarrativeTrack = isStackedStation
    ? requiredElement<HTMLElement>(
        article,
        ".kp-kinetic-figure__narrative-track"
      )
    : undefined;
  const surface = requiredElement<HTMLElement>(
    player,
    "[data-kp-editor-animation-surface-slot=\"equation\"]"
  );
  surface.innerHTML = kpCanonicalLogProductNativeEndpoints[0].nativeHtmlAndMathml;
  player.tabIndex = -1;
  player.removeAttribute("aria-keyshortcuts");

  const unregisterCapability = registerKpEditorLogProductSurfaceCapability(
    kpEditorAnimationSurfaceAdapterRegistry
  );
  hydrateKpEditorAnimationSurfaces(article);

  if (isFocusDeck) {
    hydrateKpEditorAnimationPlayers(article, {
      descriptorOverrides: [descriptor]
    });
    return mountKpLogProductFocusDeck({
      article,
      player,
      unregisterCapability
    });
  }

  const initialHashState = readStateIdFromHash(window.location.hash);
  const hasInitialStateHash = initialHashState !== undefined;
  let active = readKpLogProductKineticFigureState(initialHashState);
  const initialStateId = active.id;
  let preview: KpLogProductKineticFigureState | undefined;
  let pendingTargetProgress: number | undefined;
  let microStationFrame = projectKpLogProductMicroStation(
    hasInitialStateHash
      ? kpLogProductMicroStationCanonicalTravel[active.id]
      : 0
  );
  let passageScrollFrame = isStackedStation
    ? projectKpLogProductStackedStationNode(active.id)
    : projectKpLogProductGlanceScrollytellingNode(active.id);
  let scrollCoordinator: KpTutorialPageScrollCoordinator<
    string,
    string,
    string
  > | undefined;
  let initialProjectionPending = true;
  let disposed = false;

  const select = (
    stateId: KpLogProductKineticFigureStateId,
    options: {
      readonly animate?: boolean;
      readonly replayTransition?: boolean;
      readonly updateHash?: boolean;
    } = {}
  ): void => {
    const next = readKpLogProductKineticFigureState(stateId);
    active = next;
    preview = undefined;
    projectPreviewState(article);
    projectReadingState(article, active);
    if (options.updateHash !== false) {
      history.replaceState(null, "", hashForState(projection, active.id));
    }
    movePlayerToState(player, active, {
      animate: options.animate !== false,
      replayTransition: options.replayTransition === true
    });
  };

  const movePlayerToState = (
    owner: HTMLElement,
    state: KpLogProductKineticFigureState,
    options: {
      readonly animate: boolean;
      readonly replayTransition: boolean;
    }
  ): void => {
    if (owner.dataset["kpEditorAnimationHydrated"] !== "true") return;
    const target = poseProgress[state.pose];
    let current = Number(owner.dataset["kpEditorAnimationProgress"] ?? 0);
    if (options.replayTransition && state.entryTransitionId !== undefined) {
      current = poseProgress.source;
      dispatchKpEditorAnimationPlaybackAction(owner, {
        type: "seek",
        progress: current
      });
    }
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !options.animate ||
      current > target ||
      Math.abs(current - target) <= progressTolerance
    ) {
      pendingTargetProgress = undefined;
      dispatchKpEditorAnimationPlaybackAction(owner, {
        type: "seek",
        progress: target
      });
      markSettled(article, state);
      return;
    }
    pendingTargetProgress = target;
    article.dataset["kpKineticFigureSettledState"] = "moving";
    dispatchKpEditorAnimationPlaybackAction(owner, {
      type: "forward",
      nowMs: performance.now()
    });
  };

  const handleFrame = (): void => {
    if (isPassageScrollProjection) {
      projectPassageScrollFigureAttention(
        player,
        passageScrollFrame
      );
    } else {
      projectFigureAttention(player, resolveAttentionState(active, preview));
    }
    const current = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
    if (
      initialProjectionPending &&
      player.dataset["kpEditorAnimationHydrated"] === "true"
    ) {
      initialProjectionPending = false;
      const target = isMicroStation
        ? microStationFrame.animationProgress
        : isPassageScrollProjection
          ? passageScrollFrame.animationProgress
          : poseProgress[active.pose];
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: target
      });
      if (isMicroStation) {
        markMicroStationFrame(article, microStationFrame);
      } else if (isPassageScrollProjection) {
        markPassageScrollFrame(article, passageScrollFrame);
      } else {
        markSettled(article, active);
      }
      return;
    }
    if (isScrollProjection) return;
    if (
      pendingTargetProgress !== undefined &&
      current + progressTolerance >= pendingTargetProgress
    ) {
      const target = pendingTargetProgress;
      pendingTargetProgress = undefined;
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: target
      });
      markSettled(article, active);
      return;
    }
    if (
      pendingTargetProgress === undefined &&
      player.dataset["kpEditorAnimationHydrated"] === "true"
    ) {
      const target = poseProgress[active.pose];
      if (Math.abs(current - target) <= progressTolerance) {
        markSettled(article, active);
      } else {
        movePlayerToState(player, active, {
          animate: true,
          replayTransition: false
        });
      }
    }
  };
  const handleClick = (event: MouseEvent): void => {
    const ruleToggle = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>(
          "[data-kp-kinetic-figure-rule-toggle]"
        )
      : null;
    if (ruleToggle !== null) {
      toggleRuleDisclosure(article, ruleToggle);
      return;
    }
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-state], [data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null) return;
    const stateId = target.dataset["kpKineticFigureState"] ??
      target.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId)) return;
    if (target.hasAttribute("data-kp-kinetic-figure-prose-link")) {
      event.preventDefault();
    }
    if (isScrollProjection) {
      scrollProjectionToState(
        window,
        article,
        corridorAnchor,
        projection,
        stateId
      );
      scrollCoordinator?.scheduleProjection();
      return;
    }
    select(stateId, {
      replayTransition: stateId === "transform"
    });
  };
  const handlePointerOver = (event: PointerEvent): void => {
    if (isPassageScrollProjection) return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    const stateId = target?.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId)) return;
    preview = readKpLogProductKineticFigureState(stateId);
    projectPreviewState(article, preview);
    projectFigureAttention(player, resolveAttentionState(active, preview));
  };
  const handlePointerOut = (event: PointerEvent): void => {
    if (isPassageScrollProjection) return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null) return;
    if (
      event.relatedTarget instanceof Node &&
      target.contains(event.relatedTarget)
    ) return;
    preview = undefined;
    projectPreviewState(article);
    projectFigureAttention(player, active);
  };
  const handleFocusIn = (event: FocusEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          "[data-kp-kinetic-figure-prose-link]"
        )
      : null;
    if (target === null || !target.matches(":focus-visible")) return;
    const stateId = target.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId) || stateId === active.id) return;
    if (isScrollProjection) {
      scrollProjectionToState(
        window,
        article,
        corridorAnchor,
        projection,
        stateId
      );
      scrollCoordinator?.scheduleProjection();
      return;
    }
    select(stateId, {
      replayTransition: stateId === "transform"
    });
  };
  const applyMicroStationProjection = (
    frame: KpLogProductMicroStationProjection,
    options: { readonly updateHash: boolean }
  ): void => {
    microStationFrame = frame;
    active = readKpLogProductKineticFigureState(frame.stateId);
    preview = undefined;
    projectPreviewState(article);
    projectReadingState(article, active);
    projectFigureAttention(player, active);
    article.dataset["kpKineticFigureScrollPhase"] = frame.phase;
    article.dataset["kpKineticFigureScrollTravel"] = frame.travel.toFixed(4);
    article.style.setProperty(
      "--kp-kinetic-figure-scroll-travel",
      String(frame.travel)
    );
    if (
      options.updateHash &&
      window.location.hash.slice(1) !== active.id
    ) {
      history.replaceState(null, "", `#${active.id}`);
    }
    if (player.dataset["kpEditorAnimationHydrated"] === "true") {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: frame.animationProgress
      });
    }
    markMicroStationFrame(article, frame);
  };
  const applyPassageScrollProjection = (
    frame: KpLogProductGlanceScrollytellingProjection,
    options: { readonly updateHash: boolean }
  ): void => {
    passageScrollFrame = frame;
    active = readKpLogProductKineticFigureState(frame.stateId);
    preview = undefined;
    projectPreviewState(article);
    projectPassageScrollReadingState(article, frame);
    projectPassageScrollFigureAttention(player, frame);
    article.style.setProperty(
      "--kp-kinetic-figure-stage-ownership-scale",
      frame.stageSalience.toFixed(4)
    );
    article.dataset["kpKineticFigureScrollPhase"] = frame.phase;
    article.dataset["kpKineticFigureAttentionOwner"] = frame.attentionOwner;
    article.dataset["kpKineticFigureScrollTravel"] = frame.travel.toFixed(4);
    article.style.setProperty(
      "--kp-kinetic-figure-scroll-travel",
      String(frame.travel)
    );
    if (isStackedStation) {
      projectStackedStationDock(
        article,
        figureStage,
        stackedNarrativeTrack!,
        window
      );
    }
    if (
      options.updateHash &&
      window.location.hash !== hashForState(projection, frame.urlStateId)
    ) {
      history.replaceState(
        null,
        "",
        hashForState(projection, frame.urlStateId)
      );
    }
    if (player.dataset["kpEditorAnimationHydrated"] === "true") {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: frame.animationProgress
      });
    }
    markPassageScrollFrame(article, frame);
  };
  const handleHashChange = (): void => {
    const state = readKpLogProductKineticFigureState(
      readStateIdFromHash(window.location.hash)
    );
    if (isScrollProjection) {
      scrollProjectionToState(
        window,
        article,
        corridorAnchor,
        projection,
        state.id
      );
      scrollCoordinator?.scheduleProjection();
      return;
    }
    select(state.id, { animate: false, updateHash: false });
  };

  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
  article.addEventListener("click", handleClick);
  article.addEventListener("pointerover", handlePointerOver);
  article.addEventListener("pointerout", handlePointerOut);
  article.addEventListener("focusin", handleFocusIn);
  window.addEventListener("hashchange", handleHashChange);
  if (isPassageScrollProjection) {
    projectPassageScrollReadingState(
      article,
      passageScrollFrame
    );
  } else {
    projectReadingState(article, active);
  }
  hydrateKpEditorAnimationPlayers(article, {
    descriptorOverrides: [descriptor]
  });
  if (isMicroStation) {
    applyMicroStationProjection(microStationFrame, { updateHash: false });
    const coordinator = new KpTutorialPageScrollCoordinator<
      string,
      string,
      string
    >(
      window,
      () => [Object.freeze({
        id: "registration.log-product.micro-station" as const,
        passageId: "passage.log-product" as const,
        blockId: "block.log-product-rewrite" as const,
        anchor: corridorAnchor,
        corridor: kpLogProductMicroStationCorridor
      })],
      (scrollProjection) => {
        const block = scrollProjection.blocks[0];
        if (block === undefined) return;
        applyMicroStationProjection(
          projectKpLogProductMicroStation(block.travel),
          { updateHash: block.travel > 0 }
        );
      }
    );
    scrollCoordinator = coordinator;
    coordinator.connect();
    if (hasInitialStateHash) {
      window.requestAnimationFrame(() => {
        scrollMicroStationToState(window, corridorAnchor, initialStateId);
        scrollCoordinator?.scheduleProjection();
      });
    }
  } else if (isPassageScrollProjection) {
    const passages = [...article.querySelectorAll<HTMLElement>(
      "[data-kp-kinetic-figure-scroll-passage]"
    )];
    if (passages.length !== kpLogProductKineticFigureStates.length) {
      throw new Error("Passage scroll projection requires one passage per state.");
    }
    const passageUrlIds = isStackedStation
      ? kpLogProductStackedStationUrlIds
      : kpLogProductGlanceScrollytellingUrlIds;
    const passageCorridor = isStackedStation
      ? kpLogProductStackedStationCorridor
      : kpLogProductGlanceScrollytellingCorridor;
    const passageReadingLine = isStackedStation
      ? kpLogProductStackedStationReadingLineViewportRatio
      : kpLogProductGlanceScrollytellingReadingLineViewportRatio;
    const stackedTransitionMarker = isStackedStation
      ? requiredElement<HTMLElement>(
          article,
          "[data-kp-kinetic-figure-transition]"
        )
      : undefined;
    if (isStackedStation) {
      requiredElement<HTMLElement>(
        article,
        "[data-kp-kinetic-figure-transition-label]"
      );
    }
    applyPassageScrollProjection(passageScrollFrame, {
      updateHash: false
    });
    const coordinator = new KpTutorialPageScrollCoordinator<
      string,
      string,
      string
    >(
      window,
      () => passages.map((passage) => {
        const stateId = passage.dataset["kpKineticFigureScrollPassage"];
        if (!isStateId(stateId)) {
          throw new Error("Passage scroll projection has no valid state.");
        }
        return Object.freeze({
          id: `registration.log-product.${projection}.${stateId}`,
          passageId: passageUrlIds[stateId],
          blockId: stateId === "transform"
            ? "block.log-product-rule"
            : `block.log-product-focus.${stateId}`,
          anchor: passage,
          corridor: passageCorridor,
          snapTolerance: 0.006
        });
      }),
      (scrollProjection) => {
        const landingViewportY = window.innerHeight * passageReadingLine;
        const landingEntries = scrollProjection.blocks.map((block) => {
          const stateId = stateIdFromPassageId(block.passageId, passageUrlIds);
          if (stateId === undefined) {
            throw new Error("Passage scroll projection has no state.");
          }
          return [
            stateId,
            block.anchorTop + scrollProjection.scrollY - landingViewportY
          ] as const;
        });
        if (landingEntries.length !== kpLogProductKineticFigureStates.length) {
          throw new Error("Passage scroll projection requires every landing.");
        }
        const landingScrollY = Object.fromEntries(landingEntries) as Record<
          KpLogProductKineticFigureStateId,
          number
        >;
        const transitionInterval = isStackedStation
          ? measureStackedTransitionInterval({
              view: window,
              marker: stackedTransitionMarker!,
              readingLineViewportRatio: passageReadingLine
            })
          : undefined;
        applyPassageScrollProjection(
          isStackedStation
            ? projectKpLogProductStackedStationScroll({
                scrollY: scrollProjection.scrollY,
                landingScrollY,
                transitionStartScrollY:
                  transitionInterval!.transitionStartScrollY,
                transitionEndScrollY:
                  transitionInterval!.transitionEndScrollY
              })
            : projectKpLogProductGlanceScrollytellingScroll({
                scrollY: scrollProjection.scrollY,
                landingScrollY
              }),
          { updateHash: scrollProjection.scrollChanged }
        );
      },
      { projectionNeighborhoodRadius: 3 }
    );
    scrollCoordinator = coordinator;
    coordinator.connect();
    if (hasInitialStateHash) {
      window.requestAnimationFrame(() => {
        scrollPassageScrollytellingToState(
          window,
          article,
          initialStateId,
          passageReadingLine
        );
        scrollCoordinator?.scheduleProjection();
      });
    }
  }

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
      article.removeEventListener("click", handleClick);
      article.removeEventListener("pointerover", handlePointerOver);
      article.removeEventListener("pointerout", handlePointerOut);
      article.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("hashchange", handleHashChange);
      scrollCoordinator?.disconnect();
      disposeKpEditorAnimationPlayers(article);
      unregisterCapability();
    }
  };
}

function mountKpLogProductFocusDeck(input: {
  readonly article: HTMLElement;
  readonly player: HTMLElement;
  readonly unregisterCapability: () => void;
}): KpLogProductKineticFigureSession {
  let active = readKpLogProductFocusDeckBeatFromHash(window.location.hash);
  let pendingTargetProgress: number | undefined;
  let disposed = false;
  const compactStepsMedia = window.matchMedia("(max-width: 44rem)");
  const stepsToggle = requiredElement<HTMLButtonElement>(
    input.article,
    "[data-kp-focus-deck-steps-toggle]"
  );

  const projectStepsDisclosure = (expanded: boolean): void => {
    const effectiveExpanded = compactStepsMedia.matches ? expanded : true;
    input.article.dataset["kpFocusDeckStepsExpanded"] = String(
      effectiveExpanded
    );
    stepsToggle.disabled = !compactStepsMedia.matches;
    stepsToggle.setAttribute("aria-expanded", String(effectiveExpanded));
  };

  const projectBeat = (beat: KpLogProductFocusDeckBeat): void => {
    input.article.dataset["kpFocusDeckActiveBeat"] = beat.id;
    input.article.dataset["kpKineticFigureActiveState"] = beat.figureStateId;
    input.player.dataset["kpFocusDeckMotionOwner"] = String(beat.ownsMotion);
    input.player.querySelector<HTMLElement>(
      ".editor-animation-player__controls"
    )?.setAttribute("aria-hidden", String(!beat.ownsMotion));

    input.article.querySelectorAll<HTMLDetailsElement>(
      "[data-kp-focus-deck-beat]"
    ).forEach((details) => {
      const isActive = details.dataset["kpFocusDeckBeat"] === beat.id;
      details.open = isActive;
      details.dataset["kpFocusDeckBeatActive"] = String(isActive);
    });
    input.article.querySelectorAll<HTMLElement>(
      "[data-kp-focus-deck-select]"
    ).forEach((control) => {
      const isActive = control.dataset["kpFocusDeckSelect"] === beat.id;
      if (isActive) {
        control.setAttribute("aria-current", "step");
      } else {
        control.removeAttribute("aria-current");
      }
    });

    const index = kpLogProductFocusDeckBeats.findIndex(
      ({ id }) => id === beat.id
    );
    const previous = requiredElement<HTMLButtonElement>(
      input.article,
      "[data-kp-focus-deck-previous]"
    );
    const next = requiredElement<HTMLButtonElement>(
      input.article,
      "[data-kp-focus-deck-next]"
    );
    previous.disabled = index === 0;
    next.disabled = index === kpLogProductFocusDeckBeats.length - 1;
    const nextBeat = kpLogProductFocusDeckBeats[index + 1];
    next.dataset["kpFocusDeckLeadsToMotion"] = String(
      nextBeat?.ownsMotion === true
    );
    requiredElement<HTMLOutputElement>(
      input.article,
      "[data-kp-focus-deck-position]"
    ).value = `Step ${beat.ordinal} of ${kpLogProductFocusDeckBeats.length}`;
    requiredElement<HTMLElement>(
      input.article,
      "[data-kp-kinetic-figure-state-label]"
    ).replaceChildren(document.createTextNode(
      `${beat.ordinal} · ${beat.label}`
    ));

    projectFigureAttention(
      input.player,
      readKpLogProductKineticFigureState(beat.attentionStateId)
    );
    projectFocusDeckPlaybackControl(input.player, beat);
  };

  const movePlayerToBeat = (
    beat: KpLogProductFocusDeckBeat,
    options: { readonly animate: boolean; readonly replay: boolean }
  ): void => {
    if (input.player.dataset["kpEditorAnimationHydrated"] !== "true") return;
    const state = readKpLogProductKineticFigureState(beat.figureStateId);
    const target = poseProgress[state.pose];
    let current = Number(
      input.player.dataset["kpEditorAnimationProgress"] ?? 0
    );
    if (options.replay && beat.ownsMotion) {
      current = poseProgress.source;
      dispatchKpEditorAnimationPlaybackAction(input.player, {
        type: "seek",
        progress: current
      });
    }
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !options.animate ||
      current > target ||
      Math.abs(current - target) <= progressTolerance
    ) {
      pendingTargetProgress = undefined;
      dispatchKpEditorAnimationPlaybackAction(input.player, {
        type: "seek",
        progress: target
      });
      markFocusDeckSettled(input.article, beat);
      return;
    }
    pendingTargetProgress = target;
    input.article.dataset["kpFocusDeckSettledBeat"] = "moving";
    dispatchKpEditorAnimationPlaybackAction(input.player, {
      type: "forward",
      nowMs: performance.now()
    });
  };

  const select = (
    beatId: KpLogProductFocusDeckBeatId,
    options: {
      readonly animate?: boolean;
      readonly replay?: boolean;
      readonly history?: "none" | "push" | "replace";
    } = {}
  ): void => {
    active = readKpLogProductFocusDeckBeat(beatId);
    projectBeat(active);
    movePlayerToBeat(active, {
      animate: options.animate !== false,
      replay: options.replay === true
    });
    const historyMode = options.history ?? "push";
    if (historyMode === "none") return;
    const hash = kpLogProductFocusDeckHash(active.id);
    if (window.location.hash === hash) return;
    if (historyMode === "replace") {
      history.replaceState(null, "", hash);
    } else {
      history.pushState(null, "", hash);
    }
  };

  const selectAdjacent = (direction: -1 | 1): void => {
    const next = adjacentKpLogProductFocusDeckBeat({
      beatId: active.id,
      direction
    });
    if (next.id === active.id) return;
    select(next.id, {
      replay: next.ownsMotion,
      history: "push"
    });
  };

  const handleFrame = (): void => {
    projectFigureAttention(
      input.player,
      readKpLogProductKineticFigureState(active.attentionStateId)
    );
    const current = Number(
      input.player.dataset["kpEditorAnimationProgress"] ?? 0
    );
    projectFocusDeckPlaybackControl(input.player, active);
    if (
      pendingTargetProgress !== undefined &&
      current + progressTolerance >= pendingTargetProgress
    ) {
      const target = pendingTargetProgress;
      pendingTargetProgress = undefined;
      dispatchKpEditorAnimationPlaybackAction(input.player, {
        type: "seek",
        progress: target
      });
      markFocusDeckSettled(input.article, active);
      return;
    }
    if (
      active.ownsMotion &&
      current > progressTolerance &&
      current < 1 - progressTolerance
    ) {
      input.article.dataset["kpFocusDeckSettledBeat"] = "moving";
    } else if (
      pendingTargetProgress === undefined &&
      Math.abs(current - poseProgress[
        readKpLogProductKineticFigureState(active.figureStateId).pose
      ]) <= progressTolerance
    ) {
      markFocusDeckSettled(input.article, active);
    }
  };

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-kp-focus-deck-steps-toggle]") instanceof Element) {
      projectStepsDisclosure(
        input.article.dataset["kpFocusDeckStepsExpanded"] !== "true"
      );
      return;
    }
    const beatControl = target?.closest<HTMLElement>(
      "[data-kp-focus-deck-select]"
    );
    const beatId = beatControl?.dataset["kpFocusDeckSelect"];
    if (isFocusDeckBeatId(beatId)) {
      event.preventDefault();
      select(beatId, {
        replay: readKpLogProductFocusDeckBeat(beatId).ownsMotion,
        history: "push"
      });
      if (compactStepsMedia.matches) projectStepsDisclosure(false);
      return;
    }
    if (target?.closest("[data-kp-focus-deck-previous]") instanceof Element) {
      selectAdjacent(-1);
      return;
    }
    if (target?.closest("[data-kp-focus-deck-next]") instanceof Element) {
      selectAdjacent(1);
    }
  };

  const handleToggle = (event: Event): void => {
    const details = event.target instanceof HTMLDetailsElement
      ? event.target
      : null;
    const beatId = details?.dataset["kpFocusDeckBeat"];
    if (!details?.open || !isFocusDeckBeatId(beatId) || beatId === active.id) {
      return;
    }
    // Native find opens a matching details element. Treat that reveal as a
    // semantic jump and sample its stable endpoint without replaying history.
    select(beatId, { animate: false, history: "replace" });
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement
    ) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectAdjacent(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      selectAdjacent(1);
    }
  };

  const restoreFromLocation = (): void => {
    select(readKpLogProductFocusDeckBeatFromHash(window.location.hash).id, {
      animate: false,
      history: "none"
    });
  };
  const handleCompactStepsChange = (): void => projectStepsDisclosure(false);

  input.player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
  input.article.addEventListener("click", handleClick);
  input.article.addEventListener("toggle", handleToggle, true);
  input.article.addEventListener("keydown", handleKeyDown);
  window.addEventListener("popstate", restoreFromLocation);
  window.addEventListener("hashchange", restoreFromLocation);
  compactStepsMedia.addEventListener("change", handleCompactStepsChange);
  projectStepsDisclosure(false);
  projectBeat(active);
  const projectInitialPoseWhenHydrated = (): void => {
    if (disposed || input.player.dataset["kpEditorAnimationLoadError"] === "true") {
      return;
    }
    if (input.player.dataset["kpEditorAnimationHydrated"] !== "true") {
      // Publication hydration is deliberately asynchronous. Keep the semantic
      // beat authoritative so direct links cannot be stranded at the shell's
      // default pose while the canonical animation asset is still loading.
      window.requestAnimationFrame(projectInitialPoseWhenHydrated);
      return;
    }
    movePlayerToBeat(active, { animate: false, replay: false });
    handleFrame();
  };
  window.requestAnimationFrame(projectInitialPoseWhenHydrated);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      input.player.removeEventListener(
        KP_EDITOR_ANIMATION_FRAME_EVENT,
        handleFrame
      );
      input.article.removeEventListener("click", handleClick);
      input.article.removeEventListener("toggle", handleToggle, true);
      input.article.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", restoreFromLocation);
      window.removeEventListener("hashchange", restoreFromLocation);
      compactStepsMedia.removeEventListener("change", handleCompactStepsChange);
      disposeKpEditorAnimationPlayers(input.article);
      input.unregisterCapability();
    }
  };
}

function markFocusDeckSettled(
  article: HTMLElement,
  beat: KpLogProductFocusDeckBeat
): void {
  article.dataset["kpFocusDeckSettledBeat"] = beat.id;
  article.dataset["kpKineticFigureSettledState"] = beat.figureStateId;
}

function projectFocusDeckPlaybackControl(
  player: HTMLElement,
  beat: KpLogProductFocusDeckBeat
): void {
  const toggle = player.querySelector<HTMLButtonElement>(
    '[data-action="toggle-editor-animation"]'
  );
  if (toggle === null || !beat.ownsMotion) return;
  const progress = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
  const status = player.dataset["kpEditorAnimationStatus"];
  const playing = status === "playing";
  const replay = !playing && progress >= 1 - progressTolerance;
  const resume = !playing && !replay && progress > progressTolerance;
  projectKpFocusDeckControl({
    button: toggle,
    iconId: playing ? "pause" : replay ? "replay" : "play",
    accessibleLabel: playing
      ? "Pause transformation"
      : replay
        ? "Replay transformation"
        : resume
          ? "Resume transformation"
          : "Play transformation",
    compatibilityText: playing ? "Pause" : replay ? "Replay" : "Play"
  });
}

function projectReadingState(
  article: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  article.dataset["kpKineticFigureActiveState"] = state.id;
  article.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-state]")
    .forEach((button) => {
      const active = button.dataset["kpKineticFigureState"] === state.id;
      button.toggleAttribute("aria-current", active);
    });
  article.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-prose-link]")
    .forEach((phrase) => {
      const focused = phrase.dataset["kpKineticFigureProseLink"] === state.id;
      phrase.dataset["kpSemanticSalienceLevel"] = focused
        ? "focus"
        : "context";
      if (focused) {
        phrase.setAttribute("aria-current", "step");
      } else {
        phrase.removeAttribute("aria-current");
      }
    });
  const status = requiredElement<HTMLElement>(
    article,
    "[data-kp-kinetic-figure-state-label]"
  );
  status.replaceChildren(document.createTextNode(
    `${state.ordinal} · ${state.label}`
  ));
}

function projectPassageScrollReadingState(
  article: HTMLElement,
  frame: KpLogProductGlanceScrollytellingProjection
): void {
  article.dataset["kpKineticFigureActiveState"] = frame.stateId;
  article.querySelectorAll<HTMLElement>(
    "[data-kp-kinetic-figure-prose-link]"
  ).forEach((passage) => {
    const stateId = passage.dataset["kpKineticFigureProseLink"];
    if (!isStateId(stateId)) return;
    const salience = frame.passageSalience[stateId];
    const ownsAttention = salience >= 1 - progressTolerance &&
      (frame.attentionOwner === "source-passage" ||
        frame.attentionOwner === "target-passage");
    passage.style.setProperty(
      "--kp-kinetic-figure-passage-rail-scale",
      salience.toFixed(4)
    );
    passage.dataset["kpSemanticSalienceLevel"] = ownsAttention
      ? "focus"
      : "context";
    passage.toggleAttribute("aria-current", ownsAttention);
    if (ownsAttention) passage.setAttribute("aria-current", "step");
  });
  const status = requiredElement<HTMLElement>(
    article,
    "[data-kp-kinetic-figure-state-label]"
  );
  const statusText = passageScrollStatus(frame);
  if (status.textContent !== statusText) {
    status.replaceChildren(document.createTextNode(statusText));
  }
}

function projectPreviewState(
  article: HTMLElement,
  state?: KpLogProductKineticFigureState | undefined
): void {
  if (state === undefined) {
    delete article.dataset["kpKineticFigurePreviewState"];
  } else {
    article.dataset["kpKineticFigurePreviewState"] = state.id;
  }
  article.querySelectorAll<HTMLElement>(
    "[data-kp-kinetic-figure-state], [data-kp-kinetic-figure-prose-link]"
  ).forEach((element) => {
    const stateId = element.dataset["kpKineticFigureState"] ??
      element.dataset["kpKineticFigureProseLink"];
    if (stateId === state?.id) {
      element.dataset["kpKineticFigurePreview"] = "true";
    } else {
      delete element.dataset["kpKineticFigurePreview"];
    }
  });
}

function resolveAttentionState(
  active: KpLogProductKineticFigureState,
  preview?: KpLogProductKineticFigureState | undefined
): KpLogProductKineticFigureState {
  // Preview never moves the semantic playhead. It may borrow figure salience
  // only when the linked entity already exists at the active endpoint.
  return preview?.pose === active.pose ? preview : active;
}

function projectFigureAttention(
  player: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  player.dataset["kpKineticFigureAttentionState"] = state.id;
  clearFigureAttention(player);
  const semanticIds = state.attentionTargetId ===
      "semantic.log-product.product"
    ? [kpCanonicalLogProductFamily.sourceProductSemanticId]
    : state.attentionTargetId === "semantic.log-product.introduced-structure"
      ? [
          ...kpCanonicalLogProductFamily.factors.flatMap(({ targetWrapper }) => [
            targetWrapper.operator,
            targetWrapper.open,
            targetWrapper.close
          ]),
          ...kpCanonicalLogProductFamily.connectorSemanticIds
        ]
      : state.attentionTargetId === "semantic.log-product.sum"
        ? [kpCanonicalLogProductFamily.targetSumSemanticId]
        : [];
  for (const semanticId of semanticIds) {
    player.querySelectorAll<HTMLElement>(
      `[data-kp-semantic-identity-id="${CSS.escape(semanticId)}"]`
    ).forEach((element) => {
      element.dataset["kpKineticFigureAttention"] = "focus";
    });
  }
}

function projectPassageScrollFigureAttention(
  player: HTMLElement,
  frame: KpLogProductGlanceScrollytellingProjection
): void {
  player.dataset["kpKineticFigureAttentionOwner"] = frame.attentionOwner;
  player.style.setProperty(
    "--kp-kinetic-figure-product-mark-scale",
    frame.productMarkSalience.toFixed(4)
  );
  if (frame.productMarkSalience > progressTolerance) {
    projectFigureAttention(
      player,
      readKpLogProductKineticFigureState("product")
    );
    return;
  }
  player.dataset["kpKineticFigureAttentionState"] = frame.stateId;
  clearFigureAttention(player);
}

function clearFigureAttention(player: HTMLElement): void {
  player.querySelectorAll<HTMLElement>("[data-kp-kinetic-figure-attention]")
    .forEach((element) => delete element.dataset["kpKineticFigureAttention"]);
}

function passageScrollStatus(
  frame: KpLogProductGlanceScrollytellingProjection
): string {
  switch (frame.phase) {
    case "focus-release":
      return "Focus releases from the current paragraph";
    case "focus-between":
      return "Focus moves between adjacent paragraphs";
    case "focus-reception":
      return "Focus arrives at the next paragraph";
    case "source-release":
      return "Focus moves from the product law to the equation";
    case "armed":
      return "The source expression is ready to rewrite";
    case "rewrite":
      return "The product law rewrites one logarithm as a sum";
    case "settled":
      return "The rewritten expression is held for inspection";
    case "result-reception":
      return "Focus moves from the equation to the result paragraph";
    default: {
      const state = readKpLogProductKineticFigureState(frame.stateId);
      return `${state.ordinal} · ${state.label}`;
    }
  }
}

function toggleRuleDisclosure(
  article: HTMLElement,
  button: HTMLButtonElement
): void {
  const disclosure = requiredElement<HTMLElement>(
    article,
    "[data-kp-kinetic-figure-rule-disclosure]"
  );
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.replaceChildren(document.createTextNode(
    expanded ? "Show product law" : "Hide product law"
  ));
  disclosure.hidden = expanded;
}

function markSettled(
  article: HTMLElement,
  state: KpLogProductKineticFigureState
): void {
  article.dataset["kpKineticFigureSettledState"] = state.id;
}

function markMicroStationFrame(
  article: HTMLElement,
  frame: KpLogProductMicroStationProjection
): void {
  article.dataset["kpKineticFigureSettledState"] = frame.phase === "rewrite"
    ? "scrubbing"
    : frame.stateId;
}

function markPassageScrollFrame(
  article: HTMLElement,
  frame: KpLogProductGlanceScrollytellingProjection
): void {
  article.dataset["kpKineticFigureSettledState"] =
    frame.stateId === "transform" && frame.animationProgress > 0 &&
      frame.animationProgress < 1
      ? "scrubbing"
      : frame.stateId;
}

function renderPage(
  descriptor: ReturnType<typeof createKpEditorAnimationLibrary>[number],
  projection: KpLogProductKineticFigureProjection
): string {
  const inline = (latex: string): string => renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  if (projection === "focus-deck") {
    return renderKpLogProductFocusDeckPage(descriptor, inline);
  }
  const isGlanceScrollytelling = projection === "glance-scrollytelling";
  const isStackedStation = projection === "stacked-station";
  const isPassageScrollProjection = isGlanceScrollytelling ||
    isStackedStation;
  const figureCaption = isPassageScrollProjection
    ? `
      <figcaption id="kinetic-figure-caption" class="kp-kinetic-figure__caption kp-kinetic-figure__caption--visually-hidden">
        <span>Equation coordinated with the surrounding explanation. <span data-kp-kinetic-figure-state-label aria-live="polite">1 · Read the expression</span></span>
      </figcaption>
    `
    : `
      <figcaption id="kinetic-figure-caption" class="kp-kinetic-figure__caption">
        <span data-kp-kinetic-figure-state-label aria-live="polite">1 · Read the expression</span>
        <span class="kp-kinetic-figure__scroll-hint">Scroll controls pace</span>
        <button type="button" data-kp-kinetic-figure-rule-toggle aria-expanded="false" aria-controls="kinetic-figure-product-law">Show product law</button>
      </figcaption>
      <div id="kinetic-figure-product-law" class="kp-kinetic-figure__rule-disclosure" data-kp-kinetic-figure-rule-disclosure hidden>
        <span>Reference</span>
        <div>${inline("\\ln(uv)=\\ln(u)+\\ln(v)")}</div>
        <p>for ${inline("u>0")} and ${inline("v>0")}</p>
      </div>
    `;
  const figureNavigation = isPassageScrollProjection
    ? ""
    : `
      <nav class="kp-kinetic-figure__states" aria-label="Conceptual states">
        ${kpLogProductKineticFigureStates.map((state) => `
          <button type="button" data-kp-kinetic-figure-state="${state.id}" aria-label="State ${state.ordinal}: ${state.label}">${state.ordinal}</button>
        `).join("")}
      </nav>
      <div class="kp-kinetic-figure__scroll-rail" aria-hidden="true"><span></span></div>
    `;
  const narrative = renderKpLogProductNarrative(inline, projection);
  const figure = `
    <figure class="kp-kinetic-figure__figure" aria-labelledby="kinetic-figure-caption">
      ${figureCaption}
      <div class="kp-kinetic-figure__stage">
        ${renderKpEditorAnimationPlayerShell({ descriptor, chrome: "catalogue" })}
      </div>
      ${figureNavigation}
    </figure>
  `;
  // The stacked projection follows its visible reading order in the DOM:
  // establish the stage, then encounter cue and interpretation passages.
  const figureComposition = isStackedStation
    ? `${figure}${narrative}`
    : `${narrative}${figure}`;
  const passageScrollAttribute = isPassageScrollProjection
    ? " data-kp-kinetic-figure-passage-scroll"
    : "";
  return `
    <main class="kp-kinetic-figure-page" data-kp-kinetic-figure-projection="${projection}"${passageScrollAttribute}>
      <article class="kp-kinetic-figure-article">
        <header class="kp-kinetic-figure-article__header">
          <p class="kp-kinetic-figure-article__eyebrow">Algebra · Logarithms</p>
          <h1>Multiplicative structure inside logarithms</h1>
          <p class="kp-kinetic-figure-article__lede">Logarithm laws let us choose a form that exposes the structure we need. The value remains fixed while the notation changes.</p>
        </header>
        <section class="kp-kinetic-figure-lesson-section" aria-labelledby="products-heading">
          <h2 id="products-heading">From a product to a sum</h2>
          <p class="kp-kinetic-figure-article__body">Suppose ${inline("x>0")} and ${inline("y>0")}. When a logarithm contains a product, we can rewrite it as a sum of logarithms. This is useful when the factors are easier to reason about separately.</p>
          <div class="kp-kinetic-figure-corridor" data-kp-kinetic-figure-corridor>
          <span class="kp-kinetic-figure-corridor__anchor" data-kp-kinetic-figure-corridor-anchor aria-hidden="true"></span>
          <section class="kp-kinetic-figure" data-kp-kinetic-figure data-kp-kinetic-figure-model="paragraph-stateful.v2">
            ${figureComposition}
          </section>
          </div>
          <p class="kp-kinetic-figure-article__body">The rewrite does not approximate ${inline("\\ln(xy)")}; it names the same quantity in a different form. The two logarithms make each factor available for later algebraic work.</p>
        </section>
        <section class="kp-kinetic-figure-lesson-section kp-kinetic-figure-lesson-section--boundary" aria-labelledby="boundary-heading">
          <h2 id="boundary-heading">A boundary worth noticing</h2>
          <p class="kp-kinetic-figure-article__body">The product law responds to multiplication, not to every operation inside a logarithm. In general, ${inline("\\ln(x+y)\\ne\\ln(x)+\\ln(y)")}. Reading the internal structure correctly is what determines whether the rewrite is available.</p>
        </section>
      </article>
    </main>
  `;
}

function renderKpLogProductFocusDeckPage(
  descriptor: ReturnType<typeof createKpEditorAnimationLibrary>[number],
  inline: (latex: string) => string
): string {
  return `
    <main class="kp-kinetic-figure-page kp-focus-deck-page" data-kp-kinetic-figure-projection="focus-deck">
      <article class="kp-kinetic-figure-article kp-focus-deck-article">
        <header class="kp-focus-deck-page__header">
          <p class="kp-kinetic-figure-article__eyebrow">Focus Deck · Algebra</p>
          <h1>See a product become a sum</h1>
          <p>Assume ${inline("x>0")} and ${inline("y>0")}.</p>
        </header>
        <section class="kp-kinetic-figure kp-focus-deck" data-kp-kinetic-figure data-kp-kinetic-figure-model="focus-deck.log-product.v1" data-kp-focus-deck-steps-expanded="false" aria-label="Logarithm product-law Focus Deck">
          <span class="kp-kinetic-figure-corridor__anchor" data-kp-kinetic-figure-corridor-anchor aria-hidden="true"></span>
          <header class="kp-focus-deck__header">
            <span>Kinetic Figure</span>
            <a href="./#transform">Read in context</a>
          </header>
          <div class="kp-focus-deck__body">
            <nav class="kp-focus-deck__steps" aria-label="Figure steps">
              <header>
                <button type="button" data-kp-focus-deck-steps-toggle aria-controls="kp-focus-deck-step-list" aria-expanded="false">
                  <span>Steps</span>
                  <output data-kp-focus-deck-position>Step 1 of ${kpLogProductFocusDeckBeats.length}</output>
                  <span class="kp-focus-deck__steps-disclosure-mark" aria-hidden="true">▾</span>
                </button>
              </header>
              <ol id="kp-focus-deck-step-list">
                ${kpLogProductFocusDeckBeats.map((beat, index) => `
                  <li>
                    <button type="button" data-kp-focus-deck-select="${beat.id}"${index === 0 ? ' aria-current="step"' : ""}>
                      <span aria-hidden="true">${beat.ordinal}</span>
                      <span>${beat.label}</span>
                    </button>
                  </li>
                `).join("")}
              </ol>
            </nav>
            <div class="kp-focus-deck__main">
              <figure class="kp-kinetic-figure__figure kp-focus-deck__figure" aria-labelledby="kinetic-figure-caption">
                <figcaption id="kinetic-figure-caption" class="kp-kinetic-figure__caption kp-kinetic-figure__caption--visually-hidden">
                  The logarithm product law shown as a complete equivalence. <span data-kp-kinetic-figure-state-label aria-live="polite">1 · Read the product</span>
                </figcaption>
                <div class="kp-kinetic-figure__stage kp-focus-deck__stage">
                  ${renderKpEditorAnimationPlayerShell({ descriptor, chrome: "catalogue" })}
                </div>
              </figure>
              <div class="kp-focus-deck__narrative" aria-label="Current explanation">
                ${kpLogProductFocusDeckBeats.map((beat, index) => `
                  <details data-kp-focus-deck-beat="${beat.id}"${index === 0 ? " open" : ""}>
                    <summary class="kp-focus-deck__search-summary" tabindex="-1" aria-hidden="true">${beat.label}</summary>
                    <div class="kp-focus-deck__beat-copy">
                      ${renderKpLogProductFocusDeckBeatCopy(beat.id, inline)}
                    </div>
                  </details>
                `).join("")}
              </div>
              <footer class="kp-focus-deck__navigation">
                <button type="button" data-kp-focus-deck-previous aria-label="Previous step" title="Previous step" disabled>
                  ${renderKpFocusDeckControlIcon("previous")}
                </button>
                <button type="button" data-kp-focus-deck-next data-kp-focus-deck-leads-to-motion="false" aria-label="Next step" title="Next step">
                  ${renderKpFocusDeckControlIcon("next")}
                </button>
              </footer>
            </div>
          </div>
        </section>
      </article>
    </main>
  `;
}

function renderKpLogProductFocusDeckBeatCopy(
  beatId: KpLogProductFocusDeckBeatId,
  inline: (latex: string) => string
): string {
  switch (beatId) {
    case "orient":
      return `<p>Begin with ${inline("\\ln(xy)")}. It is the logarithm of one quantity: the product ${inline("xy")}.</p>`;
    case "locate-product":
      return `<p>Read inside the parentheses first. The relevant structure is multiplication: ${inline("x")} and ${inline("y")} occur together as a product.</p>`;
    case "product-law":
      return `<p>The pattern ${inline("\\ln(uv)=\\ln(u)+\\ln(v)")} matches. Here ${inline("u=x")} and ${inline("v=y")}, so the law is available.</p>`;
    case "apply-product-law":
      return `<p>Apply the law. The left side remains as a witness while the equivalent right side is constructed, giving ${inline("\\ln(xy)=\\ln(x)+\\ln(y)")}.</p>`;
  }
}

function renderKpLogProductNarrative(
  inline: (latex: string) => string,
  projection: KpLogProductKineticFigureProjection
): string {
  if (
    projection !== "glance-scrollytelling" &&
    projection !== "stacked-station"
  ) {
    return `
      <p class="kp-kinetic-figure__paragraph">
        <a href="#whole" data-kp-kinetic-figure-prose-link="whole">In ${inline("\\ln(xy)")},</a> the logarithm
        <a href="#product" data-kp-kinetic-figure-prose-link="product">contains the product of ${inline("x")} and ${inline("y")}.</a>
        <a href="#transform" data-kp-kinetic-figure-prose-link="transform">The product law separates that product into a sum,</a> so
        <a href="#result" data-kp-kinetic-figure-prose-link="result">the same quantity can be written as ${inline("\\ln(x)+\\ln(y)")}.</a>
      </p>
    `;
  }
  const passageUrlIds = projection === "stacked-station"
    ? kpLogProductStackedStationUrlIds
    : kpLogProductGlanceScrollytellingUrlIds;
  const transitionMarker = projection === "stacked-station"
    ? `
      <p id="transition.log-product.apply-product-law" class="kp-kinetic-figure__transition-marker" data-kp-kinetic-figure-transition="edge.log-product.rule-to-result">
        <span data-kp-kinetic-figure-transition-label>Apply the product law</span>
      </p>
    `
    : "";
  return `
    <div class="kp-kinetic-figure__narrative-track" aria-label="Explanation">
      <p id="${passageUrlIds.whole}" class="kp-kinetic-figure__paragraph kp-kinetic-figure__passage" data-kp-kinetic-figure-scroll-passage="whole">
        <a href="#${passageUrlIds.whole}" data-kp-kinetic-figure-prose-link="whole"><span class="kp-kinetic-figure__passage-number" aria-hidden="true">1</span><span>Begin with ${inline("\\ln(xy)")}. Under the positive-domain conditions above, this is one quantity written as the logarithm of a product.</span></a>
      </p>
      <p id="${passageUrlIds.product}" class="kp-kinetic-figure__paragraph kp-kinetic-figure__passage" data-kp-kinetic-figure-scroll-passage="product">
        <a href="#${passageUrlIds.product}" data-kp-kinetic-figure-prose-link="product"><span class="kp-kinetic-figure__passage-number" aria-hidden="true">2</span><span>Read the structure inside the parentheses first. The logarithm contains multiplication: ${inline("x")} and ${inline("y")} occur together as the product ${inline("xy")}.</span></a>
      </p>
      <p id="${passageUrlIds.transform}" class="kp-kinetic-figure__paragraph kp-kinetic-figure__passage" data-kp-kinetic-figure-scroll-passage="transform">
        <a href="#${passageUrlIds.transform}" data-kp-kinetic-figure-prose-link="transform"><span class="kp-kinetic-figure__passage-number" aria-hidden="true">3</span><span>The product law, <span class="kp-kinetic-figure__rule-template">${inline("\\ln(uv)=\\ln(u)+\\ln(v)")}</span>, applies because the argument is a product. It separates the single logarithm into two logarithms joined by addition.</span></a>
      </p>
      ${transitionMarker}
      <p id="${passageUrlIds.result}" class="kp-kinetic-figure__paragraph kp-kinetic-figure__passage" data-kp-kinetic-figure-scroll-passage="result">
        <a href="#${passageUrlIds.result}" data-kp-kinetic-figure-prose-link="result"><span class="kp-kinetic-figure__passage-number" aria-hidden="true">4</span><span>The rewrite settles as ${inline("\\ln(x)+\\ln(y).")} Nothing has been approximated; the notation now exposes the two factors separately.</span></a>
      </p>
    </div>
  `;
}

function resolveProjection(view: Window): KpLogProductKineticFigureProjection {
  const requested = new URLSearchParams(view.location.search).get("projection");
  if (requested === "focus-deck") return "focus-deck";
  const reducedMotion = view.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (requested === "stacked-station" && !reducedMotion) {
    return "stacked-station";
  }
  const supportsScrollProjection = view.matchMedia(
    "(min-width: 48rem) and (prefers-reduced-motion: no-preference)"
  ).matches;
  if (!supportsScrollProjection) return "local-split";
  if (requested === "glance-scrollytelling") return "glance-scrollytelling";
  return requested === "micro-station" ? "micro-station" : "local-split";
}

function measureStackedTransitionInterval(input: {
  readonly view: Window;
  readonly marker: HTMLElement;
  readonly readingLineViewportRatio: number;
}): {
  readonly transitionStartScrollY: number;
  readonly transitionEndScrollY: number;
} {
  const markerBounds = input.marker.getBoundingClientRect();
  const readingLineViewportY = input.view.innerHeight *
    input.readingLineViewportRatio;
  const markerDocumentTop = markerBounds.top + input.view.scrollY;
  const markerDocumentBottom = markerBounds.bottom + input.view.scrollY;
  const resultReceptionRunway = markerBounds.height * 0.2;
  return Object.freeze({
    transitionStartScrollY: markerDocumentTop - readingLineViewportY,
    transitionEndScrollY: markerDocumentBottom - readingLineViewportY -
      resultReceptionRunway
  });
}

function projectStackedStationDock(
  article: HTMLElement,
  stage: HTMLElement,
  narrative: HTMLElement,
  view: Window
): void {
  const stageBlockSize = stage.getBoundingClientRect().height;
  const anchorProjection = projectKpLogProductStackedStationDock({
    stageViewportTop: 0,
    stageBlockSize,
    viewportHeight: view.innerHeight
  });
  const dockTop = `${anchorProjection.dockTopViewportY.toFixed(3)}px`;
  if (stage.style.getPropertyValue(
    "--kp-kinetic-figure-stage-dock-top"
  ) !== dockTop) {
    stage.style.setProperty(
      "--kp-kinetic-figure-stage-dock-top",
      dockTop
    );
  }
  const stageBounds = stage.getBoundingClientRect();
  const projection = projectKpLogProductStackedStationDock({
    stageViewportTop: stageBounds.top,
    stageBlockSize,
    viewportHeight: view.innerHeight
  });
  const narrativeClipTop = Math.max(
    0,
    stageBounds.bottom - narrative.getBoundingClientRect().top
  );
  narrative.style.setProperty(
    "--kp-kinetic-figure-narrative-clip-top",
    `${narrativeClipTop.toFixed(3)}px`
  );
  article.dataset["kpKineticFigureStationLifecycle"] = projection.phase;
}

function scrollProjectionToState(
  view: Window,
  article: HTMLElement,
  microStationAnchor: HTMLElement,
  projection: KpLogProductKineticFigureProjection,
  stateId: KpLogProductKineticFigureStateId
): void {
  if (
    projection === "glance-scrollytelling" ||
    projection === "stacked-station"
  ) {
    scrollPassageScrollytellingToState(
      view,
      article,
      stateId,
      projection === "stacked-station"
        ? kpLogProductStackedStationReadingLineViewportRatio
        : kpLogProductGlanceScrollytellingReadingLineViewportRatio
    );
    return;
  }
  scrollMicroStationToState(view, microStationAnchor, stateId);
}

function scrollPassageScrollytellingToState(
  view: Window,
  article: HTMLElement,
  stateId: KpLogProductKineticFigureStateId,
  readingLineViewportRatio: number
): void {
  const passage = requiredElement<HTMLElement>(
    article,
    `[data-kp-kinetic-figure-scroll-passage="${CSS.escape(stateId)}"]`
  );
  const viewportHeight = view.innerHeight;
  const passageDocumentTop = passage.getBoundingClientRect().top + view.scrollY;
  const targetPassageTop = readingLineViewportRatio * viewportHeight;
  view.scrollTo({
    top: Math.max(0, passageDocumentTop - targetPassageTop),
    behavior: "auto"
  });
}

function stateIdFromPassageId(
  passageId: string,
  passageUrlIds: Readonly<Record<KpLogProductKineticFigureStateId, string>>
): KpLogProductKineticFigureStateId | undefined {
  return (Object.entries(passageUrlIds) as Array<
    [KpLogProductKineticFigureStateId, string]
  >).find(([, semanticId]) => semanticId === passageId)?.[0];
}

function scrollMicroStationToState(
  view: Window,
  anchor: HTMLElement,
  stateId: KpLogProductKineticFigureStateId
): void {
  const travel = kpLogProductMicroStationCanonicalTravel[stateId];
  const viewportHeight = view.innerHeight;
  const start = kpLogProductMicroStationCorridor.startViewportRatio *
    viewportHeight;
  const end = kpLogProductMicroStationCorridor.endViewportRatio *
    viewportHeight;
  const anchorDocumentTop = anchor.getBoundingClientRect().top + view.scrollY;
  const targetAnchorTop = start - travel * (start - end);
  view.scrollTo({
    top: Math.max(0, anchorDocumentTop - targetAnchorTop),
    behavior: "auto"
  });
}

function isStateId(
  value: string | undefined
): value is KpLogProductKineticFigureStateId {
  return kpLogProductKineticFigureStates.some(({ id }) => id === value);
}

function isFocusDeckBeatId(
  value: string | undefined
): value is KpLogProductFocusDeckBeatId {
  return kpLogProductFocusDeckBeatIds.some((id) => id === value);
}

function readStateIdFromHash(
  hash: string
): KpLogProductKineticFigureStateId | undefined {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  // Semantic passage links must survive a responsive or reduced-motion
  // fallback to Local Split; URL meaning cannot depend on presentation mode.
  const semanticState = readKpLogProductGlanceScrollytellingUrlState(raw) ??
    readKpLogProductStackedStationUrlState(raw);
  return semanticState ?? (isStateId(raw) ? raw : undefined);
}

function hashForState(
  projection: KpLogProductKineticFigureProjection,
  stateId: KpLogProductKineticFigureStateId
): string {
  if (projection === "stacked-station") {
    return `#${kpLogProductStackedStationUrlIds[stateId]}`;
  }
  return projection === "glance-scrollytelling"
    ? `#${kpLogProductGlanceScrollytellingUrlIds[stateId]}`
    : `#${stateId}`;
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing Kinetic Figure ${selector}.`);
  return element;
}
