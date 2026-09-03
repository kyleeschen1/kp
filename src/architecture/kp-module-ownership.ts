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
    ownershipRule("src/app-adapters/", "application"),
    ownershipRule("src/public-web/", "application"),
    ownershipRule("src/project-dashboard/", "application"),
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
