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
