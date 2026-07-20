import {
  conceptRoomStateRoute,
  createConceptRoomState,
  formatConceptRoomRoute,
  parseConceptRoomRoute,
  reduceConceptRoomState,
  type KpConceptRoomProviderRouteState,
  type KpConceptRoomRoute,
  type KpConceptRoomState
} from "../kernel/public-api.ts";

import { createRoomEffectCoordinator } from "./room-effect-coordinator.ts";
import {
  createConceptRoomScrollCoordinator,
  type KpConceptRoomScrollCoordinator
} from "./concept-room-scroll-coordinator.ts";
import {
  createConceptRoomPlaybackController,
  type KpConceptRoomPlaybackController,
  type KpConceptRoomPlaybackSeekSource
} from "./concept-room-playback-controller.ts";
import type {
  KpConceptRoomArtifactLike,
  KpConceptRoomCatalogEntryLike
} from "./concept-room-artifact.ts";
import {
  KpConceptRoomRuntimeError,
  type KpConceptRoomArtifactValidator,
  type KpConceptRoomDiagnosticCode,
  type KpConceptRoomRuntime,
  type KpConceptRoomRuntimeSession
} from "./concept-room-runtime.ts";
import { applyConceptRoomTheme } from "./concept-room-theme-adapters.ts";
import { linearEquationExemplarTheme } from "./concept-room-theme.ts";
import { linearEquationExemplarCss } from "./linear-equation-exemplar-style.ts";
import {
  createLinearEquationCorrespondenceController,
  type KpLinearEquationCorrespondenceController
} from "./linear-equation-correspondence-controller.ts";
import {
  createLinearEquationStoryAnimationStage,
  type KpLinearEquationStoryAnimationStage
} from "./linear-equation-story-animation-stage.ts";
import {
  renderLinearEquationSymbolicStory,
  type KpLinearEquationSymbolicStoryLike
} from "./linear-equation-symbolic-story-dom.ts";

export type {
  KpConceptRoomArtifactLike,
  KpConceptRoomCatalogEntryLike
} from "./concept-room-artifact.ts";

export interface KpConceptRoomNavigationHost {
  current(): { readonly pathname: string; readonly search: string };
  push(url: string): void;
  replace(url: string): void;
  subscribe(listener: () => void): () => void;
}

export interface KpConceptRoomClipboard {
  writeText(text: string): Promise<void>;
}

export interface KpConceptRoomShellHandle {
  readonly conceptId: string;
  readonly disposed: boolean;
  dispose(): void;
}

export function resolveConceptRoomCatalogEntry(
  catalog: readonly KpConceptRoomCatalogEntryLike[],
  pathname: string
): KpConceptRoomCatalogEntryLike | undefined {
  return catalog.find((entry) =>
    entry.canonicalPath === pathname || entry.legacyAliases.includes(pathname)
  );
}

