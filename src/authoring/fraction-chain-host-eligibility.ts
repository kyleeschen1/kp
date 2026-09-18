import { assertCheckedFractionChain, type CheckedFractionChain } from "./fraction-chain-checked.ts";
import { createCheckedFractionReductionAnimation } from "./fraction-chain-reduction-animation.ts";
import { assertFractionChainHostShape } from "./fraction-chain-host-shape.ts";
import { FractionChainRepair, fractionChainDiagnostic, type FractionChainDiagnostic } from "./fraction-chain-source.ts";
import { compileKpCommonDenominatorPressurePresentationPlan } from "../animation/common-denominator-pressure-presentation-plan.ts";
import { resolveFractionAdditionPresentation } from "./fraction-addition-presentation.ts";

/** Semantic compilation and host layout support are distinct. Check the actual
 * native operation owners before a publication can promise an inspection. */
export function checkFractionChainHostEligibility(compilation: CheckedFractionChain):
  | Readonly<{ status: "eligible"; host: "fraction-passage"; revision: string; paintCertification: "not-performed" }>
  | FractionChainDiagnostic {
  assertCheckedFractionChain(compilation);
  const [alignment, combination, reduction] = compilation.steps;
  try {
    assertFractionChainHostShape(compilation);
    if (alignment?.kind !== "align" || combination?.kind !== "combine") throw new TypeError("Expected checked host shape");
    compileKpCommonDenominatorPressurePresentationPlan(alignment.authority);
    resolveFractionAdditionPresentation(compilation, 1);
    if (reduction) createCheckedFractionReductionAnimation(compilation, 2);
  } catch (error) {
    if (error instanceof FractionChainRepair) return fractionChainDiagnostic(error);
    if (!(error instanceof Error)) throw error;
    return { status: "repair-required", code: "fraction-chain.presentation", path: "$.moves",
      expected: `The native fraction host cannot present this checked sequence: ${error.message}` };
  }
  return Object.freeze({ status: "eligible", host: "fraction-passage", revision: compilation.revision, paintCertification: "not-performed" });
}
