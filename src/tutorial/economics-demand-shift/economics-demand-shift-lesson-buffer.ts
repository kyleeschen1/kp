import {
  kpEconomicsMotionBlocks,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  compileKpEconomicsDemandShiftSemanticTransitExemplar
} from "./economics-demand-shift-semantic-transit-exemplar.ts";
import type {
  KpEconomicsDemandShiftPassageRole
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  kpEconomicsTwoColumnSourceSchema,
  type KpEconomicsTwoColumnSource
} from "./economics-demand-shift-two-column-source.ts";

export const kpEconomicsLessonBufferSchema =
  "kp.economics.lesson-buffer.v1" as const;

const lessonId = "lesson.economics.demand-shift";
const motionPassageId = "demand-shift-explanation";
const stageId = "demand-shift-graph";
const stageAssetId = "asset.economics.supply-demand-equilibrium-shift";
const bufferLimit = 120_000;
const sourceTextLimit = 20_000;
const semanticSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const entityIdPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const languagePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const directivePattern = /^<!-- kp:([a-z-]+)(?: (.+))? -->$/;
const reservedSourceLinePattern = /^\\*<!-- kp:/;
const roles = new Set<KpEconomicsDemandShiftPassageRole>([
  "regular",
  "transition",
  "interpretation",
  "reflection"
]);
const motionBlockIds = new Set(kpEconomicsMotionBlocks.map(({ id }) => id));

export interface KpEconomicsLessonBufferLesson {
  readonly id: string;
  readonly title: string;
  readonly language: string;
}

export interface KpEconomicsLessonBufferStage {
  readonly id: string;
  readonly assetId: string;
}

export interface KpEconomicsLessonBufferMotionPassage {
  readonly id: string;
  readonly stageId: string;
}

export interface KpEconomicsLessonBufferPassage {
  readonly id: string;
  readonly motionPassageId: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly sourceText: string;
}

export interface KpEconomicsLessonBufferMotionBlock {
  readonly id: KpEconomicsMotionBlockId;
  readonly passageId: string;
}

export interface KpEconomicsLessonBufferSemanticReference {
  readonly id: string;
  readonly passageId: string;
  readonly stageId: string;
  readonly stageObjectId: string;
  readonly transitId: string;
}

export interface KpEconomicsLessonBuffer {
  readonly schemaVersion: typeof kpEconomicsLessonBufferSchema;
  readonly lesson: KpEconomicsLessonBufferLesson;
  readonly stages: readonly KpEconomicsLessonBufferStage[];
  readonly motionPassages: readonly KpEconomicsLessonBufferMotionPassage[];
  readonly passages: readonly KpEconomicsLessonBufferPassage[];
  readonly motionBlocks: readonly KpEconomicsLessonBufferMotionBlock[];
  readonly semanticReferences:
    readonly KpEconomicsLessonBufferSemanticReference[];
}

/**
 * Creates the bounded editor document from the current economics source.
 * Runtime objects remain repository-owned references rather than executable
 * source embedded in the lesson buffer.
 */
export function createKpEconomicsLessonBuffer(
  source: KpEconomicsTwoColumnSource
): KpEconomicsLessonBuffer {
  const passageIds = source.passages.map(({ id }) => id);
  const semanticTransit =
    compileKpEconomicsDemandShiftSemanticTransitExemplar(passageIds);
  const semanticReferences = semanticTransit.transits.map((transit) => {
    const reference = semanticTransit.textReferences.find(
      ({ id }) => id === transit.sourceReferenceId
    )!;
    const object = semanticTransit.stageObjects.find(
      ({ id }) => id === transit.destinationObjectId
    )!;
    return {
      id: reference.id,
      passageId: reference.passageId,
      stageId: object.stageId,
      stageObjectId: object.id,
      transitId: transit.id
    };
  });
  return freezeAndValidate({
    schemaVersion: kpEconomicsLessonBufferSchema,
    lesson: {
      id: lessonId,
      title: "Demand increase with fixed supply",
      language: "en"
    },
    stages: [{ id: stageId, assetId: stageAssetId }],
    motionPassages: [{ id: motionPassageId, stageId }],
    passages: source.passages.map((passage) => ({
      id: passage.id,
      motionPassageId,
      role: passage.role,
      sourceText: passage.sourceText
    })),
    motionBlocks: kpEconomicsMotionBlocks.map(({ id, passageId }) => ({
      id,
      passageId
    })),
    semanticReferences
  });
}