export async function tryMountConceptRoomRoute(input: {
  readonly root: HTMLElement;
  readonly catalog: readonly KpConceptRoomCatalogEntryLike[];
  readonly navigation?: KpConceptRoomNavigationHost;
  readonly clipboard?: KpConceptRoomClipboard;
  readonly runtime?: KpConceptRoomRuntime;
  readonly validateArtifact?: KpConceptRoomArtifactValidator;
  readonly symbolicStory?: KpLinearEquationSymbolicStoryLike;
}): Promise<KpConceptRoomShellHandle | null> {
  const navigation = input.navigation ?? browserNavigationHost();
  const clipboard = input.clipboard ?? browserClipboard();
  const location = navigation.current();
  const entry = resolveConceptRoomCatalogEntry(input.catalog, location.pathname);
  if (entry === undefined) return null;

  input.root.replaceChildren(loadingShell());
  let artifact: KpConceptRoomArtifactLike;
  try {
    const loaded = await entry.load();
    artifact = input.validateArtifact === undefined
      ? loaded
      : await input.validateArtifact(loaded);
    requireMatchingArtifact(entry, artifact);
  } catch (error) {
    renderCatalogReviewFallback(input.root, entry, diagnosticFrom(error, "artifact-invalid"));
    return inertHandle(entry.conceptId, input.root);
  }
  let state = stateForLocation(entry, artifact, location, navigation);
  let isDisposed = false;
  let renderRequest = 0;
  const abortController = new AbortController();
  let runtimeSession: KpConceptRoomRuntimeSession | undefined;
  let startupDiagnostic: RoomDiagnostic | undefined;
  let scrollCoordinator: KpConceptRoomScrollCoordinator | undefined;
  let playbackController: KpConceptRoomPlaybackController | undefined;
  let correspondenceController: KpLinearEquationCorrespondenceController | undefined;
  let storyAnimationStage: KpLinearEquationStoryAnimationStage | undefined;
  let storyAnimationHost: HTMLElement | undefined;
  let initialCheckpointToRestore = location.search.length > 0 ? state.checkpoint : undefined;
  const roomEffects = createRoomEffectCoordinator({
    roomId: `concept.${entry.conceptId}`,
    getState: () => state,
    ports: {
      provider: async () => undefined,
      url: (request) => {
        if (request.strategy === "push") navigation.push(request.route);
        else navigation.replace(request.route);
      },
      persistence: () => undefined,
      lazyLoad: async () => undefined
    },
    onApplied: () => undefined
  });

  const render = async (options: { readonly preserveShell?: boolean } = {}) => {
    const request = ++renderRequest;
    const playing = playbackController?.playing ?? false;
    const preservedViewport = options.preserveShell
      ? updateRenderedShell(input.root, artifact, state, playing)
      : undefined;
    const viewport = preservedViewport ?? renderShell(
      input.root,
      artifact,
      state,
      playing,
      input.symbolicStory
    );
    if (input.symbolicStory !== undefined) {
      const storyHost = input.root.querySelector<HTMLElement>(
        "[data-kp-symbolic-story-animation-host]"
      );
      if (storyHost !== null && storyHost !== storyAnimationHost) {
        storyAnimationHost = storyHost;
        storyAnimationStage?.dispose();
        storyAnimationStage = undefined;
        void createLinearEquationStoryAnimationStage(storyHost).then((nextStage) => {
          if (isDisposed || storyAnimationHost !== storyHost || !storyHost.isConnected) {
            nextStage.dispose();
            return;
          }
          storyAnimationStage = nextStage;
          nextStage.setProgress(state.timePermille / 1000);
        }).catch((error: unknown) => {
          if (isDisposed || storyAnimationHost !== storyHost || !storyHost.isConnected) return;
          storyHost.dataset["kpSymbolicStoryAnimationError"] = "true";
          storyHost.textContent = error instanceof Error
            ? error.message
            : "The symbolic animation is unavailable.";
        });
      }
      storyAnimationStage?.setProgress(state.timePermille / 1000);
    }
    if (preservedViewport === undefined) {
      scrollCoordinator?.refresh();
      if (initialCheckpointToRestore !== undefined) {
        scrollCoordinator?.scrollTo(initialCheckpointToRestore, "auto");
        initialCheckpointToRestore = undefined;
      }
    }
    if (state.mode === "ask") {
      renderArtifactReviewFallback(
        viewport,
        artifact,
        diagnostic("ask-unavailable", "Ask is not connected in this architecture exemplar.")
      );
      correspondenceController?.refresh(state.focus);
      return;
    }
    if (state.mode === "review") {
      renderArtifactReviewFallback(viewport, artifact);
      correspondenceController?.refresh(state.focus);
      return;
    }
    if (startupDiagnostic !== undefined || runtimeSession === undefined) {
      renderArtifactReviewFallback(
        viewport,
        artifact,
        startupDiagnostic ?? diagnostic("renderer-unavailable", "The interactive renderer is unavailable.")
      );
      correspondenceController?.refresh(state.focus);
      return;
    }
    try {
      // Motion and diagram renderers measure real layout, so their viewport must be connected.
      await runtimeSession.render(viewport, state);
      if (isDisposed || request !== renderRequest) return;
      correspondenceController?.refresh(state.focus);
    } catch (error) {
      if (isDisposed || request !== renderRequest) return;
      renderArtifactReviewFallback(viewport, artifact, diagnosticFrom(error, "renderer-unavailable"));
    }
  };
  const onClick = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-kp-concept-room-link]");
    if (link !== null && input.root.contains(link)) {
      event.preventDefault();
      const nextRoute = parseConceptRoomRoute(link.getAttribute("href") ?? "");
      let explicitCheckpoint: string | undefined;
      if (link.dataset["kpConceptCheckpointLink"] !== undefined) {
        explicitCheckpoint = nextRoute.checkpoint;
        playbackController?.pause();
        state = reduceConceptRoomState(state, {
          kind: "seek",
          checkpoint: nextRoute.checkpoint,
          timePermille: nextRoute.timePermille
        });
        state = reduceConceptRoomState(state, { kind: "set-focus", focus: nextRoute.focus });
      } else if (link.dataset["kpConceptProjectionLink"] !== undefined) {
        state = reduceConceptRoomState(state, { kind: "set-projection", projection: nextRoute.projection });
      } else if (link.dataset["kpConceptModeLink"] !== undefined) {
        playbackController?.pause();
        state = reduceConceptRoomState(state, { kind: "set-mode", mode: nextRoute.mode });
        if (nextRoute.mode === "watch" || nextRoute.mode === "touch") {
          explicitCheckpoint = state.checkpoint;
        }
      }
      void render({ preserveShell: link.dataset["kpConceptModeLink"] === undefined });
      roomEffects.start({
        kind: "url",
        route: formatConceptRoomRoute(conceptRoomStateRoute(state)),
        strategy: "push"
      });
      // Entering Watch is the one intentional autoplay gesture: the click is
      // explicit, while direct URLs remain paused at the exact shared frame.
      if (link.dataset["kpConceptModeLink"] === "watch") playbackController?.play();
      if (explicitCheckpoint !== undefined) {
        scrollCoordinator?.scrollTo(explicitCheckpoint, "smooth");
      }
      return;
    }
    const button = event.target.closest<HTMLButtonElement>("button[data-kp-concept-playback-action]");
    const shareButton = event.target.closest<HTMLButtonElement>("button[data-kp-concept-share-route]");
    if (shareButton !== null && input.root.contains(shareButton)) {
      const route = shareButton.dataset["kpConceptShareRoute"];
      if (route !== undefined) void copyConceptRoomRoute(input.root, clipboard, route);
      return;
    }
    if (button === null || !input.root.contains(button)) return;
    switch (button.dataset["kpConceptPlaybackAction"]) {
      case "play-pause":
        if (playbackController?.playing) playbackController.pause();
        else playbackController?.play();
        return;
      case "replay": playbackController?.replay(); return;
      case "previous": playbackController?.previous(); return;
      case "next": playbackController?.next(); return;
    }
  };
  const onInput = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement) ||
      event.target.dataset["kpConceptPlaybackAction"] !== "scrub") return;
    playbackController?.scrub(event.target.valueAsNumber);
  };
  const onPopState = () => {
    if (isDisposed) return;
    playbackController?.pause();
    const current = navigation.current();
    const currentEntry = resolveConceptRoomCatalogEntry(input.catalog, current.pathname);
    if (currentEntry?.conceptId !== entry.conceptId) return;
    const previousMode = state.mode;
    state = stateForLocation(entry, artifact, current, navigation);
    void render({ preserveShell: previousMode === state.mode });
    scrollCoordinator?.scrollTo(state.checkpoint, "auto");
  };
  scrollCoordinator = createConceptRoomScrollCoordinator({
    root: input.root,
    checkpoints: artifact.manifest.checkpoints,
    currentCheckpoint: () => state.checkpoint,
    onCheckpoint(checkpoint) {
      // Passive reading controls the shared clock only in Touch. Watch owns
      // its clock through playback, and Review is an inert static document.
      if (state.mode !== "touch" || checkpoint.id === state.checkpoint || isDisposed) return;
      state = reduceConceptRoomState(state, {
        kind: "seek",
        checkpoint: checkpoint.id,
        timePermille: checkpoint.progressPermille
      });
      state = reduceConceptRoomState(state, {
        kind: "set-focus",
        focus: checkpoint.semanticRefs
      });
      void render();
      roomEffects.start({
        kind: "url",
        route: formatConceptRoomRoute(conceptRoomStateRoute(state)),
        strategy: "replace"
      });
    }
  });
  playbackController = createConceptRoomPlaybackController({
    checkpointTimes: artifact.manifest.checkpoints.map((checkpoint) => checkpoint.progressPermille),
    durationMs: exemplarPlaybackDurationMs(),
    getTimePermille: () => state.timePermille,
    onSeek(timePermille, source) {
      if (isDisposed) return;
      applyPlaybackSeek(timePermille, source);
    },
    onPlayingChange(playing) {
      syncPlaybackControls(input.root, playing);
    }
  });
  function applyPlaybackSeek(timePermille: number, source: KpConceptRoomPlaybackSeekSource): void {
    const checkpoint = checkpointAtTime(artifact, timePermille);
    const checkpointChanged = checkpoint.id !== state.checkpoint;
    state = reduceConceptRoomState(state, {
      kind: "seek",
      checkpoint: checkpoint.id,
      timePermille
    });
    if (checkpointChanged) {
      state = reduceConceptRoomState(state, { kind: "set-focus", focus: checkpoint.semanticRefs });
    }
    void render({ preserveShell: source === "playback" });
    if (checkpointChanged) {
      scrollCoordinator?.scrollTo(checkpoint.id, source === "scrub" ? "auto" : "smooth");
    }
    roomEffects.start({
      kind: "url",
      route: formatConceptRoomRoute(conceptRoomStateRoute(state)),
      strategy: source === "step" || source === "replay" ? "push" : "replace"
    });
  }
  function togglePinnedFocus(semanticId: string): void {
    if (isDisposed) return;
    const focus = state.focus.length === 1 && state.focus[0] === semanticId ? [] : [semanticId];
    state = reduceConceptRoomState(state, { kind: "set-focus", focus });
    void render({ preserveShell: true });
    roomEffects.start({
      kind: "url",
      route: formatConceptRoomRoute(conceptRoomStateRoute(state)),
      strategy: "push"
    });
  }
  correspondenceController = createLinearEquationCorrespondenceController({
    root: input.root,
    onPin: togglePinnedFocus
  });
  input.root.addEventListener("click", onClick);
  input.root.addEventListener("input", onInput);
  const unsubscribe = navigation.subscribe(onPopState);
  if (input.runtime === undefined) {
    startupDiagnostic = diagnostic("renderer-unavailable", "No interactive runtime was registered.");
  } else {
    try {
      runtimeSession = await input.runtime.prepare(artifact, { signal: abortController.signal });
    } catch (error) {
      startupDiagnostic = diagnosticFrom(error, "provider-unavailable");
    }
  }
  await render();
  if (location.search.length > 0) scrollCoordinator.scrollTo(state.checkpoint, "auto");

  return {
    conceptId: entry.conceptId,
    get disposed() { return isDisposed; },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      renderRequest += 1;
      abortController.abort();
      runtimeSession?.dispose();
      playbackController?.dispose();
      scrollCoordinator?.dispose();
      correspondenceController?.dispose();
      storyAnimationStage?.dispose();
      storyAnimationHost = undefined;
      roomEffects.dispose();
      unsubscribe();
      input.root.removeEventListener("click", onClick);
      input.root.removeEventListener("input", onInput);
      input.root.replaceChildren();
    }
  };
}

