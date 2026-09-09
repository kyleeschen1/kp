import { KpCommonFactorPresentationGap } from "../animation/distribution-adapter.ts";
import { resolveKpCommonFactorPresentation, explicitCommonFactorExpression as explicit, type KpCommonFactorPresentation } from "./common-factor-presentation.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import { verifyKpCommonFactorRewrite, KpCommonFactorVerificationError, type KpVerifiedCommonFactorRewrite } from "../semantic/common-factor-rewrite.ts";
import { readKpCommonFactorSource, KpCommonFactorRepair, type KpCommonFactorSource } from "./common-factor-source.ts";
import { normalizeKpCommonFactorEndpoints } from "./common-factor-normalizer.ts";
import { createKpEquationSeriesCommonFactorSemanticSource, KP_COMMON_FACTOR_OPERATION } from "./equation-series-common-factor-authoring.ts";
import { bindKpEquationSeriesGovernedRequest } from "./equation-series-governed-source-binding.ts";
import { compileKpEquationTransformSeries, type KpCompiledEquationTransformSeriesCandidate } from "./compile-equation-transform-series.ts";
import type { KpEquationTransformSeriesRequest } from "./equation-transform-series-request.ts";

const brand = Symbol("prepared-common-factor");
const issued = new WeakSet<object>();
export interface KpPreparedCommonFactorDraft {
  readonly [brand]: true;
  readonly source: KpCommonFactorSource;
  readonly revisionId: string;
  readonly proof: KpVerifiedCommonFactorRewrite;
  readonly candidate: KpCompiledEquationTransformSeriesCandidate;
  readonly animation: KpAnimationAsset;
  readonly presentation: KpCommonFactorPresentation;
}

/** Syntax, proof, governed adjacency and paint preparation all succeed before
 * a revision becomes consumable. Serial check reports never carry this brand. */
export function prepareKpCommonFactorDraft(value: unknown): KpPreparedCommonFactorDraft {
  const source = readKpCommonFactorSource(value);
  const endpoints = normalizeKpCommonFactorEndpoints(source);
  let proof: KpVerifiedCommonFactorRewrite;
  try { proof = verifyKpCommonFactorRewrite({ domain: source.domain, symbols: source.symbols,
    source: endpoints[0].structured, target: endpoints[1].structured }); }
  catch (error) {
    if (error instanceof KpCommonFactorVerificationError) throw new KpCommonFactorRepair(error.code, "$.states", error.message);
    throw error;
  }
  const adjacencyId = `${source.id}.factor`;
  const authority = createKpEquationSeriesCommonFactorSemanticSource({ sourceId: source.id, adjacencyId, transformation: proof });
  const request: KpEquationTransformSeriesRequest = {
    schemaVersion: "kp.equation-transform-series-request.v1", kind: "equation-transform-series-request", id: `series.${source.id}`,
    states: [{ id: source.states[0].id, latex: explicit(proof.source.root) }, { id: source.states[1].id, latex: explicit(proof.target.root) }],
    adjacencies: [{ id: adjacencyId, fromStateId: source.states[0].id, toStateId: source.states[1].id,
      intent: { mode: "explicit", operationId: KP_COMMON_FACTOR_OPERATION, semanticArguments: {} } }]
  };
  const binding = bindKpEquationSeriesGovernedRequest({ request, proposals: [], sources: [authority] });
  if (binding.status !== "bound") throw new KpCommonFactorRepair("missing-authority", "$.states", binding.diagnostics.map(d => d.message).join(" "));
  const compiled = compileKpEquationTransformSeries({ value: binding.request, governedSources: [authority] });
  if (compiled.status !== "compiled" || compiled.active === undefined)
    throw new KpCommonFactorRepair("missing-authority", "$.states", compiled.repairs.map(r => r.message).join(" "));
  let presentation: KpCommonFactorPresentation;
  try { presentation = resolveKpCommonFactorPresentation({ source, proof, candidate: compiled.active }); }
  catch (error) {
    if (error instanceof KpCommonFactorPresentationGap) throw new KpCommonFactorRepair(error.code, "$.states", error.message);
    throw error;
  }
  const draft: KpPreparedCommonFactorDraft = Object.freeze({ [brand]: true as const, source, proof, candidate: compiled.active,
    presentation, animation: presentation.animation, revisionId: presentation.revisionId });
  issued.add(draft);
  return draft;
}

export function assertKpPreparedCommonFactorDraft(value: unknown): asserts value is KpPreparedCommonFactorDraft {
  if (typeof value !== "object" || value === null || !issued.has(value))
    throw new TypeError("Render and export require an issued common-factor revision; recheck serialized source first.");
}

export function exportKpCommonFactorSource(draft: KpPreparedCommonFactorDraft): string {
  assertKpPreparedCommonFactorDraft(draft);
  return JSON.stringify(draft.source, null, 2) + "\n";
}
