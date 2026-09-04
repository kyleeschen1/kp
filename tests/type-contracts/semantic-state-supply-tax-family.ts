import type { ExactRationalDto } from
  "../../protocols/public-api.ts";
import {
  createKpSemanticStateSupplyTaxFamilyAuthoring,
  type KpSupplyTaxFamilyParameters
} from "../../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";

const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
const parameters: KpSupplyTaxFamilyParameters = {
  finalTaxAmount: { numerator: "4", denominator: "1" }
};
const exactAmount: ExactRationalDto = parameters.finalTaxAmount;
void exactAmount;

fixture.family.apply(fixture.initial, {
  applicationId: "typed",
  parameters,
  sourceId: "economics.supply-tax.family-authoring.application.typed"
});

fixture.family.apply(fixture.initial, {
  applicationId: "invalid-number",
  // @ts-expect-error Tax family parameters require an exact-rational DTO.
  parameters: { finalTaxAmount: 4 },
  sourceId: "economics.supply-tax.family-authoring.application.invalid-number"
});
