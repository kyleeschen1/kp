import {
  createKpEconomicsDemandShiftAnimationCapability
} from "./economics-demand-shift-animation-capability.ts";
import {
  kpEconomicsDemandShiftCheckpoints
} from "./economics-demand-shift-checkpoints.ts";
import type {
  KpEconomicsCodeMirrorCompletion
} from "./economics-demand-shift-codemirror-runtime.ts";
import type {
  KpEconomicsLessonBuffer
} from "./economics-demand-shift-lesson-buffer.ts";
import {
  kpEconomicsMotionBlocks
} from "./economics-demand-shift-motion-blocks.ts";
import {
  compileKpEconomicsDemandShiftSemanticTransitExemplar
} from "./economics-demand-shift-semantic-transit-exemplar.ts";

export type KpEconomicsSemanticIndexEntryKind =
  | "lesson"
  | "motion-passage"
  | "stage"
  | "passage"
  | "motion-block"
  | "checkpoint"
  | "animation"
  | "stage-object"
  | "semantic-reference"
  | "semantic-transit"
  | "vignette";

export interface KpEconomicsSemanticIndexEntry {
  readonly id: string;
  readonly kind: KpEconomicsSemanticIndexEntryKind;
  readonly label: string;
  readonly detail: string;
}

export interface KpEconomicsSemanticIndexDiagnostic {
  readonly code: "KP_UNKNOWN_REFERENCE";
  readonly message: string;
  readonly from: number;
  readonly to: number;
  readonly id: string;
}

export interface KpEconomicsLessonSemanticIndex {
  readonly entries: readonly KpEconomicsSemanticIndexEntry[];
  readonly completions: readonly KpEconomicsCodeMirrorCompletion[];
  readonly vignetteIds: readonly string[];
  readonly diagnose: (
    source: string
  ) => readonly KpEconomicsSemanticIndexDiagnostic[];
}

/**
 * Builds completion from the actual lesson registries. It is editor-only and
 * must remain behind the lazy CodeMirror boundary; public readers never need
 * a repository search index.
 */
export function createKpEconomicsLessonSemanticIndex(
  buffer: KpEconomicsLessonBuffer
): KpEconomicsLessonSemanticIndex {
  assertRepositoryBindings(buffer);
  const passageIds = buffer.passages.map(({ id }) => id);
  const semantic =
    compileKpEconomicsDemandShiftSemanticTransitExemplar(passageIds);
  const capability = createKpEconomicsDemandShiftAnimationCapability();
  const entries: KpEconomicsSemanticIndexEntry[] = [
    entry(buffer.lesson.id, "lesson", buffer.lesson.title, "lesson document"),
    ...buffer.motionPassages.map((record) => entry(
      record.id,
      "motion-passage",
      record.id,
      `motion passage → stage ${record.stageId}`
    )),
    ...buffer.stages.map((record) => entry(
      record.id,
      "stage",
      record.id,
      `stage → ${record.assetId}`
    )),
    ...buffer.passages.map((record) => entry(
      record.id,
      "passage",
      record.id,
      `${record.role} passage → ${record.motionPassageId}`
    )),
    ...kpEconomicsMotionBlocks.map((record) => entry(
      record.id,
      "motion-block",
      record.label,
      `motion block → passage ${record.passageId}`
    )),
    ...kpEconomicsMotionBlocks.flatMap((block) => block.checkpoints.map(
      (checkpoint) => entry(
        checkpoint.id,
        "checkpoint",
        checkpoint.label,
        `checkpoint ${checkpoint.progress} → motion block ${block.id}`
      )
    )),
    ...kpEconomicsDemandShiftCheckpoints.map((checkpoint) => entry(
      checkpoint.id,
      "checkpoint",
      checkpoint.label,
      `lesson checkpoint → passage ${checkpoint.passageId}`
    )),
    entry(
      capability.entry.animationId,
      "animation",
      capability.entry.title,
      capability.entry.summary
    ),
    ...semantic.stageObjects.map((record) => entry(
      record.id,
      "stage-object",
      record.id,
      `stage object → ${record.stageId}`
    )),
    ...semantic.textReferences.map((record) => {
      const transit = semantic.transits.find(
        ({ sourceReferenceId }) => sourceReferenceId === record.id
      );
      return entry(
        record.id,
        "semantic-reference",
        record.id,
        `text reference → ${transit?.destinationObjectId ?? record.passageId}`
      );
    }),
    ...semantic.transits.map((record) => entry(
      record.id,
      "semantic-transit",
      record.id,
      `${record.sourceReferenceId} → ${record.destinationObjectId}`
    ))
  ];
  const uniqueEntries = uniqueEntriesByKind(entries);
  const semanticReferenceEntries = uniqueEntries.filter(
    ({ kind }) => kind === "semantic-reference"
  );
  const completions: KpEconomicsCodeMirrorCompletion[] = [
    ...semanticReferenceEntries.map((record) => Object.freeze({
      label: record.id,
      apply: record.id,
      detail: record.detail,
      info: `Insert as [$label](kp-ref:${record.id}).`,
      contexts: Object.freeze(["kp-ref" as const])
    })),
    ...uniqueEntries.map((record) => Object.freeze({
      label: record.id,
      apply: record.id,
      detail: `${record.kind} · ${record.detail}`,
      contexts: Object.freeze(["semantic-id" as const])
    })),
    ...directiveCompletions(buffer)
  ];
  const knownReferences = new Set(semanticReferenceEntries.map(({ id }) => id));
  return Object.freeze({
    entries: uniqueEntries,
    completions: Object.freeze(completions),
    // Shared vignette authoring remains deferred. An empty repository result
    // is safer than presenting animation or passage IDs as fictitious vignettes.
    vignetteIds: Object.freeze([]),
    diagnose: (source: string) => diagnoseReferences(source, knownReferences)
  });
}

