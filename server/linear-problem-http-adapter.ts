import type { IncomingMessage, ServerResponse } from "node:http";

import {
  linearProblemErrorSchema,
  type LinearProblemErrorDto,
  type LinearProblemProviderV1
} from "../protocols/public-api.ts";

const LINEAR_PROBLEM_PATH = "/api/v1/linear-problems";
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export interface LinearProblemHttpAdapter {
  handle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean>;
}

export function createLinearProblemHttpAdapter(
  provider: LinearProblemProviderV1,
  options: { readonly maxBodyBytes?: number } = {}
): LinearProblemHttpAdapter {
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  return {
    async handle(request, response, url) {
      if (url.pathname !== LINEAR_PROBLEM_PATH) return false;
      if (request.method !== "POST") {
        sendJson(response, 405, protocolError("invalid-request", "Expected POST request.", ["$.method"]));
        return true;
      }
      if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
        sendJson(response, 415, protocolError("invalid-request", "Expected application/json.", ["$.headers.content-type"]));
        return true;
      }

      let input: unknown;
      try {
        input = await readBoundedJson(request, maxBodyBytes);
      } catch (error) {
        const tooLarge = error instanceof PayloadTooLargeError;
        sendJson(response, tooLarge ? 413 : 400, protocolError(
          tooLarge ? "payload-too-large" : "invalid-request",
          error instanceof Error ? error.message : "Invalid JSON body.",
          ["$"],
          tooLarge
        ));
        return true;
      }

      const schemaVersion = readSchemaVersion(input);
      const output = schemaVersion === "linear-problem.generate.request.v1"
        ? provider.generate(input)
        : schemaVersion === "linear-problem.verify-step.request.v1"
          ? provider.verifyStep(input)
          : schemaVersion === "linear-problem.verify-solution.request.v1"
            ? provider.verifySolution(input)
            : protocolError("unsupported-protocol", "Unknown linear-problem request schema.", ["$.schemaVersion"]);
      const error = linearProblemErrorSchema.safeParse(output).success;
      sendJson(response, error ? 400 : 200, output);
      return true;
    }
  };
}

class PayloadTooLargeError extends Error {
  constructor(maxBodyBytes: number) {
    super(`Request body exceeds ${maxBodyBytes} bytes.`);
    this.name = "PayloadTooLargeError";
  }
}

async function readBoundedJson(request: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers["content-length"] ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    throw new PayloadTooLargeError(maxBodyBytes);
  }

  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.byteLength;
    if (receivedBytes > maxBodyBytes) throw new PayloadTooLargeError(maxBodyBytes);
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  if (body.length === 0) throw new SyntaxError("Expected a JSON request body.");
  return JSON.parse(body) as unknown;
}

function readSchemaVersion(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  return "schemaVersion" in input && typeof input.schemaVersion === "string"
    ? input.schemaVersion
    : undefined;
}

function protocolError(
  code: LinearProblemErrorDto["code"],
  message: string,
  path: readonly string[],
  retryable = false
): LinearProblemErrorDto {
  return linearProblemErrorSchema.parse({
    schemaVersion: "linear-problem.error.v1",
    code,
    message,
    path,
    retryable
  });
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
    "content-type": "application/json; charset=utf-8"
  });
  response.end(payload);
}

