import type {
  KpEconomicsDemandShiftLessonPassage
} from "./economics-demand-shift-lesson-compiler.ts";
import {
  compileKpEconomicsLessonBufferSource,
  parseKpEconomicsLessonBuffer,
  type KpEconomicsLessonBuffer
} from "./economics-demand-shift-lesson-buffer.ts";
import {
  compileKpEconomicsTwoColumnParagraphs
} from "./economics-demand-shift-two-column-scroll.ts";

export interface KpEconomicsLessonBufferDiagnostic {
  readonly code: "KP_BUFFER_PARSE" | "KP_BUFFER_COMPILE";
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly passageId?: string | undefined;
}

export interface KpEconomicsLessonBufferPreviewSnapshot {
  readonly sourceRevision: number;
  readonly previewRevision: number;
  readonly status: "valid" | "pending" | "invalid";
  readonly source: string;
  readonly buffer: KpEconomicsLessonBuffer;
  readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
  readonly restoredPassageId: string;
  readonly diagnostics: readonly KpEconomicsLessonBufferDiagnostic[];
  readonly compiledPassageIds: readonly string[];
  /** Stable identity proves prose compilation never replaces stage ownership. */
  readonly stageSessionToken: object;
}

export interface KpEconomicsLessonBufferPreviewScheduler {
  readonly schedule: (callback: () => void, delayMs: number) => unknown;
  readonly cancel: (handle: unknown) => void;
}

export interface KpEconomicsLessonBufferPreviewSessionOptions {
  readonly source: string;
  readonly passageId: string;
  readonly debounceMs?: number | undefined;
  readonly scheduler?: KpEconomicsLessonBufferPreviewScheduler | undefined;
  readonly onSnapshot?:
    ((snapshot: KpEconomicsLessonBufferPreviewSnapshot) => void) | undefined;
}

