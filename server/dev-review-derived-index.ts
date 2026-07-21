import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { kpDevReviewInboxV2Schema } from "../protocols/dev-review-v2-schema.ts";
import type { KpDevReviewStoredEvent } from "../protocols/dev-review-stored.ts";
import type { KpDevReviewInboxV2 } from "../protocols/dev-review-v2.ts";
import { projectKpDevReviewRoundInbox } from "./dev-review-round-inbox.ts";

export const KP_DEV_REVIEW_DERIVED_INDEX_FILENAME = "derived-index.v1.json";
export const KP_DEV_REVIEW_DERIVED_INDEX_SCHEMA_VERSION =
  "kp.dev-review.derived-index.v1" as const;

export interface KpDevReviewDerivedIndexV1 {
  readonly schemaVersion: typeof KP_DEV_REVIEW_DERIVED_INDEX_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly source: {
    readonly eventCount: number;
    readonly canonicalByteLength: number;
    readonly digest: string;
  };
  readonly counts: {
    readonly lifetime: number;
    readonly current: number;
    readonly currentNew: number;
  };
  readonly inbox: KpDevReviewInboxV2;
}

export interface KpDevReviewDerivedIndexOptions {
  readonly now?: () => Date;
}

export class KpDevReviewDerivedIndex {
  readonly #indexFile: string;
  readonly #now: () => Date;

  private constructor(indexFile: string, options: KpDevReviewDerivedIndexOptions) {
    this.#indexFile = indexFile;
    this.#now = options.now ?? (() => new Date());
  }

  static async open(
    rootDirectory: string,
    options: KpDevReviewDerivedIndexOptions = {}
  ): Promise<KpDevReviewDerivedIndex> {
    await mkdir(rootDirectory, { recursive: true, mode: 0o700 });
    return new KpDevReviewDerivedIndex(
      join(rootDirectory, KP_DEV_REVIEW_DERIVED_INDEX_FILENAME),
      options
    );
  }

  async read(
    events: readonly KpDevReviewStoredEvent[]
  ): Promise<KpDevReviewDerivedIndexV1 | undefined> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(this.#indexFile, "utf8"));
    } catch (error) {
      if (isMissingFile(error) || error instanceof SyntaxError) return undefined;
      throw error;
    }
    const index = parseDerivedIndex(parsed);
    if (index === undefined) return undefined;
    const source = fingerprint(events);
    if (
      index.source.eventCount !== source.eventCount ||
      index.source.canonicalByteLength !== source.canonicalByteLength ||
      index.source.digest !== source.digest
    ) {
      return undefined;
    }
    return structuredClone(index);
  }

  async rebuild(
    events: readonly KpDevReviewStoredEvent[]
  ): Promise<KpDevReviewDerivedIndexV1> {
    const inbox = projectKpDevReviewRoundInbox(events);
    const currentNotes = inbox.notes.filter((note) => note.roundId === inbox.currentRoundId);
    const index: KpDevReviewDerivedIndexV1 = {
      schemaVersion: KP_DEV_REVIEW_DERIVED_INDEX_SCHEMA_VERSION,
      generatedAt: this.#now().toISOString(),
      source: fingerprint(events),
      counts: {
        lifetime: inbox.notes.length,
        current: currentNotes.length,
        currentNew: currentNotes.filter((note) => note.status === "new").length
      },
      inbox
    };
    const temporaryFile = `${this.#indexFile}.${process.pid}.tmp`;
    await writeFile(temporaryFile, `${JSON.stringify(index)}\n`, {
      encoding: "utf8",
      mode: 0o600
    });
    // Atomic replacement means interruption can only lose disposable derived state.
    await rename(temporaryFile, this.#indexFile);
    return structuredClone(index);
  }
}

function fingerprint(events: readonly KpDevReviewStoredEvent[]): KpDevReviewDerivedIndexV1["source"] {
  const canonical = events.length === 0
    ? ""
    : `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
  return {
    eventCount: events.length,
    canonicalByteLength: Buffer.byteLength(canonical),
    digest: `sha256:${createHash("sha256").update(canonical).digest("hex")}`
  };
}

function parseDerivedIndex(input: unknown): KpDevReviewDerivedIndexV1 | undefined {
  if (!isRecord(input) || input["schemaVersion"] !== KP_DEV_REVIEW_DERIVED_INDEX_SCHEMA_VERSION) {
    return undefined;
  }
  const source = input["source"];
  const counts = input["counts"];
  if (
    typeof input["generatedAt"] !== "string" ||
    !isRecord(source) ||
    !isNonNegativeInteger(source["eventCount"]) ||
    !isNonNegativeInteger(source["canonicalByteLength"]) ||
    typeof source["digest"] !== "string" ||
    !isRecord(counts) ||
    !isNonNegativeInteger(counts["lifetime"]) ||
    !isNonNegativeInteger(counts["current"]) ||
    !isNonNegativeInteger(counts["currentNew"])
  ) {
    return undefined;
  }
  try {
    const inbox = kpDevReviewInboxV2Schema.parse(input["inbox"]);
    const currentNotes = inbox.notes.filter((note) => note.roundId === inbox.currentRoundId);
    if (
      counts["lifetime"] !== inbox.notes.length ||
      counts["current"] !== currentNotes.length ||
      counts["currentNew"] !== currentNotes.filter((note) => note.status === "new").length
    ) {
      return undefined;
    }
    return {
      schemaVersion: KP_DEV_REVIEW_DERIVED_INDEX_SCHEMA_VERSION,
      generatedAt: input["generatedAt"],
      source: {
        eventCount: source["eventCount"],
        canonicalByteLength: source["canonicalByteLength"],
        digest: source["digest"]
      },
      counts: {
        lifetime: counts["lifetime"],
        current: counts["current"],
        currentNew: counts["currentNew"]
      },
      inbox
    };
  } catch {
    return undefined;
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isNonNegativeInteger(input: unknown): input is number {
  return typeof input === "number" && Number.isSafeInteger(input) && input >= 0;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
