import type {
  KpEquationExtensionPack,
  KpEquationFamilyDisposition
} from "./equation-extension-registry.ts";
import type {
  KpFamilyId,
  KpRecipeId
} from "./equation-motion-vocabulary.ts";

export const kpEquationFamilyDispositionValues = Object.freeze([
  "active",
  "deferred",
  "static-only",
  "unsupported",
  "retirement-candidate"
] as const satisfies readonly KpEquationFamilyDisposition[]);

export type KpEquationExtensionPackDiagnosticCode =
  | "pack.operation.family-missing"
  | "pack.operation.recipe-missing"
  | "pack.operation.recipe-mismatch"
  | "pack.operation.semantic-authority"
  | "pack.recipe.family-missing"
  | "pack.recipe.operation-missing"
  | "pack.recipe.operation-unclaimed"
  | "pack.recipe.motif-use-duplicate"
  | "pack.recipe.motif-missing"
  | "pack.recipe.role-incompatible"
  | "pack.recipe.operation-incompatible"
  | "pack.recipe.dependency-missing"
  | "pack.recipe.dependency-cycle"
  | "pack.recipe.causal-grammar"
  | "pack.motif.family-missing"
  | "pack.motif.schema-mismatch"
  | "pack.motif.capability-missing"
  | "pack.motif.capability-unclaimed"
  | "pack.capability.motif-missing"
  | "pack.family.disposition-invalid"
  | "pack.family.member-missing"
  | "pack.family.member-mismatch"
  | "pack.family.member-unclaimed";

export interface KpEquationExtensionPackDiagnostic {
  readonly code: KpEquationExtensionPackDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpEquationFamilyCodeGenerationDisposition {
  readonly familyId: KpFamilyId;
  readonly disposition: KpEquationFamilyDisposition;
}

declare const kpValidatedEquationExtensionPackAuthority: unique symbol;

export type KpValidatedEquationExtensionPack = Readonly<{
  schemaVersion: "kp.validated-equation-extension-pack.v1";
  kind: "validated-equation-extension-pack";
  pack: KpEquationExtensionPack;
  familyDispositions: readonly KpEquationFamilyCodeGenerationDisposition[];
  [kpValidatedEquationExtensionPackAuthority]: true;
}>;

export type KpEquationExtensionPackValidationResult =
  | {
      readonly status: "valid";
      readonly validatedPack: KpValidatedEquationExtensionPack;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "invalid";
      readonly diagnostics: readonly KpEquationExtensionPackDiagnostic[];
    };

const validatedPacks = new WeakSet<object>();
const validDispositions = new Set<string>(kpEquationFamilyDispositionValues);

export function validateKpEquationExtensionPack(
  pack: KpEquationExtensionPack
): KpEquationExtensionPackValidationResult {
  const diagnostics: KpEquationExtensionPackDiagnostic[] = [];
  validateOperations(pack, diagnostics);
  validateRecipes(pack, diagnostics);
  validateMotifs(pack, diagnostics);
  validateCapabilities(pack, diagnostics);
  validateFamilies(pack, diagnostics);
  if (containsRecipeCycle(pack)) {
    diagnostics.push(issue(
      "pack.recipe.dependency-cycle",
      "$.recipes",
      "Recipe dependencies must form an acyclic graph."
    ));
  }
  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "invalid" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }

