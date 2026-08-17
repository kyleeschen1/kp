import {
  generatedConceptCatalog,
  solveXPlusThreeSymbolicStory
} from "../../content/public-api.ts";
import {
  assertConceptPublicationFit,
  definePublicationEnvironment
} from "../authoring/public-api.ts";

export interface KpLegacyConceptRoomSession {
  readonly dispose: () => void;
}

/**
 * Concept composition remains a compatibility capability until it receives a
 * dedicated product entry. Keeping it lazy prevents the editor fallback from
 * paying for content, publication validation, KaTeX, and room adapters.
 */
export async function tryMountKpLegacyConceptRoom(input: {
  readonly root: HTMLElement;
}): Promise<KpLegacyConceptRoomSession | null> {
  await import("katex/dist/katex.min.css");
  const [shell, runtimeModule, themeModule] = await Promise.all([
    import("../app-adapters/concept-room-shell.ts"),
    import("../app-adapters/linear-equation-concept-runtime.ts"),
    import("../app-adapters/concept-room-theme.ts")
  ]);
  const environment = definePublicationEnvironment({
    capabilities: [{
      id: "kp.equation",
      major: 1,
      implementationVersion: "1.0.0"
    }],
    providers: [{
      id: "linear-problems.exact-rational",
      protocol: "linear-problem.v1",
      versions: ["1.0.0"]
    }],
    styleRoles: themeModule.conceptRoomStyleRoles
  });
  return shell.tryMountConceptRoomRoute({
    root: input.root,
    catalog: generatedConceptCatalog,
    runtime: runtimeModule.createLinearEquationConceptRuntime(),
    symbolicStory: solveXPlusThreeSymbolicStory,
    validateArtifact: (artifact) =>
      assertConceptPublicationFit(artifact, environment)
  });
}
