import type { KpAnimationAsset } from "./asset.ts";
import {
  registerKpAnimationPackConformance,
  type KpAnimationConformanceRegistrationDeclaration
} from "./animation-conformance-registration.ts";
import {
  kpNoAnimationRuntimeCapabilities,
  type KpAnimationRuntimeCapabilities
} from "./runtime-capabilities.ts";

export type KpAnimationCatalogPackId =
  | "exact-quantity"
  | "place-value"
  | "operation-evaluation"
  | "algebra"
  | "log-product"
  | "exponential-homomorphism"
  | "generated-drafts"
  | "generated-problems"
  | "graph"
  | "economics"
  | "physics"
  | "programming"
  | "comparison"
  | "complex-katex";

export type KpAnimationCatalogPackSourcePath =
  | "src/animation/catalog-packs/exact-quantity.ts"
  | "src/animation/catalog-packs/place-value.ts"
  | "src/animation/catalog-packs/operation-evaluation.ts"
  | "src/animation/catalog-packs/algebra.ts"
  | "src/animation/catalog-packs/log-product.ts"
  | "src/animation/catalog-packs/exponential-homomorphism.ts"
  | "src/animation/catalog-packs/generated-drafts.ts"
  | "src/animation/catalog-packs/generated.ts"
  | "src/animation/catalog-packs/graph.ts"
  | "src/animation/catalog-packs/economics.ts"
  | "src/animation/catalog-packs/physics.ts"
  | "src/animation/catalog-packs/programming.ts"
  | "src/animation/catalog-packs/comparison.ts"
  | "src/animation/catalog-packs/complex-katex.ts";

export interface KpLoadedAnimationAsset {
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
  readonly packId: KpAnimationCatalogPackId;
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
  readonly conformance: KpAnimationConformanceRegistrationDeclaration;
}

export type KpAnimationCatalogLoadFailureCode =
  | "unowned-animation"
  | "pack-load-failed"
  | "asset-missing-from-pack";

export class KpAnimationCatalogLoadError extends Error {
  override readonly name = "KpAnimationCatalogLoadError";
  readonly code: KpAnimationCatalogLoadFailureCode;
  readonly animationId: string;
  readonly packId?: KpAnimationCatalogPackId | undefined;

  constructor(
    code: KpAnimationCatalogLoadFailureCode,
    message: string,
    animationId: string,
    packId?: KpAnimationCatalogPackId | undefined,
    options: ErrorOptions = {}
  ) {
    super(message, options);
    this.code = code;
    this.animationId = animationId;
    this.packId = packId;
  }
}

const packCache = new Map<string, Promise<KpLoadedAnimationPack>>();

interface KpLoadedAnimationPack {
  readonly catalog: readonly KpAnimationAsset[];
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
  readonly conformanceRegistrations:
    readonly KpAnimationConformanceRegistrationDeclaration[];
}

interface KpUnregisteredAnimationPack {
  readonly catalog: readonly KpAnimationAsset[];
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
}

interface KpAnimationCatalogPackDeclaration {
  readonly id: KpAnimationCatalogPackId;
  readonly sourcePath: KpAnimationCatalogPackSourcePath;
  readonly owns: (animationId: string) => boolean;
  readonly cacheKey: (animationId: string) => string;
  readonly load: (animationId: string) => Promise<KpUnregisteredAnimationPack>;
}