function assertRepositoryBindings(buffer: KpEconomicsLessonBuffer): void {
  const registeredBlocks = new Map(kpEconomicsMotionBlocks.map((block) => [
    block.id,
    block.passageId
  ]));
  for (const block of buffer.motionBlocks) {
    if (registeredBlocks.get(block.id) !== block.passageId) {
      throw new Error(
        `Motion block ${block.id} is stale or foreign to the economics repository.`
      );
    }
  }
  if (buffer.motionBlocks.length !== registeredBlocks.size) {
    throw new Error("The lesson buffer does not cover every economics motion block.");
  }
  const semantic = compileKpEconomicsDemandShiftSemanticTransitExemplar(
    buffer.passages.map(({ id }) => id)
  );
  const expectedReferences = new Map(semantic.textReferences.map((reference) => {
    const transit = semantic.transits.find(
      ({ sourceReferenceId }) => sourceReferenceId === reference.id
    )!;
    const object = semantic.stageObjects.find(
      ({ id }) => id === transit.destinationObjectId
    )!;
    return [reference.id, {
      passageId: reference.passageId,
      stageId: object.stageId,
      stageObjectId: object.id,
      transitId: transit.id
    }] as const;
  }));
  for (const reference of buffer.semanticReferences) {
    const expected = expectedReferences.get(reference.id);
    if (expected === undefined ||
        Object.entries(expected).some(([key, value]) =>
          reference[key as keyof typeof expected] !== value
        )) {
      throw new Error(
        `Semantic reference ${reference.id} is stale or foreign to the repository.`
      );
    }
  }
  if (buffer.semanticReferences.length !== expectedReferences.size) {
    throw new Error("The lesson buffer does not cover every semantic reference.");
  }
}

function directiveCompletions(
  buffer: KpEconomicsLessonBuffer
): readonly KpEconomicsCodeMirrorCompletion[] {
  const motionPassage = buffer.motionPassages[0]!;
  return Object.freeze([
    completion(
      "passage",
      `passage ${JSON.stringify({
        id: "new-passage",
        motionPassageId: motionPassage.id,
        role: "regular"
      })} -->\n<!-- kp:source -->\nNew passage.\n<!-- kp:end-passage -->`,
      "typed passage directive"
    ),
    completion(
      "motion-block",
      `motion-block ${JSON.stringify({
        id: kpEconomicsMotionBlocks[0]!.id,
        passageId: kpEconomicsMotionBlocks[0]!.passageId
      })} -->`,
      "typed repository motion-block directive"
    ),
    completion(
      "semantic-reference",
      `semantic-reference ${JSON.stringify(buffer.semanticReferences[0])} -->`,
      "typed repository semantic-reference directive"
    )
  ]);
}

function completion(
  label: string,
  apply: string,
  detail: string
): KpEconomicsCodeMirrorCompletion {
  return Object.freeze({
    label,
    apply,
    detail,
    contexts: Object.freeze(["kp-directive" as const])
  });
}

function diagnoseReferences(
  source: string,
  knownReferences: ReadonlySet<string>
): readonly KpEconomicsSemanticIndexDiagnostic[] {
  const diagnostics: KpEconomicsSemanticIndexDiagnostic[] = [];
  const pattern = /kp-ref:([a-z0-9]+(?:-[a-z0-9]+)*)/gu;
  for (const match of source.matchAll(pattern)) {
    const id = match[1]!;
    if (knownReferences.has(id)) continue;
    const from = (match.index ?? 0) + "kp-ref:".length;
    diagnostics.push(Object.freeze({
      code: "KP_UNKNOWN_REFERENCE",
      message: `Unknown semantic reference: ${id}.`,
      from,
      to: from + id.length,
      id
    }));
  }
  return Object.freeze(diagnostics);
}

function entry(
  id: string,
  kind: KpEconomicsSemanticIndexEntryKind,
  label: string,
  detail: string
): KpEconomicsSemanticIndexEntry {
  return Object.freeze({ id, kind, label, detail });
}

function uniqueEntriesByKind(
  entries: readonly KpEconomicsSemanticIndexEntry[]
): readonly KpEconomicsSemanticIndexEntry[] {
  const seen = new Set<string>();
  return Object.freeze(entries.filter((record) => {
    const key = `${record.kind}:${record.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}
