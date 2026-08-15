import {
  assertKpVerifiedSemanticMotionProvenance,
  type KpSemanticMotionProvenanceRecord,
  type KpVerifiedSemanticMotionProvenance
} from "./semantic-motion-correspondence-validator.ts";
import {
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerIssueCodeV1,
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1
} from "./semantic-motion-compiler-contract.ts";

export type KpSemanticMotionMaterialLifecycleKind =
  | "continuant"
  | "derived-successor"
  | "introduction"
  | "retirement"
  | "cancelation"
  | "presentation-artifact";

export interface KpSemanticMotionMaterialLifecycleRecord {
  readonly correspondenceRecordId: string;
  readonly lifecycle: KpSemanticMotionMaterialLifecycleKind;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly ownershipInvariant: "one-visible-entity-one-paint-owner";
}

export interface KpSemanticMotionInstructionalSalience {
  readonly primaryEntityIds: readonly string[];
  readonly secondaryEntityIds: readonly string[];
}

declare const kpSemanticMotionLifecycleAuthority: unique symbol;

export type KpVerifiedSemanticMotionLifecycle = Readonly<{
  kind: "verified-semantic-motion-lifecycle";
  requestId: string;
  provenance: KpVerifiedSemanticMotionProvenance;
  materialRecords: readonly KpSemanticMotionMaterialLifecycleRecord[];
  salience: KpSemanticMotionInstructionalSalience;
  [kpSemanticMotionLifecycleAuthority]: true;
}>;

export type KpSemanticMotionLifecycleCompileResult =
  | {
      readonly status: "verified";
      readonly lifecycle: KpVerifiedSemanticMotionLifecycle;
    }
  | KpSemanticMotionCompilerRepairRequiredV1;

export type KpSemanticMotionTracePhase = "source-native" | "transit" | "target-native";

export interface KpSemanticMotionPaintOwnerSample {
  readonly entityId: string;
  readonly ownerId: string;
}

export interface KpSemanticMotionMaterialTraceSample {
  readonly correspondenceRecordId: string;
  readonly presentEntityIds: readonly string[];
  readonly paintOwners: readonly KpSemanticMotionPaintOwnerSample[];
}

export interface KpSemanticMotionLifecycleTraceSample {
  readonly progress: number;
  readonly phase: KpSemanticMotionTracePhase;
  readonly material: readonly KpSemanticMotionMaterialTraceSample[];
  readonly salience: readonly {
    readonly entityId: string;
    readonly role: "primary" | "secondary" | "context";
  }[];
}

export interface KpSemanticMotionLifecycleTrace {
  readonly mode: "animated" | "reduced-motion";
  readonly samples: readonly KpSemanticMotionLifecycleTraceSample[];
}

export interface KpSemanticMotionLifecycleTraceIssue {
  readonly code: Extract<KpSemanticMotionCompilerIssueCodeV1,
    `semantic-motion.lifecycle.${string}`>;
  readonly path: string;
  readonly message: string;
}

const verifiedLifecycles = new WeakSet<object>();

export function compileKpSemanticMotionLifecycle(input: {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly provenance: KpVerifiedSemanticMotionProvenance;
}): KpSemanticMotionLifecycleCompileResult {
  assertKpVerifiedSemanticMotionProvenance(input.provenance);
  const { request, provenance } = input;
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];
  if (request.id !== provenance.requestId) {
    issues.push({
      code: "semantic-motion.lifecycle.authority-mismatch",
      path: "$",
      message: "Provenance authority does not belong to the lifecycle request."
    });
  }
  const endpointIds = new Set([
    ...request.sourceState.entityIds,
    ...request.targetState.entityIds
  ]);
  validateSalienceIds(
    request.teachingIntent.primaryEntityIds,
    "primaryEntityIds",
    endpointIds,
    issues
  );
  validateSalienceIds(
    request.teachingIntent.secondaryEntityIds,
    "secondaryEntityIds",
    endpointIds,
    issues
  );
  const primary = new Set(request.teachingIntent.primaryEntityIds);
  request.teachingIntent.secondaryEntityIds.forEach((entityId, index) => {
    if (primary.has(entityId)) {
      issues.push({
        code: "semantic-motion.lifecycle.salience-overlap",
        path: `$.teachingIntent.secondaryEntityIds[${index}]`,
        message: `Entity ${entityId} cannot be both primary and secondary salience.`
      });
    }
  });
  if (issues.length > 0) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues,
      repairTargets: [{ kind: "teaching-intent", targetId: request.id }]
    });
  }

  const lifecycle = Object.freeze({
    kind: "verified-semantic-motion-lifecycle" as const,
    requestId: request.id,
    provenance,
    materialRecords: Object.freeze(
      provenance.records
        .filter(({ relation }) => relation !== "focus")
        .map((record) => Object.freeze({
          correspondenceRecordId: record.correspondenceRecordId,
          lifecycle: lifecycleFor(record),
          sourceEntityIds: Object.freeze([...record.sourceEntityIds]),
          targetEntityIds: Object.freeze([...record.targetEntityIds]),
          ownershipInvariant: "one-visible-entity-one-paint-owner" as const
        }))
    ),
    salience: Object.freeze({
      primaryEntityIds: Object.freeze([...request.teachingIntent.primaryEntityIds]),
      secondaryEntityIds: Object.freeze([...request.teachingIntent.secondaryEntityIds])
    })
  }) as KpVerifiedSemanticMotionLifecycle;
  verifiedLifecycles.add(lifecycle);
  return { status: "verified", lifecycle };
}

