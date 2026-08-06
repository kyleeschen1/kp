import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  applyKpEconomicsDraftToTwoColumnSource,
  parseKpEconomicsLessonSourceSaveRequest,
  parseKpEconomicsTwoColumnSource,
  serializeKpEconomicsTwoColumnSource
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";

export interface KpEconomicsLessonSourceSaveResult {
  readonly schemaVersion: "kp.economics-lesson-source-save-result.v1";
  readonly sourcePath: string;
  readonly changed: boolean;
}

export class KpEconomicsLessonSourceValidationError extends Error {}
export class KpEconomicsLessonSourceRegenerationError extends Error {}

let temporarySequence = 0;

export class KpEconomicsLessonSourceStore {
  readonly #sourceFile: string;
  readonly #sourcePath: string;
  readonly #regenerate: () => Promise<void>;
  #pending: Promise<void> = Promise.resolve();

  constructor(options: {
    readonly sourceFile: string;
    readonly sourcePath: string;
    readonly regenerate: () => Promise<void>;
  }) {
    this.#sourceFile = options.sourceFile;
    this.#sourcePath = options.sourcePath;
    this.#regenerate = options.regenerate;
  }

  save(value: unknown): Promise<KpEconomicsLessonSourceSaveResult> {
    const operation = this.#pending.then(() => this.#save(value));
    this.#pending = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async #save(value: unknown): Promise<KpEconomicsLessonSourceSaveResult> {
    let request;
    let current;
    try {
      request = parseKpEconomicsLessonSourceSaveRequest(value);
      current = parseKpEconomicsTwoColumnSource(JSON.parse(
        await readFile(this.#sourceFile, "utf8")
      ));
    } catch (error) {
      throw new KpEconomicsLessonSourceValidationError(
        error instanceof Error ? error.message : "Invalid lesson source."
      );
    }

    let nextSource: string;
    try {
      nextSource = serializeKpEconomicsTwoColumnSource(
        applyKpEconomicsDraftToTwoColumnSource({ current, request })
      );
    } catch (error) {
      throw new KpEconomicsLessonSourceValidationError(
        error instanceof Error ? error.message : "Invalid lesson draft."
      );
    }

    const previousSource = serializeKpEconomicsTwoColumnSource(current);
    const changed = nextSource !== previousSource;
    if (changed) await writeAtomically(this.#sourceFile, nextSource);

    try {
      await this.#regenerate();
    } catch (error) {
      if (changed) {
        await writeAtomically(this.#sourceFile, previousSource);
        try {
          await this.#regenerate();
        } catch {
          // Preserve the original regeneration failure; source rollback is
          // already durable and a later explicit save can rebuild artifacts.
        }
      }
      throw new KpEconomicsLessonSourceRegenerationError(
        error instanceof Error ? error.message : "Publication regeneration failed."
      );
    }

    return Object.freeze({
      schemaVersion: "kp.economics-lesson-source-save-result.v1",
      sourcePath: this.#sourcePath,
      changed
    });
  }
}

async function writeAtomically(target: string, source: string): Promise<void> {
  const temporaryFile = join(
    dirname(target),
    `.kp-source-save-${process.pid}-${temporarySequence++}.tmp`
  );
  try {
    await writeFile(temporaryFile, source, { encoding: "utf8", flag: "wx" });
    await rename(temporaryFile, target);
  } finally {
    await rm(temporaryFile, { force: true });
  }
}
