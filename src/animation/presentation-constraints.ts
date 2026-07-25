export type KpInteractivePresentationCapability =
  | "accessibility"
  | "annotation"
  | "branching"
  | "cloze"
  | "direct-seek"
  | "hover"
  | "responsive"
  | "rewind";

export interface KpAnimationPresentationConstraintsV1 {
  readonly schemaVersion: "kp.animation-presentation-constraints.v1";
  readonly lineageAuthority: "canonical-operation-executor";
  readonly glyphMatching: "within-semantic-lineage-only";
  readonly ambiguityPolicy: "group-settle-or-cut";
  readonly clearancePlanning: "measured-native-notation";
  readonly fallback: "semantic-checkpoint-settle";
  readonly maxPlannerOperations: number;
  readonly allowOperationSpecificScheduler: false;
  readonly requiredCapabilities: readonly KpInteractivePresentationCapability[];
  readonly backendPolicy: {
    readonly primary: "static-js";
    readonly capabilityMismatch: "preserve-lower-or-reject";
    readonly runtimeDependencies: "none";
  };
}

export interface CreateKpAnimationPresentationConstraintsV1Input {
  readonly requiredCapabilities: readonly KpInteractivePresentationCapability[];
  readonly maxPlannerOperations?: number | undefined;
}

const allowedConstraintKeys = new Set([
  "schemaVersion",
  "lineageAuthority",
  "glyphMatching",
  "ambiguityPolicy",
  "clearancePlanning",
  "fallback",
  "maxPlannerOperations",
  "allowOperationSpecificScheduler",
  "requiredCapabilities",
  "backendPolicy"
]);

const allowedBackendKeys = new Set([
  "primary",
  "capabilityMismatch",
  "runtimeDependencies"
]);

const knownCapabilities = new Set<KpInteractivePresentationCapability>([
  "accessibility",
  "annotation",
  "branching",
  "cloze",
  "direct-seek",
  "hover",
  "responsive",
  "rewind"
]);

export function createKpAnimationPresentationConstraintsV1(
  input: CreateKpAnimationPresentationConstraintsV1Input
): KpAnimationPresentationConstraintsV1 {
  const constraints: KpAnimationPresentationConstraintsV1 = {
    schemaVersion: "kp.animation-presentation-constraints.v1",
    lineageAuthority: "canonical-operation-executor",
    glyphMatching: "within-semantic-lineage-only",
    ambiguityPolicy: "group-settle-or-cut",
    clearancePlanning: "measured-native-notation",
    fallback: "semantic-checkpoint-settle",
    maxPlannerOperations: input.maxPlannerOperations ?? 10_000,
    allowOperationSpecificScheduler: false,
    requiredCapabilities: Object.freeze([...new Set(input.requiredCapabilities)]),
    backendPolicy: Object.freeze({
      primary: "static-js",
      capabilityMismatch: "preserve-lower-or-reject",
      runtimeDependencies: "none"
    })
  };
  const issues = validateKpAnimationPresentationConstraintsV1(constraints);
  if (issues.length > 0) {
    throw new Error(issues.join(" "));
  }
  return Object.freeze(constraints);
}

export function cloneKpAnimationPresentationConstraintsV1(
  constraints: KpAnimationPresentationConstraintsV1
): KpAnimationPresentationConstraintsV1 {
  return createKpAnimationPresentationConstraintsV1({
    requiredCapabilities: constraints.requiredCapabilities,
    maxPlannerOperations: constraints.maxPlannerOperations
  });
}

export function validateKpAnimationPresentationConstraintsV1(
  constraints: KpAnimationPresentationConstraintsV1
): readonly string[] {
  const issues: string[] = [];
  for (const key of Object.keys(constraints)) {
    if (!allowedConstraintKeys.has(key)) {
      issues.push(`Presentation constraints contain unsupported field ${key}.`);
    }
  }
  if (
    constraints.schemaVersion !==
    "kp.animation-presentation-constraints.v1"
  ) {
    issues.push("Presentation constraints require schema version 1.");
  }
  if (constraints.lineageAuthority !== "canonical-operation-executor") {
    issues.push("Canonical operation execution must own semantic lineage.");
  }
  if (constraints.glyphMatching !== "within-semantic-lineage-only") {
    issues.push("Glyph matching must remain inside semantic lineage.");
  }
  if (constraints.ambiguityPolicy !== "group-settle-or-cut") {
    issues.push("Ambiguous lineage must settle or cut at group scope.");
  }
  if (constraints.clearancePlanning !== "measured-native-notation") {
    issues.push("Clearance planning must use measured native notation.");
  }
  if (constraints.fallback !== "semantic-checkpoint-settle") {
    issues.push("Presentation fallback must retain semantic checkpoints.");
  }
  if (
    !Number.isInteger(constraints.maxPlannerOperations) ||
    constraints.maxPlannerOperations <= 0
  ) {
    issues.push("Planner operation budget must be a positive integer.");
  }
  if (constraints.allowOperationSpecificScheduler !== false) {
    issues.push("Operation-specific schedulers are forbidden.");
  }
  if (constraints.requiredCapabilities.length === 0) {
    issues.push("Presentation constraints require at least one capability.");
  }
  for (const capability of constraints.requiredCapabilities) {
    if (!knownCapabilities.has(capability)) {
      issues.push(`Unknown presentation capability ${String(capability)}.`);
    }
  }
  if (
    new Set(constraints.requiredCapabilities).size !==
    constraints.requiredCapabilities.length
  ) {
    issues.push("Presentation capabilities must be unique.");
  }
  for (const key of Object.keys(constraints.backendPolicy)) {
    if (!allowedBackendKeys.has(key)) {
      issues.push(`Backend policy contains unsupported field ${key}.`);
    }
  }
  if (
    constraints.backendPolicy.primary !== "static-js" ||
    constraints.backendPolicy.capabilityMismatch !==
      "preserve-lower-or-reject" ||
    constraints.backendPolicy.runtimeDependencies !== "none"
  ) {
    issues.push("Backend policy must preserve the static-JS publication boundary.");
  }
  return Object.freeze(issues);
}
