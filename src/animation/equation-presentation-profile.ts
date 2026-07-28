import type {
  KpEquationCancellationPresentationRecipe
} from "./cancellation-presentation-contract.ts";
import type {
  KpBalancedBranchPresentationStrategy
} from "./equation-balanced-branch-scheduling.ts";

export const kpPresentationProfileSchemaVersion =
  "kp.presentation-profile.v1" as const;

export const kpEquationMotionPresentationRecipes = [
  "semantic-material-v2",
  "continuity-v1"
] as const;

export const kpEquationNativeHandoffRecipes = [
  "crossfade-v1",
  "atomic-v1"
] as const;

export const kpEquationCancellationPresentationRecipes = [
  "native-handoff-v1",
  "witnessed-annihilation-v1",
  "counter-orbit-v1"
] as const satisfies readonly KpEquationCancellationPresentationRecipe[];

export const kpEquationZeroWitnessPresentationRecipes = [
  "none",
  "embedded-v1",
  "independent-zero-v1"
] as const;

export const kpEquationSuccessorPresentationRecipes = [
  "native-handoff-v1",
  "successor-synthesis-v1",
  "convergence-v1",
  "counter-convergence-v1"
] as const;

export const kpEquationDepthPresentationRecipes = [
  "flat-v1",
  "semantic-depth-v1"
] as const;

export const kpEquationContinuantPresentationRecipes = [
  "concurrent-v1",
  "reserve-then-transit-v1",
  "transit-then-reflow-v1"
] as const;

export const kpEquationBranchPresentationStrategies = [
  "together",
  "sequential",
  "staggered",
  "stepped"
] as const satisfies readonly KpBalancedBranchPresentationStrategy[];

export type KpEquationMotionPresentationRecipe =
  typeof kpEquationMotionPresentationRecipes[number];
export type KpEquationNativeHandoffRecipe =
  typeof kpEquationNativeHandoffRecipes[number];
export type KpEquationZeroWitnessPresentationRecipe =
  typeof kpEquationZeroWitnessPresentationRecipes[number];
export type KpEquationSuccessorPresentationRecipe =
  typeof kpEquationSuccessorPresentationRecipes[number];
export type KpEquationDepthPresentationRecipe =
  typeof kpEquationDepthPresentationRecipes[number];
export type KpEquationContinuantPresentationRecipe =
  typeof kpEquationContinuantPresentationRecipes[number];

/**
 * Version 1 is deliberately closed. An extension must first become a named
 * union member with a validator here; generic metadata is not a profile seam.
 */
export type KpEquationPresentationProfileExtension = never;

export interface KpEquationPresentationDomainPayload {
  readonly kind: "equation-presentation";
  readonly motion: KpEquationMotionPresentationRecipe;
  readonly nativeHandoff: KpEquationNativeHandoffRecipe;
  readonly cancellation: KpEquationCancellationPresentationRecipe;
  readonly zeroWitness: KpEquationZeroWitnessPresentationRecipe;
  readonly successor: KpEquationSuccessorPresentationRecipe;
  readonly depth: KpEquationDepthPresentationRecipe;
  readonly continuants: KpEquationContinuantPresentationRecipe;
  readonly branchStrategy?: KpBalancedBranchPresentationStrategy | undefined;
}

export interface KpEquationPresentationProfileV1 {
  readonly schemaVersion: typeof kpPresentationProfileSchemaVersion;
  readonly domain: "equation";
  readonly payload: KpEquationPresentationDomainPayload;
  readonly extensions: readonly KpEquationPresentationProfileExtension[];
}

export interface KpEquationPresentationProfileIssue {
  readonly path: string;
  readonly code:
    | "profile.type"
    | "profile.schema"
    | "profile.domain"
    | "profile.recipe"
    | "profile.extension";
  readonly message: string;
}

export function createKpEquationPresentationProfileV1(input: {
  readonly payload: KpEquationPresentationDomainPayload;
  readonly extensions?: readonly KpEquationPresentationProfileExtension[] | undefined;
}): KpEquationPresentationProfileV1 {
  const candidate = {
    schemaVersion: kpPresentationProfileSchemaVersion,
    domain: "equation" as const,
    payload: input.payload,
    extensions: input.extensions ?? []
  };
  const issues = validateKpEquationPresentationProfileV1(candidate);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join(" "));
  }
  return Object.freeze({
    ...candidate,
    payload: Object.freeze({ ...input.payload }),
    extensions: Object.freeze([...candidate.extensions])
  });
}

export function createKpSemanticMaterialEquationPresentationProfileV1():
  KpEquationPresentationProfileV1 {
  return createKpEquationPresentationProfileV1({
    payload: {
      kind: "equation-presentation",
      motion: "semantic-material-v2",
      nativeHandoff: "crossfade-v1",
      cancellation: "witnessed-annihilation-v1",
      zeroWitness: "embedded-v1",
      successor: "successor-synthesis-v1",
      depth: "flat-v1",
      continuants: "concurrent-v1"
    }
  });
}