export function serializeKpEconomicsLessonBuffer(
  candidate: KpEconomicsLessonBuffer
): string {
  const buffer = freezeAndValidate(candidate);
  const lines: string[] = [
    directive("lesson", {
      schemaVersion: buffer.schemaVersion,
      id: buffer.lesson.id,
      title: buffer.lesson.title,
      language: buffer.lesson.language
    })
  ];
  for (const stage of buffer.stages) {
    lines.push(directive("stage", stage));
  }
  for (const passage of buffer.motionPassages) {
    lines.push(directive("motion-passage", passage));
  }
  for (const reference of buffer.semanticReferences) {
    lines.push(directive("semantic-reference", reference));
  }
  lines.push("");
  const blocks = new Map(buffer.motionBlocks.map((block) => [
    block.passageId,
    block
  ]));
  for (const passage of buffer.passages) {
    lines.push(directive("passage", {
      id: passage.id,
      motionPassageId: passage.motionPassageId,
      role: passage.role
    }));
    const block = blocks.get(passage.id);
    if (block !== undefined) lines.push(directive("motion-block", block));
    lines.push("<!-- kp:source -->");
    lines.push(...passage.sourceText.split("\n").map(escapeSourceLine));
    lines.push("<!-- kp:end-passage -->", "");
  }
  return `${lines.join("\n")}\n`;
}

export function parseKpEconomicsLessonBuffer(
  serialized: string
): KpEconomicsLessonBuffer {
  if (serialized.length > bufferLimit) {
    throw new Error(`Lesson buffers cannot exceed ${bufferLimit} characters.`);
  }
  const lines = serialized.replaceAll("\r\n", "\n").split("\n");
  let lesson: KpEconomicsLessonBufferLesson | undefined;
  let schemaVersion: string | undefined;
  const stages: KpEconomicsLessonBufferStage[] = [];
  const motionPassages: KpEconomicsLessonBufferMotionPassage[] = [];
  const passages: KpEconomicsLessonBufferPassage[] = [];
  const motionBlocks: KpEconomicsLessonBufferMotionBlock[] = [];
  const semanticReferences: KpEconomicsLessonBufferSemanticReference[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index]!;
    if (line === "") {
      index += 1;
      continue;
    }
    const parsed = parseDirective(line);
    if (parsed.kind === "lesson") {
      if (lesson !== undefined) throw new Error("Duplicate lesson directive.");
      const record = requireRecord(parsed.value, "lesson");
      requireExactKeys(
        record,
        ["schemaVersion", "id", "title", "language"],
        "lesson"
      );
      schemaVersion = requireString(record, "schemaVersion", "lesson");
      lesson = {
        id: requireString(record, "id", "lesson"),
        title: requireString(record, "title", "lesson"),
        language: requireString(record, "language", "lesson")
      };
      index += 1;
      continue;
    }
    if (parsed.kind === "stage") {
      stages.push(parseStage(parsed.value));
      index += 1;
      continue;
    }
    if (parsed.kind === "motion-passage") {
      motionPassages.push(parseMotionPassage(parsed.value));
      index += 1;
      continue;
    }
    if (parsed.kind === "semantic-reference") {
      semanticReferences.push(parseSemanticReference(parsed.value));
      index += 1;
      continue;
    }
    if (parsed.kind !== "passage") {
      throw new Error(`Unexpected kp:${parsed.kind} directive.`);
    }

    const passageRecord = requireRecord(parsed.value, "passage");
    requireExactKeys(
      passageRecord,
      ["id", "motionPassageId", "role"],
      "passage"
    );
    const passage = {
      id: requireString(passageRecord, "id", "passage"),
      motionPassageId: requireString(
        passageRecord,
        "motionPassageId",
        "passage"
      ),
      role: requireString(passageRecord, "role", "passage") as
        KpEconomicsDemandShiftPassageRole
    };
    index += 1;
    const possibleBlock = parseOptionalDirective(lines[index]);
    if (possibleBlock?.kind === "motion-block") {
      motionBlocks.push(parseMotionBlock(possibleBlock.value));
      index += 1;
    }
    if (lines[index] !== "<!-- kp:source -->") {
      throw new Error(`Passage ${passage.id} is missing its source boundary.`);
    }
    index += 1;
    const sourceLines: string[] = [];
    while (index < lines.length &&
        lines[index] !== "<!-- kp:end-passage -->") {
      const sourceLine = lines[index]!;
      if (sourceLine.startsWith("<!-- kp:")) {
        throw new Error(
          `Passage ${passage.id} contains an unescaped kp directive.`
        );
      }
      sourceLines.push(unescapeSourceLine(sourceLine));
      index += 1;
    }
    if (lines[index] !== "<!-- kp:end-passage -->") {
      throw new Error(`Passage ${passage.id} has no closing boundary.`);
    }
    passages.push({ ...passage, sourceText: sourceLines.join("\n") });
    index += 1;
  }

  if (lesson === undefined || schemaVersion === undefined) {
    throw new Error("Lesson buffer is missing its lesson directive.");
  }
  if (schemaVersion !== kpEconomicsLessonBufferSchema) {
    throw new Error(`Unsupported lesson buffer schema: ${schemaVersion}.`);
  }
  return freezeAndValidate({
    schemaVersion,
    lesson,
    stages,
    motionPassages,
    passages,
    motionBlocks,
    semanticReferences
  });
}

