import type {
  SelectorCorrespondenceRecord
} from "../semantic/correspondence.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";
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

export function checkKatexVisualArtifactFadeRules(
  records: readonly VisualArtifactLifecycleRecord[] =
    katexVisualArtifactLifecycleRecords
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  records.forEach((record) => {
    switch (record.phase) {
      case "enter":
        checkArtifactEndpoint({
          failures,
          record,
          field: "sourceArtifactIds",
          expectedEmpty: true
        });
        checkArtifactEndpoint({
          failures,
          record,
          field: "targetArtifactIds",
          expectedEmpty: false
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "sourceVisualLifecycle",
          expected: undefined
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "targetVisualLifecycle",
          expected: "enter"
        });
        break;
      case "exit":
        checkArtifactEndpoint({
          failures,
          record,
          field: "sourceArtifactIds",
          expectedEmpty: false
        });
        checkArtifactEndpoint({
          failures,
          record,
          field: "targetArtifactIds",
          expectedEmpty: true
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "sourceVisualLifecycle",
          expected: "exit"
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "targetVisualLifecycle",
          expected: undefined
        });
        break;
      case "replace":
        checkArtifactEndpoint({
          failures,
          record,
          field: "sourceArtifactIds",
          expectedEmpty: false
        });
        checkArtifactEndpoint({
          failures,
          record,
          field: "targetArtifactIds",
          expectedEmpty: false
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "sourceVisualLifecycle",
          expected: "exit"
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "targetVisualLifecycle",
          expected: "enter"
        });
        break;
      case "persist":
        checkArtifactEndpoint({
          failures,
          record,
          field: "sourceArtifactIds",
          expectedEmpty: false
        });
        checkArtifactEndpoint({
          failures,
          record,
          field: "targetArtifactIds",
          expectedEmpty: false
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "sourceVisualLifecycle",
          expected: "persist"
        });
        checkArtifactLifecycle({
          failures,
          record,
          field: "targetVisualLifecycle",
          expected: "persist"
        });
        break;
      default:
        assertNever(record.phase);
    }
  });

  return {
    lawId: "katex-visual-artifact.fade-rules",
    passed: failures.length === 0,
    failures
  };
}

export function checkKatexMatrixDelimiterArtifactContract(
  records: readonly VisualArtifactLifecycleRecord[] =
    katexVisualArtifactLifecycleRecords
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const record = records.find(
    (candidate) => candidate.id === "artifact.matrix-bracket.replace-delimiter"
  );

  if (record === undefined) {
    failures.push({
      path: "records[artifact.matrix-bracket.replace-delimiter]",
      message:
        "Matrix delimiter swaps must define a matrix bracket replacement artifact record."
    });
    return {
      lawId: "katex-matrix-delimiter.artifact-contract",
      passed: false,
      failures
    };
  }

  if (record.kind !== "matrix-bracket") {
    failures.push({
      path: `records[${record.id}].kind`,
      message:
        `Matrix delimiter artifact ${record.id} must use kind matrix-bracket.`
    });
  }

  if (record.phase !== "replace") {
    failures.push({
      path: `records[${record.id}].phase`,
      message:
        `Matrix delimiter artifact ${record.id} must replace delimiters rather than persist them.`
    });
  }

  checkArtifactCount({
    failures,
    record,
    field: "sourceArtifactIds",
    expectedCount: 2
  });
  checkArtifactCount({
    failures,
    record,
    field: "targetArtifactIds",
    expectedCount: 2
  });
  checkArtifactLifecycle({
    failures,
    record,
    field: "sourceVisualLifecycle",
    expected: "exit"
  });
  checkArtifactLifecycle({
    failures,
    record,
    field: "targetVisualLifecycle",
    expected: "enter"
  });

  return {
    lawId: "katex-matrix-delimiter.artifact-contract",
    passed: failures.length === 0,
    failures
  };
}

function checkArtifactEndpoint(input: {
  readonly failures: KpLawFailure[];
  readonly record: VisualArtifactLifecycleRecord;
  readonly field: "sourceArtifactIds" | "targetArtifactIds";
  readonly expectedEmpty: boolean;
}): void {
  const value = input.record[input.field];
  const empty = value.length === 0;

  if (empty === input.expectedEmpty) return;

  input.failures.push({
    path: `records[${input.record.id}].${input.field}`,
    message:
      `Visual artifact ${input.record.id} phase ${input.record.phase} expected ${input.field} to be ${input.expectedEmpty ? "empty" : "present"}.`
  });
}

function checkArtifactCount(input: {
  readonly failures: KpLawFailure[];
  readonly record: VisualArtifactLifecycleRecord;
  readonly field: "sourceArtifactIds" | "targetArtifactIds";
  readonly expectedCount: number;
}): void {
  const actualCount = input.record[input.field].length;

  if (actualCount === input.expectedCount) return;

  input.failures.push({
    path: `records[${input.record.id}].${input.field}`,
    message:
      `Visual artifact ${input.record.id} expected ${input.expectedCount} ${input.field} but received ${actualCount}.`
  });
}

function checkArtifactLifecycle(input: {
  readonly failures: KpLawFailure[];
  readonly record: VisualArtifactLifecycleRecord;
  readonly field: "sourceVisualLifecycle" | "targetVisualLifecycle";
  readonly expected: VisualTokenLifecycle | undefined;
}): void {
  const actual = input.record[input.field];

  if (actual === input.expected) return;

  input.failures.push({
    path: `records[${input.record.id}].${input.field}`,
    message:
      `Visual artifact ${input.record.id} phase ${input.record.phase} expected ${input.field} ${formatLifecycle(input.expected)} but received ${formatLifecycle(actual)}.`
  });
}

function formatLifecycle(
  lifecycle: VisualTokenLifecycle | undefined
): string {
  return lifecycle ?? "undefined";
}

function assertNever(value: never): never {
  throw new Error(`Unhandled visual artifact phase: ${value}`);
}
