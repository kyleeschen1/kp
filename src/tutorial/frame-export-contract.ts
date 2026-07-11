import {
  createKpTutorialCardManifest,
  type KpTutorialCardManifest,
  type KpTutorialExportKind,
  type KpTutorialExportProfile
} from "./card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyPhase,
  type KpTutorialDependencyPlanPhase
} from "./dependency-planner.ts";
import { collectKpTutorialCapabilityPackageClosure } from "./capability-package-closure.ts";
import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact,
  type KpTutorialExportArtifactMetadataValue
} from "./export-artifact.ts";
import {
  sampleKpParentTimeline,
  type KpParentTimeline,
  type KpParentTimelineFrame
} from "./parent-timeline.ts";

export type KpTutorialMediaFrameExportKind = Extract<
  KpTutorialExportKind,
  "gif" | "video"
>;

export interface CreateKpTutorialParentTimelineFrameExportContractInput {
  readonly manifest: KpTutorialCardManifest;
  readonly parentTimeline: KpParentTimeline;
  readonly exportKind: KpTutorialMediaFrameExportKind;
  readonly frameCount: number;
}

export interface KpTutorialParentTimelineFrameExportContract {
  readonly id: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly timelineId: string;
  readonly exportKind: KpTutorialMediaFrameExportKind;
  readonly frameCount: number;
  readonly sampleSource: "parent-timeline";
  readonly rewindable: boolean;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly samplePoints: readonly KpTutorialParentTimelineFrameSamplePoint[];
  readonly rewindSamplePoints: readonly KpTutorialParentTimelineFrameSamplePoint[];
  readonly diagnostics: readonly KpTutorialParentTimelineFrameExportDiagnostic[];
}

export interface KpTutorialParentTimelineFrameSamplePoint {
  readonly id: string;
  readonly index: number;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly parentTimelineFrame: KpParentTimelineFrame;
}

export interface KpTutorialParentTimelineFrameExportDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function createKpTutorialParentTimelineFrameExportContract(
  input: CreateKpTutorialParentTimelineFrameExportContractInput
): KpTutorialParentTimelineFrameExportContract {
  assertPositiveFrameCount(input.frameCount);

  const manifest = createKpTutorialCardManifest(input.manifest);
  const profile = findMediaProfile(manifest, input.exportKind);
  const dependencyPhases = collectMediaDependencyPhases(manifest);
  const artifact = createFrameExportArtifact({
    manifest,
    parentTimeline: input.parentTimeline,
    profile,
    dependencyPhases,
    frameCount: input.frameCount
  });
  const samplePoints = createFrameSamplePoints(
    input.parentTimeline,
    input.frameCount
  );
  const diagnostics = validateParentTimelineForFrameExport(
    input.parentTimeline
  );

  return {
    id: `frame-export.${manifest.id}.${input.exportKind}`,
    manifestId: manifest.id,
    profileId: profile.id,
    timelineId: input.parentTimeline.id,
    exportKind: input.exportKind,
    frameCount: input.frameCount,
    sampleSource: "parent-timeline",
    rewindable: input.parentTimeline.reversible,
    artifact,
    samplePoints,
    // Rewind checks must sample the same immutable points in the opposite
    // order so direct seek, forward playback, and rewind can be compared.
    rewindSamplePoints: [...samplePoints].reverse(),
    diagnostics
  };
}

function assertPositiveFrameCount(frameCount: number): void {
  if (!Number.isInteger(frameCount) || frameCount <= 0) {
    throw new Error("Frame export frameCount must be a positive integer.");
  }
}

interface CreateFrameExportArtifactInput {
  readonly manifest: KpTutorialCardManifest;
  readonly parentTimeline: KpParentTimeline;
  readonly profile: KpTutorialExportProfile;
  readonly dependencyPhases: readonly KpTutorialDependencyPlanPhase[];
  readonly frameCount: number;
}

