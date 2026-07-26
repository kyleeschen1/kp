import {
  createKpGovernedCanonicalConstructionCohort
} from "./governed-canonical-construction-cohort.ts";
import type {
  KpCanonicalAnimationConstructionArtifact
} from "./canonical-animation-construction.ts";

export const kpGovernedCanonicalProjectionSchemaVersion =
  "kp.governed-canonical-projection-bundle.v1" as const;

export type KpGovernedCanonicalProjectionKind =
  | "static-js"
  | "headless"
  | "iframe"
  | "static-step";

export interface KpGovernedCanonicalInspectionCheckpoint {
  readonly id: string;
  readonly artifactId: string;
  readonly checkpointId: string;
  readonly progress: number;
}

export interface KpGovernedCanonicalProjectionTarget {
  readonly id: string;
  readonly kind: KpGovernedCanonicalProjectionKind;
  readonly delivery:
    | "interactive-browser"
    | "serialized-document"
    | "embedded-document"
    | "checkpoint-document";
  readonly entrypoint: string;
  readonly artifactIds: readonly string[];
  readonly checkpointIds: readonly string[];
}

export interface KpGovernedCanonicalProjectionBundle {
  readonly kind: "governed-canonical-projection-bundle";
  readonly schemaVersion: typeof kpGovernedCanonicalProjectionSchemaVersion;
  readonly id: "projection-bundle.governed-canonical-cohort.v1";
  readonly artifacts: readonly KpCanonicalAnimationConstructionArtifact[];
  readonly checkpoints: readonly KpGovernedCanonicalInspectionCheckpoint[];
  readonly targets: readonly KpGovernedCanonicalProjectionTarget[];
}

export interface KpGovernedCanonicalProjectionAuditIssue {
  readonly path: string;
  readonly key: string;
  readonly message: string;
}

const forbiddenRuntimeStateKeys = new Set([
  "animationframe",
  "baseline",
  "bounds",
  "clone",
  "clones",
  "computedstyle",
  "document",
  "dom",
  "element",
  "elements",
  "fontrevision",
  "glyph",
  "glyphs",
  "html",
  "keyframe",
  "keyframes",
  "materialplan",
  "motionplan",
  "nativeatom",
  "nativeatoms",
  "paint",
  "paintatom",
  "paintatoms",
  "rect",
  "renderer",
  "renderersession",
  "schedule",
  "sourceelement",
  "stylefingerprint",
  "targetelement",
  "viewportkey"
]);

/**
 * Backend records contain references only. Keeping the canonical artifacts in
 * one central set makes it structurally impossible for an output adapter to
 * carry a rewritten operation, lineage record, or checkpoint.
 */
export function projectKpGovernedCanonicalConstructionCohort():
  KpGovernedCanonicalProjectionBundle {
  const artifacts = Object.freeze(
    createKpGovernedCanonicalConstructionCohort().map(
      ({ compilation }) => compilation.construction
    )
  );
  const artifactIds = Object.freeze(artifacts.map(({ id }) => id));
  const rawCheckpoints = artifacts.flatMap((artifact) =>
    artifact.checkpoints.map((checkpoint) => ({
      artifactId: artifact.id,
      checkpointId: checkpoint.id
    }))
  );
  const checkpoints = Object.freeze(rawCheckpoints.map((checkpoint, index) =>
    Object.freeze({
      id: `inspection-checkpoint.${index}.${checkpoint.checkpointId}`,
      ...checkpoint,
      progress: rawCheckpoints.length === 1
        ? 1
        : index / (rawCheckpoints.length - 1)
    })
  ));
  const checkpointIds = Object.freeze(checkpoints.map(({ id }) => id));
  const target = (
    kind: KpGovernedCanonicalProjectionKind,
    delivery: KpGovernedCanonicalProjectionTarget["delivery"],
    entrypoint: string
  ): KpGovernedCanonicalProjectionTarget => Object.freeze({
    id: `projection-target.governed-canonical-cohort.${kind}`,
    kind,
    delivery,
    entrypoint,
    artifactIds,
    checkpointIds
  });
  return deepFreeze({
    kind: "governed-canonical-projection-bundle" as const,
    schemaVersion: kpGovernedCanonicalProjectionSchemaVersion,
    id: "projection-bundle.governed-canonical-cohort.v1" as const,
    artifacts,
    checkpoints,
    targets: [
      target(
        "static-js",
        "interactive-browser",
        "/glyph-reconciliation-experiment.html?reviewGallery=cohort"
      ),
      target("headless", "serialized-document", "application/json"),
      target(
        "iframe",
        "embedded-document",
        "/canonical-animation-review.html"
      ),
      target(
        "static-step",
        "checkpoint-document",
        "/canonical-animation-review.html?projection=static-step"
      )
    ]
  });
}

export function auditKpGovernedCanonicalProjectionBundle(
  bundle: KpGovernedCanonicalProjectionBundle
): readonly KpGovernedCanonicalProjectionAuditIssue[] {
  const issues: KpGovernedCanonicalProjectionAuditIssue[] = [];
  visit(bundle, "$", issues, new WeakSet<object>());
  return Object.freeze(issues);
}

export function serializeKpGovernedCanonicalProjectionBundle(
  bundle: KpGovernedCanonicalProjectionBundle
): string {
  const issues = auditKpGovernedCanonicalProjectionBundle(bundle);
  if (issues.length > 0) {
    throw new Error(`Projection bundle contains runtime state at ${issues[0]!.path}.`);
  }
  return JSON.stringify(bundle);
}

function visit(
  value: unknown,
  path: string,
  issues: KpGovernedCanonicalProjectionAuditIssue[],
  visited: WeakSet<object>
): void {
  if (value === null || typeof value !== "object" || visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => visit(child, `${path}[${index}]`, issues, visited));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenRuntimeStateKeys.has(normalize(key))) {
      issues.push(Object.freeze({
        path: `${path}.${key}`,
        key,
        message: `${key} is renderer-session or DOM state and cannot be exported.`
      }));
    }
    visit(child, `${path}.${key}`, issues, visited);
  }
}

function normalize(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
