import { assertCompiledFractionChain, type CompiledFractionChain } from "../../authoring/fraction-chain-compilation.ts";
import { FractionChainRepair } from "../../authoring/fraction-chain-source.ts";
import { kpCanonicalCommonDenominatorAlignment } from "../../semantic/fraction-common-denominator.ts";
import { mountCanonicalCommonDenominatorPressure } from "../../rendering/common-denominator-pressure-session.ts";

/** This first host reuses the exact canonical caller. A different numeric
 * source must resolve its own endpoints; visual similarity is not authority. */
export async function mountFractionAlignmentSurface(target: HTMLElement, compilation: CompiledFractionChain, index: number) {
  assertCompiledFractionChain(compilation);
  const step = compilation.steps[index];
  if (step?.kind !== "align") throw new TypeError("Select the checked alignment.");
  for (const side of ["source", "target"] as const) for (const position of [0, 1] as const) {
    const actual = step.authority[side].terms[position], canonical = kpCanonicalCommonDenominatorAlignment[side].terms[position];
    if (actual.numerator.value !== canonical.numerator.value || actual.denominator.value !== canonical.denominator.value)
      throw new FractionChainRepair("fraction-chain.presentation", `$.moves[${index}]`, "This alignment host currently binds the canonical one-third plus one-sixth caller.");
  }
  const session = mountCanonicalCommonDenominatorPressure(target, target);
  try { await session.ready; } catch (error) { session.dispose(); throw error; }
  return { seek(progress: number) { session.sample({ direction: "forward", progress }); }, dispose: session.dispose };
}
