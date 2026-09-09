import { isKpVerifiedCommonFactorRewrite, type KpVerifiedCommonFactorRewrite } from "../semantic/common-factor-rewrite.ts";
import { listKpStructuredExpressionSubtrees, type KpStructuredExpressionNode } from "../semantic/structured-expression.ts";
import type { ParsedLatexExpression } from "../math/latex-parser.ts";
import { resolveKpEquationSeriesGovernedSource, type KpEquationSeriesVerifiedSemanticSource } from "./equation-series-governed-source.ts";
import type { KpEquationSeriesGovernedAuthoringInput } from "./equation-series-governed-authoring-registry.ts";
import type { KpEquationSeriesGovernedSourceBindingInput, KpEquationSeriesGovernedSourceBindingResult } from "./equation-series-governed-source-binding.ts";
import type { KpEquationSeriesExternalDiagnostic } from "./equation-series-repair-taxonomy.ts";

export const KP_COMMON_FACTOR_OPERATION = "kp.algebra.factor-common-term";
const contractKind = "kp.semantic-contract.common-factor.v1";
export const kpCommonFactorGovernance = Object.freeze({
  authoringAuthorityId: "authoring.equation.common-factor.v1",
  operationPin: Object.freeze({ packId: "kp.algebra", version: "0.1.0" }),
  requiredEvidenceIds: Object.freeze([contractKind])
});
// The shared envelope selects evidence; it cannot authenticate fabricated roles.
// Keep the verified proof attached to the exact immutable envelope we issued.
const issuedSources = new WeakMap<object, KpVerifiedCommonFactorRewrite>();

export function createKpEquationSeriesCommonFactorSemanticSource(input: {
  readonly sourceId: string;
  readonly adjacencyId: string;
  readonly transformation: KpVerifiedCommonFactorRewrite;
}): KpEquationSeriesVerifiedSemanticSource {
  const proof = input.transformation;
  if (!isKpVerifiedCommonFactorRewrite(proof)) throw new TypeError("Common factoring requires authenticated distributive-law evidence.");
  if (!input.sourceId.trim() || !input.adjacencyId.trim()) throw new TypeError("Source and adjacency IDs are required.");
  const source: KpEquationSeriesVerifiedSemanticSource = Object.freeze({
    sourceId: input.sourceId, revisionId: proof.revisionId,
    operationIds: Object.freeze([KP_COMMON_FACTOR_OPERATION]),
    entityIds: Object.freeze([proof.source, proof.target].flatMap(e => listKpStructuredExpressionSubtrees(e).map(n => n.id))),
    assumptionEvidenceIds: Object.freeze([]),
    semanticContracts: Object.freeze([Object.freeze({ kind: contractKind, authority: proof })]),
    adjacencyEvidence: Object.freeze([Object.freeze({
      adjacencyId: input.adjacencyId, fromStateId: proof.source.root.id, toStateId: proof.target.root.id,
      correspondenceIds: Object.freeze([`${input.adjacencyId}.factor`, `${input.adjacencyId}.left`, `${input.adjacencyId}.right`]),
      roleBindings: Object.freeze({ "factor-copies": proof.factorCopyIds,
        "common-factor": Object.freeze([proof.factor.id]), "source-addends": proof.sourceAddendIds,
        "target-addends": Object.freeze(proof.addends.map(n => n.id)) })
    })])
  });
  issuedSources.set(source, proof);
  return source;
}

export function bindKpEquationSeriesCommonFactorSource(input: KpEquationSeriesGovernedSourceBindingInput): KpEquationSeriesGovernedSourceBindingResult {
  const matches = input.sources.filter(s => s.operationIds.includes(KP_COMMON_FACTOR_OPERATION) &&
    s.adjacencyEvidence?.some(e => e.adjacencyId === input.adjacency.id && e.fromStateId === input.adjacency.fromStateId && e.toStateId === input.adjacency.toStateId));
  const source = matches[0];
  if (matches.length !== 1 || source === undefined || !issuedSources.has(source))
    return Object.freeze({ status: "repair-required", diagnostics: Object.freeze([repair(input.path, "Select one authenticated source with exact adjacency evidence.")]) });
  return Object.freeze({ status: "bound", semanticArguments: argumentsFor(source) });
}

