import {
  createKpFunctionWrapEquationExtensionPack,
  kpFunctionWrapEquationExtensionPackId
} from "./equation-extension-packs/function-wrap.ts";
import {
  createKpFunctionWrapReceptionPlan,
  kpFunctionWrapMotifSchema,
  type KpFunctionWrapEnclosureEntityRoles,
  type KpFunctionWrapReceptionPlan
} from "./function-wrap-motif.ts";
import {
  compileKpMotifInvocation,
  createKpMotifEntityBinding,
  createKpMotifInvocation,
  type KpCompiledMotifPlan,
  type KpMotifEntityBinding,
  type KpMotifInvocation,
  type KpMotifRoleBindings
} from "../domain-ir/equation-motif-invocation.ts";
import {
  validateKpEquationExtensionPack,
  type KpValidatedEquationExtensionPack
} from "../domain-ir/equation-extension-pack-validator.ts";
import {
  kpCanonicalEquationMotionVocabulary,
  type KpOperationKind,
  type KpRecipeId,
  type KpRendererCapabilityId
} from "../domain-ir/equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;

export const kpCanonicalFunctionWrapDeclaration = Object.freeze({
  packId: kpFunctionWrapEquationExtensionPackId,
  operationKind: vocabulary.operations.wrapFunctionV1,
  recipeId: vocabulary.recipes.functionApplicationV1,
  motifId: vocabulary.motifs.functionWrapV1,
  rendererCapabilityId: vocabulary.rendererCapabilities.nativeKatexV1
});

const functionWrapRegistryAuthority = requireFunctionWrapRegistryAuthority();

export interface KpCompiledFunctionWrapInvocation {
  readonly invocation: KpMotifInvocation;
  readonly compiledMotifPlan: KpCompiledMotifPlan;
  readonly registryAuthority: KpValidatedEquationExtensionPack;
}

export interface KpFunctionWrapInvocationGroupBranch {
  readonly id: string;
  readonly sourceArgumentEntityIds: readonly string[];
  readonly targetArgumentEntityIds: readonly string[];
  readonly functionEntityIds: readonly string[];
  readonly wrapperEntityIds: readonly string[];
  readonly enclosureEntityRoles: KpFunctionWrapEnclosureEntityRoles;
  readonly compiledInvocation: KpCompiledFunctionWrapInvocation;
}

declare const kpFunctionWrapInvocationGroupAuthority: unique symbol;

export type KpCompiledFunctionWrapInvocationGroup = Readonly<{
  schemaVersion: "kp.compiled-function-wrap-invocation-group.v1";
  kind: "compiled-function-wrap-invocation-group";
  id: string;
  motifId: typeof kpCanonicalFunctionWrapDeclaration.motifId;
  operationKind: KpOperationKind;
  recipeId: KpRecipeId;
  rendererCapabilityId: KpRendererCapabilityId;
  branches: readonly KpFunctionWrapInvocationGroupBranch[];
  synchronization: "together";
  [kpFunctionWrapInvocationGroupAuthority]: true;
}>;

const compiledGroups = new WeakSet<object>();

