import { sha256 } from "../kernel/public-api.ts";
import { readFractionChainSource, FractionChainRepair, fractionChainDiagnostic, type FractionChainSource, type FractionChainDiagnostic } from "./fraction-chain-source.ts";
import { bindFractionChainAlignment } from "./fraction-chain-alignment.ts";
import { verifyKpCommonDenominatorAlignment } from "../semantic/fraction-common-denominator.ts";
import { bindFractionChainCombination } from "./fraction-chain-combination.ts";
import { bindFractionChainReduction } from "./fraction-chain-reduction.ts";
import { resolveFractionChainMove } from "./fraction-chain-move-resolution.ts";
import { fractionChainStateId } from "./fraction-chain-binding.ts";
import { createKpEquationSeriesCommonDenominatorSemanticSource, KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID } from "./equation-series-common-denominator-authoring.ts";
import { createKpEquationSeriesLikeDenominatorSemanticSource, KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID } from "./equation-series-like-denominator-authoring.ts";
import { bindKpEquationSeriesGovernedRequest } from "./equation-series-governed-source-binding.ts";
import { compileKpEquationTransformSeries, type KpCompiledEquationTransformSeriesCandidate } from "./compile-equation-transform-series.ts";
import type { KpEquationSeriesVerifiedSemanticSource } from "./equation-series-governed-source.ts";
import type { KpEquationTransformSeriesRequest } from "./equation-transform-series-request.ts";
import { createFractionSimplificationAnimationAsset } from "../animation/fraction-adapter.ts";
import { createKpGovernedCanonicalConstructionRequest } from "./governed-semantic-request.ts";
import { compileKpGovernedCanonicalConstruction } from "./governed-canonical-construction-compiler.ts";

const brand = Symbol("compiled-fraction-chain"), issued = new WeakSet<object>();
export type CompiledFractionChainStep =
  | Readonly<{ kind: "align"; authority: ReturnType<typeof bindFractionChainAlignment>; governed: KpCompiledEquationTransformSeriesCandidate }>
  | Readonly<{ kind: "combine"; authority: ReturnType<typeof bindFractionChainCombination>; governed: KpCompiledEquationTransformSeriesCandidate }>
  | Readonly<{ kind: "reduce"; authority: ReturnType<typeof bindFractionChainReduction>;
      animation: ReturnType<typeof createFractionSimplificationAnimationAsset>; governed: ReturnType<typeof compileKpGovernedCanonicalConstruction> }>;
export interface CompiledFractionChain {
  readonly [brand]: true;
  readonly source: FractionChainSource; readonly revision: string; readonly steps: readonly CompiledFractionChainStep[];
}

