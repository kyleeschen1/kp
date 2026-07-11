import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "./export-artifact.ts";

export interface KpTutorialStaticStepCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly beat: number;
  readonly timelineId: string;
  readonly summary?: string | undefined;
  readonly markers?: readonly KpTutorialStaticStepAuthoredMarker[] | undefined;
}

export type KpTutorialStaticStepAuthoredMarkerKind = "annotation" | "focus";

export interface KpTutorialStaticStepAuthoredMarker {
  readonly id: string;
  readonly kind: KpTutorialStaticStepAuthoredMarkerKind;
  readonly label: string;
  readonly targetId?: string | undefined;
  readonly summary?: string | undefined;
}

export interface KpTutorialCardStaticStepArtifact {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly checkpoints: readonly KpTutorialStaticStepCheckpoint[];
}

export interface KpTutorialStaticStepArtifactDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function createKpTutorialCardStaticStepArtifact(
  input: KpTutorialCardStaticStepArtifact
): KpTutorialCardStaticStepArtifact {
  return {
    artifact: createKpTutorialCardExportArtifact(input.artifact),
    checkpoints: input.checkpoints.map(cloneCheckpoint)
  };
}

export function validateKpTutorialCardStaticStepArtifact(
  input: KpTutorialCardStaticStepArtifact
): readonly KpTutorialStaticStepArtifactDiagnostic[] {
  const diagnostics: KpTutorialStaticStepArtifactDiagnostic[] = [];

  if (input.artifact.artifactKind !== "static-step-sequence") {
    diagnostics.push({
      path: "artifact.artifactKind",
      message:
        "Static-step artifact must use static-step-sequence artifactKind."
    });
  }

  if (input.artifact.payloadKind !== "json-document") {
    diagnostics.push({
      path: "artifact.payloadKind",
      message: "Static-step artifact must use json-document payloadKind."
    });
  }

  if (input.checkpoints.length === 0) {
    diagnostics.push({
      path: "checkpoints",
      message: "Static-step artifact must include at least one checkpoint."
    });
  }

  return diagnostics;
}

function cloneCheckpoint(
  checkpoint: KpTutorialStaticStepCheckpoint
): KpTutorialStaticStepCheckpoint {
  return {
    id: checkpoint.id,
    label: checkpoint.label,
    progress: checkpoint.progress,
    beat: checkpoint.beat,
    timelineId: checkpoint.timelineId,
    ...(checkpoint.summary === undefined
      ? {}
      : { summary: checkpoint.summary }),
    ...(checkpoint.markers === undefined
      ? {}
      : { markers: checkpoint.markers.map(cloneAuthoredMarker) })
  };
}

function cloneAuthoredMarker(
  marker: KpTutorialStaticStepAuthoredMarker
): KpTutorialStaticStepAuthoredMarker {
  return {
    id: marker.id,
    kind: marker.kind,
    label: marker.label,
    ...(marker.targetId === undefined ? {} : { targetId: marker.targetId }),
    ...(marker.summary === undefined ? {} : { summary: marker.summary })
  };
}
