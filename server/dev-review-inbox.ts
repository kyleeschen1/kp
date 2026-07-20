import {
  kpDevReviewCreateRequestSchema,
  kpDevReviewEventSchema
} from "../protocols/dev-review-schema.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION,
  type KpDevReviewCreateRequestV1,
  type KpDevReviewEventV1,
  type KpDevReviewInboxV1,
  type KpDevReviewNoteV1,
  type KpDevReviewStatusV1
} from "../protocols/dev-review-v1.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

export interface KpDevReviewInboxServiceOptions {
  readonly now?: () => Date;
}

export class KpDevReviewInboxService {
  readonly #store: KpDevReviewEventStore;
  readonly #now: () => Date;
  #mutationTail: Promise<unknown> = Promise.resolve();

  constructor(store: KpDevReviewEventStore, options: KpDevReviewInboxServiceOptions = {}) {
    this.#store = store;
    this.#now = options.now ?? (() => new Date());
  }

  read(): KpDevReviewInboxV1 {
    return projectKpDevReviewInbox(this.#store.readAll());
  }

  createNote(request: KpDevReviewCreateRequestV1): Promise<KpDevReviewNoteV1> {
    return this.#enqueue(async () => {
      const validated = kpDevReviewCreateRequestSchema.parse(request);
      const inbox = this.read();
      const sequence = (inbox.notes.at(-1)?.sequence ?? 0) + 1;
      const occurredAt = this.#now().toISOString();
      const note: KpDevReviewNoteV1 = {
        ...validated,
        id: `review-note.${sequence}.${Date.parse(occurredAt).toString(36)}`,
        sequence,
        status: "new"
      };
      await this.#store.append(kpDevReviewEventSchema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
        kind: "note-created",
        occurredAt,
        note
      }));
      return structuredClone(note);
    });
  }

  setStatus(noteId: string, status: KpDevReviewStatusV1, reason?: string): Promise<void> {
    return this.#enqueue(async () => {
      if (!this.read().notes.some((note) => note.id === noteId)) {
        throw new Error(`Unknown review note ${noteId}`);
      }
      await this.#store.append(kpDevReviewEventSchema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
        kind: "status-changed",
        occurredAt: this.#now().toISOString(),
        noteId,
        status,
        ...(reason === undefined ? {} : { reason })
      }));
    });
  }

  advanceCursor(consumerId: string, throughSequence: number): Promise<void> {
    return this.#enqueue(async () => {
      const inbox = this.read();
      const highestSequence = inbox.notes.at(-1)?.sequence ?? 0;
      const current = inbox.cursors[consumerId] ?? 0;
      if (throughSequence < current || throughSequence > highestSequence) {
        throw new RangeError(`Cursor must advance from ${current} through at most ${highestSequence}`);
      }
      await this.#store.append(kpDevReviewEventSchema.parse({
        schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
        kind: "cursor-advanced",
        occurredAt: this.#now().toISOString(),
        consumerId,
        throughSequence
      }));
    });
  }

  #enqueue<Value>(mutation: () => Promise<Value>): Promise<Value> {
    const result = this.#mutationTail.then(mutation);
    this.#mutationTail = result.catch(() => undefined);
    return result;
  }
}

export function projectKpDevReviewInbox(
  events: readonly KpDevReviewEventV1[]
): KpDevReviewInboxV1 {
  const notes = new Map<string, KpDevReviewNoteV1>();
  const cursors: Record<string, number> = {};
  let lastSequence = 0;

  for (const event of events) {
    if (event.kind === "note-created") {
      if (notes.has(event.note.id) || event.note.sequence <= lastSequence) {
        throw new Error(`Review note sequence ${event.note.sequence} is duplicate or out of order`);
      }
      notes.set(event.note.id, structuredClone(event.note));
      lastSequence = event.note.sequence;
      continue;
    }
    if (event.kind === "status-changed") {
      const note = notes.get(event.noteId);
      if (note === undefined) throw new Error(`Status references unknown review note ${event.noteId}`);
      notes.set(event.noteId, { ...note, status: event.status });
      continue;
    }
    const previous = cursors[event.consumerId] ?? 0;
    if (event.throughSequence < previous || event.throughSequence > lastSequence) {
      throw new Error(`Invalid cursor ${event.consumerId}:${event.throughSequence}`);
    }
    cursors[event.consumerId] = event.throughSequence;
  }

  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    notes: [...notes.values()].sort((left, right) => left.sequence - right.sequence),
    cursors
  };
}
