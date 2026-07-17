import type { KpAnimationAsset } from "./asset.ts";

export type KpAnimationCatalogPackId =
  | "algebra"
  | "generated-drafts"
  | "generated-problems"
  | "graph"
  | "programming"
  | "comparison"
  | "complex-katex";

export interface KpLoadedAnimationAsset {
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
  readonly packId: KpAnimationCatalogPackId;
}

const packCache = new Map<
  KpAnimationCatalogPackId,
  Promise<readonly KpAnimationAsset[]>
>();

export async function loadKpAnimationAsset(
  animationId: string
): Promise<KpLoadedAnimationAsset> {
  const packId = kpAnimationCatalogPackId(animationId);
  const catalog = await loadPack(packId);
  const animation = catalog.find((candidate) => candidate.id === animationId);
  if (animation === undefined) {
    throw new Error(`Animation pack ${packId} does not contain ${animationId}.`);
  }
  return { animation, catalog, packId };
}

export function kpAnimationCatalogPackId(
  animationId: string
): KpAnimationCatalogPackId {
  if (
    animationId === "animation.linear-solve.solve-x" ||
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
  if (animationId.startsWith("animation.programming.")) return "programming";
  if (animationId.startsWith("animation.comparison.")) return "comparison";
  if (animationId.startsWith("animation.sample.")) return "complex-katex";
  throw new Error(`No animation capability pack owns ${animationId}.`);
}

async function loadPack(
  packId: KpAnimationCatalogPackId
): Promise<readonly KpAnimationAsset[]> {
  const existing = packCache.get(packId);
  if (existing !== undefined) return existing;

  // Literal imports preserve independent capability chunks; a computed module
  // path would collapse this boundary or force the bundler to include a glob.
  const loaded = loadUncachedPack(packId);
  packCache.set(packId, loaded);
  return loaded;
}

async function loadUncachedPack(
  packId: KpAnimationCatalogPackId
): Promise<readonly KpAnimationAsset[]> {
  switch (packId) {
    case "algebra":
      return (await import("./catalog-packs/algebra.ts"))
        .createKpAlgebraAnimationPack();
    case "generated-drafts":
      return (await import("./catalog-packs/generated-drafts.ts"))
        .createKpGeneratedDraftAnimationPack();
    case "generated-problems":
      return (await import("./catalog-packs/generated.ts"))
        .createKpGeneratedProblemAnimationPack();
    case "graph":
      return (await import("./catalog-packs/graph.ts"))
        .createKpGraphAnimationPack();
    case "programming":
      return (await import("./catalog-packs/programming.ts"))
        .createKpProgrammingAnimationPack();
    case "comparison":
      return (await import("./catalog-packs/comparison.ts"))
        .createKpComparisonAnimationPack();
    case "complex-katex":
      return (await import("./catalog-packs/complex-katex.ts"))
        .createKpComplexKatexAnimationPack();
  }
}
