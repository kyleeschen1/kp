import {
  compileKpExponentialHomomorphismCorrespondence
} from "./exponential-homomorphism-correspondence.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "./power-application-endpoint-normalizer.ts";

export const kpCanonicalExponentialHomomorphismLatex = Object.freeze({
  source: "b^{x+y}",
  target: "b^{x}b^{y}"
});

const normalizedSource = normalizeKpPowerApplicationEndpoint(
  kpCanonicalExponentialHomomorphismLatex.source
);
if (normalizedSource.status !== "normalized") {
  throw new Error("The exponential exemplar requires a normalized power source.");
}

export const kpCanonicalExponentialHomomorphismAuthority =
  compileKpExponentialHomomorphismCorrespondence({
    id: "exponential.sum-to-product.xy",
    source: normalizedSource.endpoint,
    baseReferentId: "semantic.exponential.base.b",
    operandReferentIds: [
      "semantic.exponential.operand.x",
      "semantic.exponential.operand.y"
    ]
  });
