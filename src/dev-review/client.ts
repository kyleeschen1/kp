import {
  kpDevReviewCreateRequestSchema,
  kpDevReviewInboxSchema,
  kpDevReviewNoteSchema
} from "../../protocols/dev-review-schema.ts";
import type {
  KpDevReviewCreateRequestV1,
  KpDevReviewInboxV1,
  KpDevReviewNoteV1
} from "../../protocols/dev-review-v1.ts";

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