export function compileKpEconomicsLessonBufferSource(
  buffer: KpEconomicsLessonBuffer
): KpEconomicsTwoColumnSource {
  const validated = freezeAndValidate(buffer);
  const blocks = new Map(validated.motionBlocks.map((block) => [
    block.passageId,
    block.id
  ]));
  return Object.freeze({
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: Object.freeze(validated.passages.map((passage) =>
      Object.freeze({
        id: passage.id,
        role: passage.role,
        ...(blocks.has(passage.id)
          ? { motionBlockId: blocks.get(passage.id)! }
          : {}),
        sourceText: passage.sourceText
      })
    ))
  });
}

function freezeAndValidate(
  candidate: KpEconomicsLessonBuffer
): KpEconomicsLessonBuffer {
  if (candidate.schemaVersion !== kpEconomicsLessonBufferSchema) {
    throw new Error("Unsupported economics lesson buffer schema.");
  }
  requireEntityId(candidate.lesson.id, "Lesson id");
  if (candidate.lesson.title.trim() === "" ||
      candidate.lesson.title.length > 240 ||
      !languagePattern.test(candidate.lesson.language)) {
    throw new Error("Invalid lesson title or language.");
  }
  if (candidate.stages.length === 0 || candidate.motionPassages.length === 0 ||
      candidate.passages.length === 0) {
    throw new Error("A lesson buffer needs a stage, motion passage, and passage.");
  }
  uniqueIds(candidate.stages, "stage");
  uniqueIds(candidate.motionPassages, "motion passage");
  uniqueIds(candidate.passages, "passage");
  uniqueIds(candidate.motionBlocks, "motion block");
  uniqueIds(candidate.semanticReferences, "semantic reference");

  const stageIds = new Set(candidate.stages.map(({ id }) => id));
  const motionPassageIds = new Set(candidate.motionPassages.map(({ id }) => id));
  const passageIds = new Set(candidate.passages.map(({ id }) => id));
  const blockPassageIds = new Set<string>();
  for (const stage of candidate.stages) {
    requireSlug(stage.id, "Stage id");
    requireEntityId(stage.assetId, "Stage asset id");
  }
  for (const passage of candidate.motionPassages) {
    requireSlug(passage.id, "Motion passage id");
    if (!stageIds.has(passage.stageId)) {
      throw new Error(
        `Motion passage ${passage.id} names unknown stage ${passage.stageId}.`
      );
    }
  }
  for (const passage of candidate.passages) {
    requireSlug(passage.id, "Passage id");
    if (!motionPassageIds.has(passage.motionPassageId) ||
        !roles.has(passage.role) || passage.sourceText === "" ||
        passage.sourceText.length > sourceTextLimit) {
      throw new Error(`Invalid lesson passage ${passage.id}.`);
    }
    if (/^\s*```+\s*kp(?:\s|$)/mu.test(passage.sourceText) ||
        /<(?:script|svelte:|component)\b/iu.test(passage.sourceText)) {
      throw new Error(`Passage ${passage.id} contains executable source.`);
    }
    for (const line of passage.sourceText.split("\n")) {
      if (line.trimStart().startsWith("<") &&
          !reservedSourceLinePattern.test(line.trimStart())) {
        throw new Error(`Passage ${passage.id} contains unsupported HTML.`);
      }
    }
  }
  for (const block of candidate.motionBlocks) {
    requireSlug(block.id, "Motion block id");
    if (!motionBlockIds.has(block.id) || !passageIds.has(block.passageId) ||
        blockPassageIds.has(block.passageId)) {
      throw new Error(`Invalid motion block passage ${block.passageId}.`);
    }
    blockPassageIds.add(block.passageId);
    const passage = candidate.passages.find(({ id }) => id === block.passageId)!;
    if (passage.role !== "transition") {
      throw new Error(`Motion block ${block.id} needs a transition passage.`);
    }
  }
  for (const passage of candidate.passages) {
    if ((passage.role === "transition") !== blockPassageIds.has(passage.id)) {
      throw new Error(
        `Transition passage ${passage.id} and motion-block ownership differ.`
      );
    }
  }
  for (const reference of candidate.semanticReferences) {
    requireSlug(reference.id, "Semantic reference id");
    requireSlug(reference.stageObjectId, "Stage object id");
    requireSlug(reference.transitId, "Semantic transit id");
    if (!passageIds.has(reference.passageId) ||
        !stageIds.has(reference.stageId)) {
      throw new Error(`Semantic reference ${reference.id} has an unknown owner.`);
    }
    const marker = `kp-ref:${reference.id}`;
    const source = candidate.passages.find(
      ({ id }) => id === reference.passageId
    )!.sourceText;
    if (source.split(marker).length - 1 !== 1) {
      throw new Error(
        `Semantic reference ${reference.id} must appear exactly once in its passage.`
      );
    }
  }
  return Object.freeze({
    schemaVersion: kpEconomicsLessonBufferSchema,
    lesson: Object.freeze({ ...candidate.lesson }),
    stages: freezeRecords(candidate.stages),
    motionPassages: freezeRecords(candidate.motionPassages),
    passages: freezeRecords(candidate.passages),
    motionBlocks: freezeRecords(candidate.motionBlocks),
    semanticReferences: freezeRecords(candidate.semanticReferences)
  });
}

function parseDirective(line: string): { kind: string; value?: unknown } {
  const match = directivePattern.exec(line);
  if (match === null) {
    throw new Error(`Unexpected lesson buffer content: ${line}`);
  }
  const kind = match[1]!;
  const source = match[2];
  if (source === undefined) return { kind };
  try {
    return { kind, value: JSON.parse(source) as unknown };
  } catch {
    throw new Error(`Invalid JSON in kp:${kind} directive.`);
  }
}

function parseOptionalDirective(
  line: string | undefined
): { kind: string; value?: unknown } | undefined {
  if (line === undefined || !line.startsWith("<!-- kp:")) return undefined;
  return parseDirective(line);
}

function parseStage(value: unknown): KpEconomicsLessonBufferStage {
  const record = requireRecord(value, "stage");
  requireExactKeys(record, ["id", "assetId"], "stage");
  return {
    id: requireString(record, "id", "stage"),
    assetId: requireString(record, "assetId", "stage")
  };
}

function parseMotionPassage(
  value: unknown
): KpEconomicsLessonBufferMotionPassage {
  const record = requireRecord(value, "motion passage");
  requireExactKeys(record, ["id", "stageId"], "motion passage");
  return {
    id: requireString(record, "id", "motion passage"),
    stageId: requireString(record, "stageId", "motion passage")
  };
}

function parseMotionBlock(value: unknown): KpEconomicsLessonBufferMotionBlock {
  const record = requireRecord(value, "motion block");
  requireExactKeys(record, ["id", "passageId"], "motion block");
  return {
    id: requireString(record, "id", "motion block") as
      KpEconomicsMotionBlockId,
    passageId: requireString(record, "passageId", "motion block")
  };
}

function parseSemanticReference(
  value: unknown
): KpEconomicsLessonBufferSemanticReference {
  const record = requireRecord(value, "semantic reference");
  requireExactKeys(
    record,
    ["id", "passageId", "stageId", "stageObjectId", "transitId"],
    "semantic reference"
  );
  return {
    id: requireString(record, "id", "semantic reference"),
    passageId: requireString(record, "passageId", "semantic reference"),
    stageId: requireString(record, "stageId", "semantic reference"),
    stageObjectId: requireString(record, "stageObjectId", "semantic reference"),
    transitId: requireString(record, "transitId", "semantic reference")
  };
}

function requireRecord(
  value: unknown,
  label: string
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid ${label} directive.`);
  }
  return value as Record<string, unknown>;
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  label: string
): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Invalid ${label} ${key}.`);
  }
  return value;
}

function requireExactKeys(
  record: Record<string, unknown>,
  keys: readonly string[],
  label: string
): void {
  const expected = new Set(keys);
  if (Object.keys(record).length !== expected.size ||
      Object.keys(record).some((key) => !expected.has(key))) {
    throw new Error(`Invalid ${label} directive fields.`);
  }
}

function directive(kind: string, value: object): string {
  return `<!-- kp:${kind} ${JSON.stringify(value)} -->`;
}

function escapeSourceLine(line: string): string {
  return reservedSourceLinePattern.test(line) ? `\\${line}` : line;
}

function unescapeSourceLine(line: string): string {
  return line.startsWith("\\") && reservedSourceLinePattern.test(line.slice(1))
    ? line.slice(1)
    : line;
}

function uniqueIds(
  records: readonly { readonly id: string }[],
  label: string
): void {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate ${label} id: ${record.id}.`);
    ids.add(record.id);
  }
}

function requireSlug(id: string, label: string): void {
  if (!semanticSlugPattern.test(id)) {
    throw new Error(`${label} must be a lowercase semantic slug.`);
  }
}

function requireEntityId(id: string, label: string): void {
  if (!entityIdPattern.test(id)) {
    throw new Error(`${label} must be a lowercase semantic entity id.`);
  }
}

function freezeRecords<RecordType extends object>(
  records: readonly RecordType[]
): readonly Readonly<RecordType>[] {
  return Object.freeze(records.map((record) => Object.freeze({ ...record })));
}