function createFrameExportArtifact(
  input: CreateFrameExportArtifactInput
): KpTutorialCardExportArtifact {
  const capabilityPackageClosure = collectKpTutorialCapabilityPackageClosure(
    input.dependencyPhases
  );

  return createKpTutorialCardExportArtifact({
    id: artifactIdForProfile(input.profile.id),
    manifestId: input.manifest.id,
    profileId: input.profile.id,
    exportKind: input.profile.kind,
    target: "media",
    artifactKind: "media-encoding",
    payloadKind: "metadata",
    status: "metadata",
    timelineIds: [input.parentTimeline.id],
    dependencies: {
      phases: input.dependencyPhases.map((phase) => phase.phase),
      capabilityKeys: unique(
        input.dependencyPhases.flatMap((phase) => phase.capabilityKeys)
      ),
      capabilityPackageIds: capabilityPackageClosure.packageIds,
      capabilityPackageKeys: capabilityPackageClosure.packageKeys,
      assetIds: unique(input.dependencyPhases.flatMap((phase) => phase.assetIds))
    },
    fallback: input.manifest.fallback,
    metadata: {
      ...cloneMetadataSettings(input.profile.settings),
      frameCount: input.frameCount,
      frameSampleSource: "parent-timeline",
      resolver: "parent-timeline-frame-export"
    }
  });
}

function createFrameSamplePoints(
  parentTimeline: KpParentTimeline,
  frameCount: number
): readonly KpTutorialParentTimelineFrameSamplePoint[] {
  return Array.from({ length: frameCount }, (_, index) => {
    const progress = frameProgress(index, frameCount);
    const parentTimelineFrame = sampleKpParentTimeline(parentTimeline, progress);

    return {
      id: `${frameIdPrefix(parentTimeline.id)}.${index
        .toString()
        .padStart(4, "0")}`,
      index,
      progress,
      beat: parentTimelineFrame.beat,
      elapsedMs: parentTimelineFrame.elapsedMs,
      parentTimelineFrame
    };
  });
}

function frameProgress(index: number, frameCount: number): number {
  if (frameCount === 1) {
    return 0;
  }

  return Number((index / (frameCount - 1)).toFixed(12));
}

function findMediaProfile(
  manifest: KpTutorialCardManifest,
  exportKind: KpTutorialMediaFrameExportKind
): KpTutorialExportProfile {
  const profile = manifest.exportProfiles.find(
    (candidate) => candidate.kind === exportKind && candidate.target === "media"
  );

  if (profile === undefined) {
    throw new Error(
      `Tutorial card ${manifest.id} does not define a media ${exportKind} export profile.`
    );
  }

  return profile;
}

function collectMediaDependencyPhases(
  manifest: KpTutorialCardManifest
): readonly KpTutorialDependencyPlanPhase[] {
  const mediaPhases: readonly KpTutorialDependencyPhase[] = [
    "critical",
    "interactive",
    "optional"
  ];
  const dependencyPlan = createKpTutorialCardDependencyPlan(manifest);

  return dependencyPlan.phases.filter((phase) =>
    mediaPhases.includes(phase.phase)
  );
}

function validateParentTimelineForFrameExport(
  parentTimeline: KpParentTimeline
): readonly KpTutorialParentTimelineFrameExportDiagnostic[] {
  const diagnostics: KpTutorialParentTimelineFrameExportDiagnostic[] = [];

  if (!parentTimeline.sampleable) {
    diagnostics.push({
      path: "parentTimeline.sampleable",
      message: "Frame export requires a sampleable parent timeline."
    });
  }

  if (!parentTimeline.reversible) {
    diagnostics.push({
      path: "parentTimeline.reversible",
      message: "Frame export rewind checks require a reversible parent timeline."
    });
  }

  return diagnostics;
}

function artifactIdForProfile(profileId: string): string {
  return profileId.startsWith("export.")
    ? `artifact.${profileId.slice("export.".length)}`
    : `artifact.${profileId}`;
}

function frameIdPrefix(timelineId: string): string {
  return `frame.${timelineId.replaceAll(".", "-")}`;
}

function cloneMetadataSettings(
  settings: KpTutorialExportProfile["settings"]
): Readonly<Record<string, KpTutorialExportArtifactMetadataValue>> {
  if (settings === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