function stateForLocation(
  entry: KpConceptRoomCatalogEntryLike,
  artifact: KpConceptRoomArtifactLike,
  location: { readonly pathname: string; readonly search: string },
  navigation: KpConceptRoomNavigationHost
): KpConceptRoomState {
  const route = location.search.length === 0 || location.pathname !== entry.canonicalPath
    ? defaultRoute(artifact)
    : parseConceptRoomRoute(`${location.pathname}${location.search}`);
  if (route.conceptId !== entry.conceptId || route.conceptVersion !== entry.version) {
    throw new Error("Concept room route does not match the generated catalog entry.");
  }
  const canonical = formatConceptRoomRoute(route);
  if (`${location.pathname}${location.search}` !== canonical) navigation.replace(canonical);
  return createConceptRoomState(route, artifact.integrity);
}

function defaultRoute(artifact: KpConceptRoomArtifactLike): KpConceptRoomRoute {
  const checkpoint = artifact.manifest.checkpoints[0];
  const mode = artifact.manifest.modes[0];
  const projection = artifact.manifest.projections[0];
  if (checkpoint === undefined || mode === undefined || projection === undefined) {
    throw new Error("Concept artifact requires a checkpoint, mode, and projection.");
  }
  const provider = providerRouteState(artifact);
  return {
    schemaVersion: "kp.room-route.v1",
    conceptId: artifact.manifest.conceptId,
    conceptVersion: artifact.manifest.version,
    checkpoint: checkpoint.id,
    timePermille: checkpoint.progressPermille,
    mode,
    projection,
    parameters: {},
    focus: checkpoint.semanticRefs,
    ...(provider === undefined ? {} : { provider })
  };
}

