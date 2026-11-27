export const kpModuleOwnershipZoneIds = [
  "neutral-core",
  "presentation",
  "renderer",
  "experience",
  "integration",
  "public-api",
  "application",
  "governance",
  "experiment"
] as const;

export type KpModuleOwnershipZoneId =
  (typeof kpModuleOwnershipZoneIds)[number];

export type KpFrameworkBoundary =
  | "framework-neutral"
  | "host-neutral"
  | "host-owned";

export type KpOwnershipEnforcement =
  | "production"
  | "audit-only"
  | "excluded";

export interface KpModuleOwnershipZone {
  readonly id: KpModuleOwnershipZoneId;
  readonly purpose: string;
  readonly frameworkBoundary: KpFrameworkBoundary;
  readonly enforcement: KpOwnershipEnforcement;
}

export const kpModuleOwnershipZones = Object.freeze({
  "neutral-core": zone({
    id: "neutral-core",
    purpose: "Semantic truth, domain IR, animation state, and pure utilities.",
    frameworkBoundary: "framework-neutral",
    enforcement: "production"
  }),
  presentation: zone({
    id: "presentation",
    purpose: "Renderer-neutral presentation and layout projections.",
    frameworkBoundary: "framework-neutral",
    enforcement: "production"
  }),
  renderer: zone({
    id: "renderer",
    purpose: "DOM, SVG, Canvas, WebGL, and output-format realization.",
    frameworkBoundary: "host-neutral",
    enforcement: "production"
  }),
  experience: zone({
    id: "experience",
    purpose: "Reader, tutorial, article, and authoring composition.",
    frameworkBoundary: "host-neutral",
    enforcement: "production"
  }),
  integration: zone({
    id: "integration",
    purpose: "External transports and bridges over neutral KP contracts.",
    frameworkBoundary: "host-neutral",
    enforcement: "production"
  }),
  "public-api": zone({
    id: "public-api",
    purpose: "Compatibility and supported external entrypoints.",
    frameworkBoundary: "host-neutral",
    enforcement: "production"
  }),
  application: zone({
    id: "application",
    purpose: "Product hosts, editors, dashboards, and development UI.",
    frameworkBoundary: "host-owned",
    enforcement: "production"
  }),
  governance: zone({
    id: "governance",
    purpose: "Architecture evidence, inventories, ratchets, and policy data.",
    frameworkBoundary: "framework-neutral",
    enforcement: "audit-only"
  }),
  experiment: zone({
    id: "experiment",
    purpose: "Reversible investigations that cannot become production authority.",
    frameworkBoundary: "host-owned",
    enforcement: "excluded"
  })
} satisfies Readonly<Record<KpModuleOwnershipZoneId, KpModuleOwnershipZone>>);

export interface KpModuleOwnershipRule {
  readonly pathPrefix: string;
  readonly zone: KpModuleOwnershipZoneId;
  readonly rationale?: string;
}

/**
 * Longest-prefix ownership is intentional: mixed historical directories can
 * expose a narrow neutral seam without granting that status to their host code.
 */
