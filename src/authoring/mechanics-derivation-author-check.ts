import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource, momentumEnergyDerivationStates } from "../../domains/public-api.ts";

export function createMechanicsDerivationAuthorExample() { return { ...momentumEnergyDerivationSource }; }

/** Discovery exposes the existing mechanics authority; it does not infer new
 * physics, transport its nominal proof or apply a draft to the reference host. */
export function checkMechanicsDerivationAuthorSource(json: string) {
  let value: unknown;
  try { value = JSON.parse(json); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { status: "repair-required" as const, code: "physics.derivation.json", path: "$", expected: "Provide valid JSON." };
  }
  const result = checkMomentumEnergyDerivation(value);
  if (result.status !== "checked") return { ...result,
    expected: "Use the existing positive-real mass, Euclidean-vector velocity and mass-times-velocity momentum assumptions. Arbitrary mechanics inference is unsupported." };
  return { status: "semantic-plan-only" as const, domain: "mechanics", checkpointCount: momentumEnergyDerivationStates.length,
    source: result.model.source, presentationStatus: "reference-only" as const };
}