const defaultScheduler: KpEconomicsLessonBufferPreviewScheduler = {
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

/**
 * Owns editor compilation state only. The renderer/session token is created
 * once so valid, invalid, and repaired prose revisions cannot remount motion.
 */
export class KpEconomicsLessonBufferPreviewSession {
  readonly stageSessionToken = Object.freeze({
    owner: "economics-demand-shift-stage-session"
  });

  private readonly debounceMs: number;
  private readonly scheduler: KpEconomicsLessonBufferPreviewScheduler;
  private readonly onSnapshot:
    ((snapshot: KpEconomicsLessonBufferPreviewSnapshot) => void) | undefined;
  private pendingHandle: unknown;
  private disposed = false;
  private requestedPassageId: string;
  private snapshotValue: KpEconomicsLessonBufferPreviewSnapshot;

  constructor(options: KpEconomicsLessonBufferPreviewSessionOptions) {
    this.debounceMs = options.debounceMs ?? 180;
    if (!Number.isFinite(this.debounceMs) || this.debounceMs < 0) {
      throw new Error("Lesson buffer debounce must be a non-negative number.");
    }
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.onSnapshot = options.onSnapshot;
    this.requestedPassageId = options.passageId;
    const compiled = compileSource(options.source);
    const restoredPassageId = restorePassageId({
      requestedPassageId: options.passageId,
      previousPassageIds: compiled.buffer.passages.map(({ id }) => id),
      nextPassageIds: compiled.buffer.passages.map(({ id }) => id)
    });
    this.snapshotValue = freezeSnapshot({
      sourceRevision: 0,
      previewRevision: 0,
      status: "valid",
      source: options.source,
      buffer: compiled.buffer,
      passages: compiled.passages,
      restoredPassageId,
      diagnostics: [],
      compiledPassageIds: compiled.compiledPassageIds,
      stageSessionToken: this.stageSessionToken
    });
  }

  get snapshot(): KpEconomicsLessonBufferPreviewSnapshot {
    return this.snapshotValue;
  }

  update(input: { readonly source: string; readonly passageId: string }): void {
    this.assertActive();
    this.requestedPassageId = input.passageId;
    this.cancelPending();
    this.snapshotValue = freezeSnapshot({
      ...this.snapshotValue,
      sourceRevision: this.snapshotValue.sourceRevision + 1,
      status: "pending",
      source: input.source,
      diagnostics: [],
      compiledPassageIds: []
    });
    this.emit();
    this.pendingHandle = this.scheduler.schedule(
      () => this.compilePending(),
      this.debounceMs
    );
  }

  flush(): KpEconomicsLessonBufferPreviewSnapshot {
    this.assertActive();
    this.cancelPending();
    if (this.snapshotValue.status === "pending") this.compilePending();
    return this.snapshotValue;
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancelPending();
    this.disposed = true;
  }

  private compilePending(): void {
    if (this.disposed || this.snapshotValue.status !== "pending") return;
    this.pendingHandle = undefined;
    const previous = this.snapshotValue;
    try {
      const compiled = compileSource(previous.source, {
        buffer: previous.buffer,
        passages: previous.passages
      });
      const restoredPassageId = restorePassageId({
        requestedPassageId: this.requestedPassageId,
        previousPassageIds: previous.buffer.passages.map(({ id }) => id),
        nextPassageIds: compiled.buffer.passages.map(({ id }) => id)
      });
      this.snapshotValue = freezeSnapshot({
        ...previous,
        previewRevision: previous.sourceRevision,
        status: "valid",
        buffer: compiled.buffer,
        passages: compiled.passages,
        restoredPassageId,
        diagnostics: [],
        compiledPassageIds: compiled.compiledPassageIds
      });
    } catch (error) {
      this.snapshotValue = freezeSnapshot({
        ...previous,
        status: "invalid",
        restoredPassageId: restorePassageId({
          requestedPassageId: this.requestedPassageId,
          previousPassageIds: previous.buffer.passages.map(({ id }) => id),
          nextPassageIds: previous.buffer.passages.map(({ id }) => id)
        }),
        diagnostics: [diagnosticFromError(previous.source, error)],
        compiledPassageIds: []
      });
    }
    this.emit();
  }

  private cancelPending(): void {
    if (this.pendingHandle === undefined) return;
    this.scheduler.cancel(this.pendingHandle);
    this.pendingHandle = undefined;
  }

  private assertActive(): void {
    if (this.disposed) throw new Error("Lesson buffer preview is disposed.");
  }

  private emit(): void {
    this.onSnapshot?.(this.snapshotValue);
  }
}

class KpEconomicsLessonBufferCompileError extends Error {
  readonly passageId: string;

  constructor(passageId: string, cause: unknown) {
    super(cause instanceof Error ? cause.message : "Passage compilation failed.");
    this.name = "KpEconomicsLessonBufferCompileError";
    this.passageId = passageId;
  }
}

function compileSource(source: string, previous?: {
  readonly buffer: KpEconomicsLessonBuffer;
  readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
}): {
  readonly buffer: KpEconomicsLessonBuffer;
  readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
  readonly compiledPassageIds: readonly string[];
} {
  const buffer = parseKpEconomicsLessonBuffer(source);
  const compiledSource = compileKpEconomicsLessonBufferSource(buffer);
  const previousSource = previous === undefined
    ? undefined
    : compileKpEconomicsLessonBufferSource(previous.buffer);
  const previousSources = new Map(previousSource?.passages.map((passage) => [
    passage.id,
    passage
  ]) ?? []);
  const previousPassages = new Map(previous?.passages.map((passage) => [
    passage.id,
    passage
  ]) ?? []);
  const passages: KpEconomicsDemandShiftLessonPassage[] = [];
  const compiledPassageIds: string[] = [];
  for (const passage of compiledSource.passages) {
    const previousPassage = previousPassages.get(passage.id);
    if (previousPassage !== undefined &&
        samePassageSource(previousSources.get(passage.id), passage)) {
      passages.push(previousPassage);
      continue;
    }
    try {
      passages.push(...compileKpEconomicsTwoColumnParagraphs(Object.freeze({
        schemaVersion: compiledSource.schemaVersion,
        passages: Object.freeze([passage])
      })));
      compiledPassageIds.push(passage.id);
    } catch (error) {
      throw new KpEconomicsLessonBufferCompileError(passage.id, error);
    }
  }
  return Object.freeze({
    buffer,
    passages: Object.freeze(passages),
    compiledPassageIds: Object.freeze(compiledPassageIds)
  });
}

function samePassageSource(
  left: ReturnType<typeof compileKpEconomicsLessonBufferSource>["passages"][number] |
    undefined,
  right: ReturnType<typeof compileKpEconomicsLessonBufferSource>["passages"][number]
): boolean {
  return left !== undefined && left.id === right.id && left.role === right.role &&
    left.motionBlockId === right.motionBlockId &&
    left.sourceText === right.sourceText;
}

function diagnosticFromError(
  source: string,
  error: unknown
): KpEconomicsLessonBufferDiagnostic {
  const message = error instanceof Error ? error.message : "Compilation failed.";
  const passageId = error instanceof KpEconomicsLessonBufferCompileError
    ? error.passageId
    : passageIdFromMessage(message);
  const line = passageId === undefined
    ? diagnosticLineForMessage(source, message)
    : passageSourceLine(source, passageId);
  return Object.freeze({
    code: error instanceof KpEconomicsLessonBufferCompileError
      ? "KP_BUFFER_COMPILE"
      : "KP_BUFFER_PARSE",
    message,
    line,
    column: 1,
    ...(passageId === undefined ? {} : { passageId })
  });
}

function passageIdFromMessage(message: string): string | undefined {
  return /(?:Passage|passage) ([a-z0-9-]+)/u.exec(message)?.[1];
}

function passageSourceLine(source: string, passageId: string): number {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const directiveIndex = lines.findIndex((line) =>
    line.startsWith("<!-- kp:passage ") &&
    line.includes(`\"id\":\"${passageId}\"`)
  );
  if (directiveIndex < 0) return 1;
  const sourceOffset = lines.slice(directiveIndex).findIndex(
    (line) => line === "<!-- kp:source -->"
  );
  return sourceOffset < 0 ? directiveIndex + 1 : directiveIndex + sourceOffset + 2;
}

function diagnosticLineForMessage(source: string, message: string): number {
  if (/schema/iu.test(message)) return 1;
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const kind = /kp:([a-z-]+)/u.exec(message)?.[1];
  if (kind === undefined) return 1;
  const index = lines.findIndex((line) => line.startsWith(`<!-- kp:${kind}`));
  return index < 0 ? 1 : index + 1;
}

function restorePassageId(input: {
  readonly requestedPassageId: string;
  readonly previousPassageIds: readonly string[];
  readonly nextPassageIds: readonly string[];
}): string {
  if (input.nextPassageIds.includes(input.requestedPassageId)) {
    return input.requestedPassageId;
  }
  const previousIndex = input.previousPassageIds.indexOf(
    input.requestedPassageId
  );
  if (previousIndex >= 0) {
    for (let distance = 1; distance < input.previousPassageIds.length; distance += 1) {
      const following = input.previousPassageIds[previousIndex + distance];
      if (following !== undefined && input.nextPassageIds.includes(following)) {
        return following;
      }
      const preceding = input.previousPassageIds[previousIndex - distance];
      if (preceding !== undefined && input.nextPassageIds.includes(preceding)) {
        return preceding;
      }
    }
  }
  const fallback = input.nextPassageIds[0];
  if (fallback === undefined) throw new Error("Preview requires one stable passage.");
  return fallback;
}

function freezeSnapshot(
  snapshot: KpEconomicsLessonBufferPreviewSnapshot
): KpEconomicsLessonBufferPreviewSnapshot {
  return Object.freeze({
    ...snapshot,
    diagnostics: Object.freeze([...snapshot.diagnostics]),
    compiledPassageIds: Object.freeze([...snapshot.compiledPassageIds])
  });
}
