export interface KpCanonicalReaderPromotionCostEvidence {
  readonly schemaVersion: "kp.canonical-reader-promotion-cost.v1";
  readonly promotionId: string;
  readonly changedFiles: readonly string[];
  readonly addedLifecycleCategories: readonly string[];
  readonly addedSchedulerCategories: readonly string[];
  readonly notationSpecificGeometryFiles: readonly string[];
  readonly addedRuntimeArtifactIds: readonly string[];
}

export type KpCanonicalReaderPromotionCostIssueKind =
  | "unclassified-change"
  | "compositor-core-change"
  | "lifecycle-category"
  | "scheduler-category"
  | "notation-specific-geometry"
  | "runtime-artifact";

export interface KpCanonicalReaderPromotionCostIssue {
  readonly kind: KpCanonicalReaderPromotionCostIssueKind;
  readonly subject: string;
  readonly message: string;
}

const postKitAllowedFilePatterns = [
  /^content\/lessons\/[^/]+\.md$/,
  /^src\/reader\/compiler\/[^/]+(?:lesson|preservation-manifest)[^/]*\.ts$/,
  /^src\/architecture\/[^/]+promotion-certificate\.ts$/,
  /^src\/reader\/compiler\/public-api\.ts$/,
  /^src\/reader\/compiler\/reader-route-manifest\.ts$/,
  /^src\/reader\/app\/equation-lesson-descriptor\.ts$/,
  /^src\/reader\/app\/equation-lesson-descriptors\/[^/]+\.ts$/,
  /^src\/rendering\/[^/]+-selector-annotated-latex\.ts$/,
  /^tests\/[^/]+\.(?:test|browser\.spec)\.ts$/,
  /^tests\/type-fixtures\/[^/]+\.ts$/,
  /^scripts\/capture-[^/]+\.ts$/,
  /^docs\/project\//,
  /^docs\/theseus\//,
  /^package\.json$/
] as const;

export const kpCanonicalReaderPromotionProtectedCoreFiles = Object.freeze([
  "src/rendering/native-katex-glyph-compositor.ts",
  "src/rendering/native-katex-rendered-scene.ts",
  "src/rendering/native-katex-scene-compositor.ts",
  "src/reader/app/exemplar-entry.ts",
  "src/reader/app/reader-canonical-equation-session.ts",
  "src/reader/renderers/equation-scene-compositor-adapter.ts",
  "src/reader/renderers/equation-render-plan.ts",
  "src/reader/renderers/equation-material-plan.ts",
  "src/animation/choreography-lifecycle.ts",
  "src/animation/equation-motion-plan.ts"
]);

/**
 * This gate measures whether the promotion kit actually amortized platform
 * work. It intentionally rejects otherwise reasonable core edits: a failed
 * ratchet is evidence for another architectural decision, not permission to
 * relabel platform work as lesson wiring.
 */
export function evaluateKpCanonicalReaderPromotionCost(
  evidence: KpCanonicalReaderPromotionCostEvidence
): readonly KpCanonicalReaderPromotionCostIssue[] {
  if (evidence.schemaVersion !== "kp.canonical-reader-promotion-cost.v1") {
    throw new Error(
      `Unsupported canonical reader promotion cost ${evidence.schemaVersion}.`
    );
  }
  if (evidence.promotionId.trim() === "") {
    throw new Error("Canonical reader promotion evidence requires an id.");
  }
  const issues: KpCanonicalReaderPromotionCostIssue[] = [];
  for (const file of unique(evidence.changedFiles)) {
    if (kpCanonicalReaderPromotionProtectedCoreFiles.includes(file)) {
      issues.push(issue(
        "compositor-core-change",
        file,
        `${file} is protected canonical renderer or scheduling core.`
      ));
      continue;
    }
    if (!postKitAllowedFilePatterns.some((pattern) => pattern.test(file))) {
      issues.push(issue(
        "unclassified-change",
        file,
        `${file} is not lesson content, descriptor wiring, verification, or durable evidence.`
      ));
    }
  }
  appendCategoryIssues(
    issues,
    "lifecycle-category",
    evidence.addedLifecycleCategories
  );
  appendCategoryIssues(
    issues,
    "scheduler-category",
    evidence.addedSchedulerCategories
  );
  appendCategoryIssues(
    issues,
    "notation-specific-geometry",
    evidence.notationSpecificGeometryFiles
  );
  appendCategoryIssues(
    issues,
    "runtime-artifact",
    evidence.addedRuntimeArtifactIds
  );
  return Object.freeze(issues);
}

export function assertKpCanonicalReaderPromotionCost(
  evidence: KpCanonicalReaderPromotionCostEvidence
): void {
  const issues = evaluateKpCanonicalReaderPromotionCost(evidence);
  if (issues.length === 0) return;
  throw new Error(
    `Canonical reader promotion cost ratchet failed: ${
      issues.map(({ kind, subject }) => `${kind}:${subject}`).join(", ")
    }`
  );
}

function appendCategoryIssues(
  issues: KpCanonicalReaderPromotionCostIssue[],
  kind: Exclude<
    KpCanonicalReaderPromotionCostIssueKind,
    "unclassified-change" | "compositor-core-change"
  >,
  subjects: readonly string[]
): void {
  for (const subject of unique(subjects)) {
    issues.push(issue(
      kind,
      subject,
      `Post-kit promotion added forbidden ${kind} ${subject}.`
    ));
  }
}

function issue(
  kind: KpCanonicalReaderPromotionCostIssueKind,
  subject: string,
  message: string
): KpCanonicalReaderPromotionCostIssue {
  return Object.freeze({ kind, subject, message });
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