  const validatedPack = Object.freeze({
    schemaVersion: "kp.validated-equation-extension-pack.v1" as const,
    kind: "validated-equation-extension-pack" as const,
    pack,
    familyDispositions: Object.freeze(pack.families.entries.map((family) =>
      Object.freeze({
        familyId: family.id,
        disposition: family.disposition
      })
    ))
  }) as KpValidatedEquationExtensionPack;
  validatedPacks.add(validatedPack);
  return Object.freeze({
    status: "valid" as const,
    validatedPack,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpValidatedEquationExtensionPack(
  value: unknown
): value is KpValidatedEquationExtensionPack {
  return typeof value === "object" && value !== null && validatedPacks.has(value);
}

function validateOperations(
  pack: KpEquationExtensionPack,
  diagnostics: KpEquationExtensionPackDiagnostic[]
): void {
  pack.operations.entries.forEach((operation, index) => {
    const path = `$.operations[${index}]`;
    if (pack.families.byId[operation.familyId] === undefined) {
      diagnostics.push(issue("pack.operation.family-missing", `${path}.familyId`, `Operation ${operation.id} references missing family ${operation.familyId}.`));
    }
    operation.recipeIds.forEach((recipeId, recipeIndex) => {
      const recipe = pack.recipes.byId[recipeId];
      const recipePath = `${path}.recipeIds[${recipeIndex}]`;
      if (recipe === undefined) {
        diagnostics.push(issue("pack.operation.recipe-missing", recipePath, `Operation ${operation.id} references missing recipe ${recipeId}.`));
      } else if (!recipe.operationKinds.includes(operation.id)) {
        diagnostics.push(issue("pack.operation.recipe-mismatch", recipePath, `Recipe ${recipeId} does not support ${operation.id}.`));
      }
    });
    checkUniqueText(
      operation.semanticAuthorityIds,
      `${path}.semanticAuthorityIds`,
      "pack.operation.semantic-authority",
      diagnostics
    );
  });
}

function validateRecipes(
  pack: KpEquationExtensionPack,
  diagnostics: KpEquationExtensionPackDiagnostic[]
): void {
  pack.recipes.entries.forEach((recipe, index) => {
    const path = `$.recipes[${index}]`;
    if (pack.families.byId[recipe.familyId] === undefined) {
      diagnostics.push(issue("pack.recipe.family-missing", `${path}.familyId`, `Recipe ${recipe.id} references missing family ${recipe.familyId}.`));
    }
    recipe.operationKinds.forEach((operationKind, operationIndex) => {
      const operationPath = `${path}.operationKinds[${operationIndex}]`;
      const operation = pack.operations.byId[operationKind];
      if (operation === undefined) {
        diagnostics.push(issue("pack.recipe.operation-missing", operationPath, `Recipe ${recipe.id} references missing operation ${operationKind}.`));
      } else if (!operation.recipeIds.includes(recipe.id)) {
        diagnostics.push(issue("pack.recipe.operation-unclaimed", operationPath, `Operation ${operation.id} does not claim recipe ${recipe.id}.`));
      }
    });
    if (recipe.operationKinds.length === 0) {
      diagnostics.push(issue("pack.recipe.operation-missing", `${path}.operationKinds`, `Recipe ${recipe.id} requires at least one operation.`));
    }
    checkUniqueText(
      recipe.causalGrammarIds,
      `${path}.causalGrammarIds`,
      "pack.recipe.causal-grammar",
      diagnostics
    );
    const useIds = new Set<string>();
    recipe.motifUses.forEach((use, useIndex) => {
      const usePath = `${path}.motifUses[${useIndex}]`;
      if (useIds.has(use.id)) {
        diagnostics.push(issue("pack.recipe.motif-use-duplicate", `${usePath}.id`, `Recipe ${recipe.id} duplicates motif use ${use.id}.`));
      }
      useIds.add(use.id);
      const motif = pack.motifs.byId[use.motifId];
      if (motif === undefined) {
        diagnostics.push(issue("pack.recipe.motif-missing", `${usePath}.motifId`, `Recipe ${recipe.id} references missing motif ${use.motifId}.`));
        return;
      }
      const expectedRoles = motif.schema.roles.map(({ id }) => id);
      if (!sameUniqueValues(use.roleIds, expectedRoles)) {
        diagnostics.push(issue("pack.recipe.role-incompatible", `${usePath}.roleIds`, `Motif use ${use.id} must bind exactly the roles declared by ${motif.id}.`));
      }
      const unsupportedOperations = recipe.operationKinds.filter(
        (operationKind) => !motif.schema.operationKinds.includes(operationKind)
      );
      if (unsupportedOperations.length > 0) {
        diagnostics.push(issue("pack.recipe.operation-incompatible", `${usePath}.motifId`, `Motif ${motif.id} does not support ${unsupportedOperations.join(", ")}.`));
      }
    });
    recipe.dependencyRecipeIds.forEach((dependencyId, dependencyIndex) => {
      if (pack.recipes.byId[dependencyId] === undefined) {
        diagnostics.push(issue("pack.recipe.dependency-missing", `${path}.dependencyRecipeIds[${dependencyIndex}]`, `Recipe ${recipe.id} depends on missing recipe ${dependencyId}.`));
      }
    });
  });
}

function validateMotifs(
  pack: KpEquationExtensionPack,
  diagnostics: KpEquationExtensionPackDiagnostic[]
): void {
  pack.motifs.entries.forEach((motif, index) => {
    const path = `$.motifs[${index}]`;
    if (pack.families.byId[motif.familyId] === undefined) {
      diagnostics.push(issue("pack.motif.family-missing", `${path}.familyId`, `Motif ${motif.id} references missing family ${motif.familyId}.`));
    }
    if (motif.schema.id !== motif.id || motif.schema.familyId !== motif.familyId) {
      diagnostics.push(issue("pack.motif.schema-mismatch", `${path}.schema`, `Motif ${motif.id} disagrees with its registered schema identity.`));
    }
    motif.schema.requiredRendererCapabilityIds.forEach((capabilityId, capabilityIndex) => {
      const capability = pack.rendererCapabilities.byId[capabilityId];
      const capabilityPath = `${path}.schema.requiredRendererCapabilityIds[${capabilityIndex}]`;
      if (capability === undefined) {
        diagnostics.push(issue("pack.motif.capability-missing", capabilityPath, `Motif ${motif.id} requires missing capability ${capabilityId}.`));
      } else if (!capability.motifIds.includes(motif.id)) {
        diagnostics.push(issue("pack.motif.capability-unclaimed", capabilityPath, `Capability ${capabilityId} does not claim motif ${motif.id}.`));
      }
    });
  });
}

function validateCapabilities(
  pack: KpEquationExtensionPack,
  diagnostics: KpEquationExtensionPackDiagnostic[]
): void {
  pack.rendererCapabilities.entries.forEach((capability, index) => {
    capability.motifIds.forEach((motifId, motifIndex) => {
      if (pack.motifs.byId[motifId] === undefined) {
        diagnostics.push(issue("pack.capability.motif-missing", `$.rendererCapabilities[${index}].motifIds[${motifIndex}]`, `Capability ${capability.id} references missing motif ${motifId}.`));
      }
    });
  });
}

function validateFamilies(
  pack: KpEquationExtensionPack,
  diagnostics: KpEquationExtensionPackDiagnostic[]
): void {
  pack.families.entries.forEach((family, index) => {
    const path = `$.families[${index}]`;
    if (!validDispositions.has(family.disposition)) {
      diagnostics.push(issue("pack.family.disposition-invalid", `${path}.disposition`, `Family ${family.id} has invalid disposition ${family.disposition}.`));
    }
    checkFamilyMembers(diagnostics, family.id, path, "operationKindIds", family.operationKindIds, pack.operations.byId);
    checkFamilyMembers(diagnostics, family.id, path, "recipeIds", family.recipeIds, pack.recipes.byId);
    checkFamilyMembers(diagnostics, family.id, path, "motifIds", family.motifIds, pack.motifs.byId);
    family.rendererCapabilityIds.forEach((capabilityId, capabilityIndex) => {
      if (pack.rendererCapabilities.byId[capabilityId] === undefined) {
        diagnostics.push(issue("pack.family.member-missing", `${path}.rendererCapabilityIds[${capabilityIndex}]`, `Family ${family.id} references missing renderer capability ${capabilityId}.`));
      }
    });
    const requiredCapabilityIds = new Set(family.motifIds.flatMap((motifId) =>
      pack.motifs.byId[motifId]?.schema.requiredRendererCapabilityIds ?? []
    ));
    for (const capabilityId of requiredCapabilityIds) {
      if (!family.rendererCapabilityIds.includes(capabilityId)) {
        diagnostics.push(issue("pack.family.member-unclaimed", `${path}.rendererCapabilityIds`, `Family ${family.id} does not claim required renderer capability ${capabilityId}.`));
      }
    }

    for (const [collectionName, entries, claimedIds] of [
      ["operationKindIds", pack.operations.entries, family.operationKindIds],
      ["recipeIds", pack.recipes.entries, family.recipeIds],
      ["motifIds", pack.motifs.entries, family.motifIds]
    ] as const) {
      entries.filter((entry) => entry.familyId === family.id).forEach((entry) => {
        if (!(claimedIds as readonly string[]).includes(entry.id)) {
          diagnostics.push(issue("pack.family.member-unclaimed", `${path}.${collectionName}`, `Family ${family.id} does not claim registered member ${entry.id}.`));
        }
      });
    }
  });
}

function checkFamilyMembers(
  diagnostics: KpEquationExtensionPackDiagnostic[],
  familyId: KpFamilyId,
  path: string,
  field: "operationKindIds" | "recipeIds" | "motifIds",
  ids: readonly string[],
  entries: Readonly<Record<string, { readonly id: string; readonly familyId: KpFamilyId }>>
): void {
  ids.forEach((id, memberIndex) => {
    const entry = entries[id];
    const memberPath = `${path}.${field}[${memberIndex}]`;
    if (entry === undefined) {
      diagnostics.push(issue("pack.family.member-missing", memberPath, `Family ${familyId} references missing member ${id}.`));
    } else if (entry.familyId !== familyId) {
      diagnostics.push(issue("pack.family.member-mismatch", memberPath, `Member ${id} belongs to ${entry.familyId}, not ${familyId}.`));
    }
  });
}

function containsRecipeCycle(pack: KpEquationExtensionPack): boolean {
  const indegree = new Map(pack.recipes.ids.map((id) => [id, 0]));
  const outgoing = new Map(pack.recipes.ids.map((id) => [
    id,
    [] as KpRecipeId[]
  ]));
  for (const recipe of pack.recipes.entries) {
    for (const dependencyId of recipe.dependencyRecipeIds) {
      if (!indegree.has(dependencyId)) continue;
      indegree.set(recipe.id, indegree.get(recipe.id)! + 1);
      outgoing.get(dependencyId)!.push(recipe.id);
    }
  }
  const ready = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;
  while (ready.length > 0) {
    const current = ready.shift()!;
    visited += 1;
    for (const target of outgoing.get(current)!) {
      const remaining = indegree.get(target)! - 1;
      indegree.set(target, remaining);
      if (remaining === 0) ready.push(target);
    }
  }
  return visited !== pack.recipes.entries.length;
}

function sameUniqueValues(left: readonly string[], right: readonly string[]): boolean {
  return new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.length === right.length &&
    left.every((value) => right.includes(value));
}

function issue(
  code: KpEquationExtensionPackDiagnosticCode,
  path: string,
  message: string
): KpEquationExtensionPackDiagnostic {
  return Object.freeze({ code, path, message });
}

function checkUniqueText(
  values: readonly string[],
  path: string,
  code: Extract<
    KpEquationExtensionPackDiagnosticCode,
    "pack.operation.semantic-authority" | "pack.recipe.causal-grammar"
  >,
  diagnostics: KpEquationExtensionPackDiagnostic[]
): void {
  if (
    values.some((value) => value.trim() === "") ||
    new Set(values).size !== values.length
  ) {
    diagnostics.push(issue(
      code,
      path,
      "Authority references must be non-empty and unique."
    ));
  }
}