function providerRouteState(
  artifact: KpConceptRoomArtifactLike
): KpConceptRoomProviderRouteState | undefined {
  const provider = artifact.manifest.providers[0];
  if (provider === undefined) return undefined;
  return {
    id: provider.id,
    protocol: provider.protocol,
    version: provider.version,
    provenance: `${artifact.manifest.provenance.sourcePath}#${artifact.integrity}`
  };
}

function renderShell(
  root: HTMLElement,
  artifact: KpConceptRoomArtifactLike,
  state: KpConceptRoomState,
  playing: boolean,
  symbolicStory?: KpLinearEquationSymbolicStoryLike
): HTMLElement {
  const checkpoint = artifact.manifest.checkpoints.find((item) => item.id === state.checkpoint);
  if (checkpoint === undefined) throw new Error(`Unknown concept checkpoint ${state.checkpoint}.`);
  const main = document.createElement("main");
  main.dataset["kpConceptRoomShell"] = "true";
  main.dataset["kpConceptId"] = artifact.manifest.conceptId;
  main.dataset["kpConceptVersion"] = artifact.manifest.version;
  main.dataset["kpConceptCheckpoint"] = checkpoint.id;
  main.dataset["kpConceptMode"] = state.mode;
  main.dataset["kpConceptProjection"] = state.projection;
  main.dataset["kpConceptPlaying"] = String(playing);
  applyConceptRoomTheme(main, linearEquationExemplarTheme);

  const header = document.createElement("header");
  header.dataset["kpConceptRoomHeader"] = "true";
  const productTag = document.createElement("p");
  productTag.dataset["kpConceptRoomProductTag"] = "true";
  productTag.textContent = "See concepts move";
  const title = document.createElement("h1");
  title.dataset["kpConceptRoomTitle"] = "true";
  title.textContent = artifact.manifest.title;
  header.append(productTag, title);

  const navigation = document.createElement("nav");
  navigation.dataset["kpConceptCheckpoints"] = "true";
  navigation.setAttribute("aria-label", "Concept checkpoints");
  const list = document.createElement("ol");
  artifact.manifest.checkpoints.forEach((item) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.dataset["kpConceptRoomLink"] = "checkpoint";
    link.dataset["kpConceptCheckpointLink"] = item.id;
    link.href = formatConceptRoomRoute({
      ...conceptRoomStateRoute(state),
      checkpoint: item.id,
      timePermille: item.progressPermille,
      focus: item.semanticRefs
    });
    link.textContent = item.title;
    if (item.id === checkpoint.id) link.setAttribute("aria-current", "step");
    listItem.append(link);
    list.append(listItem);
  });
  navigation.append(list);

  const checkpointSections = document.createElement("div");
  checkpointSections.dataset["kpConceptCheckpointSections"] = "true";
  artifact.manifest.checkpoints.forEach((item) => {
    const section = document.createElement("section");
    section.id = `checkpoint-${item.id}`;
    section.dataset["kpConceptExplanation"] = item.id;
    section.dataset["kpSemanticRefs"] = item.semanticRefs.join(" ");
    section.dataset["kpConceptCheckpointActive"] = String(item.id === checkpoint.id);
    if (item.id === checkpoint.id) section.setAttribute("aria-current", "step");
    const heading = document.createElement("h2");
    heading.id = `kp-concept-checkpoint-${item.id}-title`;
    if (state.mode === "touch") {
      heading.textContent = item.title;
    } else {
      const headingLink = document.createElement("a");
      headingLink.dataset["kpConceptRoomLink"] = "checkpoint";
      headingLink.dataset["kpConceptCheckpointLink"] = item.id;
      headingLink.href = formatConceptRoomRoute({
        ...conceptRoomStateRoute(state),
        checkpoint: item.id,
        timePermille: item.progressPermille,
        focus: item.semanticRefs
      });
      headingLink.textContent = item.title;
      if (item.id === checkpoint.id) headingLink.setAttribute("aria-current", "step");
      heading.append(headingLink);
    }
    const copy = document.createElement("p");
    appendLinkedExplanation(copy, item, state);
    section.setAttribute("aria-labelledby", heading.id);
    section.append(heading, copy);
    if (state.mode === "touch") {
      section.append(shareButton(
        "Copy step link",
        formatConceptRoomRoute({
          ...conceptRoomStateRoute(state),
          checkpoint: item.id,
          timePermille: item.progressPermille,
          focus: item.semanticRefs
        }),
        item.id,
        `Copy link to ${item.title} step`
      ));
    }
    checkpointSections.append(section);
  });

  const viewControls = document.createElement("nav");
  viewControls.dataset["kpConceptProjectionControls"] = "true";
  viewControls.setAttribute("aria-label", "Concept views");
  artifact.manifest.projections.forEach((projection) => {
    const link = document.createElement("a");
    link.dataset["kpConceptRoomLink"] = "projection";
    link.dataset["kpConceptProjectionLink"] = projection;
    link.href = formatConceptRoomRoute({ ...conceptRoomStateRoute(state), projection });
    link.textContent = projectionLabel(projection);
    if (projection === state.projection) link.setAttribute("aria-current", "page");
    viewControls.append(link);
  });
  const modeControls = document.createElement("nav");
  modeControls.dataset["kpConceptModeControls"] = "true";
  modeControls.setAttribute("aria-label", "Learning mode");
  artifact.manifest.modes.filter((mode) => mode !== "ask").forEach((mode) => {
    const link = document.createElement("a");
    link.dataset["kpConceptRoomLink"] = "mode";
    link.dataset["kpConceptModeLink"] = mode;
    link.href = formatConceptRoomRoute({ ...conceptRoomStateRoute(state), mode });
    link.textContent = mode[0]!.toUpperCase() + mode.slice(1);
    if (mode === state.mode) link.setAttribute("aria-current", "page");
    modeControls.append(link);
  });
  const controls = document.createElement("footer");
  controls.dataset["kpConceptControls"] = "true";
  const playback = playbackControls(state, playing);
  if (playback !== undefined) controls.append(playback);
  if (state.mode !== "review") controls.append(viewControls);
  controls.append(shareButton(
    "Copy frame link",
    formatConceptRoomRoute(conceptRoomStateRoute(state)),
    "current",
    "Copy link to current frame"
  ));
  controls.append(modeControls);
  const viewport = document.createElement("section");
  viewport.dataset["kpConceptViewport"] = "true";
  viewport.setAttribute("aria-label", "Concept view");
  const visualField = document.createElement("section");
  visualField.dataset["kpConceptVisualField"] = "true";
  visualField.setAttribute("aria-label", "Synchronized concept stage");
  const semanticDefinition = document.createElement("p");
  semanticDefinition.id = "kp-linear-equation-semantic-definition";
  semanticDefinition.dataset["kpConceptSemanticDefinition"] = "true";
  semanticDefinition.dataset["kpConceptSemanticDefinitionActive"] = "false";
  semanticDefinition.setAttribute("role", "status");
  semanticDefinition.textContent = "Select a linked idea to trace it through the equation and balance.";
  visualField.append(viewport, semanticDefinition, controls);
  const copyRail = document.createElement("aside");
  copyRail.dataset["kpConceptCopyRail"] = "true";
  copyRail.setAttribute("aria-label", "Concept explanation");
  if (state.mode === "touch") copyRail.append(navigation);
  copyRail.append(checkpointSections);
  const stage = document.createElement("div");
  stage.dataset["kpConceptRoomStage"] = "true";
  stage.append(visualField);
  if (state.mode !== "review") stage.append(copyRail);
  const shareStatus = document.createElement("p");
  shareStatus.dataset["kpConceptShareStatus"] = "true";
  shareStatus.setAttribute("role", "status");
  shareStatus.setAttribute("aria-live", "polite");
  const narration = document.createElement("p");
  narration.dataset["kpConceptNarration"] = "true";
  narration.setAttribute("role", "status");
  narration.setAttribute("aria-live", "polite");
  narration.setAttribute("aria-atomic", "true");
  narration.textContent = narrationForState(artifact, state);
  const verification = verificationDisclosure(artifact);
  const secondary = document.createElement("section");
  secondary.dataset["kpConceptSecondarySurface"] = "true";
  secondary.setAttribute("aria-labelledby", "kp-concept-secondary-title");
  const secondaryHeading = document.createElement("h2");
  secondaryHeading.id = "kp-concept-secondary-title";
  secondaryHeading.textContent = "Explore the harder example";
  const secondaryCopy = document.createElement("p");
  secondaryCopy.textContent =
    "Continue to division and fractions, or compare the same steps with a balance model.";
  secondary.append(secondaryHeading, secondaryCopy, stage);
  main.append(header, narration);
  if (symbolicStory !== undefined) {
    main.append(renderLinearEquationSymbolicStory(symbolicStory));
  }
  main.append(secondary, shareStatus, verification);
  const style = document.createElement("style");
  style.dataset["kpLinearEquationExemplarStyle"] = "true";
  style.textContent = linearEquationExemplarCss();
  root.replaceChildren(style, main);
  return viewport;
}