// These declarations are the build-visible lazy boundary. Literal imports
// remain colocated with ownership so generated inventories cannot disagree
// with the chunk that actually loads an asset.
export const kpAnimationCatalogPackDeclarations: readonly KpAnimationCatalogPackDeclaration[] =
  Object.freeze([
    pack("operation-evaluation", "src/animation/catalog-packs/operation-evaluation.ts",
      (id) => id.startsWith("animation.operation-evaluation."),
      async () => dataOnlyPack((await import("./catalog-packs/operation-evaluation.ts")).createKpOperationEvaluationAnimationPack())),
    pack("exact-quantity", "src/animation/catalog-packs/exact-quantity.ts",
      (id) => id === "animation.exact-fraction-quantity.third-plus-sixth",
      async () => dataOnlyPack((await import("./catalog-packs/exact-quantity.ts")).createKpExactQuantityAnimationPack())),
    pack("place-value", "src/animation/catalog-packs/place-value.ts",
      (id) => id === "animation.place-value-addition.278-plus-156",
      async () => dataOnlyPack((await import("./catalog-packs/place-value.ts")).createKpPlaceValueAnimationPack())),
    pack("log-product", "src/animation/catalog-packs/log-product.ts",
      (id) => id.startsWith("animation.algebra.log-product."),
      async () => dataOnlyPack((await import("./catalog-packs/log-product.ts")).createKpLogProductAnimationPack())),
    pack("exponential-homomorphism", "src/animation/catalog-packs/exponential-homomorphism.ts",
      (id) => id.startsWith(
        "animation.algebra.exponential-homomorphism."
      ),
      async () => dataOnlyPack((await import("./catalog-packs/exponential-homomorphism.ts")).createKpExponentialHomomorphismAnimationPack())),
    // The public algebra identity remains stable while solve-x avoids loading
    // unrelated symbolic families; both variants import one shared runtime.
    splitPack("algebra", "src/animation/catalog-packs/algebra.ts",
      (id) => id === "animation.linear-solve.solve-x" ||
        id.startsWith("animation.generated.linear-solve.") ||
        id.startsWith("animation.generated.fraction-") ||
        id.startsWith("animation.generated.exponent.") ||
        id.startsWith("animation.generated.radical.") ||
        id.startsWith("animation.generated.function-wrap.") ||
        id.startsWith("animation.generated.distribution.") ||
        id.startsWith("animation.generated.cancellation.") ||
        id.startsWith("animation.algebra.log-exponent.") ||
        id.startsWith("animation.algebra.log-quotient.") ||
        id.startsWith("animation.algebra.radical.") ||
        id === "animation.equation.finite-sum-expansion.v1" ||
        id === "animation.equation.finite-product-expansion.v1" ||
        id === "animation.equation.logarithm-change-of-base.v1" ||
        id.startsWith("animation.equation.fraction-equivalence.") ||
        id.startsWith("animation.inequality."),
      (id) => id === "animation.linear-solve.solve-x" ||
        id.startsWith("animation.generated.linear-solve.")
        ? "linear-solve"
        : "remaining-algebra",
      async (id) => id === "animation.linear-solve.solve-x" ||
        id.startsWith("animation.generated.linear-solve.")
        ? (await import("./catalog-packs/algebra-linear-solve.ts"))
          .createKpAlgebraLinearSolveAnimationPack()
        : (await import("./catalog-packs/algebra.ts"))
          .createKpAlgebraAnimationPack()),
    pack("generated-drafts", "src/animation/catalog-packs/generated-drafts.ts",
      (id) => id === "animation.generated.pipeline-diagram" ||
        id === "animation.generated.add-zero" ||
        id === "animation.generated.substitute-three" ||
        id === "animation.generated.substitute-three.provisional-incorrect",
      async () => dataOnlyPack((await import("./catalog-packs/generated-drafts.ts")).createKpGeneratedDraftAnimationPack())),
    pack("generated-problems", "src/animation/catalog-packs/generated.ts",
      (id) => id.startsWith("animation.generated.calculus.") ||
        id.startsWith("animation.generated.linear-algebra."),
      async () => dataOnlyPack((await import("./catalog-packs/generated.ts")).createKpGeneratedProblemAnimationPack())),
    pack("graph", "src/animation/catalog-packs/graph.ts",
      (id) => id.startsWith("animation.graph.") ||
        id === "animation.derivative-rules.tangent-graph" ||
        id === "animation.integral-ftc.area-sweep" ||
        id === "animation.dot-projection.basic",
      async () => dataOnlyPack((await import("./catalog-packs/graph.ts")).createKpGraphAnimationPack())),
    pack("economics", "src/animation/catalog-packs/economics.ts",
      (id) => id.startsWith("animation.economics."),
      async () => dataOnlyPack((await import("./catalog-packs/economics.ts")).createKpEconomicsAnimationPack())),
    pack("physics", "src/animation/catalog-packs/physics.ts",
      (id) => id.startsWith("animation.physics."),
      async () => dataOnlyPack((await import("./catalog-packs/physics.ts")).createKpPhysicsAnimationPack())),
    pack("programming", "src/animation/catalog-packs/programming.ts",
      (id) => id.startsWith("animation.programming."),
      async () => dataOnlyPack((await import("./catalog-packs/programming.ts")).createKpProgrammingAnimationPack())),
    pack("comparison", "src/animation/catalog-packs/comparison.ts",
      (id) => id.startsWith("animation.comparison."),
      async () => dataOnlyPack((await import("./catalog-packs/comparison.ts")).createKpComparisonAnimationPack())),
    pack("complex-katex", "src/animation/catalog-packs/complex-katex.ts",
      (id) => id.startsWith("animation.sample."),
      async () => dataOnlyPack((await import("./catalog-packs/complex-katex.ts")).createKpComplexKatexAnimationPack()))
  ]);

