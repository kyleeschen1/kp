import {
  kpDevReviewCreateRequestSchema,
  kpDevReviewInboxSchema,
  kpDevReviewNoteSchema,
  kpDevReviewScreenshotRequestSchema,
  kpDevReviewScreenshotSchema
} from "../../protocols/dev-review-schema.ts";
import type {
  KpDevReviewCreateRequestV1,
  KpDevReviewInboxV1,
  KpDevReviewNoteV1,
  KpDevReviewScreenshotRequestV1,
  KpDevReviewScreenshotV1
} from "../../protocols/dev-review-v1.ts";
import {
  kpDevReviewAdvanceCursorOperationV2Schema,
  kpDevReviewCloseRoundOperationV2Schema,
  kpDevReviewOpenRoundOperationV2Schema,
  kpDevReviewOperationSuccessV2Schema,
  kpDevReviewQueryInputSchema,
  kpDevReviewQueryResultSchema,
  kpDevReviewSetStatusOperationV2Schema
} from "../../protocols/dev-review-operations-v2-schema.ts";
import {
  kpDevReviewCreateRequestV2Schema,
  kpDevReviewNoteV2Schema,
  kpDevReviewRoundV2Schema
} from "../../protocols/dev-review-v2-schema.ts";
import type {
  KpDevReviewAdvanceCursorOperationV2,
  KpDevReviewCloseRoundOperationV2,
  KpDevReviewOpenRoundOperationV2,
  KpDevReviewQueryInput,
  KpDevReviewQueryResult,
  KpDevReviewSetStatusOperationV2
} from "../../protocols/dev-review-operations-v2.ts";
import type {
  KpDevReviewCreateRequestV2,
  KpDevReviewNoteV2,
  KpDevReviewRoundV2
} from "../../protocols/dev-review-v2.ts";

export type KpDevReviewFetch = (input: string, init?: RequestInit) => Promise<Response>;

export class KpDevReviewClient {
  readonly #fetch: KpDevReviewFetch;
  readonly #endpoint: string;

  constructor(options: {
    readonly fetch?: KpDevReviewFetch;
    readonly endpoint?: string;
  } = {}) {
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#endpoint = options.endpoint ?? "/api/dev/reviews";
  }

  async create(request: KpDevReviewCreateRequestV1): Promise<KpDevReviewNoteV1> {
    const validated = kpDevReviewCreateRequestSchema.parse(request);
    const response = await this.#fetch(this.#endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kp-dev-review": "1"
      },
      body: JSON.stringify(validated)
    });
    await requireOk(response);
    return kpDevReviewNoteSchema.parse(await response.json()) as KpDevReviewNoteV1;
  }

  async read(): Promise<KpDevReviewInboxV1> {
    const response = await this.#fetch(this.#endpoint, {
      headers: { "x-kp-dev-review": "1" }
    });
    await requireOk(response);
    return kpDevReviewInboxSchema.parse(await response.json()) as KpDevReviewInboxV1;
  }

  async query(request: KpDevReviewQueryInput = {}): Promise<KpDevReviewQueryResult> {
    return this.#postV2("query", kpDevReviewQueryInputSchema.parse(request), (input) =>
      kpDevReviewQueryResultSchema.parse(input));
  }

  async openRound(request: KpDevReviewOpenRoundOperationV2): Promise<KpDevReviewRoundV2> {
    return this.#postV2("rounds/open", kpDevReviewOpenRoundOperationV2Schema.parse(request),
      (input) => kpDevReviewRoundV2Schema.parse(input));
  }

  async closeRound(request: KpDevReviewCloseRoundOperationV2 = {}): Promise<void> {
    await this.#postV2("rounds/close", kpDevReviewCloseRoundOperationV2Schema.parse(request), (input) =>
      kpDevReviewOperationSuccessV2Schema.parse(input));
  }

  async createNote(request: KpDevReviewCreateRequestV2): Promise<KpDevReviewNoteV2> {
    return this.#postV2("notes", kpDevReviewCreateRequestV2Schema.parse(request),
      (input) => kpDevReviewNoteV2Schema.parse(input));
  }

  async captureScreenshot(
    request: KpDevReviewScreenshotRequestV1
  ): Promise<KpDevReviewScreenshotV1> {
    return this.#postV2(
      "screenshots",
      kpDevReviewScreenshotRequestSchema.parse(request),
      (input) => kpDevReviewScreenshotSchema.parse(input)
    );
  }

  async setStatus(request: KpDevReviewSetStatusOperationV2): Promise<void> {
    await this.#postV2("notes/status", kpDevReviewSetStatusOperationV2Schema.parse(request), (input) =>
      kpDevReviewOperationSuccessV2Schema.parse(input));
  }

  async advanceCursor(request: KpDevReviewAdvanceCursorOperationV2): Promise<void> {
    await this.#postV2("cursors/advance", kpDevReviewAdvanceCursorOperationV2Schema.parse(request), (input) =>
      kpDevReviewOperationSuccessV2Schema.parse(input));
  }

  async #postV2<Value>(
    path: string,
    request: unknown,
    parse: (input: unknown) => Value
  ): Promise<Value> {
    const response = await this.#fetch(`${this.#endpoint}/v2/${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kp-dev-review": "1"
      },
      body: JSON.stringify(request)
    });
    await requireOk(response);
    return parse(await response.json());
  }
}

export class KpDevReviewClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Visual review request failed with status ${status}`);
    this.name = "KpDevReviewClientError";
    this.status = status;
  }
}

async function requireOk(response: Response): Promise<void> {
  if (!response.ok) throw new KpDevReviewClientError(response.status);
}
