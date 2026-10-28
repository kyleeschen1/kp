import { fractionalLinearEquationAssetIds as ids } from '../../semantic/fractional-linear-equation-asset.ts';

export interface FractionalPassageOperationBinding {
  readonly transformationId: string;
  readonly start: number;
  readonly end: number;
}

// Local editorial associations, checked against the semantic asset's sequence.
// A paragraph's position in the article does not grant animation authority.
const associations: Readonly<Record<string, string>> = {
  'beat.subtract': ids.subtract,
  'beat.cancel-additive': ids.cancelAdditive,
  'beat.simplify-difference': ids.simplifyDifference,
  'beat.multiply': ids.multiply,
  'beat.cancel-denominator': ids.cancelDenominator,
  'beat.solve': ids.simplifyProduct
};

export function fractionalPassageOperations(
  checkpoints: readonly { readonly beatId: string; readonly progressPermille: number }[],
  transformations: readonly { readonly id: string }[],
  bindings: Readonly<Record<string, string>> = associations
): ReadonlyMap<string, FractionalPassageOperationBinding> {
  const result = new Map<string, FractionalPassageOperationBinding>();
  let previous = 0;
  for (const checkpoint of checkpoints) {
    const transformationId = bindings[checkpoint.beatId];
    if (transformationId === undefined) {
      if (checkpoint.progressPermille !== previous) throw new Error(`Unbound passage ${checkpoint.beatId} cannot advance an animation.`);
      continue;
    }
    const index = transformations.findIndex((item) => item.id === transformationId);
    if (index < 0) throw new Error(`Unknown passage operation ${transformationId}.`);
    const start = Math.round(index / transformations.length * 1000);
    const end = Math.round((index + 1) / transformations.length * 1000);
    if (start !== previous || end !== checkpoint.progressPermille) {
      throw new Error(`Passage ${checkpoint.beatId} must match its operation's source and result.`);
    }
    result.set(checkpoint.beatId, { transformationId, start, end });
    previous = end;
  }
  return result;
}
