import {
  generatedConceptCatalog,
  solveXPlusThreeSymbolicStory,
  type GeneratedConceptCatalogEntry
} from "../content/public-api.ts";
import {
  assertConceptPublicationFit,
  definePublicationEnvironment
} from "./authoring/public-api.ts";
import {
  readKpAnimationCatalogueRoute
} from "./editor/animation-catalogue-route.ts";
import {
  isKpEconomicsDemandShiftTutorialRoute
} from "./tutorial/economics-demand-shift/economics-demand-shift-route.ts";
import {
  isKpLispFunctionApplicationTutorialRoute
} from "./tutorial/lisp-function-application/lisp-function-application-route.ts";

type KpDevelopmentToolbarClient = typeof import(
  "./dev-toolbar/development-toolbar-bootstrap.ts"
);

// Vite can erase this branch and its entire tooling graph from production.
const loadKpDevelopmentToolbar:
  | (() => Promise<KpDevelopmentToolbarClient>)
  | undefined = import.meta.env.DEV
    ? () => import("./dev-toolbar/development-toolbar-bootstrap.ts")
    : undefined;

const conceptCatalog: readonly GeneratedConceptCatalogEntry[] = generatedConceptCatalog;

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Expected #app root element to exist.");
  if (isKpLispFunctionApplicationTutorialRoute(window.location.pathname)) {
    await mountDevelopmentToolbar();
    const tutorial = await import(
      "./tutorial/lisp-function-application/lisp-function-application-tutorial-entry.ts"
    );
    const dispose = await tutorial.mountKpLispFunctionApplicationTutorial({ root });
    window.addEventListener("pagehide", dispose, { once: true });
    return;
  }
  if (isKpEconomicsDemandShiftTutorialRoute(window.location.pathname)) {
    await mountDevelopmentToolbar();
    const route = await import(
      "./tutorial/economics-demand-shift/economics-demand-shift-route-entry.ts"
    );
    const session = await route.mountKpEconomicsDemandShiftRoute({
      root,
      search: window.location.search,
      hash: window.location.hash
    });
    window.addEventListener("pagehide", session.dispose, { once: true });
    return;
  }
  const entry = conceptCatalog.find((candidate) =>
    candidate.canonicalPath === window.location.pathname ||
    candidate.legacyAliases.includes(window.location.pathname)
  );
  if (entry === undefined) {
    if (readKpAnimationCatalogueRoute(window.location.search).active) {
      await mountDevelopmentToolbar();
      const catalogue = await import(
        "./editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
      );
      const dispose = await catalogue.mountKpSvelteCatalogueExemplar({
        root,
        search: window.location.search
      });
      window.addEventListener("pagehide", dispose, { once: true });
      return;
    }
    await mountDevelopmentToolbar();
    await import("./main.ts");
    return;
  }

  await mountDevelopmentToolbar();
  await import("katex/dist/katex.min.css");
  const [shell, runtimeModule, themeModule] = await Promise.all([
    import("./app-adapters/concept-room-shell.ts"),
    import("./app-adapters/linear-equation-concept-runtime.ts"),
    import("./app-adapters/concept-room-theme.ts")
  ]);
  const environment = definePublicationEnvironment({
    capabilities: [{ id: "kp.equation", major: 1, implementationVersion: "1.0.0" }],
    providers: [{
      id: "linear-problems.exact-rational",
      protocol: "linear-problem.v1",
      versions: ["1.0.0"]
    }],
    styleRoles: themeModule.conceptRoomStyleRoles
  });
  const handle = await shell.tryMountConceptRoomRoute({
    root,
    catalog: conceptCatalog,
    runtime: runtimeModule.createLinearEquationConceptRuntime(),
    symbolicStory: solveXPlusThreeSymbolicStory,
    validateArtifact: (artifact) => assertConceptPublicationFit(artifact, environment)
  });
  if (handle === null) {
    await import("./main.ts");
    return;
  }
  window.addEventListener("pagehide", () => handle.dispose(), { once: true });
  root.dataset["kpConceptRoomMounted"] = "true";
}

async function mountDevelopmentToolbar(): Promise<void> {
  if (loadKpDevelopmentToolbar === undefined) return;
  const client = await loadKpDevelopmentToolbar();
  const session = client.mountKpDevelopmentToolbar(window);
  window.addEventListener("pagehide", session.dispose, { once: true });
}

void bootstrap();
