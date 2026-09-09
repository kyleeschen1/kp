import { compileKpEquationTransformSeries, type KpEquationTransformSeriesCompilationState, type KpCompiledEquationTransformSeriesCandidate } from "./compile-equation-transform-series.ts";
import { compileKpEquationSeriesLogarithmBaseExample, createKpEquationSeriesLogarithmBaseExample } from "./equation-series-logarithm-base-example.ts";
import { createKpEquationSeriesLogarithmBaseSemanticSource, KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID } from "./equation-series-logarithm-base-authoring.ts";
import { bindKpEquationSeriesGovernedRequest } from "./equation-series-governed-source-binding.ts";
import { normalizeKpEquationTransformSeriesEndpoints } from "./equation-latex-endpoint-normalizer.ts";
import { validateKpEquationTransformSeriesRequest } from "./equation-transform-series-request.ts";
import { kpCanonicalLogarithmChangeOfBase, verifyKpLogarithmChangeOfBase, type KpVerifiedLogarithmChangeOfBase, type KpLogarithmChangeOfBaseDraft } from "../semantic/logarithm-change-of-base.ts";

type DraftAttempt = KpEquationTransformSeriesCompilationState & {
  readonly semantic?: KpVerifiedLogarithmChangeOfBase | undefined;
};
export type KpLogarithmBaseDraftCompilation =
  | (DraftAttempt & { readonly status: "compiled"; readonly active: KpCompiledEquationTransformSeriesCandidate;
      readonly semantic: KpVerifiedLogarithmChangeOfBase })
  | (DraftAttempt & { readonly status: "repair-required" });

export function createKpEquationSeriesLogarithmBaseDraft() {
  const example = createKpEquationSeriesLogarithmBaseExample().value;
  return { ...example, adjacencies: example.adjacencies.map(adjacency => ({ ...adjacency,
    intent: { ...adjacency.intent, semanticArguments: {} } })) };
}

/** Untrusted text enters the same compiler in CLI and browser. Parse failures
 * use the existing repair taxonomy and preserve the last valid candidate. */
export function compileKpEquationSeriesLogarithmBaseText(json: string,
  previous?: KpLogarithmBaseDraftCompilation): KpLogarithmBaseDraftCompilation {
  const fail = (code: string, message: string): KpLogarithmBaseDraftCompilation => ({
    ...compileKpEquationTransformSeries({ value: undefined, previous, externalDiagnostics: [{
      code, path: "$.request", message, repair: "Provide one valid numeric logarithm-base request within 100,000 characters."
    }] }), status: "repair-required", semantic: previous?.semantic
  });
  if (json.length > 100_000) return fail("equation-series.request.size", "The equation source exceeds 100,000 characters.");
  let value: unknown;
  try { value = JSON.parse(json); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return fail("equation-series.request.json", "Provide valid JSON before compiling the equation draft.");
  }
  return compileKpEquationSeriesLogarithmBaseDraft(value, previous);
}

/** Numeric notation proposes operands; the existing verifier and binder own
 * law, domain evidence and correspondence. Explicit legacy pins stay strict. */
export function compileKpEquationSeriesLogarithmBaseDraft(value: unknown,
  previous?: KpLogarithmBaseDraftCompilation): KpLogarithmBaseDraftCompilation {
  const result = compileDraft(value, previous);
  if (result.status === "repair-required") return { ...result, status: "repair-required" };
  // CLI and browser share this boundary. Success cannot expose a partial
  // candidate; the upstream compiler still owns every mathematical check.
  if (!result.active || !result.semantic) throw new Error("Compiled logarithm draft requires its candidate and verified semantic source.");
  return { ...result, status: "compiled", active: result.active, semantic: result.semantic };
}

