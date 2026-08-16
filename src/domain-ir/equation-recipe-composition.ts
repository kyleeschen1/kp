import {
  isKpCompiledMotifPlan,
  type KpCompiledMotifPlan
} from "./equation-motif-invocation.ts";
import type {
  KpOperationKind,
  KpRecipeId
} from "./equation-motion-vocabulary.ts";

export interface KpEquationRecipePhase {
  readonly id: string;
  readonly motifPlan: KpCompiledMotifPlan;
  readonly spanWeight: number;
}

export type KpEquationRecipeDependency =
  | {
      readonly from: string;
      readonly to: string;
      readonly kind: "sequence";
    }
  | {
      readonly from: string;
      readonly to: string;
      readonly kind: "overlap";
      readonly overlapFraction: number;
    };

export interface KpEquationRecipeDefinition {
  readonly schemaVersion: "kp.equation-recipe.v1";
  readonly kind: "equation-recipe";
  readonly id: KpRecipeId;
  readonly operationKind: KpOperationKind;
  readonly phases: readonly KpEquationRecipePhase[];
  readonly dependencies: readonly KpEquationRecipeDependency[];
}

export type KpEquationRecipeDiagnosticCode =
  | "recipe.empty"
  | "recipe.phase.id"
  | "recipe.phase.duplicate"
  | "recipe.phase.span"
  | "recipe.phase.uncompiled-motif"
  | "recipe.invocation.duplicate"
  | "recipe.dependency.unknown-phase"
  | "recipe.dependency.self"
  | "recipe.dependency.duplicate"
  | "recipe.dependency.overlap"
  | "recipe.dependency.cycle";

