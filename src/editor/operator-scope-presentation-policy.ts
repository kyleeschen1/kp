export const kpOperatorScopePresentationTreatments = Object.freeze([
  "outline",
  "salience-only",
  "none"
] as const);

export type KpOperatorScopePresentationTreatment =
  (typeof kpOperatorScopePresentationTreatments)[number];

export const kpOperatorApplicationKinds = Object.freeze([
  "derivative-operator-application",
  "antiderivative-operator-application"
] as const);

export type KpOperatorApplicationKind =
  (typeof kpOperatorApplicationKinds)[number];

export interface KpOperatorScopePresentationPolicy {
  readonly kind: "operator-scope-presentation-policy";
  readonly id: string;
  readonly operatorApplicationKind: KpOperatorApplicationKind;
  readonly treatment: KpOperatorScopePresentationTreatment;
  readonly scopeAuthority: "semantic-argument-selector-ids";
}

const policies = Object.freeze([
  policy("derivative-operator-application", "outline"),
  policy("antiderivative-operator-application", "salience-only")
]);

/**
 * Semantic plans identify the operator and its argument; this renderer policy
 * alone decides whether that scope is drawn, expressed through salience, or
 * left untreated. Missing application kinds fail closed instead of inheriting
 * a visually plausible treatment.
 */
export function requireKpOperatorScopePresentationPolicy(
  operatorApplicationKind: KpOperatorApplicationKind
): KpOperatorScopePresentationPolicy {
  const found = policies.find((candidate) =>
    candidate.operatorApplicationKind === operatorApplicationKind
  );
  if (found === undefined) {
    throw new Error(
      `Missing operator-scope presentation policy for ${operatorApplicationKind}.`
    );
  }
  return found;
}

export function listKpOperatorScopePresentationPolicies():
readonly KpOperatorScopePresentationPolicy[] {
  return policies;
}

function policy(
  operatorApplicationKind: KpOperatorApplicationKind,
  treatment: KpOperatorScopePresentationTreatment
): KpOperatorScopePresentationPolicy {
  return Object.freeze({
    kind: "operator-scope-presentation-policy" as const,
    id: `presentation.operator-scope.${operatorApplicationKind}.v1`,
    operatorApplicationKind,
    treatment,
    scopeAuthority: "semantic-argument-selector-ids" as const
  });
}
