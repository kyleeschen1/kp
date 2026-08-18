import {
  selectKpLegacyRootRoute
} from "./compatibility/legacy-root-route.ts";

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
    case "animation-catalogue": {
      const catalogue = await import(
        "./editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
      );
      // Catalogue CSS owns the application-wide box model. Let it settle
      // before fixed development chrome measures the viewport.
      await mountDevelopmentToolbar();
      registerPagehide(await catalogue.mountKpSvelteCatalogueExemplar({
        root,
        search: window.location.search
      }));
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
