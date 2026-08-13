import type { KpAnimationAsset } from "./asset.ts";
import {
  kpNoAnimationRuntimeCapabilities,
  type KpAnimationRuntimeCapabilities
} from "./runtime-capabilities.ts";

export type KpAnimationCatalogPackId =
  | "exact-quantity"
  | "place-value"
  | "operation-evaluation"
  | "algebra"
  | "generated-drafts"
  | "generated-problems"
  | "graph"
  | "economics"
  | "physics"
  | "programming"
  | "comparison"
  | "complex-katex";

export interface KpLoadedAnimationAsset {
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
  readonly packId: KpAnimationCatalogPackId;
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
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

const packCache = new Map<
  KpAnimationCatalogPackId,
  Promise<KpLoadedAnimationPack>
>();

interface KpLoadedAnimationPack {
  readonly catalog: readonly KpAnimationAsset[];
  readonly runtimeCapabilities: KpAnimationRuntimeCapabilities;
}

export async function loadKpAnimationAsset(
  animationId: string
): Promise<KpLoadedAnimationAsset> {
  const packId = kpAnimationCatalogPackId(animationId);
  let loadedPack: KpLoadedAnimationPack;
  try {
    loadedPack = await loadPack(packId);
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
  return { animation, catalog, packId, runtimeCapabilities };
}

export function kpAnimationCatalogPackId(
  animationId: string
): KpAnimationCatalogPackId {
  if (animationId.startsWith("animation.operation-evaluation.")) {
    return "operation-evaluation";
  }
  if (
    animationId ===
      "animation.exact-fraction-quantity.third-plus-sixth"
  ) return "exact-quantity";
  if (
    animationId === "animation.place-value-addition.278-plus-156"
  ) return "place-value";
  if (
    animationId === "animation.linear-solve.solve-x" ||
    animationId.startsWith("animation.generated.linear-solve.") ||
    animationId.startsWith("animation.generated.fraction-") ||
    animationId.startsWith("animation.generated.exponent.") ||
    animationId.startsWith("animation.generated.radical.") ||
    animationId.startsWith("animation.generated.function-wrap.") ||
    animationId.startsWith("animation.generated.distribution.") ||
    animationId.startsWith("animation.inequality.")
  ) return "algebra";
  if (animationId === "animation.generated.pipeline-diagram" ||
    animationId === "animation.generated.add-zero" ||
    animationId === "animation.generated.substitute-three" ||
    animationId === "animation.generated.substitute-three.provisional-incorrect") {
    return "generated-drafts";
  }
  if (animationId.startsWith("animation.generated.calculus.") ||
    animationId.startsWith("animation.generated.linear-algebra.")) {
    return "generated-problems";
  }
  if (animationId.startsWith("animation.graph.") ||
    animationId === "animation.derivative-rules.tangent-graph" ||
    animationId === "animation.integral-ftc.area-sweep" ||
    animationId === "animation.dot-projection.basic") {
    return "graph";
  }
  if (animationId.startsWith("animation.economics.")) return "economics";
  if (animationId.startsWith("animation.physics.")) return "physics";
  if (animationId.startsWith("animation.programming.")) return "programming";
  if (animationId.startsWith("animation.comparison.")) return "comparison";
  if (animationId.startsWith("animation.sample.")) return "complex-katex";
  throw new KpAnimationCatalogLoadError(
    "unowned-animation",
    `No animation capability pack owns ${animationId}.`,
    animationId
  );
}

async function loadPack(
  packId: KpAnimationCatalogPackId
): Promise<KpLoadedAnimationPack> {
  const existing = packCache.get(packId);
  if (existing !== undefined) return existing;

  // Literal imports preserve independent capability chunks; a computed module
  // path would collapse this boundary or force the bundler to include a glob.
  const loaded = loadUncachedPack(packId);
  packCache.set(packId, loaded);
  // A transient chunk failure must remain explicit without poisoning every
  // later attempt in this host for the lifetime of the page.
  void loaded.catch(() => {
    if (packCache.get(packId) === loaded) packCache.delete(packId);
  });
  return loaded;
}

async function loadUncachedPack(
  packId: KpAnimationCatalogPackId
): Promise<KpLoadedAnimationPack> {
  switch (packId) {
    case "exact-quantity":
      return dataOnlyPack((await import("./catalog-packs/exact-quantity.ts"))
        .createKpExactQuantityAnimationPack());
    case "place-value":
      return dataOnlyPack((await import("./catalog-packs/place-value.ts"))
        .createKpPlaceValueAnimationPack());
    case "operation-evaluation":
      return dataOnlyPack((await import("./catalog-packs/operation-evaluation.ts"))
        .createKpOperationEvaluationAnimationPack());
    case "algebra":
      return (await import("./catalog-packs/algebra.ts"))
        .createKpAlgebraAnimationPack();
    case "generated-drafts":
      return dataOnlyPack((await import("./catalog-packs/generated-drafts.ts"))
        .createKpGeneratedDraftAnimationPack());
    case "generated-problems":
      return dataOnlyPack((await import("./catalog-packs/generated.ts"))
        .createKpGeneratedProblemAnimationPack());
    case "graph":
      return dataOnlyPack((await import("./catalog-packs/graph.ts"))
        .createKpGraphAnimationPack());
    case "economics":
      return dataOnlyPack((await import("./catalog-packs/economics.ts"))
        .createKpEconomicsAnimationPack());
    case "physics":
      return dataOnlyPack((await import("./catalog-packs/physics.ts"))
        .createKpPhysicsAnimationPack());
    case "programming":
      return dataOnlyPack((await import("./catalog-packs/programming.ts"))
        .createKpProgrammingAnimationPack());
    case "comparison":
      return dataOnlyPack((await import("./catalog-packs/comparison.ts"))
        .createKpComparisonAnimationPack());
    case "complex-katex":
      return dataOnlyPack((await import("./catalog-packs/complex-katex.ts"))
        .createKpComplexKatexAnimationPack());
  }
}

function dataOnlyPack(catalog: readonly KpAnimationAsset[]): KpLoadedAnimationPack {
  return Object.freeze({
    catalog,
    runtimeCapabilities: kpNoAnimationRuntimeCapabilities
  });
}
