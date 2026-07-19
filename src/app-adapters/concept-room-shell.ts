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
  readonly runtime?: KpConceptRoomRuntime;
  readonly validateArtifact?: KpConceptRoomArtifactValidator;
}): Promise<KpConceptRoomShellHandle | null> {
  const navigation = input.navigation ?? browserNavigationHost();
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
  const coordinator = createRoomEffectCoordinator({
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

  const render = async () => {
    const request = ++renderRequest;
    const viewport = renderShell(input.root, artifact, state);
    if (state.mode === "ask") {
      renderArtifactReviewFallback(
        viewport,
        artifact,
        diagnostic("ask-unavailable", "Ask is not connected in this architecture exemplar.")
      );
      return;
    }
    if (state.mode === "review") {
      renderArtifactReviewFallback(viewport, artifact);
      return;
    }
    if (startupDiagnostic !== undefined || runtimeSession === undefined) {
      renderArtifactReviewFallback(
        viewport,
        artifact,
        startupDiagnostic ?? diagnostic("renderer-unavailable", "The interactive renderer is unavailable.")
      );
      return;
    }
    const detached = document.createElement("div");
    try {
      await runtimeSession.render(detached, state);
      if (isDisposed || request !== renderRequest) return;
      viewport.replaceChildren(...detached.childNodes);
    } catch (error) {
      if (isDisposed || request !== renderRequest) return;
      renderArtifactReviewFallback(viewport, artifact, diagnosticFrom(error, "renderer-unavailable"));
    }
  };
  const onClick = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-kp-concept-room-link]");
    if (link === null || !input.root.contains(link)) return;
    event.preventDefault();
    const nextRoute = parseConceptRoomRoute(link.getAttribute("href") ?? "");
    if (link.dataset["kpConceptCheckpointLink"] !== undefined) {
      state = reduceConceptRoomState(state, {
        kind: "seek",
        checkpoint: nextRoute.checkpoint,
        timePermille: nextRoute.timePermille
      });
      state = reduceConceptRoomState(state, { kind: "set-focus", focus: nextRoute.focus });
    } else if (link.dataset["kpConceptProjectionLink"] !== undefined) {
      state = reduceConceptRoomState(state, { kind: "set-projection", projection: nextRoute.projection });
    } else if (link.dataset["kpConceptModeLink"] !== undefined) {
      state = reduceConceptRoomState(state, { kind: "set-mode", mode: nextRoute.mode });
    }
    void render();
    coordinator.start({
      kind: "url",
      route: formatConceptRoomRoute(conceptRoomStateRoute(state)),
      strategy: "push"
    });
  };
  const onPopState = () => {
    if (isDisposed) return;
    const current = navigation.current();
    const currentEntry = resolveConceptRoomCatalogEntry(input.catalog, current.pathname);
    if (currentEntry?.conceptId !== entry.conceptId) return;
    state = stateForLocation(entry, artifact, current, navigation);
    void render();
  };
  input.root.addEventListener("click", onClick);
  const unsubscribe = navigation.subscribe(onPopState);
  renderShell(input.root, artifact, state);
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

  return {
    conceptId: entry.conceptId,
    get disposed() { return isDisposed; },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      renderRequest += 1;
      abortController.abort();
      runtimeSession?.dispose();
      coordinator.dispose();
      unsubscribe();
      input.root.removeEventListener("click", onClick);
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
  state: KpConceptRoomState
): HTMLElement {
  const checkpoint = artifact.manifest.checkpoints.find((item) => item.id === state.checkpoint);
  if (checkpoint === undefined) throw new Error(`Unknown concept checkpoint ${state.checkpoint}.`);
  const main = document.createElement("main");
  main.dataset["kpConceptRoomShell"] = "true";
  main.dataset["kpConceptId"] = artifact.manifest.conceptId;
  main.dataset["kpConceptVersion"] = artifact.manifest.version;
  main.dataset["kpConceptCheckpoint"] = checkpoint.id;
  main.dataset["kpConceptProjection"] = state.projection;

  const header = document.createElement("header");
  const productTag = document.createElement("p");
  productTag.textContent = "See concepts move";
  const title = document.createElement("h1");
  title.textContent = artifact.manifest.title;
  header.append(productTag, title);

  const explanation = document.createElement("section");
  explanation.setAttribute("aria-labelledby", "kp-concept-checkpoint-title");
  const checkpointTitle = document.createElement("h2");
  checkpointTitle.id = "kp-concept-checkpoint-title";
  checkpointTitle.textContent = checkpoint.title;
  const copy = document.createElement("p");
  copy.textContent = checkpoint.explanation;
  explanation.append(checkpointTitle, copy);

  const navigation = document.createElement("nav");
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

  const viewControls = document.createElement("nav");
  viewControls.setAttribute("aria-label", "Concept views");
  artifact.manifest.projections.forEach((projection) => {
    const link = document.createElement("a");
    link.dataset["kpConceptRoomLink"] = "projection";
    link.dataset["kpConceptProjectionLink"] = projection;
    link.href = formatConceptRoomRoute({ ...conceptRoomStateRoute(state), projection });
    link.textContent = projection === "symbolic" ? "Equation" : "Balance";
    if (projection === state.projection) link.setAttribute("aria-current", "page");
    viewControls.append(link);
  });
  artifact.manifest.modes.forEach((mode) => {
    const link = document.createElement("a");
    link.dataset["kpConceptRoomLink"] = "mode";
    link.dataset["kpConceptModeLink"] = mode;
    link.href = formatConceptRoomRoute({ ...conceptRoomStateRoute(state), mode });
    link.textContent = mode[0]!.toUpperCase() + mode.slice(1);
    if (mode === state.mode) link.setAttribute("aria-current", "page");
    viewControls.append(link);
  });
  const viewport = document.createElement("section");
  viewport.dataset["kpConceptViewport"] = "true";
  viewport.setAttribute("aria-label", "Concept view");
  main.append(header, explanation, navigation, viewControls, viewport);
  root.replaceChildren(main);
  return viewport;
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
  if (issue !== undefined) review.dataset["kpDiagnosticCode"] = issue.code;
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
  review.append(summary, list);
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