export function compileKpFunctionWrapInvocation(input: {
  readonly id: string;
  readonly roleBindings: {
    readonly argument: readonly KpMotifEntityBinding[];
    readonly function: readonly KpMotifEntityBinding[];
    readonly "leading-enclosure": readonly KpMotifEntityBinding[];
    readonly "trailing-enclosure": readonly KpMotifEntityBinding[];
  };
}): KpCompiledFunctionWrapInvocation {
  const leadingCount = input.roleBindings["leading-enclosure"].length;
  const trailingCount = input.roleBindings["trailing-enclosure"].length;
  if (
    leadingCount !== trailingCount ||
    leadingCount > 1 ||
    trailingCount > 1
  ) {
    throw new Error(
      "One function-wrap invocation requires either no enclosure or one paired leading and trailing enclosure."
    );
  }
  const invocation = createKpMotifInvocation(kpFunctionWrapMotifSchema, {
    id: input.id,
    motifId: kpCanonicalFunctionWrapDeclaration.motifId,
    operationKind: kpCanonicalFunctionWrapDeclaration.operationKind,
    roleBindings: input.roleBindings as
      KpMotifRoleBindings<typeof kpFunctionWrapMotifSchema.roles>
  });
  const compilation = compileKpMotifInvocation({
    schema: kpFunctionWrapMotifSchema,
    invocation,
    rendererCapabilityIds: [
      kpCanonicalFunctionWrapDeclaration.rendererCapabilityId
    ]
  });
  if (compilation.status !== "compiled") {
    throw new Error(
      `Function-wrap invocation ${invocation.id} is invalid: ${compilation.diagnostics[0]?.message ?? "unknown diagnostic"}`
    );
  }
  return Object.freeze({
    invocation,
    compiledMotifPlan: compilation.plan,
    registryAuthority: functionWrapRegistryAuthority
  });
}

export function compileKpFunctionWrapInvocationGroup(input: {
  readonly id: string;
  readonly branches: readonly {
    readonly id: string;
    readonly semanticObjectId: string;
    readonly sourceArgumentEntityIds: readonly string[];
    readonly targetArgumentEntityIds: readonly string[];
    readonly functionEntityIds: readonly string[];
    readonly enclosureEntityRoles: KpFunctionWrapEnclosureEntityRoles;
  }[];
}): KpCompiledFunctionWrapInvocationGroup {
  requireText(input.id, "Function-wrap invocation group");
  if (input.branches.length === 0) {
    throw new Error("Function-wrap invocation group requires a branch.");
  }
  requireUnique(input.branches.map(({ id }) => id), "function-wrap branch");
  const ownedEntityIds: string[] = [];
  const branches = input.branches.map((branch) => {
    requireText(branch.id, "Function-wrap invocation branch");
    requireText(branch.semanticObjectId, `${branch.id} semantic object`);
    if (
      branch.sourceArgumentEntityIds.length === 0 ||
      branch.targetArgumentEntityIds.length === 0 ||
      branch.functionEntityIds.length === 0
    ) {
      throw new Error(
        `Function-wrap invocation branch ${branch.id} requires source arguments, target arguments, and function syntax.`
      );
    }
    if (
      branch.sourceArgumentEntityIds.length !==
        branch.targetArgumentEntityIds.length
    ) {
      throw new Error(
        `Function-wrap invocation branch ${branch.id} requires paired source and target arguments.`
      );
    }
    requireUnique(branch.sourceArgumentEntityIds, `${branch.id} source argument`);
    requireUnique(branch.targetArgumentEntityIds, `${branch.id} target argument`);
    requireUnique(branch.functionEntityIds, `${branch.id} function syntax`);
    if (branch.enclosureEntityRoles.length !== 0) {
      const [leadingRole, trailingRole] = branch.enclosureEntityRoles;
      if (
        leadingRole.side !== "leading" ||
        trailingRole.side !== "trailing" ||
        leadingRole.entityId === trailingRole.entityId
      ) {
        throw new Error(
          `Function-wrap invocation branch ${branch.id} requires distinct leading then trailing enclosure entities.`
        );
      }
    }
    const leading = branch.enclosureEntityRoles.length === 0
      ? []
      : [entity(
          branch.enclosureEntityRoles[0].entityId,
          branch.semanticObjectId
        )];
    const trailing = branch.enclosureEntityRoles.length === 0
      ? []
      : [entity(
          branch.enclosureEntityRoles[1].entityId,
          branch.semanticObjectId
        )];
    const compiledInvocation = compileKpFunctionWrapInvocation({
      id: `invocation.${input.id}.${branch.id}`,
      roleBindings: {
        argument: branch.targetArgumentEntityIds.map((entityId) =>
          entity(entityId, branch.semanticObjectId)
        ),
        function: branch.functionEntityIds.map((entityId) =>
          entity(entityId, branch.semanticObjectId)
        ),
        "leading-enclosure": leading,
        "trailing-enclosure": trailing
      }
    });
    const wrapperEntityIds = [
      ...branch.functionEntityIds,
      ...branch.enclosureEntityRoles.map(({ entityId }) => entityId)
    ];
    ownedEntityIds.push(
      ...branch.targetArgumentEntityIds,
      ...wrapperEntityIds
    );
    return Object.freeze({
      id: branch.id,
      sourceArgumentEntityIds: Object.freeze([
        ...branch.sourceArgumentEntityIds
      ]),
      targetArgumentEntityIds: Object.freeze([
        ...branch.targetArgumentEntityIds
      ]),
      functionEntityIds: Object.freeze([...branch.functionEntityIds]),
      wrapperEntityIds: Object.freeze(wrapperEntityIds),
      enclosureEntityRoles: Object.freeze(
        branch.enclosureEntityRoles.map((role) => Object.freeze({ ...role }))
      ) as KpFunctionWrapEnclosureEntityRoles,
      compiledInvocation
    });
  });
  requireUnique(ownedEntityIds, "function-wrap invocation owner");
  const group = Object.freeze({
    schemaVersion: "kp.compiled-function-wrap-invocation-group.v1" as const,
    kind: "compiled-function-wrap-invocation-group" as const,
    id: input.id,
    motifId: kpCanonicalFunctionWrapDeclaration.motifId,
    operationKind: kpCanonicalFunctionWrapDeclaration.operationKind,
    recipeId: kpCanonicalFunctionWrapDeclaration.recipeId,
    rendererCapabilityId:
      kpCanonicalFunctionWrapDeclaration.rendererCapabilityId,
    branches: Object.freeze(branches),
    synchronization: "together" as const
  }) as KpCompiledFunctionWrapInvocationGroup;
  compiledGroups.add(group);
  return group;
}

