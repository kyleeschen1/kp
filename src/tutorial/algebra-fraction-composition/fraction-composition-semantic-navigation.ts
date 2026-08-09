import {
  fractionCompositionArticleVignetteRelease,
  kpFractionCompositionArticleObjectBindings
} from "../../article/vignettes/fraction-composition-vignette.ts";
import {
  createKpFractionCompositionSalienceInventory
} from "../../semantic/fraction-composition-salience-inventory.ts";

export interface KpFractionCompositionArticleSemanticReference {
  readonly address: string;
  readonly stageId: "solve";
  readonly objectPath: string;
  readonly targetIds: readonly string[];
  readonly paintTargetIds: readonly string[];
}

const salienceInventory = createKpFractionCompositionSalienceInventory();

/**
 * Article paths remain the public identity. Renderer target IDs are a locked
 * adapter detail, so prose never needs to know which KaTeX endpoint is live.
 */
export const kpFractionCompositionArticleSemanticReferences:
readonly KpFractionCompositionArticleSemanticReference[] = Object.freeze(
  kpFractionCompositionArticleObjectBindings.map((binding) => Object.freeze({
    address: `solve/${binding.path}`,
    stageId: "solve" as const,
    objectPath: binding.path,
    targetIds: Object.freeze(binding.targets.map(({ targetId }) => targetId)),
    paintTargetIds: Object.freeze([...new Set(binding.targets.flatMap(
      ({ targetId }) => paintTargets(targetId)
    ))])
  }))
);

const referenceByAddress = new Map(
  kpFractionCompositionArticleSemanticReferences.map((reference) => [
    reference.address,
    reference
  ])
);

if (
  referenceByAddress.size !==
    kpFractionCompositionArticleSemanticReferences.length
  || !fractionCompositionArticleVignetteRelease.objectPaths.every((path) =>
    referenceByAddress.has(`solve/${path}`)
  )
) {
  throw new Error("Fraction composition article semantic paths drifted from its vignette release.");
}

export function resolveKpFractionCompositionArticleSemanticReference(
  address: string
): KpFractionCompositionArticleSemanticReference | undefined {
  return referenceByAddress.get(address);
}

function paintTargets(targetId: string): readonly string[] {
  const matches = salienceInventory.endpoints.flatMap((endpoint) => {
    if (endpoint.stateId === targetId) return [targetId];
    const envelope = endpoint.envelopes.find(({ id }) => id === targetId);
    if (envelope !== undefined) {
      return [...envelope.memberSelectorIds, ...envelope.structuralAnchorIds];
    }
    return [...endpoint.selectorIds, ...endpoint.structuralAnchorIds].filter(
      (selectorId) =>
        selectorId === targetId || selectorId.startsWith(`${targetId}.`)
    );
  });
  if (matches.length === 0) {
    throw new Error(`Fraction composition target ${targetId} has no native paint identity.`);
  }
  return matches;
}
