import {
  readKpEconomicsDemandShiftEnhancementMode
} from "./economics-demand-shift-enhancement-mode.ts";

export const KP_ECONOMICS_DEMAND_SHIFT_ROUTE_REQUEST_EVENT =
  "kp-economics-demand-shift-route-request";

export interface KpEconomicsDemandShiftRouteRequest {
  readonly search: string;
  readonly hash?: string | undefined;
  readonly history?: "push" | "replace" | undefined;
}

export interface KpEconomicsDemandShiftRouteSession {
  readonly navigate: (
    request: KpEconomicsDemandShiftRouteRequest
  ) => Promise<void>;
  readonly dispose: () => void;
}

/**
 * Owns one economics route capability at a time. The publication snapshot is
 * compiler output, so returning from an experimental presenter never requires
 * a document reload or a second semantic source.
 */
export async function mountKpEconomicsDemandShiftRoute(input: {
  readonly root: HTMLElement;
  readonly search: string;
  readonly hash: string;
}): Promise<KpEconomicsDemandShiftRouteSession> {
  const publicationSnapshot = [...input.root.childNodes].map((node) =>
    node.cloneNode(true)
  );
  let activeDispose: (() => void) | undefined;
  let activeSearch: string | undefined;
  let disposed = false;
  let transition = Promise.resolve();

  const ensurePublication = (): void => {
    if (input.root.querySelector("[data-kp-economics-static-publication]")) {
      return;
    }
    input.root.replaceChildren(
      ...publicationSnapshot.map((node) => node.cloneNode(true))
    );
  };

  const mount = async (search: string, hash: string): Promise<void> => {
    if (disposed || activeSearch === search) return;
    activeDispose?.();
    activeDispose = undefined;
    activeSearch = search;
    const mode = readKpEconomicsDemandShiftEnhancementMode(search);
    document.documentElement.dataset["kpEconomicsEnhancement"] = mode;
    if (mode === "published") {
      ensurePublication();
      const tutorial = await import(
        "./economics-demand-shift-progressive-entry.ts"
      );
      if (disposed || activeSearch !== search) return;
      activeDispose = await tutorial.enhanceKpEconomicsDemandShiftPublication({
        root: input.root,
        search,
        hash
      });
      return;
    }
    const tutorial = await import(
      "./economics-demand-shift-tutorial-entry.ts"
    );
    if (disposed || activeSearch !== search) return;
    activeDispose = await tutorial.mountKpEconomicsDemandShiftTutorial({
      root: input.root,
      search,
      hash
    });
  };

  const enqueueMount = (search: string, hash: string): Promise<void> => {
    transition = transition.then(() => mount(search, hash));
    return transition;
  };

  const navigate = async (
    request: KpEconomicsDemandShiftRouteRequest
  ): Promise<void> => {
    const hash = request.hash ?? window.location.hash;
    const url = `${window.location.pathname}${request.search}${hash}`;
    if (request.history === "replace") {
      window.history.replaceState(window.history.state, "", url);
    } else {
      window.history.pushState(window.history.state, "", url);
    }
    await enqueueMount(request.search, hash);
  };

  const onPopState = (): void => {
    void enqueueMount(window.location.search, window.location.hash);
  };
  const onRouteRequest = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const request = (event as CustomEvent<KpEconomicsDemandShiftRouteRequest>)
      .detail;
    if (request === undefined || !request.search.startsWith("?")) return;
    void navigate(request);
  };

  window.addEventListener("popstate", onPopState);
  window.addEventListener(
    KP_ECONOMICS_DEMAND_SHIFT_ROUTE_REQUEST_EVENT,
    onRouteRequest
  );
  await enqueueMount(input.search, input.hash);

  return {
    navigate,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      activeDispose?.();
      activeDispose = undefined;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(
        KP_ECONOMICS_DEMAND_SHIFT_ROUTE_REQUEST_EVENT,
        onRouteRequest
      );
    }
  };
}
