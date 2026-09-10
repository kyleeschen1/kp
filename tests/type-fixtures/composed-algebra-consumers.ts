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