function updateRenderedShell(
  root: HTMLElement,
  artifact: KpConceptRoomArtifactLike,
  state: KpConceptRoomState,
  playing: boolean
): HTMLElement | undefined {
  const shell = root.querySelector<HTMLElement>("[data-kp-concept-room-shell]");
  const viewport = shell?.querySelector<HTMLElement>("[data-kp-concept-viewport]");
  if (shell === null || shell === undefined || viewport === null || viewport === undefined) return undefined;
  shell.dataset["kpConceptCheckpoint"] = state.checkpoint;
  shell.dataset["kpConceptMode"] = state.mode;
  shell.dataset["kpConceptProjection"] = state.projection;
  shell.dataset["kpConceptPlaying"] = String(playing);
  const route = conceptRoomStateRoute(state);
  const narration = shell.querySelector<HTMLElement>("[data-kp-concept-narration]");
  if (narration !== null) {
    const nextNarration = narrationForState(artifact, state);
    // Avoid re-announcing unchanged prose on every animation frame.
    if (narration.textContent !== nextNarration) narration.textContent = nextNarration;
  }
  artifact.manifest.checkpoints.forEach((checkpoint) => {
    shell.querySelectorAll<HTMLAnchorElement>(
      `[data-kp-concept-checkpoint-link="${checkpoint.id}"]`
    ).forEach((link) => {
      link.href = formatConceptRoomRoute({
        ...route,
        checkpoint: checkpoint.id,
        timePermille: checkpoint.progressPermille,
        focus: checkpoint.semanticRefs
      });
      setCurrent(link, checkpoint.id === state.checkpoint, "step");
    });
    const section = shell.querySelector<HTMLElement>(
      `[data-kp-concept-explanation="${checkpoint.id}"]`
    );
    if (section !== null) {
      section.dataset["kpConceptCheckpointActive"] = String(checkpoint.id === state.checkpoint);
      setCurrent(section, checkpoint.id === state.checkpoint, "step");
      const share = section.querySelector<HTMLButtonElement>("[data-kp-concept-share-checkpoint]");
      if (share !== null) {
        share.dataset["kpConceptShareRoute"] = formatConceptRoomRoute({
          ...route,
          checkpoint: checkpoint.id,
          timePermille: checkpoint.progressPermille,
          focus: checkpoint.semanticRefs
        });
      }
    }
  });
  artifact.manifest.projections.forEach((projection) => {
    const link = shell.querySelector<HTMLAnchorElement>(`[data-kp-concept-projection-link="${projection}"]`);
    if (link === null) return;
    link.href = formatConceptRoomRoute({ ...route, projection });
    setCurrent(link, projection === state.projection, "page");
  });
  artifact.manifest.modes.filter((mode) => mode !== "ask").forEach((mode) => {
    const link = shell.querySelector<HTMLAnchorElement>(`[data-kp-concept-mode-link="${mode}"]`);
    if (link === null) return;
    link.href = formatConceptRoomRoute({ ...route, mode });
    setCurrent(link, mode === state.mode, "page");
  });
  const scrubber = shell.querySelector<HTMLInputElement>('[data-kp-concept-playback-action="scrub"]');
  if (scrubber !== null) scrubber.value = String(state.timePermille);
  const currentShare = shell.querySelector<HTMLButtonElement>('[data-kp-concept-share-checkpoint="current"]');
  if (currentShare !== null) currentShare.dataset["kpConceptShareRoute"] = formatConceptRoomRoute(route);
  syncPlaybackControls(root, playing);
  return viewport;
}

