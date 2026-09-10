// M1b grows this real-consumer fixture as source, proof, host and projections
// land. It belongs to the complete frontend cohort, not the frozen core cohort.
import { parseLatexScalarExpression } from "../../src/math/latex-parser.ts";
import { createKpStructuredExpression } from "../../src/semantic/structured-expression.ts";
import { verifyKpCommonFactorRewrite, type KpVerifiedCommonFactorRewrite } from "../../src/semantic/common-factor-rewrite.ts";
import { resolveKpOperationEvaluationAuthority } from "../../src/semantic/operation-evaluation-authority.ts";

const parsed = parseLatexScalarExpression("2(x+3)+3(x+3)", ["x"]);
const expression = createKpStructuredExpression({ root: { id: "expression.x", kind: "symbol", name: "x" } });
const proof = verifyKpCommonFactorRewrite({ domain: "real-scalars", symbols: ["x"], source: expression, target: expression });
const evaluation = resolveKpOperationEvaluationAuthority("simplifyConstantSum");
// @ts-expect-error parsed notation cannot mint a verified rewrite
const forged: KpVerifiedCommonFactorRewrite = parsed;
// @ts-expect-error an operation descriptor is not a verified rewrite
const mislabeled: KpVerifiedCommonFactorRewrite = evaluation;
void [proof, forged, mislabeled];
import { readKpComposedAlgebraSource, type KpComposedAlgebraSource } from "../../src/authoring/composed-algebra-source.ts";
const source = readKpComposedAlgebraSource(undefined);
const thirdState: string = source.states[2].latex;
// @ts-expect-error a two-state legacy tuple is not a composed chain
const wrongCount: KpComposedAlgebraSource["states"] = [source.states[0], source.states[1]];
void [thirdState, wrongCount];
import { normalizeKpComposedAlgebraEndpoints } from "../../src/authoring/composed-algebra-normalizer.ts";
const endpoints = normalizeKpComposedAlgebraEndpoints(source);
const lastExpression = endpoints[2].structured;
// @ts-expect-error normalized endpoints remain syntax, not authenticated proof
const normalizedProof: KpVerifiedCommonFactorRewrite = lastExpression;
void normalizedProof;
import { verifyKpOrientedDistributionRewrite, type KpDistributionOrientation } from "../../src/semantic/structured-expression-rewrite.ts";
import type { KpStructuredExpressionRoleBindingSet } from "../../src/semantic/structured-expression-role-binding.ts";
declare const bindings: KpStructuredExpressionRoleBindingSet;
const oriented = verifyKpOrientedDistributionRewrite({ bindings, orientation: "right" });
if (oriented.ok) { const orientation: KpDistributionOrientation = oriented.verification.orientation; void orientation; }
// @ts-expect-error orientation must be explicit, not guessed
verifyKpOrientedDistributionRewrite({ bindings });
// @ts-expect-error only ordered left or right distribution is supported
verifyKpOrientedDistributionRewrite({ bindings, orientation: "commute" });
import { verifyKpComposedFactoring, isKpVerifiedComposedFactoring, type KpVerifiedComposedFactoring } from "../../src/semantic/composed-algebra-factoring.ts";
const factoring = verifyKpComposedFactoring({ domain: source.domain, symbols: source.symbols, orientation: "right",
  source: endpoints[0].structured, target: endpoints[1].structured });
const authenticated: boolean = isKpVerifiedComposedFactoring(factoring);
// @ts-expect-error a normalized expression has no private proof authority
const forgedCompound: KpVerifiedComposedFactoring = lastExpression;
// @ts-expect-error the legacy proof cannot authorize the new composed contract
const legacyCompound: KpVerifiedComposedFactoring = proof;
// @ts-expect-error the new proof cannot silently widen an M1a caller
const compoundLegacy: KpVerifiedCommonFactorRewrite = factoring;
void [authenticated, forgedCompound, legacyCompound, compoundLegacy];
import { verifyKpComposedEvaluation, isKpVerifiedComposedEvaluation, type KpVerifiedComposedEvaluation } from "../../src/semantic/composed-algebra-evaluation.ts";
const contextual = verifyKpComposedEvaluation({ factoring, target: endpoints[2].structured });
const evaluationAuthenticated: boolean = isKpVerifiedComposedEvaluation(contextual);
// @ts-expect-error a descriptor cannot stand in for exact contextual arithmetic
const forgedEvaluation: KpVerifiedComposedEvaluation = evaluation;
// @ts-expect-error parsed source is not the authenticated first deduction
verifyKpComposedEvaluation({ factoring: source, target: endpoints[2].structured });
void [evaluationAuthenticated, forgedEvaluation, contextual.localEvaluation];
import { verifyKpComposedAlgebraChain, type KpVerifiedComposedAlgebraChain } from "../../src/semantic/composed-algebra-chain.ts";
import { checkKpComposedAlgebraProof, bindKpComposedAlgebraProof, assertKpSourceBoundComposedAlgebraProof,
  type KpSourceBoundComposedAlgebraProof } from "../../src/authoring/composed-algebra-proof.ts";
