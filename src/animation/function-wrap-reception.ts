import {
  kpCanonicalEquationMotionVocabulary,
  type KpMotifId
} from "../domain-ir/equation-motion-vocabulary.ts";

export type KpFunctionWrapEnclosureSide = "leading" | "trailing";

export interface KpFunctionWrapEnclosureEntityRole {
  readonly entityId: string;
  readonly side: KpFunctionWrapEnclosureSide;
}

export type KpFunctionWrapEnclosureEntityRoles =
  | readonly []
  | readonly [
      KpFunctionWrapEnclosureEntityRole,
      KpFunctionWrapEnclosureEntityRole
    ];

export interface KpFunctionWrapReceptionBranch {
  readonly id: string;
  readonly argumentEntityIds: readonly string[];
  readonly syntaxEntityIds: readonly string[];
  readonly enclosureEntityRoles: KpFunctionWrapEnclosureEntityRoles;
}

export interface KpFunctionWrapReceptionPlan {
  readonly schemaVersion: "kp.function-wrap-reception.v1";
  readonly kind: "function-wrap-reception";
  readonly id: string;
  readonly motifId: KpMotifId;
  readonly direction: "forward" | "rewind";
  readonly branches: readonly KpFunctionWrapReceptionBranch[];
  readonly synchronization: "all-enclosures-together";
}

/**
 * This plan names semantic enclosure roles without owning KaTeX geometry.
 * Renderers can express the same wrapping act without inferring delimiters
 * from glyph text or incidental DOM order.
 */
export function createKpFunctionWrapReceptionPlan(input: {
  readonly id: string;
  readonly direction: "forward" | "rewind";
  readonly branches: readonly KpFunctionWrapReceptionBranch[];
}): KpFunctionWrapReceptionPlan {
  requireText(input.id, "Function-wrap reception plan");
  if (input.branches.length === 0) {
    throw new Error("Function-wrap reception requires at least one branch.");
  }
  requireUnique(input.branches.map(({ id }) => id), "function-wrap branch");
  const allEntityIds: string[] = [];
  const branches = input.branches.map((branch) => {
    requireText(branch.id, "Function-wrap reception branch");
    if (branch.argumentEntityIds.length === 0) {
      throw new Error(
        `Function-wrap reception branch ${branch.id} requires argument material.`
      );
    }
    requireUnique(branch.argumentEntityIds, `${branch.id} argument`);
    requireUnique(branch.syntaxEntityIds, `${branch.id} syntax`);
    if (branch.enclosureEntityRoles.length !== 0) {
      const [leading, trailing] = branch.enclosureEntityRoles;
      if (leading.side !== "leading" || trailing.side !== "trailing") {
        throw new Error(
          `Function-wrap reception branch ${branch.id} requires leading then trailing enclosure roles.`
        );
      }
      if (leading.entityId === trailing.entityId) {
        throw new Error(
          `Function-wrap reception branch ${branch.id} requires distinct enclosure entities.`
        );
      }
    }
    const wrapperIds = [
      ...branch.syntaxEntityIds,
      ...branch.enclosureEntityRoles.map(({ entityId }) => entityId)
    ];
    if (wrapperIds.length === 0) {
      throw new Error(
        `Function-wrap reception branch ${branch.id} requires wrapper material.`
      );
    }
    requireUnique(wrapperIds, `${branch.id} wrapper`);
    allEntityIds.push(...branch.argumentEntityIds, ...wrapperIds);
    return Object.freeze({
      id: branch.id,
      argumentEntityIds: Object.freeze([...branch.argumentEntityIds]),
      syntaxEntityIds: Object.freeze([...branch.syntaxEntityIds]),
      enclosureEntityRoles: Object.freeze(
        branch.enclosureEntityRoles.map((role) => Object.freeze({ ...role }))
      ) as KpFunctionWrapEnclosureEntityRoles
    });
  });
  requireUnique(allEntityIds, "function-wrap reception entity");
  return Object.freeze({
    schemaVersion: "kp.function-wrap-reception.v1" as const,
    kind: "function-wrap-reception" as const,
    id: input.id,
    motifId: kpCanonicalEquationMotionVocabulary.motifs.functionWrapV1,
    direction: input.direction,
    branches: Object.freeze(branches),
    synchronization: "all-enclosures-together" as const
  });
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} requires a non-empty id.`);
}

function requireUnique(values: readonly string[], label: string): void {
  for (const value of values) requireText(value, label);
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}