export const kpModuleOwnershipRules: readonly KpModuleOwnershipRule[] =
  Object.freeze([
    ownershipRule(
      "src/reader/compiler/verified-generated-linear-solve-lesson.ts",
      "experience",
      "This module assembles a product lesson from an already verified session."
    ),
    ownershipRule(
      "src/reader/compiler/public-api.ts",
      "experience",
      "The aggregate compiler facade exports complete product lessons."
    ),
    ownershipRule(
      "src/reader/compiler/reader-route-manifest.ts",
      "experience",
      "The route manifest aggregates product-level reader lesson entries."
    ),
    ownershipRule(
      "src/projections/quadratic-equation-graph-sync.ts",
      "application",
      "This projection synchronizes the concrete quadratic reader surface."
    ),
    ownershipRule(
      "src/reader/compiler/",
      "neutral-core",
      "Reader compilation owns portable semantic artifacts, not product layout."
    ),
    ownershipRule("src/reader/renderers/", "renderer"),
    ownershipRule(
      "src/reader/preparation/",
      "neutral-core",
      "Dependency-free first-paint functions are compiled into the document and reused by hydration; they import no application or renderer."
    ),
    ownershipRule(
      "src/reader/document/",
      "neutral-core",
      "Document contracts are portable semantic data shared by compilers and hosts."
    ),
    ownershipRule("src/reader/runtime/", "experience"),
    ownershipRule("src/reader/app/", "application"),
    ownershipRule("src/architecture/", "governance"),
    ownershipRule("src/domain-ir/", "neutral-core"),
    ownershipRule(
      "src/semantic-state/",
      "neutral-core",
      "Persistent semantic identity and snapshot truth is framework-neutral."
    ),
    ownershipRule("src/semantic/", "neutral-core"),
    ownershipRule("src/animation/", "neutral-core"),
    ownershipRule("src/kernel/", "neutral-core"),
    ownershipRule("src/math/", "neutral-core"),
    ownershipRule("src/search/", "neutral-core"),
    ownershipRule("src/generated/", "neutral-core"),
    ownershipRule("src/projections/", "presentation"),
    ownershipRule("src/layout/", "presentation"),
    ownershipRule("src/rendering/", "renderer"),
    ownershipRule("src/tutorial/", "experience"),
    ownershipRule("src/article/", "experience"),
    ownershipRule("src/authoring/", "experience"),
    ownershipRule("src/integrations/", "integration"),
    ownershipRule("src/public/", "public-api"),
    ownershipRule("src/editor/", "application"),
    ownershipRule("src/editor-chat/", "application", "Chat composes browser editing and session services; it is not a headless library."),
    ownershipRule("src/editor-commands/", "renderer", "Shared commands include DOM button binding but do not own product hosts."),
    ownershipRule("src/editor-rows/", "renderer", "Portable resource rows, matching and browser rendering stay outside product applications."),
    ownershipRule("src/interaction/", "renderer", "Independent browser picker over the existing row and command owners."),
    ownershipRule("src/math-discovery/", "renderer", "Metadata rows capture existing host commands without importing mathematical evaluators or product hosts."),
    ownershipRule("src/math-resources/", "neutral-core", "Validated persistent resources and derivations have no host or renderer ownership."),
    ownershipRule("src/composition-explanation/draft.ts", "neutral-core", "Bounded integer matrix-entry admission."),
    ownershipRule("src/composition-explanation/resource.ts", "neutral-core", "Persistent matrix pairs and independent-copy identities."),
    ownershipRule("src/composition-explanation/model.ts", "experience", "Ordered matrix preparation over the existing semantic evaluator."),
    ownershipRule("src/composition-explanation/", "renderer", "Accepted Graph2D and KaTeX composition player shared by reference and notebook."),
    ownershipRule("src/projection-explanation/draft.ts", "neutral-core", "Bounded integer coordinate admission without a renderer or evaluator."),
    ownershipRule("src/projection-explanation/resource.ts", "neutral-core", "Persistent vector pairs and independent-copy identities; no host or playback ownership."),
    ownershipRule("src/projection-explanation/model.ts", "experience", "Editable vector-pair preparation and accepted cues over the existing semantic compiler."),
    ownershipRule("src/projection-explanation/", "renderer", "Accepted projection notation, graph and clock mount shared by reference and notebook; hosts retain persistence and routing."),
    ownershipRule("src/animation-player/", "renderer", "Reusable retained rendering and lifecycle adapters consume existing semantic and clock owners."),
    // The notebook reuses this inspected mount closure, not the experiment's
    // page/author/route hosts. Exact paths retain that distinction until a
    // separately approved physical extraction; no directory-wide promotion.
    ownershipRule("src/experiments/matrix-column-combinations/embed.ts", "renderer", "Bounded connected-host column player with no page ownership."),
    ownershipRule("src/experiments/matrix-column-combinations/column-geometry.ts", "experience", "Pure source-linked column projection shared by notebook and reference."),
    ownershipRule("src/experiments/matrix-column-combinations/column-graph.ts", "renderer", "Graph2D paint adapter for the shared column projection."),
    ownershipRule("src/experiments/matrix-column-combinations/linked-embed.ts", "renderer", "Combined symbolic and graph mount using the existing column clock."),
    ownershipRule("src/experiments/matrix-column-combinations/linked-embed.css", "renderer", "Host-sized linked column layout and theme roles."),
    ownershipRule("src/experiments/matrix-column-combinations/embed.css", "renderer", "Scoped notebook theme adaptation for the column mount."),
    ownershipRule("src/experiments/matrix-column-combinations/style.css", "renderer", "Existing column stage geometry shared by its hosts."),
    ownershipRule("src/experiments/matrix-player.css", "renderer", "Shared embedded-player controls, with no document layout ownership."),
    ownershipRule("src/experiments/matrix-theme.css", "renderer", "Scoped matrix-player theme; does not retheme the host document."),
    ownershipRule("src/experiments/matrix-column-combinations/model.ts", "experience", "Column interpretation and editorial cues over existing typed mathematics."),
    ownershipRule("src/experiments/matrix-column-combinations/player.ts", "renderer", "Disposable column controls, measurement and existing clock; no page routing."),
    ownershipRule("src/experiments/matrix-column-combinations/presentation.ts", "renderer", "Native column realization shared by the original host and notebook."),
    ownershipRule("src/experiments/matrix-column-combinations/continuity.ts", "renderer", "Existing local native-paint projection; classification does not certify a new motif."),
    ownershipRule("src/experiments/matrix-column-combinations/view.ts", "renderer", "Pure HTML projection; hosts own mounting and navigation."),
    ownershipRule("src/experiments/matrix-column-combinations/fonts.ts", "renderer", "Requests the existing math faces before native endpoint measurement."),
    ownershipRule("src/experiments/matrix-column-product/environment.ts", "neutral-core", "Typed numeric source/selector projection with no DOM or route state."),
    ownershipRule("src/experiments/matrix-examples/config.ts", "renderer", "Document-scoped presentation preferences and disposable subscription."),
    ownershipRule("src/experiments/dot-product-passage/fusion.ts", "renderer", "DOM adapter over the canonical optical sampler; no lesson host ownership."),
    ownershipRule("src/notebook/model.ts", "neutral-core", "Persistent notebook identity and JSON data have no host dependencies."),
    ownershipRule("src/notebook/math-model.ts", "neutral-core", "Validated quadratic resources are portable data, independent of the original matrix experiment."),
    ownershipRule("src/notebook/math-runtime.ts", "neutral-core", "Quadratic resource evaluation composes existing math and semantic-state kernels without a host."),
    ownershipRule("src/notebook/atomic-record.ts", "application", "Shared browser-local atomic storage for notebooks and reference snapshots."),
    ownershipRule("src/notebook/download.ts", "application", "Shared browser export and object-URL cleanup; no animation clock."),
    ownershipRule("src/matrix-reference/", "application", "Standalone source snapshot, persistence and player host; no editor ownership."),
    ownershipRule("src/notebook/", "experiment", "The matrix composition proof reuses experimental matrix players and is not promoted reader authority."),
    ownershipRule("src/fraction-notebook/", "application", "The bounded development editor and its validated preview bridge compose existing reader authority."),
    ownershipRule("src/app-adapters/", "application"),
    ownershipRule("src/public-web/", "application"),
    ownershipRule("src/project-dashboard/", "application"),
    ownershipRule("src/repertoire/", "application"),
    ownershipRule("src/internal-studio/", "application"),
    ownershipRule(
      "src/compatibility/",
      "application",
      "Legacy route selection and fallback composition remain host-owned migration seams."
    ),
    ownershipRule("src/dev-review/", "application"),
    ownershipRule("src/dev-toolbar/", "application"),
    ownershipRule(
      "src/compiler/",
      "application",
      "The legacy HTML compiler delegates to the editor and is not core authority."
    ),
    ownershipRule("src/experiments/", "experiment"),
    ownershipRule("src/bootstrap.ts", "application"),
    ownershipRule("src/main.ts", "application")
  ]);

