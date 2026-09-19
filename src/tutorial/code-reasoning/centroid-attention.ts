import type { KpAnimationSalienceIntent } from "../../animation/salience-plan.ts";
import type { KpCentroidExtractionArtifact } from "../../semantic/centroid-extraction-model.ts";

// These claims use checked source roles, never identifier spellings or DOM order.
export const centroidClaims = [
  { id: "accumulation", phrase: "sum and loop", kind: "notice", targetEntityIds: ["centroid.local.sum", "centroid.local.iteration"], summary: "The initialization and loop form the accumulation inside the helper." },
  { id: "division", phrase: "division's result", kind: "notice", targetEntityIds: ["centroid.result.expression"], summary: "The same division produces the result before and after extraction." },
  { id: "answer", phrase: "`cx`", kind: "transmit", sourceEntityIds: ["centroid.result.expression"], targetEntityIds: ["centroid.caller.result"], summary: "The division produces the value received by the caller's cx assignment." }
] as const satisfies readonly (KpAnimationSalienceIntent & { readonly phrase: string })[];

export function centroidClaimEntities(claim: typeof centroidClaims[number]): readonly string[] {
  return claim.kind === "transmit" ? [...claim.sourceEntityIds, ...claim.targetEntityIds] : claim.targetEntityIds;
}

export function validateCentroidClaims(artifact: KpCentroidExtractionArtifact): void {
  for (const state of artifact.states) {
    const entities = new Set(state.tokens.map(token => token.entityId));
    for (const claim of centroidClaims) for (const id of centroidClaimEntities(claim)) {
      if (!entities.has(id)) throw new Error(`Centroid attention needs repair: ${claim.id} lacks ${id} in ${state.id}`);
    }
  }
}

export function projectCentroidAttention(entityId: string, claimId: string | undefined): "focus" | "context" | "normal" {
  if (claimId === undefined) return "normal";
  const claim = centroidClaims.find(claim => claim.id === claimId);
  if (!claim) throw new Error(`Unknown centroid claim ${claimId}`);
  return centroidClaimEntities(claim).includes(entityId) ? "focus" : "context";
}
