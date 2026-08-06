import type {
  KpEconomicsLessonDraftState
} from "./economics-demand-shift-lesson-draft.ts";
import type {
  KpEconomicsDemandShiftPassageRole
} from "./economics-demand-shift-lesson-compiler.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export const kpEconomicsTwoColumnSourceSchema =
  "kp.economics-two-column-lesson.v1" as const;
export const kpEconomicsLessonSourceSaveRequestSchema =
  "kp.economics-lesson-source-save.v1" as const;

const passageLimit = 40;
const sourceTextLimit = 20_000;
const passageIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const draftIdPattern = /^draft-[a-z0-9-]+$/;
const roles = new Set<KpEconomicsDemandShiftPassageRole>([
  "regular",
  "transition",
  "interpretation",
  "reflection"
]);
const motionBlockIds = new Set<KpEconomicsMotionBlockId>([
  "demand-shift",
  "supply-movement"
]);

export interface KpEconomicsTwoColumnSourcePassage {
  readonly id: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly motionBlockId?: KpEconomicsMotionBlockId | undefined;
  readonly sourceText: string;
}

export interface KpEconomicsTwoColumnSource {
  readonly schemaVersion: typeof kpEconomicsTwoColumnSourceSchema;
  readonly passages: readonly KpEconomicsTwoColumnSourcePassage[];
}

export interface KpEconomicsLessonSourceSaveRequest {
  readonly schemaVersion: typeof kpEconomicsLessonSourceSaveRequestSchema;
  readonly draft: KpEconomicsLessonDraftState;
}

export function parseKpEconomicsTwoColumnSource(
  value: unknown
): KpEconomicsTwoColumnSource {
  if (!isRecord(value) ||
      value["schemaVersion"] !== kpEconomicsTwoColumnSourceSchema ||
      !Array.isArray(value["passages"])) {
    throw new Error("Invalid economics two-column source envelope.");
  }
  const passages = value["passages"].map(parsePassage);
  if (passages.length === 0 || passages.length > passageLimit) {
    throw new Error("Invalid economics two-column passage count.");
  }
  if (new Set(passages.map(({ id }) => id)).size !== passages.length) {
    throw new Error("Economics two-column passage IDs must be unique.");
  }
  return Object.freeze({
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: Object.freeze(passages)
  });
}

export function parseKpEconomicsLessonSourceSaveRequest(
  value: unknown
): KpEconomicsLessonSourceSaveRequest {
  if (!isRecord(value) ||
      value["schemaVersion"] !== kpEconomicsLessonSourceSaveRequestSchema ||
      !isRecord(value["draft"]) ||
      value["draft"]["version"] !== 1 ||
      typeof value["draft"]["selectedPassageId"] !== "string" ||
      !Array.isArray(value["draft"]["passages"])) {
    throw new Error("Invalid economics lesson source-save request.");
  }
  const passages = value["draft"]["passages"].map(parsePassage);
  const selectedPassageId = value["draft"]["selectedPassageId"];
  if (passages.length === 0 || passages.length > passageLimit ||
      !passages.some(({ id }) => id === selectedPassageId)) {
    throw new Error("Invalid economics lesson draft selection or size.");
  }
  if (new Set(passages.map(({ id }) => id)).size !== passages.length) {
    throw new Error("Economics lesson draft passage IDs must be unique.");
  }
  return Object.freeze({
    schemaVersion: kpEconomicsLessonSourceSaveRequestSchema,
    draft: Object.freeze({
      version: 1,
      selectedPassageId,
      passages: Object.freeze(passages)
    })
  });
}

export function applyKpEconomicsDraftToTwoColumnSource(input: {
  readonly current: KpEconomicsTwoColumnSource;
  readonly request: KpEconomicsLessonSourceSaveRequest;
}): KpEconomicsTwoColumnSource {
  const protectedCurrent = input.current.passages.filter(
    ({ id }) => !draftIdPattern.test(id)
  );
  const protectedNext = input.request.draft.passages.filter(
    ({ id }) => !draftIdPattern.test(id)
  );
  if (protectedCurrent.length !== protectedNext.length) {
    throw new Error("Published economics passages cannot be added or removed.");
  }
  for (const [index, current] of protectedCurrent.entries()) {
    const next = protectedNext[index];
    if (next === undefined || next.id !== current.id ||
        next.role !== current.role ||
        next.motionBlockId !== current.motionBlockId) {
      throw new Error(
        "Published economics passage identity, order, role, and motion are protected."
      );
    }
  }
  for (const passage of input.request.draft.passages) {
    if (draftIdPattern.test(passage.id) && passage.motionBlockId !== undefined) {
      throw new Error("Draft passages cannot introduce motion ownership.");
    }
  }
  return Object.freeze({
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: Object.freeze(input.request.draft.passages.map((passage) =>
      Object.freeze({
        id: passage.id,
        role: passage.role,
        ...(passage.motionBlockId === undefined
          ? {}
          : { motionBlockId: passage.motionBlockId }),
        sourceText: passage.sourceText
      })
    ))
  });
}

export function serializeKpEconomicsTwoColumnSource(
  source: KpEconomicsTwoColumnSource
): string {
  return `${JSON.stringify(source, null, 2)}\n`;
}

function parsePassage(value: unknown): KpEconomicsTwoColumnSourcePassage {
  if (!isRecord(value) ||
      typeof value["id"] !== "string" ||
      !passageIdPattern.test(value["id"]) ||
      !roles.has(value["role"] as KpEconomicsDemandShiftPassageRole) ||
      typeof value["sourceText"] !== "string" ||
      value["sourceText"].length > sourceTextLimit ||
      (value["motionBlockId"] !== undefined &&
        !motionBlockIds.has(value["motionBlockId"] as KpEconomicsMotionBlockId))) {
    throw new Error("Invalid economics two-column passage.");
  }
  return Object.freeze({
    id: value["id"],
    role: value["role"] as KpEconomicsDemandShiftPassageRole,
    ...(value["motionBlockId"] === undefined
      ? {}
      : { motionBlockId: value["motionBlockId"] as KpEconomicsMotionBlockId }),
    sourceText: value["sourceText"]
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