export function compileFractionChain(value: unknown): { status: "compiled"; compilation: CompiledFractionChain } | FractionChainDiagnostic {
  const parsed = readFractionChainSource(value);
  if (parsed.status !== "parsed") return parsed;
  const source = parsed.source;
  const revision = sha256(JSON.stringify({ ...source, states: source.states.map(({ id, latex }) => ({ id, latex })) }));
  try {
    const steps = source.moves.map((move, index): CompiledFractionChainStep => {
      const pin = { sourceId: `source.${source.id}.${move.id}`, revisionId: revision, adjacencyId: `adjacency.${source.id}.${move.id}` };
      const resolved = resolveFractionChainMove(source, index);
      if (resolved.kind === "align") {
        const authority = resolved.authority;
        const multiplier = ({ entityId, semanticId, numerator, denominator }: typeof authority.equivalenceMultipliers[0]) => ({ entityId, semanticId, numerator, denominator });
        const internal = verifyKpCommonDenominatorAlignment({ schemaVersion: authority.schemaVersion, operator: authority.operator, id: `${authority.id}.products`,
          operationAuthority: authority.operationAuthority, lawAuthority: authority.lawAuthority, source: authority.source,
          target: { ...authority.target, stateId: `${authority.target.stateId}.products` },
          equivalenceMultipliers: [multiplier(authority.equivalenceMultipliers[0]), multiplier(authority.equivalenceMultipliers[1])] });
        return Object.freeze({ kind: "align", authority, governed: compilePair(source, index,
          createKpEquationSeriesCommonDenominatorSemanticSource({ ...pin, transformation: internal }), KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
          internal) });
      }
      if (resolved.kind === "combine") {
        const authority = resolved.authority;
        return Object.freeze({ kind: "combine", authority, governed: compilePair(source, index,
          createKpEquationSeriesLikeDenominatorSemanticSource({ ...pin, transformation: authority }), KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID) });
      }
      return compileReduction(source, index, revision, resolved.authority);
    });
    // All proofs are issued from one frozen source; no transported proof or
    // independently authored endpoint can be spliced into this sequence.
    const compilation: CompiledFractionChain = Object.freeze({ [brand]: true as const, source, revision, steps: Object.freeze(steps) });
    issued.add(compilation);
    return { status: "compiled", compilation };
  } catch (error) {
    if (error instanceof FractionChainRepair) return fractionChainDiagnostic(error);
    throw error;
  }
}
function compilePair(source: FractionChainSource, index: number, semantic: KpEquationSeriesVerifiedSemanticSource, operationId: string,
  alignment?: ReturnType<typeof bindFractionChainAlignment>) {
  const move = source.moves[index]!, adjacencyId = `adjacency.${source.id}.${move.id}`;
  const from = source.states[index]!, to = source.states[index + 1]!;
  const first = { id: fractionChainStateId(source, from), latex: from.latex };
  const last = { id: fractionChainStateId(source, to), latex: to.latex };
  const intermediate = alignment ? { id: alignment.target.stateId,
    latex: alignment.source.terms.map((term, index) => {
      const factor = alignment.equivalenceMultipliers[index]!;
      return factor.numerator === 1n ? `\\frac{${term.numerator.value}}{${term.denominator.value}}`
        : `\\frac{${factor.numerator}*${term.numerator.value}}{${factor.denominator}*${term.denominator.value}}`;
    }).join(alignment.operator) } : undefined;
  // Scaling and arithmetic evaluation have different owners. Keep both checked
  // adjacencies inside the coarse authored move, with the original final ID.
  const request: KpEquationTransformSeriesRequest = { schemaVersion: "kp.equation-transform-series-request.v1", kind: "equation-transform-series-request",
    id: `series.${source.id}.${move.id}`, states: intermediate ? [first, intermediate, last] : [first, last],
    adjacencies: [{ id: adjacencyId, fromStateId: first.id, toStateId: intermediate?.id ?? last.id,
      intent: { mode: "proposed", instruction: move.prose } }, ...(intermediate ? [{ id: `${adjacencyId}.evaluate`, fromStateId: intermediate.id, toStateId: last.id,
        intent: { mode: "proposed" as const, instruction: "Evaluate the numerator and denominator products." } }] : [])] };
  const bound = bindKpEquationSeriesGovernedRequest({ request, proposals: [{ adjacencyId, kind: "single", operationId },
    ...(intermediate ? [{ adjacencyId: `${adjacencyId}.evaluate`, kind: "single" as const, operationId: "kp.algebra.simplify-constant-product" }] : [])], sources: [semantic] });
  if (bound.status !== "bound") throw new FractionChainRepair("fraction-chain.operation", `$.moves[${index}]`, "The operation could not bind to its exact source endpoints.");
  const result = compileKpEquationTransformSeries({ value: bound.request, governedSources: [semantic] });
  if (result.status !== "compiled" || !result.active) throw new FractionChainRepair("fraction-chain.operation", `$.moves[${index}]`,
    result.repairs.map(repair => repair.message).join("; "));
  return result.active;
}
function compileReduction(source: FractionChainSource, index: number, revision: string,
  authority: ReturnType<typeof bindFractionChainReduction>): Extract<CompiledFractionChainStep, { kind: "reduce" }> {
  const path = `$.moves[${index}]`;
  if (authority.source.term.numerator.value <= 0n || authority.target.term.numerator.value <= 0n)
    throw new FractionChainRepair("fraction-chain.presentation", path, "The current reduction presentation requires positive numerators; exact signed/zero reduction is not yet a supported visual caller.");
  try {
    const animation = createFractionSimplificationAnimationAsset({ familyId: "generated.fraction-expression", id: `generated.fraction-expression.${source.id}.${source.moves[index]!.id}`,
      title: source.moves[index]!.prose, numerator: Number(authority.source.term.numerator.value), denominator: Number(authority.source.term.denominator.value),
      simplifiedNumerator: Number(authority.target.term.numerator.value), simplifiedDenominator: Number(authority.target.term.denominator.value) });
    const operationPacks = [{ packId: "kp.algebra", version: "0.1.0" }] as const;
    const operationIds = animation.transformations.map(operation => operation.id), objectIds = animation.bundle.objects.map(object => object.id);
    const request = createKpGovernedCanonicalConstructionRequest({ schemaVersion: "kp.governed-semantic-authoring-request.v2", id: `request.${source.id}.${source.moves[index]!.id}`,
      source: { kind: "verified-semantic-source", sourceId: animation.bundle.id, revisionId: revision, operationPacks },
      approvedObjectIds: objectIds, approvedOperationIds: operationIds, explanationPurpose: { kind: "transmit", objectIds, operationIds },
      detailLevel: "complete", compositionIntent: { kind: "sequence", operationIds } });
    const governed = compileKpGovernedCanonicalConstruction({ request, authority: { sourceId: animation.bundle.id, revisionId: revision, operationPacks, animation } });
    return Object.freeze({ kind: "reduce", authority, animation, governed });
  } catch (error) {
    throw new FractionChainRepair("fraction-chain.presentation", path, error instanceof Error ? error.message : "Reduction construction failed.");
  }
}
export function assertCompiledFractionChain(value: unknown): asserts value is CompiledFractionChain {
  if (!value || typeof value !== "object" || !issued.has(value)) throw new TypeError("Use the original source-checked fraction chain compilation.");
}
