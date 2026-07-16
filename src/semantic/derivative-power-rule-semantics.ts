import type { CorrespondenceMap } from "./correspondence.ts";
import {
  findKpAssetSelector,
  type KpAssetBundle
} from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";

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

export function createKpDerivativePowerRuleCorrespondenceMap(
  roles: KpDerivativePowerRuleSemanticRoles,
  transformationId: string
): CorrespondenceMap {
  if (transformationId.trim() === "") {
    throw new Error("Derivative power-rule transformation id must not be empty.");
  }
  const selectorId = (roleId: KpDerivativePowerRuleRoleId): string => {
    const semanticRole = [...roles.sourceRoles, ...roles.targetRoles].find(
      (candidate) => candidate.id === roleId
    );
    if (semanticRole === undefined) {
      throw new Error(`Derivative power-rule role ${roleId} is unavailable.`);
    }
    return semanticRole.selectorId;
  };

  return {
    id: `${transformationId}.correspondence`,
    records: [
      {
        id: "derivative-operator-consumed",
        relation: "removal",
        sourceSelectorIds: [selectorId("source.derivative-operator")],
        targetSelectorIds: [],
        summary: "Applying the rule consumes the derivative operator."
      },
      {
        id: "differentiation-variable-consumed",
        relation: "removal",
        sourceSelectorIds: [selectorId("source.differentiation-variable")],
        targetSelectorIds: [],
        summary:
          "The differentiation variable has constrained the operation and leaves with the operator."
      },
      {
        id: "base-persists",
        relation: "identity",
        sourceSelectorIds: [selectorId("source.base")],
        targetSelectorIds: [selectorId("target.base")],
        summary: "The powered base persists as the derivative's base."
      },
      {
        id: "exponent-branches",
        relation: "fan-out",
        sourceSelectorIds: [selectorId("source.exponent")],
        targetSelectorIds: [
          selectorId("target.coefficient"),
          selectorId("target.exponent")
        ],
        summary:
          "The source exponent branches into a transmitted coefficient and its decremented successor."
      }
    ]
  };
}

export function resolveKpDerivativePowerRuleSemanticRoles(input: {
  readonly transformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
}): KpDerivativePowerRuleSemanticRoles {
  if (
    input.transformation.transformType !== "applyDerivativePowerRule" ||
    input.transformation.sourceObjectIds.length !== 1 ||
    input.transformation.targetObjectIds.length !== 1
  ) {
    throw new Error(
      `Transformation ${input.transformation.id} is not a single-source derivative power rule.`
    );
  }
  const sourceObjectId = input.transformation.sourceObjectIds[0]!;
  const targetObjectId = input.transformation.targetObjectIds[0]!;
  const label = (selectorId: string): string => {
    const value = findKpAssetSelector(input.bundle, selectorId)?.label;
    if (value === undefined || value.trim() === "") {
      throw new Error(
        `Derivative power-rule selector ${selectorId} requires a semantic label.`
      );
    }
    return value;
  };
  const exponentLabel = label(`${sourceObjectId}.exponent`);
  const exponent = Number(exponentLabel);
  if (!Number.isInteger(exponent)) {
    throw new Error(
      `Derivative power-rule exponent ${exponentLabel} must be an integer.`
    );
  }
  return createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId,
    targetObjectId,
    differentiationVariable: label(`${sourceObjectId}.operator-variable`),
    base: label(`${sourceObjectId}.base`),
    exponent
  });
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
