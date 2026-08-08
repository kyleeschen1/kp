import {
  parseKpEconomicsLessonBuffer,
  serializeKpEconomicsLessonBuffer,
  type KpEconomicsLessonBuffer,
  type KpEconomicsLessonBufferPassage
} from "./economics-demand-shift-lesson-buffer.ts";

export type KpEconomicsLessonBufferCommand =
  | {
    readonly kind: "add-passage";
    readonly afterPassageId: string;
    readonly sourceText?: string | undefined;
  }
  | {
    readonly kind: "duplicate-passage";
    readonly passageId: string;
  }
  | {
    readonly kind: "delete-passage";
    readonly passageId: string;
    readonly confirmed: boolean;
  }
  | {
    readonly kind: "move-passage";
    readonly passageId: string;
    readonly direction: -1 | 1;
  }
  | {
    readonly kind: "update-passage-source";
    readonly passageId: string;
    readonly sourceText: string;
  };

export interface KpEconomicsLessonBufferCommandResult {
  readonly source: string;
  readonly selectedPassageId: string;
  readonly affectedPassageId: string;
  readonly description: string;
}

export class KpEconomicsLessonBufferConfirmationError extends Error {
  readonly passageId: string;

  constructor(passageId: string) {
    super(`Deleting passage ${passageId} requires explicit confirmation.`);
    this.name = "KpEconomicsLessonBufferConfirmationError";
    this.passageId = passageId;
  }
}

/**
 * Returns one complete replacement transaction. CodeMirror owns undo/redo;
 * structural commands must enter that same history instead of forking state.
 */
export function applyKpEconomicsLessonBufferCommand(input: {
  readonly source: string;
  readonly command: KpEconomicsLessonBufferCommand;
}): KpEconomicsLessonBufferCommandResult {
  const buffer = parseKpEconomicsLessonBuffer(input.source);
  switch (input.command.kind) {
    case "add-passage":
      return addPassage(buffer, input.command);
    case "duplicate-passage":
      return duplicatePassage(buffer, input.command.passageId);
    case "delete-passage":
      return deletePassage(buffer, input.command);
    case "move-passage":
      return movePassage(buffer, input.command);
    case "update-passage-source":
      return updatePassageSource(buffer, input.command);
  }
}

function addPassage(
  buffer: KpEconomicsLessonBuffer,
  command: Extract<KpEconomicsLessonBufferCommand, { kind: "add-passage" }>
): KpEconomicsLessonBufferCommandResult {
  const index = passageIndex(buffer, command.afterPassageId);
  const owner = buffer.passages[index]!;
  const id = nextPassageId(buffer, "passage");
  const passage: KpEconomicsLessonBufferPassage = {
    id,
    motionPassageId: owner.motionPassageId,
    role: "regular",
    sourceText: command.sourceText ?? "New passage."
  };
  const passages = [...buffer.passages];
  passages.splice(index + 1, 0, passage);
  return result(
    { ...buffer, passages },
    id,
    id,
    `Added passage ${id}.`
  );
}

function duplicatePassage(
  buffer: KpEconomicsLessonBuffer,
  passageId: string
): KpEconomicsLessonBufferCommandResult {
  const index = passageIndex(buffer, passageId);
  const original = buffer.passages[index]!;
  const id = nextPassageId(buffer, original.id);
  const passage: KpEconomicsLessonBufferPassage = {
    id,
    motionPassageId: original.motionPassageId,
    // Motion ownership belongs to the repository block, not a copied cue.
    role: original.role === "transition" ? "regular" : original.role,
    sourceText: stripSemanticReferenceLinks(original.sourceText)
  };
  const passages = [...buffer.passages];
  passages.splice(index + 1, 0, passage);
  return result(
    { ...buffer, passages },
    id,
    id,
    `Duplicated passage ${passageId} as ${id}.`
  );
}

function deletePassage(
  buffer: KpEconomicsLessonBuffer,
  command: Extract<KpEconomicsLessonBufferCommand, { kind: "delete-passage" }>
): KpEconomicsLessonBufferCommandResult {
  if (!command.confirmed) {
    throw new KpEconomicsLessonBufferConfirmationError(command.passageId);
  }
  const index = passageIndex(buffer, command.passageId);
  if (buffer.passages.length === 1) {
    throw new Error("A lesson buffer must retain at least one passage.");
  }
  if (buffer.motionBlocks.some(({ passageId }) =>
    passageId === command.passageId
  )) {
    throw new Error("A passage that owns a motion block cannot be deleted.");
  }
  if (buffer.semanticReferences.some(({ passageId }) =>
    passageId === command.passageId
  )) {
    throw new Error("A passage that owns a semantic reference cannot be deleted.");
  }
  const passages = buffer.passages.filter(({ id }) => id !== command.passageId);
  const selected = passages[Math.min(index, passages.length - 1)]!;
  return result(
    { ...buffer, passages },
    selected.id,
    command.passageId,
    `Deleted passage ${command.passageId}.`
  );
}

function movePassage(
  buffer: KpEconomicsLessonBuffer,
  command: Extract<KpEconomicsLessonBufferCommand, { kind: "move-passage" }>
): KpEconomicsLessonBufferCommandResult {
  const index = passageIndex(buffer, command.passageId);
  const destination = index + command.direction;
  if (destination < 0 || destination >= buffer.passages.length) {
    return result(
      buffer,
      command.passageId,
      command.passageId,
      `Passage ${command.passageId} is already at the boundary.`
    );
  }
  const passages = [...buffer.passages];
  const [passage] = passages.splice(index, 1);
  passages.splice(destination, 0, passage!);
  return result(
    { ...buffer, passages },
    command.passageId,
    command.passageId,
    `Moved passage ${command.passageId} ${
      command.direction < 0 ? "earlier" : "later"
    }.`
  );
}

function updatePassageSource(
  buffer: KpEconomicsLessonBuffer,
  command: Extract<
    KpEconomicsLessonBufferCommand,
    { kind: "update-passage-source" }
  >
): KpEconomicsLessonBufferCommandResult {
  passageIndex(buffer, command.passageId);
  const passages = buffer.passages.map((passage) => passage.id === command.passageId
    ? { ...passage, sourceText: command.sourceText }
    : passage);
  return result(
    { ...buffer, passages },
    command.passageId,
    command.passageId,
    `Updated passage ${command.passageId}.`
  );
}

function result(
  buffer: KpEconomicsLessonBuffer,
  selectedPassageId: string,
  affectedPassageId: string,
  description: string
): KpEconomicsLessonBufferCommandResult {
  return Object.freeze({
    source: serializeKpEconomicsLessonBuffer(buffer),
    selectedPassageId,
    affectedPassageId,
    description
  });
}

function passageIndex(
  buffer: KpEconomicsLessonBuffer,
  passageId: string
): number {
  const index = buffer.passages.findIndex(({ id }) => id === passageId);
  if (index < 0) throw new Error(`Unknown lesson passage: ${passageId}.`);
  return index;
}

function nextPassageId(
  buffer: KpEconomicsLessonBuffer,
  source: string
): string {
  const stem = source.replace(/^draft-/, "").replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "") || "passage";
  const ids = new Set(buffer.passages.map(({ id }) => id));
  let suffix = 1;
  while (ids.has(`draft-${stem}-${suffix}`)) suffix += 1;
  return `draft-${stem}-${suffix}`;
}

function stripSemanticReferenceLinks(sourceText: string): string {
  return sourceText.replace(
    /\[([^\]]+)\]\(kp-ref:[a-z0-9]+(?:-[a-z0-9]+)*\)/gu,
    "$1"
  );
}