export interface KpEquationRecipeDiagnostic {
  readonly code: KpEquationRecipeDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpCompiledEquationRecipePhase {
  readonly id: string;
  readonly motifPlan: KpCompiledMotifPlan;
  readonly startProgress: number;
  readonly endProgress: number;
}

declare const kpCompiledEquationRecipeAuthority: unique symbol;

export type KpCompiledEquationRecipe = Readonly<{
  schemaVersion: "kp.compiled-equation-recipe.v1";
  kind: "compiled-equation-recipe";
  id: KpRecipeId;
  operationKind: KpOperationKind;
  hostClock: "kp.shared-normalized-clock.v1";
  phases: readonly KpCompiledEquationRecipePhase[];
  dependencies: readonly KpEquationRecipeDependency[];
  [kpCompiledEquationRecipeAuthority]: true;
}>;

export type KpEquationRecipeCompilationResult =
  | {
      readonly status: "compiled";
      readonly recipe: KpCompiledEquationRecipe;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "invalid";
      readonly diagnostics: readonly KpEquationRecipeDiagnostic[];
    };

export interface KpEquationRecipePhaseSample {
  readonly phaseId: string;
  readonly invocationId: string;
  readonly state: "queued" | "active" | "settled";
  readonly localProgress: number;
}

export interface KpEquationRecipeSample {
  readonly recipeId: KpRecipeId;
  readonly hostProgress: number;
  readonly phases: readonly KpEquationRecipePhaseSample[];
}

const compiledRecipes = new WeakSet<object>();

export function defineKpEquationRecipe(input: {
  readonly id: KpRecipeId;
  readonly operationKind: KpOperationKind;
  readonly phases: readonly KpEquationRecipePhase[];
  readonly dependencies?: readonly KpEquationRecipeDependency[];
}): KpEquationRecipeDefinition {
  return Object.freeze({
    schemaVersion: "kp.equation-recipe.v1" as const,
    kind: "equation-recipe" as const,
    id: input.id,
    operationKind: input.operationKind,
    phases: Object.freeze(input.phases.map((phase) => Object.freeze({ ...phase }))),
    dependencies: Object.freeze(
      (input.dependencies ?? []).map((dependency) => Object.freeze({ ...dependency }))
    )
  });
}

export function compileKpEquationRecipe(
  definition: KpEquationRecipeDefinition
): KpEquationRecipeCompilationResult {
  const validation = validateRecipe(definition);
  if (validation.diagnostics.length > 0 || validation.order === undefined) {
    return Object.freeze({
      status: "invalid" as const,
      diagnostics: Object.freeze(validation.diagnostics)
    });
  }

  const phasesById = new Map(definition.phases.map((phase) => [phase.id, phase]));
  const scheduled = new Map<string, { readonly start: number; readonly end: number }>();
  for (const phaseId of validation.order) {
    const phase = phasesById.get(phaseId)!;
    const incoming = definition.dependencies.filter(({ to }) => to === phaseId);
    const start = incoming.length === 0
      ? 0
      : Math.max(...incoming.map((dependency) => {
          const predecessor = scheduled.get(dependency.from)!;
          if (dependency.kind === "sequence") return predecessor.end;
          const predecessorSpan = predecessor.end - predecessor.start;
          return predecessor.end - predecessorSpan * dependency.overlapFraction;
        }));
    scheduled.set(phaseId, { start, end: start + phase.spanWeight });
  }

  const totalSpan = Math.max(...[...scheduled.values()].map(({ end }) => end));
  const phases = validation.order.map((phaseId) => {
    const phase = phasesById.get(phaseId)!;
    const window = scheduled.get(phaseId)!;
    return Object.freeze({
      id: phase.id,
      motifPlan: phase.motifPlan,
      startProgress: window.start / totalSpan,
      endProgress: window.end / totalSpan
    });
  });
  const recipe = Object.freeze({
    schemaVersion: "kp.compiled-equation-recipe.v1" as const,
    kind: "compiled-equation-recipe" as const,
    id: definition.id,
    operationKind: definition.operationKind,
    hostClock: "kp.shared-normalized-clock.v1" as const,
    phases: Object.freeze(phases),
    dependencies: Object.freeze(definition.dependencies.map((dependency) =>
      Object.freeze({ ...dependency })
    ))
  }) as KpCompiledEquationRecipe;
  compiledRecipes.add(recipe);
  return Object.freeze({
    status: "compiled" as const,
    recipe,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpCompiledEquationRecipe(
  value: unknown
): value is KpCompiledEquationRecipe {
  return typeof value === "object" && value !== null && compiledRecipes.has(value);
}

export function sampleKpCompiledEquationRecipe(
  recipe: KpCompiledEquationRecipe,
  hostProgress: number
): KpEquationRecipeSample {
  if (!isKpCompiledEquationRecipe(recipe)) {
    throw new Error("Recipe sampling requires a compiler-minted recipe.");
  }
  if (!Number.isFinite(hostProgress)) {
    throw new Error("Recipe host progress must be finite.");
  }
  const progress = Math.max(0, Math.min(1, hostProgress));
  return Object.freeze({
    recipeId: recipe.id,
    hostProgress: progress,
    phases: Object.freeze(recipe.phases.map((phase) => {
      const span = phase.endProgress - phase.startProgress;
      const localProgress = Math.max(
        0,
        Math.min(1, (progress - phase.startProgress) / span)
      );
      const state = progress < phase.startProgress
        ? "queued"
        : progress >= phase.endProgress
          ? "settled"
          : "active";
      return Object.freeze({
        phaseId: phase.id,
        invocationId: phase.motifPlan.invocationId,
        state,
        localProgress
      });
    }))
  });
}

function validateRecipe(definition: KpEquationRecipeDefinition): {
  readonly diagnostics: KpEquationRecipeDiagnostic[];
  readonly order?: readonly string[];
} {
  const diagnostics: KpEquationRecipeDiagnostic[] = [];
  if (definition.phases.length === 0) {
    diagnostics.push(diagnostic("recipe.empty", "$.phases", "A recipe requires at least one phase."));
  }
  const phasesById = new Map<string, KpEquationRecipePhase>();
  const invocationOwners = new Map<string, string>();
  definition.phases.forEach((phase, index) => {
    const path = `$.phases[${index}]`;
    if (phase.id.trim() === "") {
      diagnostics.push(diagnostic("recipe.phase.id", `${path}.id`, "A recipe phase requires a non-empty id."));
    }
    if (phasesById.has(phase.id)) {
      diagnostics.push(diagnostic("recipe.phase.duplicate", `${path}.id`, `Phase ${phase.id} is duplicated.`));
    } else {
      phasesById.set(phase.id, phase);
    }
    if (!Number.isFinite(phase.spanWeight) || phase.spanWeight <= 0) {
      diagnostics.push(diagnostic("recipe.phase.span", `${path}.spanWeight`, "Phase span weight must be finite and greater than zero."));
    }
    if (!isKpCompiledMotifPlan(phase.motifPlan)) {
      diagnostics.push(diagnostic("recipe.phase.uncompiled-motif", `${path}.motifPlan`, "Recipe phases require compiler-minted motif plans."));
    } else {
      const prior = invocationOwners.get(phase.motifPlan.invocationId);
      if (prior !== undefined) {
        diagnostics.push(diagnostic("recipe.invocation.duplicate", `${path}.motifPlan`, `Motif invocation ${phase.motifPlan.invocationId} is already owned by ${prior}.`));
      } else {
        invocationOwners.set(phase.motifPlan.invocationId, phase.id);
      }
    }
  });

  const edgeKeys = new Set<string>();
  definition.dependencies.forEach((dependency, index) => {
    const path = `$.dependencies[${index}]`;
    if (!phasesById.has(dependency.from) || !phasesById.has(dependency.to)) {
      diagnostics.push(diagnostic("recipe.dependency.unknown-phase", path, `Dependency ${dependency.from} -> ${dependency.to} references an unknown phase.`));
    }
    if (dependency.from === dependency.to) {
      diagnostics.push(diagnostic("recipe.dependency.self", path, `Phase ${dependency.from} cannot depend on itself.`));
    }
    const edgeKey = `${dependency.from}\u0000${dependency.to}`;
    if (edgeKeys.has(edgeKey)) {
      diagnostics.push(diagnostic("recipe.dependency.duplicate", path, `Dependency ${dependency.from} -> ${dependency.to} is duplicated.`));
    } else {
      edgeKeys.add(edgeKey);
    }
    if (
      dependency.kind === "overlap" &&
      (!Number.isFinite(dependency.overlapFraction) ||
        dependency.overlapFraction <= 0 ||
        dependency.overlapFraction >= 1)
    ) {
      diagnostics.push(diagnostic("recipe.dependency.overlap", `${path}.overlapFraction`, "Overlap fraction must be greater than zero and less than one."));
    }
  });

  if (diagnostics.length > 0) return { diagnostics };
  const order = topologicalOrder(
    definition.phases.map(({ id }) => id),
    definition.dependencies
  );
  if (order === undefined) {
    diagnostics.push(diagnostic("recipe.dependency.cycle", "$.dependencies", "Recipe dependencies must form an acyclic graph."));
    return { diagnostics };
  }
  return { diagnostics, order };
}

function topologicalOrder(
  phaseIds: readonly string[],
  dependencies: readonly KpEquationRecipeDependency[]
): readonly string[] | undefined {
  const declarationOrder = new Map(phaseIds.map((id, index) => [id, index]));
  const indegree = new Map(phaseIds.map((id) => [id, 0]));
  const outgoing = new Map(phaseIds.map((id) => [id, [] as string[]]));
  for (const dependency of dependencies) {
    indegree.set(dependency.to, indegree.get(dependency.to)! + 1);
    outgoing.get(dependency.from)!.push(dependency.to);
  }
  const ready = phaseIds.filter((id) => indegree.get(id) === 0);
  const order: string[] = [];
  while (ready.length > 0) {
    ready.sort((left, right) => declarationOrder.get(left)! - declarationOrder.get(right)!);
    const current = ready.shift()!;
    order.push(current);
    for (const target of outgoing.get(current)!) {
      const remaining = indegree.get(target)! - 1;
      indegree.set(target, remaining);
      if (remaining === 0) ready.push(target);
    }
  }
  return order.length === phaseIds.length ? Object.freeze(order) : undefined;
}

function diagnostic(
  code: KpEquationRecipeDiagnosticCode,
  path: string,
  message: string
): KpEquationRecipeDiagnostic {
  return Object.freeze({ code, path, message });
}
