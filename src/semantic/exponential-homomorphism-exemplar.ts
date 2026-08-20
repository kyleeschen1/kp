import {
  compileKpExponentialHomomorphismCorrespondence
} from "./exponential-homomorphism-correspondence.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "./power-application-endpoint-normalizer.ts";

export const kpCanonicalExponentialHomomorphismLatex = Object.freeze({
  source: "e^{a+b}",
  target: "e^{a}e^{b}"
});

const normalizedSource = normalizeKpPowerApplicationEndpoint(
  kpCanonicalExponentialHomomorphismLatex.source
);
if (normalizedSource.status !== "normalized") {
  throw new Error("The exponential exemplar requires a normalized power source.");
}

export const kpCanonicalExponentialHomomorphismAuthority =
  compileKpExponentialHomomorphismCorrespondence({
    id: "exponential.sum-to-product.ab",
    source: normalizedSource.endpoint,
    baseReferentId: "semantic.exponential.base.e",
    operandReferentIds: [
      "semantic.exponential.operand.a",
      "semantic.exponential.operand.b"
    ]
  });