export async function loadKpAnimationAsset(
  animationId: string
): Promise<KpLoadedAnimationAsset> {
  const packId = kpAnimationCatalogPackId(animationId);
  let loadedPack: KpLoadedAnimationPack;
  try {
    loadedPack = await loadPack(packId, animationId);
  } catch (cause: unknown) {
    throw new KpAnimationCatalogLoadError(
      "pack-load-failed",
      `Animation pack ${packId} failed to load ${animationId}.`,
      animationId,
      packId,
      { cause }
    );
  }
  const { catalog, runtimeCapabilities } = loadedPack;
  const animation = catalog.find((candidate) => candidate.id === animationId);
  if (animation === undefined) {
    throw new KpAnimationCatalogLoadError(
      "asset-missing-from-pack",
      `Animation pack ${packId} does not contain ${animationId}.`,
      animationId,
      packId
    );
  }
  const conformance = loadedPack.conformanceRegistrations.find(
    ({ assetId }) => assetId === animationId
  );
  if (conformance === undefined) {
    throw new KpAnimationCatalogLoadError(
      "asset-missing-from-pack",
      `Animation pack ${packId} did not register conformance for ${animationId}.`,
      animationId,
      packId
    );
  }
  if (conformance.packId !== packId) {
    throw new KpAnimationCatalogLoadError(
      "asset-missing-from-pack",
      `Animation ${animationId} conformance belongs to ${conformance.packId}, not ${packId}.`,
      animationId,
      packId
    );
  }
  return { animation, catalog, packId, runtimeCapabilities, conformance };
}

export function kpAnimationCatalogPackId(
  animationId: string
): KpAnimationCatalogPackId {
  const declaration = kpAnimationCatalogPackDeclarations.find(
    ({ owns }) => owns(animationId)
  );
  if (declaration !== undefined) return declaration.id;
  throw new KpAnimationCatalogLoadError(
    "unowned-animation",
    `No animation capability pack owns ${animationId}.`,
    animationId
  );
}

export function kpAnimationCatalogPackSourcePath(
  packId: KpAnimationCatalogPackId
): KpAnimationCatalogPackSourcePath {
  return requirePackDeclaration(packId).sourcePath;
}

async function loadPack(
  packId: KpAnimationCatalogPackId,
  animationId: string
): Promise<KpLoadedAnimationPack> {
  const declaration = requirePackDeclaration(packId);
  const cacheKey = `${packId}:${declaration.cacheKey(animationId)}`;
  const existing = packCache.get(cacheKey);
  if (existing !== undefined) return existing;

  const loaded = declaration.load(animationId).then((pack) => {
    const governed = registerKpAnimationPackConformance({
      packId,
      catalog: pack.catalog
    });
    return Object.freeze({
      ...pack,
      conformanceRegistrations: governed.conformanceRegistrations
    });
  });
  packCache.set(cacheKey, loaded);
  // A transient chunk failure must remain explicit without poisoning every
  // later attempt in this host for the lifetime of the page.
  void loaded.catch(() => {
    if (packCache.get(cacheKey) === loaded) packCache.delete(cacheKey);
  });
  return loaded;
}

function pack(
  id: KpAnimationCatalogPackId,
  sourcePath: KpAnimationCatalogPackSourcePath,
  owns: (animationId: string) => boolean,
  load: () => Promise<KpUnregisteredAnimationPack>
): KpAnimationCatalogPackDeclaration {
  return Object.freeze({
    id,
    sourcePath,
    owns,
    cacheKey: () => "default",
    load
  });
}

function splitPack(
  id: KpAnimationCatalogPackId,
  sourcePath: KpAnimationCatalogPackSourcePath,
  owns: (animationId: string) => boolean,
  cacheKey: (animationId: string) => string,
  load: (animationId: string) => Promise<KpUnregisteredAnimationPack>
): KpAnimationCatalogPackDeclaration {
  return Object.freeze({ id, sourcePath, owns, cacheKey, load });
}

function requirePackDeclaration(
  packId: KpAnimationCatalogPackId
): KpAnimationCatalogPackDeclaration {
  const declaration = kpAnimationCatalogPackDeclarations.find(
    ({ id }) => id === packId
  );
  if (declaration === undefined) {
    throw new Error(`Unknown animation pack declaration ${packId}.`);
  }
  return declaration;
}

function dataOnlyPack(
  catalog: readonly KpAnimationAsset[]
): KpUnregisteredAnimationPack {
  return Object.freeze({
    catalog,
    runtimeCapabilities: kpNoAnimationRuntimeCapabilities
  });
}
