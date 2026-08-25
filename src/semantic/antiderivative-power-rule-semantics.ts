import type { CorrespondenceMap } from "./correspondence.ts";
import {
  findKpAssetSelector,
  type KpAssetBundle
} from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageGraph,
  type KpSemanticLineageRelation
} from "./semantic-lineage-graph.ts";

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

export function resolveKpAntiderivativePowerRuleSemanticRoles(input: {
  readonly expansionTransformation: KpSemanticTransformation;
  readonly resolutionTransformation: KpSemanticTransformation;
  readonly bundle: KpAssetBundle;
}): KpAntiderivativePowerRuleSemanticRoles {
  const expansion = input.expansionTransformation;
  const resolution = input.resolutionTransformation;
  if (
    expansion.transformType !== "applyAntiderivativePowerRule" ||
    resolution.transformType !== "simplifyAntiderivativePowerRule" ||
    expansion.sourceObjectIds.length !== 1 ||
    expansion.targetObjectIds.length !== 1 ||
    resolution.sourceObjectIds.length !== 1 ||
    resolution.targetObjectIds.length !== 1 ||
    expansion.targetObjectIds[0] !== resolution.sourceObjectIds[0]
  ) {
    throw new Error(
      "Antiderivative power-rule roles require one governed expansion followed by one governed resolution."
    );
  }
  const sourceObjectId = expansion.sourceObjectIds[0]!;
  const expandedObjectId = expansion.targetObjectIds[0]!;
  const targetObjectId = resolution.targetObjectIds[0]!;
  const label = (selectorId: string): string => {
    const value = findKpAssetSelector(input.bundle, selectorId)?.label;
    if (value === undefined || value.trim() === "") {
      throw new Error(
        `Antiderivative power-rule selector ${selectorId} requires a semantic label.`
      );
    }
    return value;
  };
  const exponentLabel = label(`${sourceObjectId}.exponent`);
  const exponent = Number(exponentLabel);
  if (!Number.isInteger(exponent)) {
    throw new Error(
      `Antiderivative power-rule exponent ${exponentLabel} must be an integer.`
    );
  }
  return createKpAntiderivativePowerRuleSemanticRoles({
    sourceObjectId,
    expandedObjectId,
    targetObjectId,
    integrationVariable: label(`${sourceObjectId}.integration-variable`),
    base: label(`${sourceObjectId}.base`),
    exponent
  });
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

export interface KpAntiderivativePowerRuleLineageSemantics {
  readonly kind: "antiderivative-power-rule-lineage-semantics";
  readonly expansion: CorrespondenceMap;
  readonly resolution: CorrespondenceMap;
  readonly expansionLineage: KpSemanticLineageGraph;
  readonly resolutionLineage: KpSemanticLineageGraph;
}

export function createKpAntiderivativePowerRuleLineageSemantics(input: {
  readonly roles: KpAntiderivativePowerRuleSemanticRoles;
  readonly expansionTransformationId: string;
  readonly resolutionTransformationId: string;
}): KpAntiderivativePowerRuleLineageSemantics {
  if (
    input.expansionTransformationId.trim() === "" ||
    input.resolutionTransformationId.trim() === ""
  ) {
    throw new Error("Antiderivative power-rule transformation ids must not be empty.");
  }
  const allRoles = [
    ...input.roles.sourceRoles,
    ...input.roles.expandedRoles,
    ...input.roles.targetRoles
  ];
  const selector = (roleId: KpAntiderivativePowerRuleRoleId): string => {
    const role = allRoles.find((candidate) => candidate.id === roleId);
    if (role === undefined) {
      throw new Error(`Antiderivative power-rule role ${roleId} is unavailable.`);
    }
    return role.selectorId;
  };
  const expansionRecords: CorrespondenceMap["records"] = [
    correspondence("integral-operator-consumed", "removal", [selector("source.integral-operator")], [], "Applying the rule consumes the integral operator."),
    correspondence("differential-symbol-consumed", "removal", [selector("source.differential-symbol")], [], "The differential symbol leaves after identifying an integration operation."),
    correspondence("integration-variable-consumed", "removal", [selector("source.integration-variable")], [], "The integration variable constrains the operation before leaving the rewritten expression."),
    correspondence("integrand-base-persists", "identity", [selector("source.integrand-base")], [selector("expanded.numerator-base")], "The integrand base persists in the quotient numerator."),
    correspondence("source-exponent-branches", "fan-out", [selector("source.integrand-exponent")], [selector("expanded.numerator-exponent"), selector("expanded.denominator-exponent")], "The source exponent supplies both successor expressions without cloning paint."),
    correspondence("numerator-increment-introduced", "introduction", [], [selector("expanded.numerator-increment")], "The rule introduces one into the numerator exponent successor."),
    correspondence("denominator-increment-introduced", "introduction", [], [selector("expanded.denominator-increment")], "The rule introduces one into the divisor successor."),
    correspondence("integration-connector-introduced", "introduction", [], [selector("expanded.connector")], "The first rewrite introduces the family-of-antiderivatives connector."),
    correspondence("integration-constant-introduced", "introduction", [], [selector("expanded.integration-constant")], "The first rewrite introduces the required constant of integration.")
  ];
  const resolutionRecords: CorrespondenceMap["records"] = [
    correspondence("numerator-base-persists", "identity", [selector("expanded.numerator-base")], [selector("target.numerator-base")], "The numerator base persists through evaluation."),
    correspondence("power-successor-evaluates", "fan-in", [selector("expanded.numerator-exponent"), selector("expanded.numerator-increment")], [selector("target.numerator-exponent")], "The numerator successor expression evaluates to the target exponent."),
    correspondence("divisor-successor-evaluates", "fan-in", [selector("expanded.denominator-exponent"), selector("expanded.denominator-increment")], [selector("target.denominator")], "The divisor successor expression evaluates to the exact denominator."),
    correspondence("integration-connector-persists", "identity", [selector("expanded.connector")], [selector("target.connector")], "The integration connector persists after its introduction."),
    correspondence("integration-constant-persists", "identity", [selector("expanded.integration-constant")], [selector("target.integration-constant")], "The constant of integration persists through local arithmetic evaluation.")
  ];
  const expansion: CorrespondenceMap = {
    id: `${input.expansionTransformationId}.correspondence`,
    records: expansionRecords
  };
  const resolution: CorrespondenceMap = {
    id: `${input.resolutionTransformationId}.correspondence`,
    records: resolutionRecords
  };

  return {
    kind: "antiderivative-power-rule-lineage-semantics",
    expansion,
    resolution,
    expansionLineage: createKpSemanticLineageGraph({
      id: `${input.expansionTransformationId}.lineage`,
      sourceEntityIds: input.roles.sourceRoles.map((role) => role.selectorId),
      targetEntityIds: input.roles.expandedRoles.map((role) => role.selectorId),
      edges: expansionRecords.map((record) => ({
        id: `${input.expansionTransformationId}.${record.id}`,
        relation: semanticLineageRelation(record.relation),
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      }))
    }),
    resolutionLineage: createKpSemanticLineageGraph({
      id: `${input.resolutionTransformationId}.lineage`,
      sourceEntityIds: input.roles.expandedRoles.map((role) => role.selectorId),
      targetEntityIds: input.roles.targetRoles.map((role) => role.selectorId),
      edges: resolutionRecords.map((record) => ({
        id: `${input.resolutionTransformationId}.${record.id}`,
        relation: semanticLineageRelation(record.relation),
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      }))
    })
  };
}

function correspondence(
  id: string,
  relation: CorrespondenceMap["records"][number]["relation"],
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
): CorrespondenceMap["records"][number] {
  return { id, relation, sourceSelectorIds, targetSelectorIds, summary };
}

function semanticLineageRelation(
  relation: CorrespondenceMap["records"][number]["relation"]
): KpSemanticLineageRelation {
  if (relation === "identity") return "persist";
  if (relation === "fan-out") return "split";
  if (relation === "fan-in") return "merge";
  if (relation === "introduction" || relation === "removal") return relation;
  throw new Error(
    `Antiderivative power-rule correspondence ${relation} has no lineage relation.`
  );
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
