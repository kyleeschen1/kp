import type {
  KpTutorialCardManifest
} from "./card-manifest.ts";
import type {
  KpTutorialDependencyPhase
} from "./dependency-planner.ts";
import type {
  KpTutorialExportArtifactPayloadKind
} from "./export-artifact.ts";
import {
  validateKpTutorialExportDependencyClosure,
  type KpTutorialExportDependencyClosureDiagnostic
} from "./export-dependency-closure.ts";
import type {
  KpTutorialFrameSequenceArtifact,
  KpTutorialFrameSequenceDomain
} from "./frame-sequence-artifact.ts";

export interface CreateKpTutorialFrameSequenceDependencyManifestInput {
  readonly sequence: KpTutorialFrameSequenceArtifact;
  readonly tutorialManifest?: KpTutorialCardManifest | undefined;
}

export interface KpTutorialFrameSequenceDependencyManifest {
  readonly artifactId: string;
  readonly sourceArtifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly payloadKind: KpTutorialExportArtifactPayloadKind;
  readonly timelineIds: readonly string[];
  readonly frameCount: number;
  readonly domains: readonly KpTutorialFrameSequenceDomain[];
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly capabilityKeys: readonly string[];
  readonly capabilityPackageIds: readonly string[];
  readonly capabilityPackageKeys: readonly string[];
  readonly assetIds: readonly string[];
  readonly previewRenderer: "renderKpTutorialFrameSequencePreviewHtml";
  readonly diagnostics: readonly KpTutorialExportDependencyClosureDiagnostic[];
}

export function createKpTutorialFrameSequenceDependencyManifest(
  input: CreateKpTutorialFrameSequenceDependencyManifestInput
): KpTutorialFrameSequenceDependencyManifest {
  const { sequence } = input;
  const artifact = sequence.artifact;

  return {
    artifactId: artifact.id,
    sourceArtifactId: sourceArtifactId(sequence),
    manifestId: artifact.manifestId,
    profileId: artifact.profileId,
    payloadKind: artifact.payloadKind,
    timelineIds: [...artifact.timelineIds],
    frameCount: sequence.frameCount,
    domains: [...sequence.domains],
    dependencyPhases: [...artifact.dependencies.phases],
    capabilityKeys: [...artifact.dependencies.capabilityKeys],
    capabilityPackageIds: [
      ...(artifact.dependencies.capabilityPackageIds ?? [])
    ],
    capabilityPackageKeys: [
      ...(artifact.dependencies.capabilityPackageKeys ?? [])
    ],
    assetIds: [...artifact.dependencies.assetIds],
    previewRenderer: "renderKpTutorialFrameSequencePreviewHtml",
    diagnostics:
      input.tutorialManifest === undefined
        ? []
        : validateKpTutorialExportDependencyClosure({
            artifact,
            manifest: input.tutorialManifest
          })
  };
}

function sourceArtifactId(sequence: KpTutorialFrameSequenceArtifact): string {
  const sourceArtifactId = sequence.artifact.metadata?.["sourceArtifactId"];

  return typeof sourceArtifactId === "string" ? sourceArtifactId : "";
}
