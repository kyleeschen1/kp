import {
  selectKpLegacyRootRoute
} from "./compatibility/legacy-root-route.ts";
import {
  KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT
} from "./editor/animation-development-view-navigation.ts";

type KpAnimationDevelopmentRootRoute =
  | "animation-catalogue"
  | "animation-coverage";

type KpDevelopmentToolbarClient = typeof import(
  "./dev-toolbar/development-toolbar-bootstrap.ts"
);

// Production compilation erases both the branch and the development graph.
const loadKpDevelopmentToolbar:
  | (() => Promise<KpDevelopmentToolbarClient>)
  | undefined = import.meta.env.DEV
    ? () => import("./dev-toolbar/development-toolbar-bootstrap.ts")
    : undefined;

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Expected #app root element to exist.");

  const route = selectKpLegacyRootRoute({
    pathname: window.location.pathname,
    search: window.location.search
  });
  if (isAnimationDevelopmentRootRoute(route)) {
    await mountDevelopmentToolbar();
    registerPagehide(await mountAnimationDevelopmentRoot({ root, route }));
    return;
  }
  switch (route) {
    case "scheme-factorial": {
      await mountDevelopmentToolbar();
      const tutorial = await import(
        "./tutorial/scheme-factorial/scheme-factorial-tutorial-entry.ts"
      );
      registerPagehide(tutorial.mountKpSchemeFactorialTutorial({ root }));
      return;
    }
    case "lisp-function-application": {
      await mountDevelopmentToolbar();
      const tutorial = await import(
        "./tutorial/lisp-function-application/lisp-function-application-tutorial-entry.ts"
      );
      registerPagehide(await tutorial.mountKpLispFunctionApplicationTutorial({
        root
      }));
      return;
    }
    case "economics-demand-shift": {
      await mountDevelopmentToolbar();
      const routeEntry = await import(
        "./tutorial/economics-demand-shift/economics-demand-shift-route-entry.ts"
      );
      const session = await routeEntry.mountKpEconomicsDemandShiftRoute({
        root,
        search: window.location.search,
        hash: window.location.hash
      });
      registerPagehide(session.dispose);
      return;
    }
    case "concept-room": {
      await mountDevelopmentToolbar();
      const concept = await import(
        "./compatibility/legacy-concept-room-entry.ts"
      );
      const session = await concept.tryMountKpLegacyConceptRoom({ root });
      if (session !== null) {
        root.dataset["kpConceptRoomMounted"] = "true";
        registerPagehide(session.dispose);
        return;
      }
      await import("./main.ts");
      return;
    }
    case "internal-studio-fallback":
      await mountDevelopmentToolbar();
      await import("./main.ts");
  }
}

async function mountAnimationDevelopmentRoot(input: {
  readonly root: HTMLElement;
  readonly route: KpAnimationDevelopmentRootRoute;
}): Promise<() => void> {
  let targetRoute = input.route;
  let activeDispose = await mountAnimationDevelopmentRoute({
    root: input.root,
    route: targetRoute
  });
  let revision = 0;
  let disposed = false;
  const restoreLocation = (): void => {
    void remountForLocation();
  };
  const remountForLocation = async (): Promise<void> => {
    const route = selectKpLegacyRootRoute({
      pathname: window.location.pathname,
      search: window.location.search
    });
    if (route === targetRoute) return;
    if (!isAnimationDevelopmentRootRoute(route)) {
      window.location.assign(window.location.href);
      return;
    }
    targetRoute = route;
    const currentRevision = ++revision;
    activeDispose();
    input.root.replaceChildren();
    const dispose = await mountAnimationDevelopmentRoute({
      root: input.root,
      route
    });
    if (disposed || currentRevision !== revision) {
      dispose();
      return;
    }
    targetRoute = route;
    activeDispose = dispose;
  };
  window.addEventListener("popstate", restoreLocation);
  window.addEventListener(
    KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT,
    restoreLocation
  );
  return () => {
    if (disposed) return;
    disposed = true;
    revision += 1;
    window.removeEventListener("popstate", restoreLocation);
    window.removeEventListener(
      KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT,
      restoreLocation
    );
    activeDispose();
  };
}

async function mountAnimationDevelopmentRoute(input: {
  readonly root: HTMLElement;
  readonly route: KpAnimationDevelopmentRootRoute;
}): Promise<() => void> {
  if (input.route === "animation-catalogue") {
    const catalogue = await import(
      "./editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
    );
    return catalogue.mountKpSvelteCatalogueExemplar({
      root: input.root,
      search: window.location.search
    });
  }
  const coverage = await import(
    "./editor/svelte-catalogue/animation-transformation-coverage-entry.ts"
  );
  return coverage.mountKpAnimationTransformationCoverage({
    root: input.root,
    search: window.location.search
  });
}

function isAnimationDevelopmentRootRoute(
  route: ReturnType<typeof selectKpLegacyRootRoute>
): route is KpAnimationDevelopmentRootRoute {
  return route === "animation-catalogue" || route === "animation-coverage";
}

async function mountDevelopmentToolbar(): Promise<void> {
  if (loadKpDevelopmentToolbar === undefined) return;
  const client = await loadKpDevelopmentToolbar();
  const session = client.mountKpDevelopmentToolbar(window);
  registerPagehide(session.dispose);
}

function registerPagehide(dispose: () => void): void {
  let disposed = false;
  const handlePagehide = (event: PageTransitionEvent): void => {
    // A persisted pagehide freezes this exact DOM for BFCache restoration;
    // unmounting here would return a permanently blank cached document.
    if (event.persisted || disposed) return;
    disposed = true;
    window.removeEventListener("pagehide", handlePagehide);
    dispose();
  };
  window.addEventListener("pagehide", handlePagehide);
}

void bootstrap();