function setCurrent(element: Element, current: boolean, value: "page" | "step"): void {
  if (current) element.setAttribute("aria-current", value);
  else element.removeAttribute("aria-current");
}

function projectionLabel(projection: KpConceptRoomState["projection"]): string {
  if (projection === "coordinated") return "Together";
  return projection === "symbolic" ? "Equation" : "Balance";
}

function playbackControls(state: KpConceptRoomState, playing: boolean): HTMLElement | undefined {
  if (state.mode === "review" || state.mode === "ask") return undefined;
  const group = document.createElement("div");
  group.dataset["kpConceptPlaybackControls"] = "true";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Concept playback");
  if (state.mode === "touch") group.append(playbackButton("previous", "Previous step", "Back"));
  group.append(
    playbackButton("play-pause", playing ? "Pause concept" : "Play concept", playing ? "Pause" : "Play"),
    playbackButton("replay", "Replay concept", "Replay")
  );
  if (state.mode === "touch") group.append(playbackButton("next", "Next step", "Next"));
  if (state.mode === "watch") return group;
  const scrubber = document.createElement("input");
  scrubber.type = "range";
  scrubber.min = "0";
  scrubber.max = "1000";
  scrubber.step = "1";
  scrubber.value = String(state.timePermille);
  scrubber.dataset["kpConceptPlaybackAction"] = "scrub";
  scrubber.setAttribute("aria-label", "Scrub concept timeline");
  group.append(scrubber);
  return group;
}