export function isKpCompiledFunctionWrapInvocationGroup(
  value: unknown
): value is KpCompiledFunctionWrapInvocationGroup {
  return typeof value === "object" && value !== null &&
    compiledGroups.has(value);
}

export function createKpFunctionWrapInvocationGroupReception(input: {
  readonly group: KpCompiledFunctionWrapInvocationGroup;
  readonly direction: "forward" | "rewind";
}): KpFunctionWrapReceptionPlan {
  if (!isKpCompiledFunctionWrapInvocationGroup(input.group)) {
    throw new Error(
      "Function-wrap reception requires a compiler-minted invocation group."
    );
  }
  return createKpFunctionWrapReceptionPlan({
    id: `function-wrap-reception.${input.group.id}.${input.direction}`,
    direction: input.direction,
    branches: input.group.branches.map((branch) => ({
      id: branch.id,
      argumentEntityIds: branch.targetArgumentEntityIds,
      syntaxEntityIds: branch.functionEntityIds,
      enclosureEntityRoles: branch.enclosureEntityRoles
    }))
  });
}

function entity(
  entityId: string,
  semanticObjectId: string
): KpMotifEntityBinding {
  return createKpMotifEntityBinding({ entityId, semanticObjectId });
}

function requireFunctionWrapRegistryAuthority():
  KpValidatedEquationExtensionPack {
  const result = validateKpEquationExtensionPack(
    createKpFunctionWrapEquationExtensionPack()
  );
  if (result.status !== "valid") {
    throw new Error(
      `Function-wrap extension pack is invalid: ${result.diagnostics[0]?.message ?? "unknown diagnostic"}`
    );
  }
  return result.validatedPack;
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} requires a non-empty id.`);
}

function requireUnique(values: readonly string[], label: string): void {
  values.forEach((value) => requireText(value, label));
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}