function compileDraft(value: unknown, previous?: KpLogarithmBaseDraftCompilation): DraftAttempt {
  const fail = (message: string, path = "$.states", code = "equation-series.logarithm-base.draft") => ({
    ...compileKpEquationTransformSeries({ value, previous, externalDiagnostics: [{ code, path, message,
      repair: "Use two matching numeric log-base and natural-log quotient states, with a positive base other than one and a positive argument. Leave semanticArguments empty for compiler-owned binding." }] }),
    semantic: previous?.semantic
  });
  const validated = validateKpEquationTransformSeriesRequest(value);
  if (validated.status !== "accepted") return { ...compileKpEquationTransformSeries({ value, previous }), semantic: previous?.semantic };
  const request = validated.request;
  const intent = request.adjacencies[0]?.intent;
  if (request.states.length !== 2 || intent?.mode !== "explicit" || intent.operationId !== KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID) {
    return fail("This authoring path binds exactly one change-of-base operation.", "$.adjacencies");
  }
  const args = intent.semanticArguments;
  if (typeof args !== "object" || args === null || Array.isArray(args)) return fail("Use an empty semanticArguments object.", "$.adjacencies[0].intent.semanticArguments");
  if (Object.keys(args).length !== 0) {
    // Older source packets intentionally pin the original specimen. Never
    // overwrite their supplied evidence or silently reinterpret a forged pin.
    const fixed = compileKpEquationSeriesLogarithmBaseExample(value, previous);
    return { ...fixed, semantic: fixed.status === "compiled" ? kpCanonicalLogarithmChangeOfBase : previous?.semantic };
  }
  const normalized = normalizeKpEquationTransformSeriesEndpoints(request);
  if (normalized.status !== "normalized") return { ...compileKpEquationTransformSeries({ value, previous }), semantic: previous?.semantic };
  const endpoint = normalized.states[0]!.endpoint;
  if (endpoint.kind !== "expression" || endpoint.expression.kind !== "call" || endpoint.expression.name !== "log" ||
      endpoint.expression.base.kind !== "number" || endpoint.expression.argument.kind !== "number") {
    return fail("The bounded frontend requires numeric base and argument literals; symbolic assumptions and compound operands need a separately verified source.", "$.states[0].latex");
  }
  const base = endpoint.expression.base.value;
  const argument = endpoint.expression.argument.value;
  if (![base, argument].every(number => Number.isFinite(number) && /^\d+(?:\.\d+)?$/.test(String(number)))) {
    return fail("Operands must be finite numeric literals renderable without scientific notation.", "$.states[0].latex");
  }
  try {
    const semantic = numericSemantic(base, argument, request.states[0].id, request.states[1].id);
    const source = createKpEquationSeriesLogarithmBaseSemanticSource({ sourceId: `source.${semantic.id}`,
      revisionId: `revision.${semantic.id}.v1`, adjacencyId: request.adjacencies[0]!.id, transformation: semantic });
    const bound = bindKpEquationSeriesGovernedRequest({ request, proposals: [], sources: [source] });
    if (bound.status !== "bound") return fail(bound.diagnostics.map(item => item.message).join(" "));
    const compiled = compileKpEquationTransformSeries({ value: bound.request, previous, governedSources: [source] });
    return { ...compiled, semantic: compiled.status === "compiled" ? semantic : previous?.semantic };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

function numericSemantic(base: number, argument: number, sourceId: string, targetId: string) {
  if (base === 2 && argument === 7 && sourceId === kpCanonicalLogarithmChangeOfBase.source.stateId && targetId === kpCanonicalLogarithmChangeOfBase.target.stateId) return kpCanonicalLogarithmChangeOfBase;
  const { correspondence: _correspondence, reverseLimits: _reverse, ...reference } = kpCanonicalLogarithmChangeOfBase;
  const draft: KpLogarithmChangeOfBaseDraft = structuredClone(reference);
  const identity = (number: number) => String(number).replace(".", "-point-");
  const baseIdentity = `semantic.logarithm.base.${identity(base)}`;
  const argumentIdentity = `semantic.logarithm.argument.${identity(argument)}`;
  const atom = (entityId: string, semanticId: string, value: number) => ({ kind: "number" as const, entityId, semanticId, value });
  return verifyKpLogarithmChangeOfBase({ ...draft,
    id: `transformation.logarithm.numeric.${identity(base)}.${identity(argument)}`,
    source: { ...draft.source, stateId: sourceId, applicationEntityId: "source.logarithm.application", operatorEntityId: "source.logarithm.operator",
      base: atom("source.logarithm.base", baseIdentity, base), argument: atom("source.logarithm.argument", argumentIdentity, argument) },
    target: { ...draft.target, stateId: targetId,
      numerator: { ...draft.target.numerator, argument: atom("target.numerator.argument", argumentIdentity, argument) },
      denominator: { ...draft.target.denominator, argument: atom("target.denominator.argument", baseIdentity, base) } },
    domainEvidence: { sourceBasePositiveEvidenceId: `evidence.${baseIdentity}.positive`,
      sourceBaseNotOneEvidenceId: `evidence.${baseIdentity}.not-one`, sourceArgumentPositiveEvidenceId: `evidence.${argumentIdentity}.positive`,
      naturalLogarithmTargetEvidenceId: draft.domainEvidence.naturalLogarithmTargetEvidenceId }
  });
}
