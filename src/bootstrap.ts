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

const conceptCatalog: readonly GeneratedConceptCatalogEntry[] = generatedConceptCatalog;

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) throw new Error("Expected #app root element to exist.");
  const entry = conceptCatalog.find((candidate) =>
    candidate.canonicalPath === window.location.pathname ||
    candidate.legacyAliases.includes(window.location.pathname)
  );
  if (entry === undefined) {
    if (readKpAnimationCatalogueRoute(window.location.search).active) {
      const catalogue = await import(
        "./editor/animation-catalogue-application.ts"
      );
      catalogue.mountKpAnimationCatalogueApplication(root);
      return;
    }
    await import("./main.ts");
    return;
  }

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

void bootstrap();
