import type {
  SelectorCorrespondenceRecord
} from "../semantic/correspondence.ts";
import type { VisualTokenLifecycle } from "../semantic/lifecycle.ts";

export type KatexVisualArtifactKind =
  | "fraction-bar"
  | "matrix-bracket"
  | "radical-glyph"
  | "accent";

export type VisualArtifactPhase =
  | "enter"
  | "exit"
  | "persist"
  | "replace";

export interface VisualArtifactLifecycleRecord {
  readonly id: string;
  readonly kind: KatexVisualArtifactKind;
  readonly phase: VisualArtifactPhase;
  readonly ownerSelectorId: string;
  readonly sourceArtifactIds: readonly string[];
  readonly targetArtifactIds: readonly string[];
  readonly sourceVisualLifecycle?: VisualTokenLifecycle | undefined;
  readonly targetVisualLifecycle?: VisualTokenLifecycle | undefined;
  readonly summary: string;
}

export interface VisualArtifactLifecycleSummary {
  readonly id: string;
  readonly kind: KatexVisualArtifactKind;
  readonly phase: VisualArtifactPhase;
  readonly sourceArtifactIds: readonly string[];
  readonly targetArtifactIds: readonly string[];
  readonly sourceVisualLifecycle?: VisualTokenLifecycle | undefined;
  readonly targetVisualLifecycle?: VisualTokenLifecycle | undefined;
}

export const katexVisualArtifactLifecycleRecords: readonly VisualArtifactLifecycleRecord[] = [
  {
    id: "artifact.fraction-bar.enter",
    kind: "fraction-bar",
    phase: "enter",
    ownerSelectorId: "fraction.make.inline-to-stacked",
    sourceArtifactIds: [],
    targetArtifactIds: [
      "fraction.make.inline-to-stacked.target.frac-line"
    ],
    targetVisualLifecycle: "enter",
    summary:
      "A stacked fraction introduces a fraction bar artifact owned by the fraction view."
  },
  {
    id: "artifact.matrix-bracket.replace-delimiter",
    kind: "matrix-bracket",
    phase: "replace",
    ownerSelectorId: "matrix.bracket.change-delimiter",
    sourceArtifactIds: [
      "matrix.bracket.change-delimiter.source.left-bracket",
      "matrix.bracket.change-delimiter.source.right-bracket"
    ],
    targetArtifactIds: [
      "matrix.bracket.change-delimiter.target.left-bracket",
      "matrix.bracket.change-delimiter.target.right-bracket"
    ],
    sourceVisualLifecycle: "exit",
    targetVisualLifecycle: "enter",
    summary:
      "Matrix delimiter artifacts are replaced while entry selector identity persists."
  },
  {
    id: "artifact.radical-glyph.enter",
    kind: "radical-glyph",
    phase: "enter",
    ownerSelectorId: "radical.rewrite-power-as-root",
    sourceArtifactIds: [],
    targetArtifactIds: [
      "radical.rewrite-power-as-root.target.hide-tail",
      "radical.rewrite-power-as-root.target.sqrt-line",
      "radical.rewrite-power-as-root.target.sqrt-glyph"
    ],
    targetVisualLifecycle: "enter",
    summary:
      "A radical rewrite introduces the radical glyph group and overbar artifacts."
  },
  {
    id: "artifact.accent.exit-overline",
    kind: "accent",
    phase: "exit",
    ownerSelectorId: "accent.strip-overline",
    sourceArtifactIds: ["accent.strip-overline.source.overline"],
    targetArtifactIds: [],
    sourceVisualLifecycle: "exit",
    summary:
      "Removing an overline exits the accent artifact while the annotated symbol can persist."
  }
];

export function summarizeVisualArtifactLifecycleRecord(
  record: VisualArtifactLifecycleRecord
): VisualArtifactLifecycleSummary {
  return {
    id: record.id,
    kind: record.kind,
    phase: record.phase,
    sourceArtifactIds: [...record.sourceArtifactIds],
    targetArtifactIds: [...record.targetArtifactIds],
    sourceVisualLifecycle: record.sourceVisualLifecycle,
    targetVisualLifecycle: record.targetVisualLifecycle
  };
}

export function visualArtifactRecordToCorrespondenceRecord(
  record: VisualArtifactLifecycleRecord
): SelectorCorrespondenceRecord {
  return {
    id: record.id,
    relation: "artifact",
    sourceSelectorIds: [...record.sourceArtifactIds],
    targetSelectorIds: [...record.targetArtifactIds],
    summary: record.summary
  };
}
