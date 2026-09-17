import { assertCompiledFractionChain, type CompiledFractionChain } from "../../authoring/fraction-chain-compilation.ts";
import { FractionChainRepair } from "../../authoring/fraction-chain-source.ts";
import { compileKpCommonDenominatorPressurePresentationPlan } from "../../animation/common-denominator-pressure-presentation-plan.ts";
import { mountCanonicalCommonDenominatorPressure } from "../../rendering/common-denominator-pressure-session.ts";

/** Bind the issued source, identities and native endpoints as one unit. */
export async function mountFractionAlignmentSurface(target: HTMLElement, compilation: CompiledFractionChain, index: number) {
  assertCompiledFractionChain(compilation);
  const step = compilation.steps[index];
  if (step?.kind !== "align") throw new TypeError("Select the checked alignment.");
  let plan;
  try { plan = compileKpCommonDenominatorPressurePresentationPlan(step.authority); }
  catch { throw new FractionChainRepair("fraction-chain.presentation", `$.moves[${index}]`, "This alignment host requires positive first-term scaling, optionally with positive second-term scaling."); }
  const session = mountCanonicalCommonDenominatorPressure(target, target, plan);
  try { await session.ready; } catch (error) { session.dispose(); throw error; }
  return { seek(progress: number) { session.sample({ direction: "forward", progress }); }, dispose: session.dispose };
}
