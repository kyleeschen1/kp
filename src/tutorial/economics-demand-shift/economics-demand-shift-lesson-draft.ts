import type {
  KpEconomicsDemandShiftLessonPassage,
  KpEconomicsDemandShiftPassageRole
} from "./economics-demand-shift-lesson-compiler.ts";
import type {
  KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export const kpEconomicsLessonDraftStorageKey =
  "kp.economics.demand-shift.lesson-draft.v1";

export const kpEconomicsLessonDraftMessages = Object.freeze({
  ready: "Draft is valid and stored locally.",
  invalidStored: "The stored draft was invalid; publication text is preserved.",
  reset: "Restored the compiled publication text.",
  persistenceFailed: "Preview updated, but this browser could not persist the draft.",
  compiled: "Draft is valid and stored locally. Preview updated.",
  compileFailed: "The passage could not be compiled."
});

const draftIdPattern = /^draft-[a-z0-9-]+$/;
const passageLimit = 40;
const sourceTextLimit = 20_000;

export interface KpEconomicsLessonDraftPassage {
  readonly id: string;
  readonly role: KpEconomicsDemandShiftPassageRole;
  readonly motionBlockId?: KpEconomicsMotionBlockId | undefined;
  readonly sourceText: string;
}

export interface KpEconomicsLessonDraftState {
  readonly version: 1;
  readonly selectedPassageId: string;
  readonly passages: readonly KpEconomicsLessonDraftPassage[];
}

export function createKpEconomicsLessonDraft(
  passages: readonly KpEconomicsDemandShiftLessonPassage[]
): KpEconomicsLessonDraftState {
  const draftPassages = passages.map(toDraftPassage);
  const selectedPassageId = draftPassages[0]?.id;
  if (selectedPassageId === undefined) {
    throw new Error("The lesson editor requires at least one passage.");
  }
  return Object.freeze({
    version: 1,
    selectedPassageId,
    passages: Object.freeze(draftPassages)
  });
}

export function readKpEconomicsLessonDraft(input: {
  readonly serialized: string | null;
  readonly publicationPassages:
    readonly KpEconomicsDemandShiftLessonPassage[];
}): KpEconomicsLessonDraftState | undefined {
  if (input.serialized === null) return undefined;
  try {
    const candidate: unknown = JSON.parse(input.serialized);
    assertDraft(candidate, input.publicationPassages);
    return freezeDraft(candidate);
  } catch {
    return undefined;
  }
}

export function serializeKpEconomicsLessonDraft(
  draft: KpEconomicsLessonDraftState
): string {
  return JSON.stringify(draft);
}

export function selectKpEconomicsLessonDraftPassage(
  draft: KpEconomicsLessonDraftState,
  passageId: string
): KpEconomicsLessonDraftState {
  requirePassage(draft, passageId);
  return freezeDraft({ ...draft, selectedPassageId: passageId });
}

export function updateKpEconomicsLessonDraftSource(input: {
  readonly draft: KpEconomicsLessonDraftState;
  readonly passageId: string;
  readonly sourceText: string;
}): KpEconomicsLessonDraftState {
  if (input.sourceText.length > sourceTextLimit) {
    throw new Error(`Passage text cannot exceed ${sourceTextLimit} characters.`);
  }
  requirePassage(input.draft, input.passageId);
  return replacePassages(input.draft, input.draft.passages.map((passage) =>
    passage.id === input.passageId
      ? Object.freeze({ ...passage, sourceText: input.sourceText })
      : passage
  ));
}

export function addKpEconomicsLessonDraftPassageAfter(
  draft: KpEconomicsLessonDraftState,
  passageId: string
): KpEconomicsLessonDraftState {
  const index = requirePassage(draft, passageId);
  assertCapacity(draft);
  const id = nextDraftId(draft, "passage");
  const passage = Object.freeze<KpEconomicsLessonDraftPassage>({
    id,
    role: "regular",
    sourceText: "New passage."
  });
  const passages = [...draft.passages];
  passages.splice(index + 1, 0, passage);
  return freezeDraft({ ...draft, passages, selectedPassageId: id });
}

export function duplicateKpEconomicsLessonDraftPassage(
  draft: KpEconomicsLessonDraftState,
  passageId: string
): KpEconomicsLessonDraftState {
  const index = requirePassage(draft, passageId);
  assertCapacity(draft);
  const source = draft.passages[index]!;
  const id = nextDraftId(draft, source.id);
  const duplicate = Object.freeze<KpEconomicsLessonDraftPassage>({
    id,
    role: source.role === "transition" ? "regular" : source.role,
    sourceText: source.sourceText
  });
  const passages = [...draft.passages];
  passages.splice(index + 1, 0, duplicate);
  return freezeDraft({ ...draft, passages, selectedPassageId: id });
}

export function deleteKpEconomicsLessonDraftPassage(input: {
  readonly draft: KpEconomicsLessonDraftState;
  readonly passageId: string;
  readonly publicationPassageIds: ReadonlySet<string>;
}): KpEconomicsLessonDraftState {
  const index = requirePassage(input.draft, input.passageId);
  if (input.publicationPassageIds.has(input.passageId)) {
    throw new Error("Published passages are protected in the exemplar editor.");
  }
  const passages = input.draft.passages.filter(
    ({ id }) => id !== input.passageId
  );
  const selected = passages[Math.min(index, passages.length - 1)]!;
  return freezeDraft({
    ...input.draft,
    passages,
    selectedPassageId: selected.id
  });
}

export function moveKpEconomicsLessonDraftPassage(input: {
  readonly draft: KpEconomicsLessonDraftState;
  readonly passageId: string;
  readonly direction: -1 | 1;
  readonly publicationPassageIds: ReadonlySet<string>;
}): KpEconomicsLessonDraftState {
  const index = requirePassage(input.draft, input.passageId);
  if (input.publicationPassageIds.has(input.passageId)) {
    throw new Error("Published passage order is protected in the exemplar editor.");
  }
  const destination = index + input.direction;
  if (destination < 0 || destination >= input.draft.passages.length) {
    return input.draft;
  }
  const passages = [...input.draft.passages];
  const [passage] = passages.splice(index, 1);
  passages.splice(destination, 0, passage!);
  return replacePassages(input.draft, passages);
}

function toDraftPassage(
  passage: KpEconomicsDemandShiftLessonPassage
): KpEconomicsLessonDraftPassage {
  if (passage.paragraphs.length !== 1) {
    throw new Error(`Passage ${passage.id} is not a single editable card.`);
  }
  return Object.freeze({
    id: passage.id,
    role: passage.role,
    ...(passage.motionBlockId === undefined
      ? {}
      : { motionBlockId: passage.motionBlockId }),
    sourceText: passage.paragraphs[0]!.sourceText
  });
}

function assertDraft(
  candidate: unknown,
  publicationPassages: readonly KpEconomicsDemandShiftLessonPassage[]
): asserts candidate is KpEconomicsLessonDraftState {
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    (candidate as { version?: unknown }).version !== 1 ||
    !Array.isArray((candidate as { passages?: unknown }).passages)
  ) {
    throw new Error("Invalid lesson draft envelope.");
  }
  const draft = candidate as {
    selectedPassageId?: unknown;
    passages: unknown[];
  };
  if (
    draft.passages.length === 0 ||
    draft.passages.length > passageLimit ||
    typeof draft.selectedPassageId !== "string"
  ) {
    throw new Error("Invalid lesson draft size or selection.");
  }
  const roles = new Set<KpEconomicsDemandShiftPassageRole>([
    "regular",
    "transition",
    "interpretation",
    "reflection"
  ]);
  const ids = new Set<string>();
  for (const passage of draft.passages) {
    if (typeof passage !== "object" || passage === null) {
      throw new Error("Invalid lesson draft passage.");
    }
    const record = passage as Record<string, unknown>;
    if (
      typeof record["id"] !== "string" ||
      typeof record["sourceText"] !== "string" ||
      record["sourceText"].length > sourceTextLimit ||
      !roles.has(record["role"] as KpEconomicsDemandShiftPassageRole) ||
      ids.has(record["id"])
    ) {
      throw new Error("Invalid lesson draft passage fields.");
    }
    ids.add(record["id"]);
  }
  if (!ids.has(draft.selectedPassageId)) {
    throw new Error("The selected draft passage is missing.");
  }
  const publicationIds = publicationPassages.map(({ id }) => id);
  const retainedPublicationIds = draft.passages
    .map((passage) => (passage as { id: string }).id)
    .filter((id) => publicationIds.includes(id));
  if (
    retainedPublicationIds.length !== publicationIds.length ||
    retainedPublicationIds.some((id, index) => id !== publicationIds[index])
  ) {
    throw new Error("Published passage identity and order must be preserved.");
  }
  for (const publication of publicationPassages) {
    const retained = draft.passages.find(
      (passage) => (passage as { id: string }).id === publication.id
    ) as Record<string, unknown>;
    if (
      retained["role"] !== publication.role ||
      retained["motionBlockId"] !== publication.motionBlockId
    ) {
      throw new Error("Published passage semantics must be preserved.");
    }
  }
  if (draft.passages.some((passage) => {
    const record = passage as Record<string, unknown>;
    return !publicationIds.includes(record["id"] as string) &&
      (!draftIdPattern.test(record["id"] as string) ||
        record["motionBlockId"] !== undefined ||
        record["role"] === "transition");
  })) {
    throw new Error("Draft passages cannot claim published motion authority.");
  }
}

