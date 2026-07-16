import type { CorrespondenceMap } from "./correspondence.ts";

export interface KpAntiderivativePowerRuleSemantics {
  readonly kind: "antiderivative-power-rule-semantics";
  readonly expansion: CorrespondenceMap;
  readonly resolution: CorrespondenceMap;
}

export function createKpAntiderivativePowerRuleSemantics(input: {
  readonly sourceObjectId: string;
  readonly expandedObjectId: string;
  readonly targetObjectId: string;
  readonly expansionTransformationId: string;
  readonly resolutionTransformationId: string;
}): KpAntiderivativePowerRuleSemantics {
  const source = (suffix: string) => `${input.sourceObjectId}.${suffix}`;
  const expanded = (suffix: string) => `${input.expandedObjectId}.${suffix}`;
  const target = (suffix: string) => `${input.targetObjectId}.${suffix}`;
  return {
    kind: "antiderivative-power-rule-semantics",
    expansion: {
      id: `${input.expansionTransformationId}.correspondence`,
      records: [
        {
          id: "integral-operator-consumed",
          relation: "removal",
          sourceSelectorIds: [source("operator")],
          targetSelectorIds: [],
          summary: "Applying the antiderivative rule consumes the integral operator."
        },
        {
          id: "differential-consumed",
          relation: "removal",
          sourceSelectorIds: [source("differential")],
          targetSelectorIds: [],
          summary: "The differential constrains the operation and leaves after application."
        },
        {
          id: "coefficient-becomes-numerator",
          relation: "role-change",
          sourceSelectorIds: [source("coefficient")],
          targetSelectorIds: [expanded("numerator-coefficient")],
          summary: "The coefficient persists while moving into the quotient numerator."
        },
        {
          id: "base-persists",
          relation: "identity",
          sourceSelectorIds: [source("base")],
          targetSelectorIds: [expanded("base")],
          summary: "The powered base persists through the antiderivative rule."
        },
        {
          id: "exponent-branches-to-successor-sites",
          relation: "fan-out",
          sourceSelectorIds: [source("exponent")],
          targetSelectorIds: [
            expanded("denominator-exponent"),
            expanded("power-exponent")
          ],
          summary: "The exponent branches to the divisor and new power before each receives one."
        },
        {
          id: "denominator-increment-introduced",
          relation: "introduction",
          sourceSelectorIds: [],
          targetSelectorIds: [expanded("denominator-increment")],
          summary: "The power rule introduces one in the denominator successor expression."
        },
        {
          id: "power-increment-introduced",
          relation: "introduction",
          sourceSelectorIds: [],
          targetSelectorIds: [expanded("power-increment")],
          summary: "The power rule introduces one in the exponent successor expression."
        }
      ]
    },
    resolution: {
      id: `${input.resolutionTransformationId}.correspondence`,
      records: [
        {
          id: "quotient-resolves-coefficient",
          relation: "fan-in",
          sourceSelectorIds: [
            expanded("numerator-coefficient"),
            expanded("denominator-exponent"),
            expanded("denominator-increment")
          ],
          targetSelectorIds: [target("coefficient")],
          summary: "The quotient resolves to the antiderivative coefficient."
        },
        {
          id: "base-settles",
          relation: "identity",
          sourceSelectorIds: [expanded("base")],
          targetSelectorIds: [target("base")],
          summary: "The base remains the same semantic variable."
        },
        {
          id: "successor-resolves-exponent",
          relation: "fan-in",
          sourceSelectorIds: [
            expanded("power-exponent"),
            expanded("power-increment")
          ],
          targetSelectorIds: [target("exponent")],
          summary: "The exponent and increment resolve to their successor."
        },
        {
          id: "integration-connector-introduced",
          relation: "introduction",
          sourceSelectorIds: [],
          targetSelectorIds: [target("connector")],
          summary: "The family-of-antiderivatives term introduces its connector."
        },
        {
          id: "integration-constant-introduced",
          relation: "introduction",
          sourceSelectorIds: [],
          targetSelectorIds: [target("constant")],
          summary: "Indefinite integration introduces the constant of integration."
        }
      ]
    }
  };
}
