import {
  compileKpExponentialHomomorphismCorrespondence
} from "./exponential-homomorphism-correspondence.ts";
import { kpExponentialDifferenceToQuotientLaw } from
  "./exponential-homomorphism-law.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "./power-application-endpoint-normalizer.ts";

export const kpExponentialQuotientPressureLatex = Object.freeze({
  source: "e^{a-b}",
  target: "\\frac{e^{a}}{e^{b}}"
});

const normalizedSource = normalizeKpPowerApplicationEndpoint(
  kpExponentialQuotientPressureLatex.source
);
if (normalizedSource.status !== "normalized") {
  throw new Error(
    "The exponential quotient pressure caller requires a normalized power source."
  );
}

export const kpExponentialQuotientPressureAuthority =
  compileKpExponentialHomomorphismCorrespondence({
    id: "exponential.difference-to-quotient.ab",
    law: kpExponentialDifferenceToQuotientLaw,
    source: normalizedSource.endpoint,
    baseReferentId: "semantic.exponential.base.e",
    operandReferentIds: [
      "semantic.exponential.operand.a",
      "semantic.exponential.operand.b"
    ]
  });