export function isKpVerifiedSemanticMotionLifecycle(
  value: unknown
): value is KpVerifiedSemanticMotionLifecycle {
  return typeof value === "object" && value !== null && verifiedLifecycles.has(value);
}

export function validateKpSemanticMotionLifecycleTrace(input: {
  readonly lifecycle: KpVerifiedSemanticMotionLifecycle;
  readonly trace: KpSemanticMotionLifecycleTrace;
}): readonly KpSemanticMotionLifecycleTraceIssue[] {
  if (!isKpVerifiedSemanticMotionLifecycle(input.lifecycle)) {
    throw new Error("Lifecycle traces require original compiler-minted lifecycle authority.");
  }
  const { lifecycle, trace } = input;
  const issues: KpSemanticMotionLifecycleTraceIssue[] = [];
  findOpacityAuthority(trace).forEach((path) => issues.push({
    code: "semantic-motion.lifecycle.opacity-authority",
    path,
    message: "Opacity cannot encode semantic presence or paint ownership."
  }));
  if (trace.samples.length < 2) {
    issues.push(issue("trace-shape", "$.samples", "A lifecycle trace requires source and target samples."));
    return issues;
  }
  const phases: readonly KpSemanticMotionTracePhase[] = [
    "source-native",
    "transit",
    "target-native"
  ];
  trace.samples.forEach((sample, sampleIndex) => {
    const path = `$.samples[${sampleIndex}]`;
    if (
      !Number.isFinite(sample.progress) ||
      sample.progress < 0 ||
      sample.progress > 1 ||
      (sampleIndex > 0 && sample.progress < trace.samples[sampleIndex - 1]!.progress)
    ) {
      issues.push(issue("trace-shape", `${path}.progress`, "Trace progress must be finite, normalized, and monotonic."));
    }
    if (
      sampleIndex > 0 &&
      phases.indexOf(sample.phase) < phases.indexOf(trace.samples[sampleIndex - 1]!.phase)
    ) {
      issues.push(issue("phase-order", `${path}.phase`, "Semantic trace phases cannot run backward."));
    }
    validateMaterialSample(lifecycle, sample, sampleIndex, issues);
    validateSampleSalience(lifecycle, sample, sampleIndex, issues);
  });
  const first = trace.samples[0]!;
  const last = trace.samples.at(-1)!;
  if (first.phase !== "source-native" || first.progress !== 0) {
    issues.push(issue("endpoint", "$.samples[0]", "The first trace sample must be the exact native source endpoint."));
  }
  if (last.phase !== "target-native" || last.progress !== 1) {
    issues.push(issue("endpoint", `$.samples[${trace.samples.length - 1}]`, "The last trace sample must be the exact native target endpoint."));
  }
  if (
    trace.mode === "reduced-motion" &&
    (trace.samples.length !== 2 || trace.samples.some(({ phase }) => phase === "transit"))
  ) {
    issues.push(issue("trace-shape", "$.samples", "Reduced motion must expose only exact native source and target checkpoints."));
  }
  return Object.freeze(issues);
}

export function semanticMotionLifecycleFingerprint(
  trace: KpSemanticMotionLifecycleTrace
): string {
  return JSON.stringify(trace.samples.map((sample) => ({
    progress: sample.progress,
    phase: sample.phase,
    material: sample.material.map((entry) => ({
      correspondenceRecordId: entry.correspondenceRecordId,
      presentEntityIds: [...entry.presentEntityIds],
      paintOwners: entry.paintOwners.map((owner) => ({ ...owner }))
    }))
  })));
}

