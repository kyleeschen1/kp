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
}): Promise<KpConceptRoomShellHandle | null> {
  const navigation = input.navigation ?? browserNavigationHost();
  const location = navigation.current();
  const entry = resolveConceptRoomCatalogEntry(input.catalog, location.pathname);
  if (entry === undefined) return null;

  input.root.replaceChildren(loadingShell());
  const artifact = await entry.load();
  requireMatchingArtifact(entry, artifact);
  let state = stateForLocation(entry, artifact, location, navigation);
  let isDisposed = false;
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

  const render = () => renderShell(input.root, artifact, state);
  const onClick = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-kp-concept-checkpoint-link]");
    if (link === null || !input.root.contains(link)) return;
    event.preventDefault();
    const nextRoute = parseConceptRoomRoute(link.getAttribute("href") ?? "");
    state = reduceConceptRoomState(state, {
      kind: "seek",
      checkpoint: nextRoute.checkpoint,
      timePermille: nextRoute.timePermille
    });
    render();
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
    render();
  };
  input.root.addEventListener("click", onClick);
  const unsubscribe = navigation.subscribe(onPopState);
  render();

  return {
    conceptId: entry.conceptId,
    get disposed() { return isDisposed; },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
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
): void {
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
  main.append(header, explanation, navigation);
  root.replaceChildren(main);
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
