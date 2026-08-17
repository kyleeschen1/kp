export const kpApplicationEntryOwnerIds = [
  "entry-owner.kernel",
  "entry-owner.internal-studio",
  "entry-owner.public-web",
  "entry-owner.development-tooling",
  "entry-owner.compatibility"
] as const;

export type KpApplicationEntryOwnerId =
  (typeof kpApplicationEntryOwnerIds)[number];

export type KpApplicationDelivery =
  | "shared-library"
  | "internal-product"
  | "public-product"
  | "development-only"
  | "compatibility";

export type KpApplicationEntryBoundary =
  | "framework-neutral-library"
  | "shared-main-graph"
  | "dedicated-production-graph"
  | "development-erased"
  | "routing-only-compatibility";

export interface KpApplicationEntryOwner {
  readonly id: KpApplicationEntryOwnerId;
  readonly delivery: KpApplicationDelivery;
  readonly frameworkBoundary:
    | "framework-neutral"
    | "host-neutral"
    | "host-owned";
  readonly currentBoundary: KpApplicationEntryBoundary;
  readonly requiredBoundary: KpApplicationEntryBoundary;
  readonly entryModules: readonly string[];
  readonly hostDocuments: readonly string[];
  readonly currentBuildConfigs: readonly string[];
  readonly requiredBuildConfigs: readonly string[];
  readonly rationale: string;
}

/**
 * This is the ownership target for application roots, not a second module-zone
 * taxonomy. Keeping current and required boundaries together lets bundle work
 * prove each migration before changing the declaration of present reality.
 */
export const kpApplicationEntryOwners = defineKpApplicationEntryOwners([
  {
    id: "entry-owner.kernel",
    delivery: "shared-library",
    frameworkBoundary: "framework-neutral",
    currentBoundary: "framework-neutral-library",
    requiredBoundary: "framework-neutral-library",
    entryModules: ["src/kernel/public-api.ts"],
    hostDocuments: [],
    currentBuildConfigs: [],
    requiredBuildConfigs: [],
    rationale:
      "The kernel exposes portable state and routing contracts and owns no page lifecycle."
  },
  {
    id: "entry-owner.internal-studio",
    delivery: "internal-product",
    frameworkBoundary: "host-owned",
    currentBoundary: "dedicated-production-graph",
    requiredBoundary: "dedicated-production-graph",
    entryModules: ["src/internal-studio/internal-studio-entry.ts"],
    hostDocuments: ["studio/index.html"],
    currentBuildConfigs: ["vite.internal-studio.config.ts"],
    requiredBuildConfigs: ["vite.internal-studio.config.ts"],
    rationale:
      "Internal Studio owns editor, catalogue, dashboard, and workbench composition."
  },
  {
    id: "entry-owner.public-web",
    delivery: "public-product",
    frameworkBoundary: "host-owned",
    currentBoundary: "dedicated-production-graph",
    requiredBoundary: "dedicated-production-graph",
    entryModules: [
      "src/public-web/typescript-free-shipping-entry.ts",
      "src/public-web/fraction-composition-public-entry.ts",
      "src/public-web/normal-matrix-proof-public-entry.ts",
      "src/public-web/eigenvector-attentional-surface-public-entry.ts"
    ],
    hostDocuments: [
      "learn/code/free-shipping/index.html",
      "learn/math/fraction-composition/index.html",
      "learn/math/normal-matrices/index.html",
      "learn/math/eigenvectors/index.html"
    ],
    currentBuildConfigs: [
      "vite.public-typescript.config.ts",
      "vite.public-fraction-composition.config.ts",
      "vite.public-normal-matrices.config.ts",
      "vite.public-eigenvectors.config.ts"
    ],
    requiredBuildConfigs: [
      "vite.public-typescript.config.ts",
      "vite.public-fraction-composition.config.ts",
      "vite.public-normal-matrices.config.ts",
      "vite.public-eigenvectors.config.ts"
    ],
    rationale:
      "Public lessons share neutral KP contracts but must not inherit Studio or development roots."
  },
  {
    id: "entry-owner.development-tooling",
    delivery: "development-only",
    frameworkBoundary: "host-owned",
    currentBoundary: "shared-main-graph",
    requiredBoundary: "development-erased",
    entryModules: [
      "src/dev-toolbar/development-toolbar-bootstrap.ts",
      "src/dev-review/editor-animation-library-review-bootstrap.ts",
      "src/dev-review/reader-review-bootstrap.ts",
      "src/dev-review/tutorial-review-bootstrap.ts",
      "src/dev-review/workbench-review-bootstrap.ts",
      "src/experiments/canonical-animation-review.ts",
      "src/experiments/glyph-reconciliation-review.ts"
    ],
    hostDocuments: [
      "canonical-animation-review.html",
      "glyph-reconciliation-experiment.html"
    ],
    currentBuildConfigs: ["vite.config.ts"],
    requiredBuildConfigs: [],
    rationale:
      "Review, capture, navigation, and diagnostic chrome observe products only in development."
  },
  {
    id: "entry-owner.compatibility",
    delivery: "compatibility",
    frameworkBoundary: "host-owned",
    currentBoundary: "routing-only-compatibility",
    requiredBoundary: "routing-only-compatibility",
    entryModules: ["src/bootstrap.ts"],
    hostDocuments: [
      "tutorials/economics/demand-shift/index.html",
      "tutorials/algebra/fraction-composition/index.html",
      "tutorials/programming/lisp-function-application/index.html",
      "tutorials/programming/scheme-factorial/index.html"
    ],
    currentBuildConfigs: ["vite.config.ts"],
    requiredBuildConfigs: ["vite.config.ts"],
    rationale:
      "The legacy root may choose a route, but it must stop owning product implementations."
  }
]);

