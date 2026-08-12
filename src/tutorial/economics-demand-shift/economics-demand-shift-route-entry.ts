import {
  readKpEconomicsDemandShiftEnhancementMode
} from "./economics-demand-shift-enhancement-mode.ts";
import {
  normalizeKpEconomicsDemandShiftViewSearch,
  readKpEconomicsDemandShiftView,
  writeKpEconomicsDemandShiftView,
  type KpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";
import {
  captureKpEconomicsDemandShiftRouteHandoff,
  projectKpEconomicsDemandShiftHandoffSearch,
  restoreKpEconomicsDemandShiftRouteScroll,
  type KpEconomicsDemandShiftRouteHandoff
} from "./economics-demand-shift-route-handoff.ts";
import {
  resolveKpEconomicsDemandShiftArticleRevealText
} from "./economics-demand-shift-article-authoring-descriptor.ts";
import type {
  KpEconomicsDemandShiftPublication
} from "./economics-demand-shift-publication.ts";

type KpEconomicsDevToolbarClient = typeof import("./economics-demand-shift-dev-toolbar.ts");
type KpEconomicsArticleAuthoringClient = typeof import(
  "./economics-demand-shift-article-authoring.ts"
);
type KpEconomicsStaticPublicationClient = typeof import(
  "./economics-demand-shift-static-publication.ts"
);
type KpEconomicsArticleEditorSession = ReturnType<
  KpEconomicsArticleAuthoringClient["mountKpEconomicsDemandShiftArticleEditor"]
>;

// This module-scope branch lets Vite erase the complete toolbar and review
// capture graph from production rather than mounting dormant development UI.
const loadKpEconomicsDevToolbar: (() => Promise<KpEconomicsDevToolbarClient>) | undefined =
  import.meta.env.DEV ? () => import("./economics-demand-shift-dev-toolbar.ts") : undefined;
const loadKpEconomicsArticleAuthoring: (() => Promise<KpEconomicsArticleAuthoringClient>) | undefined =
  import.meta.env.DEV
    ? () => import("./economics-demand-shift-article-authoring.ts")
    : undefined;
const loadKpEconomicsStaticPublication: (() => Promise<KpEconomicsStaticPublicationClient>) | undefined =
  import.meta.env.DEV
    ? () => import("./economics-demand-shift-static-publication.ts")
    : undefined;

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
  let publicationSnapshot = [...input.root.childNodes].map((node) =>
    node.cloneNode(true)
  );
  let previewPublication: KpEconomicsDemandShiftPublication | undefined;
  let publicationNeedsReplacement = false;
  let activeDispose: (() => void) | undefined;
  let activeSearch: string | undefined;
  let disposed = false;
  let transition = Promise.resolve();
  let devToolbar: ReturnType<KpEconomicsDevToolbarClient["mountKpEconomicsDemandShiftDevToolbar"]> | undefined;
  let articleEditor: KpEconomicsArticleEditorSession | undefined;

  const editArticle = async (): Promise<void> => {
    if (disposed || articleEditor !== undefined ||
        loadKpEconomicsArticleAuthoring === undefined ||
        loadKpEconomicsStaticPublication === undefined) return;
    const [authoring, staticPublication] = await Promise.all([
      loadKpEconomicsArticleAuthoring(),
      loadKpEconomicsStaticPublication()
    ]);
    if (disposed || articleEditor !== undefined) return;
    const handoff = captureKpEconomicsDemandShiftRouteHandoff({
      root: input.root,
      scrollY: window.scrollY
    });
    articleEditor = authoring.mountKpEconomicsDemandShiftArticleEditor({
      ownerDocument: document,
      preview: (publication) => {
        const previewHandoff = captureKpEconomicsDemandShiftRouteHandoff({
          root: input.root,
          scrollY: window.scrollY
        });
        previewPublication = publication;
        publicationSnapshot = parsePublicationSnapshot({
          ownerDocument: document,
          html: staticPublication.renderKpEconomicsDemandShiftStaticNarrativeStyles() +
            staticPublication.renderKpEconomicsDemandShiftStaticNarrative(
              publication
            )
        });
        publicationNeedsReplacement = true;
        activeSearch = undefined;
        void enqueueMount(
          window.location.search,
          window.location.hash,
          previewHandoff
        );
      },
      revealText: resolveKpEconomicsDemandShiftArticleRevealText(
        handoff?.passageId
      ),
      onClose: () => {
        articleEditor = undefined;
      }
    });
  };

  const ensurePublication = (): void => {
    if (!publicationNeedsReplacement &&
        input.root.querySelector("[data-kp-economics-static-publication]")) {
      return;
    }
    input.root.replaceChildren(
      ...publicationSnapshot.map((node) => node.cloneNode(true))
    );
    publicationNeedsReplacement = false;
  };

  const mount = async (
    search: string,
    hash: string,
    handoff?: KpEconomicsDemandShiftRouteHandoff
  ): Promise<void> => {
    const routeKey = `${search}${hash}`;
    if (disposed || activeSearch === routeKey) return;
    activeDispose?.();
    activeDispose = undefined;
    activeSearch = routeKey;
    const view = readKpEconomicsDemandShiftView(search);
    document.documentElement.dataset["kpEconomicsView"] = view;
    syncViewSelector(input.root, view);
    const mode = readKpEconomicsDemandShiftEnhancementMode(search);
    document.documentElement.dataset["kpEconomicsEnhancement"] = mode;
    if (mode === "published") {
      ensurePublication();
      const tutorial = await import(
        "./economics-demand-shift-progressive-entry.ts"
      );
      if (disposed || activeSearch !== routeKey) return;
      activeDispose = await tutorial.enhanceKpEconomicsDemandShiftPublication({
        root: input.root,
        search,
        hash,
        handoff
      });
      if (handoff !== undefined) restoreKpEconomicsDemandShiftRouteScroll({
        root: input.root,
        ownerWindow: window,
        handoff
      });
      syncViewSelector(input.root, view);
      devToolbar?.update(search);
      return;
    }
    const tutorial = await import(
      "./economics-demand-shift-tutorial-entry.ts"
    );
    if (disposed || activeSearch !== routeKey) return;
    activeDispose = await tutorial.mountKpEconomicsDemandShiftTutorial({
      root: input.root,
      search,
      hash,
      publication: previewPublication,
      handoff
    });
    if (handoff !== undefined) restoreKpEconomicsDemandShiftRouteScroll({
      root: input.root,
      ownerWindow: window,
      handoff
    });
    syncViewSelector(input.root, view);
    devToolbar?.update(search);
  };

  const enqueueMount = (
    search: string,
    hash: string,
    handoff?: KpEconomicsDemandShiftRouteHandoff
  ): Promise<void> => {
    transition = transition.then(() => mount(search, hash, handoff));
    return transition;
  };

  const navigate = async (
    request: KpEconomicsDemandShiftRouteRequest
  ): Promise<void> => {
    const handoff = captureKpEconomicsDemandShiftRouteHandoff({
      root: input.root,
      scrollY: window.scrollY
    });
    const normalizedRequestSearch = normalizeKpEconomicsDemandShiftViewSearch(
      request.search
    );
    const search = projectKpEconomicsDemandShiftHandoffSearch({
      search: normalizedRequestSearch,
      handoff
    });
    const hash = request.hash ?? window.location.hash;
    const url = `${window.location.pathname}${search}${hash}`;
    if (request.history === "replace" ||
        normalizedRequestSearch !== request.search) {
      window.history.replaceState(window.history.state, "", url);
    } else {
      window.history.pushState(window.history.state, "", url);
    }
    await enqueueMount(search, hash, handoff);
  };

  const onPopState = (): void => {
    void enqueueMount(window.location.search, window.location.hash);
  };
  const onViewClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element) || event.defaultPrevented ||
        event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
    const link = event.target.closest<HTMLAnchorElement>(
      "a[data-kp-economics-view-link]"
    );
    if (link === null) return;
    const view = link.dataset["kpEconomicsViewLink"];
    if (!isView(view)) return;
    event.preventDefault();
    void navigate({
      search: writeKpEconomicsDemandShiftView({
        search: window.location.search,
        view
      }),
      hash: window.location.hash,
      history: "push"
    });
  };
  const onRouteRequest = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const request = (event as CustomEvent<KpEconomicsDemandShiftRouteRequest>)
      .detail;
    if (request === undefined || !request.search.startsWith("?")) return;
    void navigate(request);
  };

  window.addEventListener("popstate", onPopState);
  input.root.addEventListener("click", onViewClick);
  window.addEventListener(
    KP_ECONOMICS_DEMAND_SHIFT_ROUTE_REQUEST_EVENT,
    onRouteRequest
  );
  const initialSearch = normalizeKpEconomicsDemandShiftViewSearch(input.search);
  if (initialSearch !== input.search) {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${initialSearch}${input.hash}`
    );
  }
  await enqueueMount(initialSearch, input.hash);
  if (loadKpEconomicsDevToolbar !== undefined) {
    const client = await loadKpEconomicsDevToolbar();
    if (!disposed) {
      devToolbar = client.mountKpEconomicsDemandShiftDevToolbar({
        search: initialSearch,
        editArticle: () => {
          void editArticle();
        },
        navigate: (search) => {
          void navigate({ search, hash: window.location.hash, history: "push" });
        }
      });
    }
  }

  return {
    navigate,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      activeDispose?.();
      activeDispose = undefined;
      devToolbar?.dispose();
      devToolbar = undefined;
      void articleEditor?.close(true);
      articleEditor = undefined;
      window.removeEventListener("popstate", onPopState);
      input.root.removeEventListener("click", onViewClick);
      window.removeEventListener(
        KP_ECONOMICS_DEMAND_SHIFT_ROUTE_REQUEST_EVENT,
        onRouteRequest
      );
    }
  };
}

function parsePublicationSnapshot(input: {
  readonly ownerDocument: Document;
  readonly html: string;
}): Node[] {
  const template = input.ownerDocument.createElement("template");
  template.innerHTML = input.html;
  return [...template.content.childNodes].map((node) => node.cloneNode(true));
}

function syncViewSelector(
  root: ParentNode,
  view: KpEconomicsDemandShiftView
): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>(
    "a[data-kp-economics-view-link]"
  )) {
    if (link.dataset["kpEconomicsViewLink"] === view) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function isView(value: string | undefined): value is KpEconomicsDemandShiftView {
  return value === "reader" || value === "deck" ||
    value === "attention-stage" || value === "split" ||
    value === "inline-sticky" || value === "two-column-scroll";
}