/**
 * Balanced solve exemplars need one indivisible presentation contract:
 * matched branches enter together and inverse terms counter-orbit. Keeping
 * these choices in one constructor prevents an asset from selecting the
 * semantic-material compositor while accidentally inheriting generic timing.
 */
export function createKpCanonicalBalancedSolveEquationPresentationProfileV1():
  KpEquationPresentationProfileV1 {
  return createKpEquationPresentationProfileV1({
    payload: {
      kind: "equation-presentation",
      motion: "semantic-material-v2",
      nativeHandoff: "crossfade-v1",
      cancellation: "counter-orbit-v1",
      zeroWitness: "none",
      successor: "successor-synthesis-v1",
      depth: "flat-v1",
      continuants: "concurrent-v1",
      branchStrategy: "together"
    }
  });
}

export function createKpContinuityEquationPresentationProfileV1(
  overrides: Partial<
    Omit<KpEquationPresentationDomainPayload, "kind" | "motion">
  > = {}
): KpEquationPresentationProfileV1 {
  return createKpEquationPresentationProfileV1({
    payload: {
      kind: "equation-presentation",
      motion: "continuity-v1",
      nativeHandoff: "crossfade-v1",
      cancellation: "native-handoff-v1",
      zeroWitness: "none",
      successor: "native-handoff-v1",
      depth: "flat-v1",
      continuants: "concurrent-v1",
      ...overrides
    }
  });
}

export function validateKpEquationPresentationProfileV1(
  value: unknown
): readonly KpEquationPresentationProfileIssue[] {
  if (!isRecord(value)) {
    return [issue("$", "profile.type", "Presentation profile must be an object.")];
  }
  const issues: KpEquationPresentationProfileIssue[] = [];
  if (value["schemaVersion"] !== kpPresentationProfileSchemaVersion) {
    issues.push(issue(
      "$.schemaVersion",
      "profile.schema",
      `Expected ${kpPresentationProfileSchemaVersion}.`
    ));
  }
  if (value["domain"] !== "equation") {
    issues.push(issue(
      "$.domain",
      "profile.domain",
      "Equation presentation profile domain must be equation."
    ));
  }
  validatePayload(value["payload"], issues);
  if (!Array.isArray(value["extensions"])) {
    issues.push(issue(
      "$.extensions",
      "profile.extension",
      "Presentation profile extensions must be an array."
    ));
  } else if (value["extensions"].length > 0) {
    issues.push(issue(
      "$.extensions",
      "profile.extension",
      "Presentation profile v1 has no registered typed extensions."
    ));
  }
  return Object.freeze(issues);
}

function validatePayload(
  value: unknown,
  issues: KpEquationPresentationProfileIssue[]
): void {
  if (!isRecord(value)) {
    issues.push(issue(
      "$.payload",
      "profile.type",
      "Equation presentation payload must be an object."
    ));
    return;
  }
  if (value["kind"] !== "equation-presentation") {
    issues.push(issue(
      "$.payload.kind",
      "profile.domain",
      "Equation presentation payload kind must be equation-presentation."
    ));
  }
  recipe(issues, value, "motion", kpEquationMotionPresentationRecipes);
  recipe(issues, value, "nativeHandoff", kpEquationNativeHandoffRecipes);
  recipe(
    issues,
    value,
    "cancellation",
    kpEquationCancellationPresentationRecipes
  );
  recipe(issues, value, "zeroWitness", kpEquationZeroWitnessPresentationRecipes);
  recipe(issues, value, "successor", kpEquationSuccessorPresentationRecipes);
  recipe(issues, value, "depth", kpEquationDepthPresentationRecipes);
  recipe(issues, value, "continuants", kpEquationContinuantPresentationRecipes);
  const branchStrategy = value["branchStrategy"];
  if (
    branchStrategy !== undefined &&
    !includes(kpEquationBranchPresentationStrategies, branchStrategy)
  ) {
    issues.push(issue(
      "$.payload.branchStrategy",
      "profile.recipe",
      `Unknown equation branch strategy ${String(branchStrategy)}.`
    ));
  }
}

function recipe(
  issues: KpEquationPresentationProfileIssue[],
  payload: Readonly<Record<string, unknown>>,
  key: string,
  allowed: readonly string[]
): void {
  const value = payload[key];
  if (!includes(allowed, value)) {
    issues.push(issue(
      `$.payload.${key}`,
      "profile.recipe",
      `Unknown equation presentation ${key} recipe ${String(value)}.`
    ));
  }
}

function includes(values: readonly string[], value: unknown): value is string {
  return typeof value === "string" && values.includes(value);
}

function issue(
  path: string,
  code: KpEquationPresentationProfileIssue["code"],
  message: string
): KpEquationPresentationProfileIssue {
  return { path, code, message };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
