import {
  generateLinearProblemRequestSchema,
  generateLinearProblemResponseSchema,
  linearProblemErrorSchema,
  verifyLinearSolutionRequestSchema,
  verifyLinearSolutionResponseSchema,
  verifyLinearStepRequestSchema,
  verifyLinearStepResponseSchema,
  type GenerateLinearProblemRequestDto,
  type GenerateLinearProblemResponseDto,
  type LinearProblemErrorDto,
  type ProtocolSchema,
  type VerifyLinearSolutionRequestDto,
  type VerifyLinearSolutionResponseDto,
  type VerifyLinearStepRequestDto,
  type VerifyLinearStepResponseDto
} from "../../protocols/public-api.ts";

const DEFAULT_ENDPOINT = "/api/v1/linear-problems";

export interface KpLinearProblemHttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

export interface KpLinearProblemFetch {
  (input: string, init: {
    readonly method: "POST";
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly signal?: AbortSignal;
  }): Promise<KpLinearProblemHttpResponse>;
}

export interface KpLinearProblemClient {
  generate(
    request: GenerateLinearProblemRequestDto,
    options?: { readonly signal?: AbortSignal }
  ): Promise<GenerateLinearProblemResponseDto>;
  verifyStep(
    request: VerifyLinearStepRequestDto,
    options?: { readonly signal?: AbortSignal }
  ): Promise<VerifyLinearStepResponseDto>;
  verifySolution(
    request: VerifyLinearSolutionRequestDto,
    options?: { readonly signal?: AbortSignal }
  ): Promise<VerifyLinearSolutionResponseDto>;
}

export class KpLinearProblemClientError extends Error {
  readonly category: "transport" | "protocol" | "schema";
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly protocolError: LinearProblemErrorDto | undefined;

  constructor(input: {
    readonly category: "transport" | "protocol" | "schema";
    readonly message: string;
    readonly status?: number;
    readonly retryable?: boolean;
    readonly protocolError?: LinearProblemErrorDto;
  }) {
    super(input.message);
    this.name = "KpLinearProblemClientError";
    this.category = input.category;
    this.status = input.status;
    this.retryable = input.retryable ?? false;
    this.protocolError = input.protocolError;
  }
}

export function createLinearProblemClient(options: {
  readonly endpoint?: string;
  readonly fetch?: KpLinearProblemFetch;
} = {}): KpLinearProblemClient {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  requireVersionedEndpoint(endpoint);
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  return Object.freeze({
    generate: async (
      request: GenerateLinearProblemRequestDto,
      requestOptions: { readonly signal?: AbortSignal } = {}
    ) => send(
      fetcher,
      endpoint,
      generateLinearProblemRequestSchema.parse(request),
      generateLinearProblemResponseSchema,
      requestOptions.signal
    ),
    verifyStep: async (
      request: VerifyLinearStepRequestDto,
      requestOptions: { readonly signal?: AbortSignal } = {}
    ) => send(
      fetcher,
      endpoint,
      verifyLinearStepRequestSchema.parse(request),
      verifyLinearStepResponseSchema,
      requestOptions.signal
    ),
    verifySolution: async (
      request: VerifyLinearSolutionRequestDto,
      requestOptions: { readonly signal?: AbortSignal } = {}
    ) => send(
      fetcher,
      endpoint,
      verifyLinearSolutionRequestSchema.parse(request),
      verifyLinearSolutionResponseSchema,
      requestOptions.signal
    )
  });
}

async function send<Response>(
  fetcher: KpLinearProblemFetch,
  endpoint: string,
  request: unknown,
  responseSchema: ProtocolSchema<Response>,
  signal: AbortSignal | undefined
): Promise<Response> {
  let response: KpLinearProblemHttpResponse;
  try {
    response = await fetcher(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify(request),
      ...(signal === undefined ? {} : { signal })
    });
  } catch (error) {
    throw new KpLinearProblemClientError({
      category: "transport",
      message: error instanceof Error ? error.message : String(error),
      retryable: true
    });
  }
  if (!response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new KpLinearProblemClientError({
      category: "transport",
      message: "Linear-problem endpoint returned a non-JSON response.",
      status: response.status,
      retryable: response.status >= 500
    });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new KpLinearProblemClientError({
      category: "transport",
      message: "Linear-problem endpoint returned invalid JSON.",
      status: response.status,
      retryable: response.status >= 500
    });
  }
  const protocolError = linearProblemErrorSchema.safeParse(body);
  if (protocolError.success) {
    throw new KpLinearProblemClientError({
      category: "protocol",
      message: protocolError.value.message,
      status: response.status,
      retryable: protocolError.value.retryable,
      protocolError: protocolError.value
    });
  }
  if (!response.ok) {
    throw new KpLinearProblemClientError({
      category: "transport",
      message: `Linear-problem endpoint failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: response.status >= 500
    });
  }
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new KpLinearProblemClientError({
      category: "schema",
      message: parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "),
      status: response.status
    });
  }
  return parsed.value;
}

function requireVersionedEndpoint(endpoint: string): void {
  if (!/^(?:https?:\/\/[^/?#]+)?\/api\/v1\/linear-problems$/.test(endpoint)) {
    throw new Error("Linear-problem client endpoint must be the versioned /api/v1/linear-problems route.");
  }
}