export function findKpApplicationEntryOwner(
  id: KpApplicationEntryOwnerId
): KpApplicationEntryOwner {
  const owner = kpApplicationEntryOwners.find((candidate) =>
    candidate.id === id
  );
  if (owner === undefined) throw new Error(`Unknown application owner ${id}.`);
  return owner;
}

export function defineKpApplicationEntryOwners<
  const TOwners extends readonly KpApplicationEntryOwner[]
>(owners: TOwners): TOwners {
  const ids = new Set<string>();
  const modules = new Set<string>();
  for (const owner of owners) {
    if (ids.has(owner.id)) {
      throw new Error(`Application entry owner ${owner.id} is duplicated.`);
    }
    ids.add(owner.id);
    for (const modulePath of owner.entryModules) {
      assertRepositoryPath(modulePath, `${owner.id} entry module`);
      if (modules.has(modulePath)) {
        throw new Error(`Application entry module ${modulePath} has two owners.`);
      }
      modules.add(modulePath);
    }
    for (const path of [
      ...owner.hostDocuments,
      ...owner.currentBuildConfigs,
      ...owner.requiredBuildConfigs
    ]) assertRepositoryPath(path, `${owner.id} owned path`);
    if (
      owner.delivery === "shared-library" &&
      (owner.hostDocuments.length > 0 || owner.currentBuildConfigs.length > 0)
    ) {
      throw new Error("A shared library cannot own a host document or build.");
    }
    if (
      owner.delivery === "development-only" &&
      owner.requiredBoundary !== "development-erased"
    ) {
      throw new Error("Development tooling must be erased from production.");
    }
  }
  if (ids.size !== kpApplicationEntryOwnerIds.length ||
      kpApplicationEntryOwnerIds.some((id) => !ids.has(id))) {
    throw new Error("Application entry ownership must declare every owner once.");
  }
  return Object.freeze(owners.map((owner) => Object.freeze({
    ...owner,
    entryModules: Object.freeze([...owner.entryModules]),
    hostDocuments: Object.freeze([...owner.hostDocuments]),
    currentBuildConfigs: Object.freeze([...owner.currentBuildConfigs]),
    requiredBuildConfigs: Object.freeze([...owner.requiredBuildConfigs])
  }))) as unknown as TOwners;
}

function assertRepositoryPath(path: string, label: string): void {
  if (path.trim() === "" || path.startsWith("/") || path.includes("\\")) {
    throw new Error(`${label} must be a normalized repository-relative path.`);
  }
}
