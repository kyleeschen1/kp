export type KpMotionFieldPurpose =
  | "continuant-reflow"
  | "meaningful-transform"
  | "representational-succession"
  | "semantic-branch";

export type KpSceneRegion =
  | "upper-left"
  | "upper-right"
  | "center"
  | "lower-left"
  | "lower-right";

export type KpMotionFieldPathFamily =
  | "shortest-curvature"
  | "diagonal-arc"
  | "opposite-corner"
  | "mirrored-branch-arcs";

export type KpMotionFieldPathCandidate =
  | "direct"
  | "above"
  | "below"
  | "left"
  | "right"
  | "opposite-corner";

export interface KpMotionFieldCohesion {
  readonly anchorEntityIds: readonly string[];
  readonly maximumSeparation: number;
  readonly maximumStaggerSpan: number;
  readonly preserveTokenOrder: boolean;
  readonly maximumCrossings: number;
  readonly minimumVisibleMaterial: number;
  readonly exactTargetRegrouping: true;
}

export interface KpMotionFieldIntent {
  readonly id: string;
  readonly groupEntityIds: readonly string[];
  readonly purpose: KpMotionFieldPurpose;
  readonly sourceRegion: KpSceneRegion;
  readonly targetRegion: KpSceneRegion;
  readonly readingDirection: "left-to-right" | "right-to-left";
  readonly traversalDirection?: "forward" | "reverse" | "symmetric" | undefined;
  readonly requiredPathFamily?: KpMotionFieldPathFamily | undefined;
  readonly cohesion: KpMotionFieldCohesion;
}

export interface KpMotionFieldPlan {
  readonly id: string;
  readonly kind: "motion-field-plan";
  readonly groupEntityIds: readonly string[];
  readonly dominantDirection:
    | "horizontal"
    | "vertical"
    | "diagonal"
    | "convergent"
    | "divergent";
  readonly curvatureFamily: KpMotionFieldPathFamily;
  readonly reconciliationRegion:
    | "target"
    | "target-leading-edge"
    | "target-opposite-corner"
    | "shared-branch-region";
  readonly branchSymmetry: "none" | "mirrored";
  readonly depthPlane: "baseline" | "foreground";
  readonly pathCandidates: readonly KpMotionFieldPathCandidate[];
  readonly cohesion: KpMotionFieldCohesion;
}

export interface KpMotionFieldIssue {
  readonly path: string;
  readonly message: string;
}

export function planKpMotionField(
  intent: KpMotionFieldIntent
): KpMotionFieldPlan {
  const issues = validateKpMotionFieldIntent(intent);
  if (issues.length > 0) throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  const defaultFamily = pathFamilyForPurpose(intent.purpose);
  const curvatureFamily = intent.requiredPathFamily ?? defaultFamily;
  return {
    id: `${intent.id}.field`,
    kind: "motion-field-plan",
    groupEntityIds: [...intent.groupEntityIds],
    dominantDirection: dominantDirection(intent),
    curvatureFamily,
    reconciliationRegion: reconciliationRegion(intent.purpose),
    branchSymmetry: intent.purpose === "semantic-branch" ? "mirrored" : "none",
    depthPlane:
      intent.purpose === "continuant-reflow" ? "baseline" : "foreground",
    pathCandidates: pathCandidates(curvatureFamily, intent),
    cohesion: {
      ...intent.cohesion,
      anchorEntityIds: [...intent.cohesion.anchorEntityIds]
    }
  };
}

