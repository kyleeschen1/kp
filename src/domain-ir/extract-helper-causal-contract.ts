export const KP_EXTRACT_HELPER_CAUSAL_CONTRACT_SCHEMA =
  "kp.extract-helper-causal-contract.v1" as const;

export interface KpExtractHelperContributorRoleChange {
  readonly sourceContributorRoleId: string;
  readonly targetCallRoleId: string;
}

export interface KpExtractHelperCausalContractInput {
  readonly contractId: string;
  readonly sourceProgramRoleId: string;
  readonly targetProgramRoleId: string;
  readonly introducedHelper: Readonly<{
    declarationRoleId: string;
    bodyRoleId: string;
  }>;
  readonly contributors: readonly KpExtractHelperContributorRoleChange[];
}

export type KpExtractHelperCausalRelationKind =
  | "merge-contributors"
  | "introduce-helper"
  | "change-contributor-role"
  | "succeed-program";

export interface KpExtractHelperCausalRelation {
  readonly id: string;
  readonly kind: KpExtractHelperCausalRelationKind;
  readonly sourceRoleIds: readonly string[];
  readonly targetRoleIds: readonly string[];
}

export interface KpExtractHelperCausalContract {
  readonly schemaVersion: typeof KP_EXTRACT_HELPER_CAUSAL_CONTRACT_SCHEMA;
  readonly kind: "extract-helper-causal-contract";
  readonly contractId: string;
  readonly operation: "extract-helper";
  readonly sourceProgramRoleId: string;
  readonly targetProgramRoleId: string;
  readonly introducedHelper: Readonly<{
    declarationRoleId: string;
    bodyRoleId: string;
  }>;
  readonly contributors: readonly KpExtractHelperContributorRoleChange[];
  readonly relations: readonly KpExtractHelperCausalRelation[];
}

export interface KpExtractHelperCausalContractDiagnostic {
  readonly code:
    | "extract-helper.contract.id-invalid"
    | "extract-helper.contract.contributors-insufficient"
    | "extract-helper.contract.role-id-invalid"
    | "extract-helper.contract.role-collision";
  readonly path: string;
  readonly message: string;
}

export class KpExtractHelperCausalContractError extends Error {
  override readonly name = "KpExtractHelperCausalContractError";
  readonly diagnostics: readonly KpExtractHelperCausalContractDiagnostic[];

  constructor(
    diagnostics: readonly KpExtractHelperCausalContractDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

/**
 * The contract describes why roles change. It intentionally cannot encode
 * syntax, naming, source ranges, traversal order, motion, or presentation.
 */
export function compileKpExtractHelperCausalContract(
  input: KpExtractHelperCausalContractInput
): KpExtractHelperCausalContract {
  const diagnostics: KpExtractHelperCausalContractDiagnostic[] = [];
  if (!validId(input.contractId)) diagnostics.push(issue(
    "extract-helper.contract.id-invalid",
    "$.contractId",
    `${input.contractId} is not a namespaced contract ID.`
  ));
  if (input.contributors.length < 2) diagnostics.push(issue(
    "extract-helper.contract.contributors-insufficient",
    "$.contributors",
    "Extract-helper requires at least two duplicate contributors."
  ));

  const declaredRoles = [
    ["$.sourceProgramRoleId", input.sourceProgramRoleId],
    ["$.targetProgramRoleId", input.targetProgramRoleId],
    [
      "$.introducedHelper.declarationRoleId",
      input.introducedHelper.declarationRoleId
    ],
    ["$.introducedHelper.bodyRoleId", input.introducedHelper.bodyRoleId],
    ...input.contributors.flatMap((contributor, index) => [[
      `$.contributors[${index}].sourceContributorRoleId`,
      contributor.sourceContributorRoleId
    ], [
      `$.contributors[${index}].targetCallRoleId`,
      contributor.targetCallRoleId
    ]])
  ] as const;
  declaredRoles.forEach(([path, id]) => {
    if (!validId(id)) diagnostics.push(issue(
      "extract-helper.contract.role-id-invalid",
      path,
      `${id} is not a namespaced semantic role ID.`
    ));
  });
  const roleIds = declaredRoles.map(([, id]) => id);
  roleIds.forEach((id, index) => {
    if (roleIds.indexOf(id) !== index) diagnostics.push(issue(
      "extract-helper.contract.role-collision",
      declaredRoles[index]?.[0] ?? "$",
      `${id} is assigned to more than one causal role.`
    ));
  });

  if (diagnostics.length > 0) {
    throw new KpExtractHelperCausalContractError(diagnostics);
  }

  const relations = Object.freeze([
    relation(
      `${input.contractId}.merge-contributors`,
      "merge-contributors",
      input.contributors.map(({ sourceContributorRoleId }) =>
        sourceContributorRoleId
      ),
      [input.introducedHelper.bodyRoleId]
    ),
    relation(
      `${input.contractId}.introduce-helper`,
      "introduce-helper",
      [],
      [input.introducedHelper.declarationRoleId]
    ),
    ...input.contributors.map((contributor, index) => relation(
      `${input.contractId}.change-contributor-${index + 1}`,
      "change-contributor-role",
      [contributor.sourceContributorRoleId],
      [contributor.targetCallRoleId]
    )),
    relation(
      `${input.contractId}.succeed-program`,
      "succeed-program",
      [input.sourceProgramRoleId],
      [input.targetProgramRoleId]
    )
  ]);

  return deepFreeze({
    schemaVersion: KP_EXTRACT_HELPER_CAUSAL_CONTRACT_SCHEMA,
    kind: "extract-helper-causal-contract" as const,
    contractId: input.contractId,
    operation: "extract-helper" as const,
    sourceProgramRoleId: input.sourceProgramRoleId,
    targetProgramRoleId: input.targetProgramRoleId,
    introducedHelper: { ...input.introducedHelper },
    contributors: input.contributors.map((contributor) => ({
      ...contributor
    })),
    relations
  });
}

function relation(
  id: string,
  kind: KpExtractHelperCausalRelationKind,
  sourceRoleIds: readonly string[],
  targetRoleIds: readonly string[]
): KpExtractHelperCausalRelation {
  return Object.freeze({
    id,
    kind,
    sourceRoleIds: Object.freeze([...sourceRoleIds]),
    targetRoleIds: Object.freeze([...targetRoleIds])
  });
}

function issue(
  code: KpExtractHelperCausalContractDiagnostic["code"],
  path: string,
  message: string
): KpExtractHelperCausalContractDiagnostic {
  return Object.freeze({ code, path, message });
}

function validId(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u.test(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

