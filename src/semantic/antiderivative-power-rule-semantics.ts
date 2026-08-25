import type { CorrespondenceMap } from "./correspondence.ts";

export type KpAntiderivativePowerRuleRoleId =
  | "source.integral-operator"
  | "source.integrand-base"
  | "source.integrand-exponent"
  | "source.differential-symbol"
  | "source.integration-variable"
  | "expanded.numerator-base"
  | "expanded.numerator-exponent"
  | "expanded.numerator-increment"
  | "expanded.denominator-exponent"
  | "expanded.denominator-increment"
  | "expanded.connector"
  | "expanded.integration-constant"
  | "target.numerator-base"
  | "target.numerator-exponent"
  | "target.denominator"
  | "target.connector"
  | "target.integration-constant";

export interface KpAntiderivativePowerRuleSemanticRole {
  readonly id: KpAntiderivativePowerRuleRoleId;
  readonly state: "source" | "expanded" | "target";
  readonly selectorId: string;
  readonly selectorKind: "operator" | "term" | "constant";
  readonly label: string;
  readonly value: string | number;
  readonly operation: "given" | "preserve" | "transmit" | "introduce" | "evaluate";
  readonly derivedFromRoleIds: readonly KpAntiderivativePowerRuleRoleId[];
}

export type KpAntiderivativePowerRuleGroupId =
  | "source.integrand-scope"
  | "source.integration-binding"
  | "expanded.power-successor"
  | "expanded.divisor-successor"
  | "expanded.exact-quotient"
  | "target.exact-quotient";

export interface KpAntiderivativePowerRuleSemanticGroup {
  readonly id: KpAntiderivativePowerRuleGroupId;
  readonly state: "source" | "expanded" | "target";
  readonly semanticId: string;
  readonly memberRoleIds: readonly KpAntiderivativePowerRuleRoleId[];
}

export interface KpAntiderivativePowerRuleSemanticConstraint {
  readonly id:
    | "integration-variable-matches-integrand-base"
    | "source-exponent-drives-both-successors"
    | "successor-increments-are-one"
    | "expanded-constant-is-required"
    | "target-quotient-is-exact";
  readonly roleIds: readonly KpAntiderivativePowerRuleRoleId[];
  readonly summary: string;
}

export interface KpAntiderivativePowerRuleSemanticRoles {
  readonly kind: "antiderivative-power-rule-semantic-roles";
  readonly sourceObjectId: string;
  readonly expandedObjectId: string;
  readonly targetObjectId: string;
  readonly sourceRoles: readonly KpAntiderivativePowerRuleSemanticRole[];
  readonly expandedRoles: readonly KpAntiderivativePowerRuleSemanticRole[];
  readonly targetRoles: readonly KpAntiderivativePowerRuleSemanticRole[];
  readonly groups: readonly KpAntiderivativePowerRuleSemanticGroup[];
  readonly constraints: readonly KpAntiderivativePowerRuleSemanticConstraint[];
}

