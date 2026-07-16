export type KpDerivativePowerRuleRoleId =
  | "source.derivative-operator"
  | "source.differentiation-variable"
  | "source.base"
  | "source.exponent"
  | "target.coefficient"
  | "target.base"
  | "target.exponent";

export type KpDerivativePowerRuleSemanticOperation =
  | "given"
  | "preserve"
  | "transmit"
  | "decrement";

export interface KpDerivativePowerRuleSemanticRole {
  readonly id: KpDerivativePowerRuleRoleId;
  readonly side: "source" | "target";
  readonly selectorId: string;
  readonly selectorKind: "operator" | "term";
  readonly label: string;
  readonly value: string | number;
  readonly operation: KpDerivativePowerRuleSemanticOperation;
  readonly derivedFromRoleIds: readonly KpDerivativePowerRuleRoleId[];
}

export interface KpDerivativePowerRuleSemanticConstraint {
  readonly id:
    | "differentiation-variable-matches-base"
    | "coefficient-equals-source-exponent"
    | "target-exponent-is-predecessor";
  readonly roleIds: readonly KpDerivativePowerRuleRoleId[];
  readonly summary: string;
}

export interface KpDerivativePowerRuleSemanticRoles {
  readonly kind: "derivative-power-rule-semantic-roles";
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly sourceRoles: readonly KpDerivativePowerRuleSemanticRole[];
  readonly targetRoles: readonly KpDerivativePowerRuleSemanticRole[];
  readonly constraints: readonly KpDerivativePowerRuleSemanticConstraint[];
}

export function createKpDerivativePowerRuleSemanticRoles(input: {
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly differentiationVariable: string;
  readonly base: string;
  readonly exponent: number;
}): KpDerivativePowerRuleSemanticRoles {
  if (input.sourceObjectId.trim() === "" || input.targetObjectId.trim() === "") {
    throw new Error("Derivative power-rule object ids must not be empty.");
  }
  if (input.differentiationVariable.trim() === "" || input.base.trim() === "") {
    throw new Error("Derivative power-rule variables must not be empty.");
  }
  if (!Number.isInteger(input.exponent) || input.exponent < 2) {
    throw new Error(
      "Derivative power-rule exponent must be an integer greater than one."
    );
  }

  const sourceRoles: readonly KpDerivativePowerRuleSemanticRole[] = [
    role({
      id: "source.derivative-operator",
      side: "source",
      selectorId: `${input.sourceObjectId}.operator`,
      selectorKind: "operator",
      label: "d/dx",
      value: "derivative",
      operation: "given"
    }),
    role({
      id: "source.differentiation-variable",
      side: "source",
      selectorId: `${input.sourceObjectId}.operator-variable`,
      selectorKind: "term",
      label: input.differentiationVariable,
      value: input.differentiationVariable,
      operation: "given"
    }),
    role({
      id: "source.base",
      side: "source",
      selectorId: `${input.sourceObjectId}.base`,
      selectorKind: "term",
      label: input.base,
      value: input.base,
      operation: "given"
    }),
    role({
      id: "source.exponent",
      side: "source",
      selectorId: `${input.sourceObjectId}.exponent`,
      selectorKind: "term",
      label: String(input.exponent),
      value: input.exponent,
      operation: "given"
    })
  ];
  const targetRoles: readonly KpDerivativePowerRuleSemanticRole[] = [
    role({
      id: "target.coefficient",
      side: "target",
      selectorId: `${input.targetObjectId}.coefficient`,
      selectorKind: "term",
      label: String(input.exponent),
      value: input.exponent,
      operation: "transmit",
      derivedFromRoleIds: ["source.exponent"]
    }),
    role({
      id: "target.base",
      side: "target",
      selectorId: `${input.targetObjectId}.base`,
      selectorKind: "term",
      label: input.base,
      value: input.base,
      operation: "preserve",
      derivedFromRoleIds: ["source.base"]
    }),
    role({
      id: "target.exponent",
      side: "target",
      selectorId: `${input.targetObjectId}.exponent`,
      selectorKind: "term",
      label: String(input.exponent - 1),
      value: input.exponent - 1,
      operation: "decrement",
      // One source exponent drives two distinct outcomes; this is derivation,
      // not two claims that the same visual identity survives unchanged.
      derivedFromRoleIds: ["source.exponent"]
    })
  ];

  return {
    kind: "derivative-power-rule-semantic-roles",
    sourceObjectId: input.sourceObjectId,
    targetObjectId: input.targetObjectId,
    sourceRoles,
    targetRoles,
    constraints: [
      {
        id: "differentiation-variable-matches-base",
        roleIds: ["source.differentiation-variable", "source.base"],
        summary: "The derivative variable and powered base denote the same symbol."
      },
      {
        id: "coefficient-equals-source-exponent",
        roleIds: ["source.exponent", "target.coefficient"],
        summary: "The source exponent is transmitted into coefficient position."
      },
      {
        id: "target-exponent-is-predecessor",
        roleIds: ["source.exponent", "target.exponent"],
        summary: "The surviving power is one less than the source exponent."
      }
    ]
  };
}

function role(
  input: Omit<KpDerivativePowerRuleSemanticRole, "derivedFromRoleIds"> & {
    readonly derivedFromRoleIds?: readonly KpDerivativePowerRuleRoleId[];
  }
): KpDerivativePowerRuleSemanticRole {
  return {
    ...input,
    derivedFromRoleIds: [...(input.derivedFromRoleIds ?? [])]
  };
}