export function validateKpMotionFieldIntent(
  intent: KpMotionFieldIntent
): readonly KpMotionFieldIssue[] {
  const issues: KpMotionFieldIssue[] = [];
  if (intent.groupEntityIds.length === 0) issue("groupEntityIds", "Motion fields require a semantic group.", issues);
  if (intent.cohesion.anchorEntityIds.length === 0) issue("cohesion.anchorEntityIds", "Motion fields require at least one anchor entity.", issues);
  intent.cohesion.anchorEntityIds.forEach((id) => {
    if (!intent.groupEntityIds.includes(id)) {
      issue("cohesion.anchorEntityIds", `Motion-field anchor ${id} is outside the group.`, issues);
    }
  });
  requireUnit(intent.cohesion.maximumSeparation, "cohesion.maximumSeparation", issues);
  requireUnit(intent.cohesion.maximumStaggerSpan, "cohesion.maximumStaggerSpan", issues);
  requireUnit(intent.cohesion.minimumVisibleMaterial, "cohesion.minimumVisibleMaterial", issues);
  if (!Number.isInteger(intent.cohesion.maximumCrossings) || intent.cohesion.maximumCrossings < 0) {
    issue("cohesion.maximumCrossings", "Maximum crossings must be a nonnegative integer.", issues);
  }
  rejectArbitraryRouting(intent, issues);
  return issues;
}

function pathFamilyForPurpose(purpose: KpMotionFieldPurpose): KpMotionFieldPathFamily {
  switch (purpose) {
    case "continuant-reflow": return "shortest-curvature";
    case "meaningful-transform": return "diagonal-arc";
    case "representational-succession": return "opposite-corner";
    case "semantic-branch": return "mirrored-branch-arcs";
  }
}

function dominantDirection(intent: KpMotionFieldIntent): KpMotionFieldPlan["dominantDirection"] {
  if (intent.purpose === "semantic-branch") return "divergent";
  if (intent.purpose === "representational-succession") return "convergent";
  const sourceColumn = intent.sourceRegion.endsWith("left") ? -1 : intent.sourceRegion.endsWith("right") ? 1 : 0;
  const targetColumn = intent.targetRegion.endsWith("left") ? -1 : intent.targetRegion.endsWith("right") ? 1 : 0;
  const sourceRow = intent.sourceRegion.startsWith("upper") ? -1 : intent.sourceRegion.startsWith("lower") ? 1 : 0;
  const targetRow = intent.targetRegion.startsWith("upper") ? -1 : intent.targetRegion.startsWith("lower") ? 1 : 0;
  const horizontal = sourceColumn !== targetColumn;
  const vertical = sourceRow !== targetRow;
  return horizontal && vertical ? "diagonal" : vertical ? "vertical" : "horizontal";
}

function reconciliationRegion(
  purpose: KpMotionFieldPurpose
): KpMotionFieldPlan["reconciliationRegion"] {
  if (purpose === "representational-succession") return "target-opposite-corner";
  if (purpose === "semantic-branch") return "shared-branch-region";
  if (purpose === "meaningful-transform") return "target-leading-edge";
  return "target";
}

function pathCandidates(
  family: KpMotionFieldPathFamily,
  intent: KpMotionFieldIntent
): readonly KpMotionFieldPathCandidate[] {
  switch (family) {
    case "shortest-curvature":
      return intent.readingDirection === "left-to-right"
        ? ["direct", "above", "below"]
        : ["direct", "below", "above"];
    case "diagonal-arc":
      return intent.readingDirection === "left-to-right"
        ? ["above", "below", "direct"]
        : ["below", "above", "direct"];
    case "opposite-corner":
      return ["opposite-corner", "above", "below", "direct"];
    case "mirrored-branch-arcs":
      return ["above", "below"];
  }
}

function rejectArbitraryRouting(
  value: unknown,
  issues: KpMotionFieldIssue[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectArbitraryRouting(item, issues, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    if (/^(controlPoints?|waypoints?|routeNodes?|coordinates?|x|y|z)$/i.test(key)) {
      issue(`${path}.${key}`, `Arbitrary motion-field routing field ${key} is not allowed.`, issues);
    }
    rejectArbitraryRouting(child, issues, `${path}.${key}`);
  });
}

function requireUnit(value: number, path: string, issues: KpMotionFieldIssue[]): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    issue(path, "Expected a normalized value between 0 and 1.", issues);
  }
}

function issue(path: string, message: string, issues: KpMotionFieldIssue[]): void {
  issues.push({ path, message });
}
