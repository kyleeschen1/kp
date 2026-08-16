import type {
  KpAnimationCatalogPackId
} from "../animation/catalog-loader.ts";
import type {
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";

export type KpCrossDomainSelectedSurfaceCapability =
  | "graph-svg-economics"
  | "programming-trace";

export type KpCrossDomainSharedCapability =
  | "catalogue-asset-loader"
  | "selected-surface-capability-host"
  | "animation-player-shared-clock"
  | "animation-catalogue-review-capture";

export interface KpCrossDomainUpperBoundaryDeclaration {
  readonly animationId: string;
  readonly domain: "graph" | "programming";
  readonly catalogPackId: KpAnimationCatalogPackId;
  readonly slotKind: Extract<
    KpEditorAnimationSurfaceSlotKind,
    "graph" | "programming"
  >;
  readonly selectedCapabilityId: KpCrossDomainSelectedSurfaceCapability;
  readonly rendererAdapterId: string;
  readonly sharedCapabilityIds: readonly KpCrossDomainSharedCapability[];
  readonly clockAuthority: "editor-animation-player-state";
  readonly reviewAuthority: "animation-catalogue-review-host";
  readonly equationRecipeBoundary: {
    readonly status: "not-applicable";
    readonly recipeIds: readonly never[];
  };
}

const sharedCapabilityIds: readonly KpCrossDomainSharedCapability[] =
  Object.freeze([
    "catalogue-asset-loader",
    "selected-surface-capability-host",
    "animation-player-shared-clock",
    "animation-catalogue-review-capture"
  ]);

// This is deliberately a two-caller probe, not a universal domain compiler.
// The shared declaration stops at lifecycle capabilities while each domain
// keeps its own asset pack, renderer adapter, and semantic model.
export const kpCrossDomainUpperBoundaryDeclarations:
readonly KpCrossDomainUpperBoundaryDeclaration[] = Object.freeze([
  declaration({
    animationId: "animation.economics.supply-demand-equilibrium-shift",
    domain: "graph",
    catalogPackId: "economics",
    slotKind: "graph",
    selectedCapabilityId: "graph-svg-economics",
    rendererAdapterId: "editor-animation-surface.graph.svg.economics"
  }),
  declaration({
    animationId: "animation.programming.typescript-free-shipping-refactor",
    domain: "programming",
    catalogPackId: "programming",
    slotKind: "programming",
    selectedCapabilityId: "programming-trace",
    rendererAdapterId: "editor-animation-surface.programming.trace"
  })
]);

const declarationsByAnimationId = Object.freeze(Object.fromEntries(
  kpCrossDomainUpperBoundaryDeclarations.map((entry) => [
    entry.animationId,
    entry
  ])
)) as Readonly<Record<string, KpCrossDomainUpperBoundaryDeclaration>>;

export function findKpCrossDomainUpperBoundaryDeclaration(
  animationId: string
): KpCrossDomainUpperBoundaryDeclaration | undefined {
  return declarationsByAnimationId[animationId];
}

function declaration(input: Omit<
  KpCrossDomainUpperBoundaryDeclaration,
  | "sharedCapabilityIds"
  | "clockAuthority"
  | "reviewAuthority"
  | "equationRecipeBoundary"
>): KpCrossDomainUpperBoundaryDeclaration {
  return Object.freeze({
    ...input,
    sharedCapabilityIds,
    clockAuthority: "editor-animation-player-state" as const,
    reviewAuthority: "animation-catalogue-review-host" as const,
    equationRecipeBoundary: Object.freeze({
      status: "not-applicable" as const,
      recipeIds: Object.freeze([]) as readonly never[]
    })
  });
}
