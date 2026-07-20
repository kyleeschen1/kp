import type { IncomingMessage, ServerResponse } from "node:http";

import { KpDevReviewInboxService } from "./dev-review-inbox.ts";

const requestBodyLimitBytes = 128 * 1024;
const capabilityHeader = "x-kp-dev-review";

export function createKpDevReviewHttpAdapter(
  service: KpDevReviewInboxService | undefined
): {
  handle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean>;
} {
  return {
    async handle(request, response, url) {
      if (url.pathname !== "/api/dev/reviews") return false;
      // Disabled servers deliberately look identical to servers without this route.
      if (service === undefined || request.headers[capabilityHeader] !== "1") return false;

      if (request.method === "GET") {
        sendJson(response, 200, service.read());
        return true;
      }
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "method_not_allowed" });
        return true;
      }
      if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
        sendJson(response, 415, { error: "unsupported_media_type" });
        return true;
      }

      try {
        const input = await readBoundedJson(request);
        const note = await service.createNote(input);
        sendJson(response, 201, note);
      } catch (error) {
        if (error instanceof KpDevReviewPayloadTooLargeError) {
          sendJson(response, 413, { error: "payload_too_large" });
          return true;
        }
        sendJson(response, 400, { error: "invalid_request" });
      }
      return true;
    }
  };
}

async function readBoundedJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.byteLength;
    if (receivedBytes > requestBodyLimitBytes) throw new KpDevReviewPayloadTooLargeError();
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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

class KpDevReviewPayloadTooLargeError extends Error {}