function playbackButton(action: string, label: string, text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset["kpConceptPlaybackAction"] = action;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function shareButton(
  text: string,
  route: string,
  checkpoint: string,
  accessibleLabel: string
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset["kpConceptShareAction"] = "copy-link";
  button.dataset["kpConceptShareCheckpoint"] = checkpoint;
  button.dataset["kpConceptShareRoute"] = route;
  button.setAttribute("aria-label", accessibleLabel);
  button.textContent = text;
  return button;
}

function narrationForState(
  artifact: KpConceptRoomArtifactLike,
  state: KpConceptRoomState
): string {
  const checkpointIndex = artifact.manifest.checkpoints.findIndex((item) => item.id === state.checkpoint);
  const checkpoint = artifact.manifest.checkpoints[checkpointIndex];
  if (checkpoint === undefined) return "Concept state is unavailable.";
  const next = artifact.manifest.checkpoints[checkpointIndex + 1];
  if (next !== undefined && state.timePermille > checkpoint.progressPermille) {
    return `Moving toward ${next.title}. ${next.explanation}`;
  }
  return `${checkpoint.title}. ${checkpoint.explanation}`;
}

function verificationDisclosure(artifact: KpConceptRoomArtifactLike): HTMLElement {
  const disclosure = document.createElement("details");
  disclosure.dataset["kpConceptVerification"] = "true";
  const summary = document.createElement("summary");
  summary.textContent = "Verification";
  const list = document.createElement("ul");
  const provider = artifact.manifest.providers[0];
  if (provider !== undefined) {
    const providerItem = document.createElement("li");
    providerItem.dataset["kpConceptVerificationProvider"] = provider.id;
    providerItem.textContent = `Exact rational arithmetic checked with ${provider.protocol}, version ${provider.version}.`;
    list.append(providerItem);
  }
  const provenanceItem = document.createElement("li");
  provenanceItem.dataset["kpConceptVerificationProvenance"] = artifact.manifest.provenance.authoredBy;
  provenanceItem.textContent = `Source authorship: ${artifact.manifest.provenance.authoredBy}. Published with Kinetic Press ${artifact.manifest.provenance.compilerVersion}.`;
  const integrityItem = document.createElement("li");
  integrityItem.dataset["kpConceptVerificationIntegrity"] = artifact.integrity;
  integrityItem.textContent = `Published artifact ${artifact.manifest.version} is integrity-checked.`;
  list.append(provenanceItem, integrityItem);
  disclosure.append(summary, list);
  return disclosure;
}

async function copyConceptRoomRoute(
  root: HTMLElement,
  clipboard: KpConceptRoomClipboard,
  route: string
): Promise<void> {
  const status = root.querySelector<HTMLElement>("[data-kp-concept-share-status]");
  try {
    const origin = root.ownerDocument.defaultView?.location.origin ?? "http://localhost";
    await clipboard.writeText(new URL(route, origin).href);
    if (status !== null) status.textContent = "Link copied.";
  } catch {
    if (status !== null) status.textContent = "Copy is unavailable. The current URL is still shareable.";
  }
}

function syncPlaybackControls(root: HTMLElement, playing: boolean): void {
  const shell = root.querySelector<HTMLElement>("[data-kp-concept-room-shell]");
  if (shell !== null) shell.dataset["kpConceptPlaying"] = String(playing);
  const button = root.querySelector<HTMLButtonElement>('[data-kp-concept-playback-action="play-pause"]');
  if (button === null) return;
  button.textContent = playing ? "Pause" : "Play";
  button.setAttribute("aria-label", playing ? "Pause concept" : "Play concept");
}

function checkpointAtTime(
  artifact: KpConceptRoomArtifactLike,
  timePermille: number
): KpConceptRoomArtifactLike["manifest"]["checkpoints"][number] {
  const checkpoint = [...artifact.manifest.checkpoints]
    .reverse()
    .find((candidate) => candidate.progressPermille <= timePermille);
  if (checkpoint === undefined) throw new Error("Concept timeline requires an initial checkpoint at zero.");
  return checkpoint;
}

function exemplarPlaybackDurationMs(): number {
  const motion = linearEquationExemplarTheme.tokens.motion;
  return (motion.focusMs + motion.reflowMs + motion.actMs + motion.settleMs) * 4;
}

const exemplarSemanticPhrases: Readonly<Record<string, readonly {
  readonly phrase: string;
  readonly semanticId: string;
}[]>> = {
  start: [
    { phrase: "2x", semanticId: "term.two-x" },
    { phrase: "+ 3", semanticId: "term.add-three" },
    { phrase: "8", semanticId: "term.eight" },
    { phrase: "one side must also change on the other", semanticId: "diagram.balance" }
  ],
  "subtract-three": [
    { phrase: "Subtract 3 from both sides", semanticId: "operation.subtract-three" },
    { phrase: "+3 and -3 cancel", semanticId: "equation.after-subtract" }
  ],
  "divide-two": [
    { phrase: "Divide both sides by 2", semanticId: "operation.divide-two" },
    { phrase: "Two copies of x", semanticId: "term.two-x" },
    { phrase: "5/2", semanticId: "equation.solved" }
  ],
  solved: [
    { phrase: "x = 5/2", semanticId: "equation.solved" },
    { phrase: "Substitution confirms", semanticId: "equation.solved" }
  ]
};

function appendLinkedExplanation(
  root: HTMLParagraphElement,
  checkpoint: KpConceptRoomArtifactLike["manifest"]["checkpoints"][number],
  state: KpConceptRoomState
): void {
  const phrases = exemplarSemanticPhrases[checkpoint.id] ?? [];
  const ordered = phrases
    .map((item) => ({ ...item, index: checkpoint.explanation.indexOf(item.phrase) }))
    .filter((item) => item.index >= 0)
    .sort((left, right) => left.index - right.index);
  let cursor = 0;
  for (const item of ordered) {
    root.append(document.createTextNode(checkpoint.explanation.slice(cursor, item.index)));
    const link = document.createElement("a");
    link.dataset["kpConceptRoomLink"] = "semantic";
    link.dataset["kpConceptCheckpointLink"] = checkpoint.id;
    link.dataset["kpConceptSemanticLink"] = item.semanticId;
    link.href = formatConceptRoomRoute({
      ...conceptRoomStateRoute(state),
      checkpoint: checkpoint.id,
      timePermille: checkpoint.progressPermille,
      focus: [item.semanticId]
    });
    link.textContent = item.phrase;
    root.append(link);
    cursor = item.index + item.phrase.length;
  }
  root.append(document.createTextNode(checkpoint.explanation.slice(cursor)));
}

function loadingShell(): HTMLElement {
  const main = document.createElement("main");
  main.dataset["kpConceptRoomLoading"] = "true";
  main.setAttribute("aria-busy", "true");
  const copy = document.createElement("p");
  copy.textContent = "Loading concept…";
  main.append(copy);
  return main;
}

interface RoomDiagnostic {
  readonly code: KpConceptRoomDiagnosticCode;
  readonly message: string;
}

function diagnostic(
  code: KpConceptRoomDiagnosticCode,
  message: string
): RoomDiagnostic {
  return Object.freeze({ code, message });
}

function diagnosticFrom(
  error: unknown,
  fallback: KpConceptRoomDiagnosticCode
): RoomDiagnostic {
  if (error instanceof KpConceptRoomRuntimeError) return diagnostic(error.code, error.message);
  const fitnessCode = firstFitnessIssueCode(error);
  switch (fitnessCode) {
    case "capability-unavailable":
      return diagnostic("capability-unavailable", "A required concept capability is unavailable.");
    case "provider-incompatible":
      return diagnostic("provider-unavailable", "The required provider version is unavailable.");
    case "style-role-unavailable":
      return diagnostic("renderer-unavailable", "A required presentation role is unavailable.");
    case "artifact-invalid":
    case "integrity-mismatch":
      return diagnostic("artifact-invalid", "The interactive artifact could not be validated.");
    default:
      return diagnostic(fallback, fallbackMessage(fallback));
  }
}

function firstFitnessIssueCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("report" in error)) return undefined;
  const report = error.report;
  if (typeof report !== "object" || report === null || !("issues" in report) || !Array.isArray(report.issues)) {
    return undefined;
  }
  const first = report.issues[0];
  return typeof first === "object" && first !== null && "code" in first && typeof first.code === "string"
    ? first.code
    : undefined;
}

