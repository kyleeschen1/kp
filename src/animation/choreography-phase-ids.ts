// Catalog metadata must not import the choreography engines merely to name
// their phases. Implementations re-export these same authorities for callers.
export const kpCopyFanOutPhaseIds = [
  "contract-source", "branch-descendants", "transit-descendants",
  "arrive-descendants", "settle-descendants"
] as const;

export const kpSubstitutionPhaseIds = [
  "establish-value-source", "transmit-substitution-value",
  "replace-substitution-occupant", "settle-substitution-replacement"
] as const;

export const kpDerivativePowerPhaseIds = [
  "orient-exponent", "reflow-continuants", "branch-exponent", "drop-coefficient",
  "decrement-successor", "settle-derivative", "release-derivative-focus"
] as const;

export const kpExponentLawChoreographyPhaseIds = [
  "focus-power-role", "reserve-product-layout", "emit-factor-and-operator",
  "decrement-or-absorb-exponent", "settle-native-product", "release-power-focus"
] as const;

export const kpFractionChoreographyPhaseIds = [
  "focus-roles", "reflow-continuants", "transmit-structure",
  "change-artifacts", "settle-native", "release-focus"
] as const;
