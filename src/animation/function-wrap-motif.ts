import { defineKpMotifSchema } from "../domain-ir/equation-motif-invocation.ts";
import {
  kpCanonicalEquationMotionVocabulary,
  type KpMotifId
} from "../domain-ir/equation-motion-vocabulary.ts";

export interface KpFunctionWrapMotionWindow {
  readonly start: number;
  readonly end: number;
}

export interface KpFunctionWrapMotionProfile {
  readonly materialTransit: KpFunctionWrapMotionWindow;
  readonly enclosureReception: KpFunctionWrapMotionWindow & {
    readonly initialScale: number;
  };
  readonly syntaxResolution: KpFunctionWrapMotionWindow;
}

export type KpFunctionWrapPhaseId =
  | "material-transit"
  | "enclosure-reception"
  | "syntax-resolution";

export interface KpFunctionWrapPhaseDefinition {
  readonly id: KpFunctionWrapPhaseId;
  readonly profileWindow:
    | "materialTransit"
    | "enclosureReception"
    | "syntaxResolution";
  readonly roleIds: readonly (
    | "argument"
    | "function"
    | "leading-enclosure"
    | "trailing-enclosure"
  )[];
}

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

const vocabulary = kpCanonicalEquationMotionVocabulary;

export const kpFunctionWrapMotifSchema = defineKpMotifSchema({
  id: vocabulary.motifs.functionWrapV1,
  familyId: vocabulary.families.structuralWrapV1,
  operationKinds: [vocabulary.operations.wrapFunctionV1],
  roles: [
    { id: "argument", cardinality: "one-or-more", materialKind: "continuant" },
    { id: "function", cardinality: "one-or-more", materialKind: "syntax" },
    { id: "leading-enclosure", cardinality: "zero-or-more", materialKind: "enclosure" },
    { id: "trailing-enclosure", cardinality: "zero-or-more", materialKind: "enclosure" }
  ],
  requiredRendererCapabilityIds: [
    vocabulary.rendererCapabilities.nativeKatexV1
  ]
});

/**
 * Function wrapping reads causally when material settles first, delimiters
 * receive it next, and the remaining operational syntax resolves last. The
 * windows overlap slightly so the target assembles continuously.
 */
export const kpCanonicalFunctionWrapMotionProfile = Object.freeze({
  materialTransit: Object.freeze({ start: 0, end: 0.4 }),
  enclosureReception: Object.freeze({
    start: 0.42,
    end: 0.7,
    initialScale: 1.18
  }),
  syntaxResolution: Object.freeze({ start: 0.5, end: 0.78 })
} satisfies KpFunctionWrapMotionProfile);

export const kpCanonicalFunctionWrapPhaseGrammar = Object.freeze([
  Object.freeze({
    id: "material-transit",
    profileWindow: "materialTransit",
    roleIds: Object.freeze(["argument"] as const)
  }),
  Object.freeze({
    id: "enclosure-reception",
    profileWindow: "enclosureReception",
    roleIds: Object.freeze([
      "leading-enclosure",
      "trailing-enclosure"
    ] as const)
  }),
  Object.freeze({
    id: "syntax-resolution",
    profileWindow: "syntaxResolution",
    roleIds: Object.freeze(["function"] as const)
  })
] as const satisfies readonly KpFunctionWrapPhaseDefinition[]);

/**
 * The plan names semantic roles only. Physical delimiter rectangles remain a
 * renderer-adapter responsibility, so the same motif can cross renderers.
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
    motifId: vocabulary.motifs.functionWrapV1,
    direction: input.direction,
    branches: Object.freeze(branches),
    synchronization: "all-enclosures-together" as const
  });
}

export function offsetKpFunctionWrapMotionWindow(
  window: KpFunctionWrapMotionWindow,
  offset: number
): KpFunctionWrapMotionWindow {
  if (!Number.isFinite(offset)) {
    throw new Error("Function-wrap motion offsets must be finite.");
  }
  const shifted = Object.freeze({
    start: window.start + offset,
    end: window.end + offset
  });
  if (shifted.start < 0 || shifted.end > 1) {
    throw new Error("Offset function-wrap motion windows must remain within unit progress.");
  }
  return shifted;
}

export const kpFunctionWrapMotifDefinition = Object.freeze({
  id: vocabulary.motifs.functionWrapV1,
  schema: kpFunctionWrapMotifSchema,
  phaseGrammar: kpCanonicalFunctionWrapPhaseGrammar,
  motionProfile: kpCanonicalFunctionWrapMotionProfile,
  createReceptionPlan: createKpFunctionWrapReceptionPlan
});

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} requires a non-empty id.`);
}

function requireUnique(values: readonly string[], label: string): void {
  for (const value of values) requireText(value, label);
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}