function validateMaterialSample(
  lifecycle: KpVerifiedSemanticMotionLifecycle,
  sample: KpSemanticMotionLifecycleTraceSample,
  sampleIndex: number,
  issues: KpSemanticMotionLifecycleTraceIssue[]
): void {
  const path = `$.samples[${sampleIndex}].material`;
  const records = new Map(sample.material.map((record) => [record.correspondenceRecordId, record] as const));
  if (records.size !== sample.material.length || records.size !== lifecycle.materialRecords.length) {
    issues.push(issue("trace-shape", path, "Every sample must contain each material lifecycle record exactly once."));
  }
  lifecycle.materialRecords.forEach((record) => {
    const sampled = records.get(record.correspondenceRecordId);
    if (sampled === undefined) return;
    const present = new Set(sampled.presentEntityIds);
    const expected = sample.phase === "source-native"
      ? record.sourceEntityIds
      : sample.phase === "target-native"
        ? record.targetEntityIds
        : undefined;
    if (expected !== undefined && !sameSet(present, new Set(expected))) {
      issues.push(issue(
        "endpoint",
        path,
        `${record.correspondenceRecordId} does not settle its exact ${sample.phase} entities.`
      ));
    }
    if (
      sample.phase === "transit" &&
      (record.lifecycle === "continuant" || record.lifecycle === "derived-successor") &&
      present.size === 0
    ) {
      issues.push(issue(
        "visibility-gap",
        path,
        `${record.correspondenceRecordId} loses all semantic material during transit.`
      ));
    }
    const ownerCounts = new Map<string, number>();
    sampled.paintOwners.forEach(({ entityId }) =>
      ownerCounts.set(entityId, (ownerCounts.get(entityId) ?? 0) + 1)
    );
    present.forEach((entityId) => {
      if (ownerCounts.get(entityId) !== 1) {
        issues.push(issue(
          "paint-owner",
          path,
          `Visible entity ${entityId} requires exactly one paint owner.`
        ));
      }
    });
    sampled.paintOwners.forEach(({ entityId }) => {
      if (!present.has(entityId)) {
        issues.push(issue(
          "paint-owner",
          path,
          `Paint owner cannot retain semantically absent entity ${entityId}.`
        ));
      }
    });
  });
}

function validateSampleSalience(
  lifecycle: KpVerifiedSemanticMotionLifecycle,
  sample: KpSemanticMotionLifecycleTraceSample,
  sampleIndex: number,
  issues: KpSemanticMotionLifecycleTraceIssue[]
): void {
  const allowed = new Set([
    ...lifecycle.provenance.endpointFrontier.sourceFrontierEntityIds,
    ...lifecycle.provenance.endpointFrontier.targetFrontierEntityIds,
    ...lifecycle.provenance.endpointFrontier.contextEntityIds
  ]);
  sample.salience.forEach(({ entityId }, index) => {
    if (!allowed.has(entityId)) {
      issues.push(issue(
        "salience-reference",
        `$.samples[${sampleIndex}].salience[${index}]`,
        `Salience references foreign semantic entity ${entityId}.`
      ));
    }
  });
}

function validateSalienceIds(
  entityIds: readonly string[],
  field: "primaryEntityIds" | "secondaryEntityIds",
  allowed: ReadonlySet<string>,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  const seen = new Set<string>();
  entityIds.forEach((entityId, index) => {
    if (!allowed.has(entityId) || seen.has(entityId)) {
      issues.push({
        code: "semantic-motion.lifecycle.salience-reference",
        path: `$.teachingIntent.${field}[${index}]`,
        message: !allowed.has(entityId)
          ? `Teaching intent references foreign entity ${entityId}.`
          : `Teaching intent repeats entity ${entityId}.`
      });
    }
    seen.add(entityId);
  });
}

function lifecycleFor(
  record: KpSemanticMotionProvenanceRecord
): KpSemanticMotionMaterialLifecycleKind {
  switch (record.relation) {
    case "identity":
    case "role-change":
      return "continuant";
    case "fan-in":
    case "fan-out":
      return "derived-successor";
    case "introduction":
      return "introduction";
    case "removal":
      return "retirement";
    case "cancelation":
      return "cancelation";
    case "artifact":
      return "presentation-artifact";
    case "focus":
      throw new Error("Instructional focus cannot become material lifecycle authority.");
  }
}

function findOpacityAuthority(value: unknown, path = "$"): readonly string[] {
  if (typeof value !== "object" || value === null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => findOpacityAuthority(child, `${path}[${index}]`));
  }
  return Object.entries(value).flatMap(([key, child]) => [
    ...(key.toLowerCase().includes("opacity") ? [`${path}.${key}`] : []),
    ...findOpacityAuthority(child, `${path}.${key}`)
  ]);
}

function issue(
  suffix: "trace-shape" | "phase-order" | "endpoint" | "visibility-gap" | "paint-owner" | "salience-reference",
  path: string,
  message: string
): KpSemanticMotionLifecycleTraceIssue {
  return { code: `semantic-motion.lifecycle.${suffix}`, path, message };
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}