const chain = verifyKpComposedAlgebraChain({ factoring, evaluation: contextual });
const bound = bindKpComposedAlgebraProof({ source, chain });
assertKpSourceBoundComposedAlgebraProof(bound);
const checked = checkKpComposedAlgebraProof(source);
// @ts-expect-error the two operation kinds cannot be reordered
verifyKpComposedAlgebraChain({ factoring: contextual, evaluation: factoring });
// @ts-expect-error an array of valid-looking steps is not issued chain authority
const forgedChain: KpVerifiedComposedAlgebraChain = [factoring, contextual];
// @ts-expect-error a valid mathematical chain has not been bound to authored source
const unbound: KpSourceBoundComposedAlgebraProof = chain;
void [checked, forgedChain, unbound];
import { createKpComposedAlgebraSemanticAsset } from "../../src/semantic/composed-algebra-asset.ts";
import { defineKpSemanticOperationProjector, type KpSemanticOperationProjectionHandlers } from "../../src/semantic/semantic-operation-projection.ts";
import { projectKpIntegerMultipleFactoring } from "../../src/semantic/integer-multiple-factoring-projection.ts";
import { projectKpContextualConstantSum } from "../../src/semantic/contextual-constant-sum-projection.ts";
import type { KpExpressionProjectionHandlers } from "../../src/semantic/expression-node-protocol.ts";
import type { KpStructuredExpressionNode } from "../../src/semantic/structured-expression.ts";
const semanticAsset = createKpComposedAlgebraSemanticAsset(chain);
// @ts-expect-error each selected proof kind requires a typed extension
const incomplete: KpSemanticOperationProjectionHandlers<KpVerifiedComposedAlgebraChain["steps"][number]> = {
  "verified-composed-factoring": { accepts: isKpVerifiedComposedFactoring, project: projectKpIntegerMultipleFactoring }
};
// @ts-expect-error expression projections cannot silently omit new node kinds
const missingExpressionHandlers: KpExpressionProjectionHandlers<KpStructuredExpressionNode, string> = { number: { project: node => String(node.value) } };
defineKpSemanticOperationProjector<KpVerifiedComposedFactoring>({ "verified-composed-factoring": {
  accepts: isKpVerifiedComposedFactoring,
  // @ts-expect-error an evaluation handler cannot receive factoring evidence
  project: projectKpContextualConstantSum
} });
void [semanticAsset, incomplete, missingExpressionHandlers];
import { resolveKpComposedAlgebraPresentation, assertKpComposedAlgebraPresentation,
  type KpComposedAlgebraPresentation } from "../../src/authoring/composed-algebra-presentation.ts";
const presentation = resolveKpComposedAlgebraPresentation(checked);
assertKpComposedAlgebraPresentation(presentation);
// @ts-expect-error mathematical authority alone is not presentation authority
const proofAsPresentation: KpComposedAlgebraPresentation = checked;
// @ts-expect-error raw source cannot select a canonical operation binding
resolveKpComposedAlgebraPresentation(source);
// @ts-expect-error a canonical evaluation cannot replace the factoring slot
const wrongPresentation: KpComposedAlgebraPresentation["steps"] = [presentation.steps[1], presentation.steps[0]];
void [proofAsPresentation, wrongPresentation];
// @ts-expect-error canonical evaluation cannot silently omit its ink-glyph certificate
const missingInkCertificate: KpComposedAlgebraPresentation["steps"][1] = { ...presentation.steps[1], evaluationCertificates: [] };
void missingInkCertificate;