function freezeDraft(
  draft: KpEconomicsLessonDraftState
): KpEconomicsLessonDraftState {
  return Object.freeze({
    version: 1,
    selectedPassageId: draft.selectedPassageId,
    passages: Object.freeze(draft.passages.map((passage) =>
      Object.freeze({ ...passage })
    ))
  });
}

function replacePassages(
  draft: KpEconomicsLessonDraftState,
  passages: readonly KpEconomicsLessonDraftPassage[]
): KpEconomicsLessonDraftState {
  return freezeDraft({ ...draft, passages });
}

function requirePassage(
  draft: KpEconomicsLessonDraftState,
  passageId: string
): number {
  const index = draft.passages.findIndex(({ id }) => id === passageId);
  if (index < 0) throw new Error(`Unknown lesson passage: ${passageId}.`);
  return index;
}

function assertCapacity(draft: KpEconomicsLessonDraftState): void {
  if (draft.passages.length >= passageLimit) {
    throw new Error(`Lesson drafts support at most ${passageLimit} passages.`);
  }
}

function nextDraftId(
  draft: KpEconomicsLessonDraftState,
  source: string
): string {
  const stem = source.replace(/^draft-/, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "passage";
  const ids = new Set(draft.passages.map(({ id }) => id));
  let suffix = 1;
  while (ids.has(`draft-${stem}-${suffix}`)) suffix += 1;
  return `draft-${stem}-${suffix}`;
}