export function createKpAntiderivativePowerRuleSemanticRoles(input: {
  readonly sourceObjectId: string;
  readonly expandedObjectId: string;
  readonly targetObjectId: string;
  readonly integrationVariable: string;
  readonly base: string;
  readonly exponent: number;
}): KpAntiderivativePowerRuleSemanticRoles {
  const objectIds = [
    input.sourceObjectId,
    input.expandedObjectId,
    input.targetObjectId
  ];
  if (objectIds.some((id) => id.trim() === "")) {
    throw new Error("Antiderivative power-rule object ids must not be empty.");
  }
  if (input.integrationVariable.trim() === "" || input.base.trim() === "") {
    throw new Error("Antiderivative power-rule variables must not be empty.");
  }
  if (input.integrationVariable !== input.base) {
    throw new Error(
      "Antiderivative power-rule integration variable must match the integrand base."
    );
  }
  if (!Number.isInteger(input.exponent) || input.exponent < 0) {
    throw new Error(
      "Antiderivative power-rule exponent must be a non-negative integer."
    );
  }

  const source = (suffix: string) => `${input.sourceObjectId}.${suffix}`;
  const expanded = (suffix: string) => `${input.expandedObjectId}.${suffix}`;
  const target = (suffix: string) => `${input.targetObjectId}.${suffix}`;
  const successor = input.exponent + 1;
  const sourceRoles: readonly KpAntiderivativePowerRuleSemanticRole[] = [
    semanticRole("source.integral-operator", "source", source("operator"), "operator", "\\int", "integrate", "given"),
    semanticRole("source.integrand-base", "source", source("base"), "term", input.base, input.base, "given"),
    semanticRole("source.integrand-exponent", "source", source("exponent"), "term", String(input.exponent), input.exponent, "given"),
    semanticRole("source.differential-symbol", "source", source("differential-symbol"), "operator", "d", "differential", "given"),
    semanticRole("source.integration-variable", "source", source("integration-variable"), "term", input.integrationVariable, input.integrationVariable, "given")
  ];
  const expandedRoles: readonly KpAntiderivativePowerRuleSemanticRole[] = [
    semanticRole("expanded.numerator-base", "expanded", expanded("numerator-base"), "term", input.base, input.base, "preserve", ["source.integrand-base"]),
    semanticRole("expanded.numerator-exponent", "expanded", expanded("numerator-exponent"), "term", String(input.exponent), input.exponent, "transmit", ["source.integrand-exponent"]),
    semanticRole("expanded.numerator-increment", "expanded", expanded("numerator-increment"), "constant", "1", 1, "introduce"),
    semanticRole("expanded.denominator-exponent", "expanded", expanded("denominator-exponent"), "term", String(input.exponent), input.exponent, "transmit", ["source.integrand-exponent"]),
    semanticRole("expanded.denominator-increment", "expanded", expanded("denominator-increment"), "constant", "1", 1, "introduce"),
    semanticRole("expanded.connector", "expanded", expanded("connector"), "operator", "+", "add", "introduce"),
    semanticRole("expanded.integration-constant", "expanded", expanded("constant"), "constant", "C", "integration-constant", "introduce")
  ];
  const targetRoles: readonly KpAntiderivativePowerRuleSemanticRole[] = [
    semanticRole("target.numerator-base", "target", target("numerator-base"), "term", input.base, input.base, "preserve", ["expanded.numerator-base"]),
    semanticRole("target.numerator-exponent", "target", target("numerator-exponent"), "term", String(successor), successor, "evaluate", ["expanded.numerator-exponent", "expanded.numerator-increment"]),
    semanticRole("target.denominator", "target", target("denominator"), "term", String(successor), successor, "evaluate", ["expanded.denominator-exponent", "expanded.denominator-increment"]),
    semanticRole("target.connector", "target", target("connector"), "operator", "+", "add", "preserve", ["expanded.connector"]),
    semanticRole("target.integration-constant", "target", target("constant"), "constant", "C", "integration-constant", "preserve", ["expanded.integration-constant"])
  ];

  return {
    kind: "antiderivative-power-rule-semantic-roles",
    sourceObjectId: input.sourceObjectId,
    expandedObjectId: input.expandedObjectId,
    targetObjectId: input.targetObjectId,
    sourceRoles,
    expandedRoles,
    targetRoles,
    groups: [
      semanticGroup("source.integrand-scope", "source", source("integrand-scope"), ["source.integrand-base", "source.integrand-exponent"]),
      semanticGroup("source.integration-binding", "source", source("integration-binding"), ["source.differential-symbol", "source.integration-variable", "source.integrand-base"]),
      semanticGroup("expanded.power-successor", "expanded", expanded("power-successor"), ["expanded.numerator-exponent", "expanded.numerator-increment"]),
      semanticGroup("expanded.divisor-successor", "expanded", expanded("divisor-successor"), ["expanded.denominator-exponent", "expanded.denominator-increment"]),
      semanticGroup("expanded.exact-quotient", "expanded", expanded("exact-quotient"), ["expanded.numerator-base", "expanded.numerator-exponent", "expanded.numerator-increment", "expanded.denominator-exponent", "expanded.denominator-increment"]),
      semanticGroup("target.exact-quotient", "target", target("exact-quotient"), ["target.numerator-base", "target.numerator-exponent", "target.denominator"])
    ],
    constraints: [
      {
        id: "integration-variable-matches-integrand-base",
        roleIds: ["source.integration-variable", "source.integrand-base"],
        summary: "The differential binds the same variable used by the integrand."
      },
      {
        id: "source-exponent-drives-both-successors",
        roleIds: ["source.integrand-exponent", "expanded.numerator-exponent", "expanded.denominator-exponent"],
        summary: "One source exponent supplies both visible successor expressions."
      },
      {
        id: "successor-increments-are-one",
        roleIds: ["expanded.numerator-increment", "expanded.denominator-increment"],
        summary: "The power rule introduces one into both successor expressions."
      },
      {
        id: "expanded-constant-is-required",
        roleIds: ["expanded.connector", "expanded.integration-constant"],
        summary: "The constant of integration belongs to the first rewritten state."
      },
      {
        id: "target-quotient-is-exact",
        roleIds: ["target.numerator-base", "target.numerator-exponent", "target.denominator"],
        summary: "The settled antiderivative remains an exact quotient."
      }
    ]
  };
}

function semanticRole(
  id: KpAntiderivativePowerRuleRoleId,
  state: KpAntiderivativePowerRuleSemanticRole["state"],
  selectorId: string,
  selectorKind: KpAntiderivativePowerRuleSemanticRole["selectorKind"],
  label: string,
  value: string | number,
  operation: KpAntiderivativePowerRuleSemanticRole["operation"],
  derivedFromRoleIds: readonly KpAntiderivativePowerRuleRoleId[] = []
): KpAntiderivativePowerRuleSemanticRole {
  return { id, state, selectorId, selectorKind, label, value, operation, derivedFromRoleIds };
}

function semanticGroup(
  id: KpAntiderivativePowerRuleGroupId,
  state: KpAntiderivativePowerRuleSemanticGroup["state"],
  semanticId: string,
  memberRoleIds: readonly KpAntiderivativePowerRuleRoleId[]
): KpAntiderivativePowerRuleSemanticGroup {
  return { id, state, semanticId, memberRoleIds };
}

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
