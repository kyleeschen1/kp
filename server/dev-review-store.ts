import { mkdir, readFile, appendFile } from "node:fs/promises";
import { join } from "node:path";

import { kpDevReviewEventSchema } from "../protocols/dev-review-schema.ts";
import type { KpDevReviewEventV1 } from "../protocols/dev-review-v1.ts";

export const KP_DEV_REVIEW_EVENTS_FILENAME = "events.v1.jsonl";

export class KpDevReviewEventStore {
  readonly #eventsFile: string;
  #events: KpDevReviewEventV1[];
  #writeTail: Promise<void> = Promise.resolve();

  private constructor(eventsFile: string, events: KpDevReviewEventV1[]) {
    this.#eventsFile = eventsFile;
    this.#events = events;
  }

  static async open(rootDirectory: string): Promise<KpDevReviewEventStore> {
    await mkdir(rootDirectory, { recursive: true, mode: 0o700 });
    const eventsFile = join(rootDirectory, KP_DEV_REVIEW_EVENTS_FILENAME);
    const events = await readExistingEvents(eventsFile);
    return new KpDevReviewEventStore(eventsFile, events);
  }

  readAll(): readonly KpDevReviewEventV1[] {
    return this.#events.map((event) => structuredClone(event));
  }

  async append(event: KpDevReviewEventV1): Promise<void> {
    const validated = kpDevReviewEventSchema.parse(event);
    const write = this.#writeTail.then(async () => {
      await appendFile(this.#eventsFile, `${JSON.stringify(validated)}\n`, {
        encoding: "utf8",
        mode: 0o600
      });
      this.#events.push(validated);
    });
    // Keep the serialization chain usable after an individual filesystem failure.
    this.#writeTail = write.catch(() => undefined);
    return write;
  }
}

async function readExistingEvents(eventsFile: string): Promise<KpDevReviewEventV1[]> {
  let source: string;
  try {
    source = await readFile(eventsFile, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }

  return source
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return kpDevReviewEventSchema.parse(JSON.parse(line));
      } catch (error) {
        throw new Error(`Invalid dev review event at line ${index + 1}`, { cause: error });
      }
    });
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