export function resolveKpModuleOwnershipRule(
  sourcePath: string
): KpModuleOwnershipRule | undefined {
  const normalizedPath = normalizeSourcePath(sourcePath);
  let bestMatch: KpModuleOwnershipRule | undefined;
  for (const rule of kpModuleOwnershipRules) {
    if (!normalizedPath.startsWith(rule.pathPrefix)) continue;
    if (
      bestMatch === undefined ||
      rule.pathPrefix.length > bestMatch.pathPrefix.length
    ) {
      bestMatch = rule;
    }
  }
  return bestMatch;
}

export function resolveKpModuleOwnershipZone(
  sourcePath: string
): KpModuleOwnershipZone | undefined {
  const rule = resolveKpModuleOwnershipRule(sourcePath);
  return rule === undefined ? undefined : kpModuleOwnershipZones[rule.zone];
}

function zone(definition: KpModuleOwnershipZone): KpModuleOwnershipZone {
  return Object.freeze({ ...definition });
}

function ownershipRule(
  pathPrefix: string,
  zoneId: KpModuleOwnershipZoneId,
  rationale?: string
): KpModuleOwnershipRule {
  return Object.freeze({
    pathPrefix,
    zone: zoneId,
    ...(rationale === undefined ? {} : { rationale })
  });
}

function normalizeSourcePath(sourcePath: string): string {
  return sourcePath.replaceAll("\\", "/").replace(/^\.\//, "");
}
