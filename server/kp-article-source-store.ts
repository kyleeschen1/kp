import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  kpArticleSourceSaveResultSchema,
  parseKpArticleSourceSaveRequest,
  type KpArticleSourceSaveResult
} from "../src/article/kp-article-source-save.ts";

export class KpArticleSourceValidationError extends Error {}
export class KpArticleSourceRegenerationError extends Error {}

let temporarySequence = 0;

export class KpArticleSourceStore {
  readonly #sourceFile: string;
  readonly #sourcePath: string;
  readonly #validate: (text: string) => void;
  readonly #regenerate: () => Promise<void>;
  #pending: Promise<void> = Promise.resolve();

  constructor(options: {
    readonly sourceFile: string;
    readonly sourcePath: string;
    readonly validate: (text: string) => void;
    readonly regenerate: () => Promise<void>;
  }) {
    this.#sourceFile = options.sourceFile;
    this.#sourcePath = options.sourcePath;
    this.#validate = options.validate;
    this.#regenerate = options.regenerate;
  }

  save(value: unknown): Promise<KpArticleSourceSaveResult> {
    const operation = this.#pending.then(() => this.#save(value));
    this.#pending = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async #save(value: unknown): Promise<KpArticleSourceSaveResult> {
    let request;
    let previousSource: string;
    try {
      request = parseKpArticleSourceSaveRequest(value);
      if (request.sourceId !== this.#sourcePath) {
        throw new TypeError(`This store does not own ${request.sourceId}.`);
      }
      this.#validate(request.text);
      previousSource = await readFile(this.#sourceFile, "utf8");
    } catch (error) {
      throw new KpArticleSourceValidationError(
        error instanceof Error ? error.message : "Invalid article source."
      );
    }

    const changed = request.text !== previousSource;
    if (changed) await writeAtomically(this.#sourceFile, request.text);
    try {
      await this.#regenerate();
    } catch (error) {
      if (changed) {
        await writeAtomically(this.#sourceFile, previousSource);
        try {
          await this.#regenerate();
        } catch {
          // The original compiler failure is the useful error; source truth
          // has already been restored for the next explicit write.
        }
      }
      throw new KpArticleSourceRegenerationError(
        error instanceof Error ? error.message : "Publication regeneration failed."
      );
    }
    return Object.freeze({
      schemaVersion: kpArticleSourceSaveResultSchema,
      sourcePath: this.#sourcePath,
      changed
    });
  }
}

async function writeAtomically(target: string, source: string): Promise<void> {
  const temporaryFile = join(
    dirname(target),
    `.kp-article-save-${process.pid}-${temporarySequence++}.tmp`
  );
  try {
    await writeFile(temporaryFile, source, { encoding: "utf8", flag: "wx" });
    await rename(temporaryFile, target);
  } finally {
    await rm(temporaryFile, { force: true });
  }
}
