import { assertCompiledFractionChain, type CompiledFractionChain } from "./fraction-chain-compilation.ts";
import { FractionChainRepair, fractionChainDiagnostic, type FractionChainDiagnostic } from "./fraction-chain-source.ts";
import { compileKpCommonDenominatorPressurePresentationPlan } from "../animation/common-denominator-pressure-presentation-plan.ts";
import { resolveFractionAdditionPresentation } from "./fraction-addition-presentation.ts";

/** Semantic compilation and host layout support are distinct. Check the actual
 * native operation owners before a publication can promise an inspection. */
export function checkFractionChainHostEligibility(compilation: CompiledFractionChain):
  | Readonly<{ status: "eligible"; host: "fraction-passage"; revision: string; paintCertification: "not-performed" }>
  | FractionChainDiagnostic {
  assertCompiledFractionChain(compilation);
  const [alignment, combination, reduction] = compilation.steps;
  if (alignment?.kind !== "align" || combination?.kind !== "combine" ||
      (compilation.steps.length !== 2 && (compilation.steps.length !== 3 || reduction?.kind !== "reduce")))
    return { status: "repair-required", code: "fraction-chain.presentation", path: "$.moves",
      expected: "The fraction passage requires alignment then raw addition/subtraction, optionally followed by one reduction. Other checked sequences need a different host." };
  try {
    compileKpCommonDenominatorPressurePresentationPlan(alignment.authority);
    resolveFractionAdditionPresentation(compilation, 1);
  } catch (error) {
    if (error instanceof FractionChainRepair) return fractionChainDiagnostic(error);
    if (!(error instanceof Error)) throw error;
    return { status: "repair-required", code: "fraction-chain.presentation", path: "$.moves",
      expected: `The native fraction host cannot present this checked sequence: ${error.message}` };
  }
  return Object.freeze({ status: "eligible", host: "fraction-passage", revision: compilation.revision, paintCertification: "not-performed" });
}
