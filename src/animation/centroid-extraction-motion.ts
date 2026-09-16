import generated from "../semantic/centroid-extraction.generated.json" with { type: "json" };
import type { KpCentroidExtractionArtifact, KpCentroidExtractionState } from "../semantic/centroid-extraction-model.ts";
import { assertKpCodeSourceTokenStream, kpCodeSyntaxRoles } from "../semantic/code-source-token-protocol.ts";
import { mintKpCodeSettlementPlan, sampleKpCodeSettlement } from "./code-motion-settlement.ts";
import { compileKpExtractHelperCausalContract } from "../domain-ir/extract-helper-causal-contract.ts";
import type { KpTypeScriptTokenTheaterFrame, KpTypeScriptTheaterToken } from "./typescript-refactor-token-theater.ts";

const verified = new WeakSet<object>();
export type KpCentroidMotion = Readonly<{ artifact: KpCentroidExtractionArtifact; readonly __centroidMotion: never }>;
export const centroidStops = [0, .5, 1] as const;
export const centroidNarration = [
  "Follow the entire calculation. The sum and loop will become helper-local work; cx will stay with the caller.",
  "The calculation now lives in mean. Its division returns the answer to cx; the caller supplies xs.",
  "Inside the helper, xs, sx and x become vs, s and v. These are local names, not shared storage; the caller still supplies xs."
] as const;
const settlement = mintKpCodeSettlementPlan({
  id: "settlement.centroid.extraction", sourcePaintOwnerId: "centroid.source", transitPaintOwnerId: "centroid.material", targetPaintOwnerId: "centroid.target",
  sourceNativeOwnerId: "centroid.source", targetNativeOwnerId: "centroid.target",
  milestones: { travel: .04, arrival: .72, recognition: .8, ownershipHandoff: .9, withdrawal: 1 }
});

/** Only the checked-in build artifact can mint this exemplar's motion. The
 * publication pin ties it back to the actual source files, not copied prose. */
export function createCentroidMotion(): KpCentroidMotion {
  if (generated.schemaVersion !== "kp.centroid-extraction.v1" || generated.states.map(state => state.id).join() !== "original,extracted,generalized") throw new Error("Invalid centroid evidence");
  const state = (index: number, id: KpCentroidExtractionState["id"]): KpCentroidExtractionState => {
    const raw = generated.states[index]!;
    const tokens = raw.tokens.map(token => {
      const kind = kpCodeSyntaxRoles.find(role => role === token.kind);
      if (!kind || !token.id || !token.entityId || !Number.isInteger(token.startOffset) || !Number.isInteger(token.endOffset)) throw new Error("Invalid centroid token evidence");
      return Object.freeze({ ...token, kind });
    });
    return Object.freeze({ id, source: raw.source, tokens: Object.freeze(tokens) });
  };
  const artifact: KpCentroidExtractionArtifact = Object.freeze({
    schemaVersion: "kp.centroid-extraction.v1", sourcePin: generated.sourcePin,
    causalContract: compileKpExtractHelperCausalContract(generated.causalContract),
    evidence: Object.freeze({ ...generated.evidence, syntaxRecordIds: Object.freeze([...generated.evidence.syntaxRecordIds]), assumptions: Object.freeze([...generated.evidence.assumptions]) }),
    states: Object.freeze([state(0, "original"), state(1, "extracted"), state(2, "generalized")] as const)
  });
  artifact.states.forEach(state => {
    assertKpCodeSourceTokenStream(state.source, state.tokens);
    if (new Set(state.tokens.map(token => token.id)).size !== state.tokens.length) throw new Error("Duplicate centroid paint identity");
  });
  for (const [index, state] of artifact.states.entries()) {
    if (index === 0) continue;
    if (artifact.states[index - 1]!.tokens.some(token => !state.tokens.some(next => next.id === token.id))) throw new Error("Centroid source has no successor");
  }
  const plan = Object.freeze({ artifact }) as KpCentroidMotion;
  verified.add(plan);
  return plan;
}

function at(state: KpCentroidExtractionState, offset: number) {
  const prefix = state.source.slice(0, offset).split("\n");
  return { x: prefix.at(-1)!.length, y: prefix.length - 1 };
}
const clamp = (p: number) => Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
const smooth = (p: number) => { const t = clamp(p); return t * t * (3 - 2 * t); };

export function sampleCentroidMotion(plan: KpCentroidMotion, progress: number): {
  readonly native: KpCentroidExtractionState;
  readonly beat: number;
  readonly theater: KpTypeScriptTokenTheaterFrame;
} {
  if (!verified.has(plan)) throw new Error("Centroid sampling requires its language-backed motion authority");
  const p = clamp(progress), index = p < .5 ? 0 : 1;
  const from = plan.artifact.states[index], to = plan.artifact.states[index + 1]!;
  const local = p === 1 ? 1 : p * 2 - index;
  const owner = sampleKpCodeSettlement({ plan: settlement, progress: local });
  const native = owner.paintOwner === "target-native" ? to : from;
  const active = owner.paintOwner === "transit";
  const travel = smooth((local - .04) / .68);
  const byId = new Map(from.tokens.map(token => [token.id, token]));
  const tokens: KpTypeScriptTheaterToken[] = to.tokens.map(target => {
    const source = byId.get(target.id);
    const end = at(to, target.startOffset), start = source ? at(from, source.startOffset) : end;
    const renamed = source !== undefined && source.text !== target.text;
    // Rename at zero ink size, not a text pop on a full-size retained node.
    // This phase belongs to this bounded code operation, not global typography.
    const rename = smooth((local - .12) / .5);
    const scale = source ? renamed ? Math.abs(1 - 2 * rename) : 1 : smooth((local - .4) / .3);
    return { id: target.id, entityId: target.entityId, kind: target.kind,
      text: renamed && rename < .5 ? source.text : target.text,
      xCh: start.x + (end.x - start.x) * travel,
      yLine: start.y + (end.y - start.y) * travel,
      opacity: 1, scale, role: source ? renamed ? "focus" : "transit" : "focus" };
  });
  return { native, beat: p === 1 ? 2 : index,
    theater: { active, activeTrackId: index === 0 ? "centroid.extract-calculation" : "centroid.rename-locals", localProgress: local, tokens,
      maxLineCount: Math.max(...plan.artifact.states.map(state => state.source.split("\n").length)) } };
}