function fallbackMessage(code: KpConceptRoomDiagnosticCode): string {
  switch (code) {
    case "artifact-invalid": return "The interactive artifact could not be loaded.";
    case "ask-unavailable": return "Ask is unavailable.";
    case "capability-unavailable": return "A required concept capability is unavailable.";
    case "provider-unavailable": return "The verified problem provider is unavailable.";
    case "renderer-unavailable": return "The interactive renderer is unavailable.";
    case "projection-unavailable": return "The requested projection is unavailable.";
  }
}

function renderArtifactReviewFallback(
  root: HTMLElement,
  artifact: KpConceptRoomArtifactLike,
  issue?: RoomDiagnostic
): void {
  const review = document.createElement("article");
  review.dataset["kpConceptReviewFallback"] = "true";
  if (issue === undefined) review.dataset["kpConceptReviewMode"] = "true";
  if (issue !== undefined) review.dataset["kpDiagnosticCode"] = issue.code;
  const heading = document.createElement("h2");
  heading.textContent = "Review the steps";
  const summary = document.createElement("p");
  summary.textContent = artifact.manifest.review.summary;
  const list = document.createElement("ol");
  artifact.manifest.checkpoints.forEach((checkpoint) => {
    const item = document.createElement("li");
    const title = document.createElement("h3");
    title.textContent = checkpoint.title;
    const explanation = document.createElement("p");
    explanation.textContent = checkpoint.explanation;
    item.append(title, explanation);
    list.append(item);
  });
  if (issue !== undefined) {
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.textContent = `${issue.message} Review remains available.`;
    review.append(status);
  }
  review.append(heading, summary, list);
  root.replaceChildren(review);
}

function renderCatalogReviewFallback(
  root: HTMLElement,
  entry: KpConceptRoomCatalogEntryLike,
  issue: RoomDiagnostic
): void {
  const main = document.createElement("main");
  main.dataset["kpConceptReviewFallback"] = "true";
  main.dataset["kpDiagnosticCode"] = issue.code;
  const productTag = document.createElement("p");
  productTag.textContent = "See concepts move";
  const title = document.createElement("h1");
  title.textContent = entry.title;
  const summary = document.createElement("p");
  summary.textContent = entry.summary;
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = `${issue.message} Review remains available.`;
  const search = document.createElement("p");
  search.textContent = entry.searchableText;
  main.append(productTag, title, summary, status, search);
  root.replaceChildren(main);
}

function inertHandle(conceptId: string, root: HTMLElement): KpConceptRoomShellHandle {
  let disposed = false;
  return {
    conceptId,
    get disposed() { return disposed; },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.replaceChildren();
    }
  };
}

function requireMatchingArtifact(
  entry: KpConceptRoomCatalogEntryLike,
  artifact: KpConceptRoomArtifactLike
): void {
  if (artifact.manifest.conceptId !== entry.conceptId || artifact.manifest.version !== entry.version) {
    throw new Error("Lazy-loaded concept artifact does not match its catalog metadata.");
  }
}

function browserNavigationHost(): KpConceptRoomNavigationHost {
  return {
    current: () => ({ pathname: window.location.pathname, search: window.location.search }),
    push: (url) => window.history.pushState(null, "", url),
    replace: (url) => window.history.replaceState(null, "", url),
    subscribe(listener) {
      window.addEventListener("popstate", listener);
      return () => window.removeEventListener("popstate", listener);
    }
  };
}

function browserClipboard(): KpConceptRoomClipboard {
  return {
    async writeText(text) {
      if (navigator.clipboard === undefined) throw new Error("Clipboard is unavailable.");
      await navigator.clipboard.writeText(text);
    }
  };
}