export function validateKpEquationSeriesCommonFactorAuthoring(input: KpEquationSeriesGovernedAuthoringInput): readonly KpEquationSeriesExternalDiagnostic[] {
  if (input.resolution.status !== "resolved") return [];
  const diagnostics: KpEquationSeriesExternalDiagnostic[] = [];
  input.resolution.plans.forEach((plan, index) => {
    if (plan.operationId !== KP_COMMON_FACTOR_OPERATION) return;
    const path = `$.adjacencies[${index}].intent.semanticArguments`;
    const args = plan.intent.mode === "explicit" ? plan.intent.semanticArguments : undefined;
    const pin = record(args) ? args["sourcePin"] : undefined;
    if (!record(pin) || typeof pin["sourceId"] !== "string" || typeof pin["revisionId"] !== "string") {
      diagnostics.push(repair(path, "An operation label is not verified factoring authority.")); return;
    }
    const resolved = resolveKpEquationSeriesGovernedSource({ sources: input.sourceAuthorities ?? [], requirement: {
      sourcePin: { sourceId: pin["sourceId"], revisionId: pin["revisionId"] }, operationId: KP_COMMON_FACTOR_OPERATION,
      requiredSemanticContractKinds: [contractKind], requiredAdjacency: { adjacencyId: plan.id, fromStateId: plan.fromStateId, toStateId: plan.toStateId }
    } });
    const source = resolved.status === "resolved" ? resolved.source : undefined;
    const proof = source === undefined ? undefined : issuedSources.get(source);
    if (source === undefined || proof === undefined || !exact(args, argumentsFor(source))) {
      diagnostics.push(repair(path, "Use the exact issued source revision, pack pin and ordered correspondences; forged or stale evidence is not authority.")); return;
    }
    const before = input.normalizedStates.find(s => s.id === plan.fromStateId)?.endpoint;
    const after = input.normalizedStates.find(s => s.id === plan.toStateId)?.endpoint;
    if (before?.kind !== "expression" || after?.kind !== "expression" ||
        !matches(before.expression, proof.source.root) || !matches(after.expression, proof.target.root))
      diagnostics.push(repair(path, "The ordered endpoints do not represent the pinned factoring proof."));
  });
  return Object.freeze(diagnostics);
}

function argumentsFor(source: KpEquationSeriesVerifiedSemanticSource) {
  return Object.freeze({ schemaVersion: "kp.equation-series.common-factor-intent.v1",
    sourcePin: Object.freeze({ sourceId: source.sourceId, revisionId: source.revisionId }),
    operationPin: kpCommonFactorGovernance.operationPin,
    correspondenceIds: source.adjacencyEvidence![0]!.correspondenceIds });
}
function matches(expression: ParsedLatexExpression, node: KpStructuredExpressionNode): boolean {
  if (node.kind === "symbol") return expression.kind === "identifier" && expression.name === node.name;
  if (node.kind === "number") return expression.kind === "number" && Object.is(expression.value, node.value);
  if (node.kind !== "sum" && node.kind !== "product") return false;
  const children = node.kind === "sum" ? node.terms : node.factors;
  return children.length === 2 && expression.kind === "binary" && expression.operator === (node.kind === "sum" ? "+" : "*") &&
    matches(expression.left, children[0]!) && matches(expression.right, children[1]!);
}
function exact(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((v, i) => exact(actual[i], v));
  if (record(expected)) return record(actual) && Object.keys(actual).length === Object.keys(expected).length &&
    Object.entries(expected).every(([k, v]) => Object.hasOwn(actual, k) && exact(actual[k], v));
  return Object.is(actual, expected);
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function repair(path: string, message: string): KpEquationSeriesExternalDiagnostic {
  return Object.freeze({ code: "equation-series.governance.source.unresolved", path, message,
    repair: "Recheck the bounded common-factor source and bind its authenticated proof to this adjacency.", operationId: KP_COMMON_FACTOR_OPERATION });
}
