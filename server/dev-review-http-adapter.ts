import type { IncomingMessage, ServerResponse } from "node:http";

import {
  kpDevReviewAdvanceCursorOperationV2Schema,
  kpDevReviewCloseRoundOperationV2Schema,
  kpDevReviewOpenRoundOperationV2Schema,
  kpDevReviewQueryInputSchema,
  kpDevReviewSetStatusOperationV2Schema
} from "../protocols/dev-review-operations-v2-schema.ts";
import { KpDevReviewInboxService } from "./dev-review-inbox.ts";
import { KpDevReviewRoundInboxService } from "./dev-review-round-inbox.ts";

const requestBodyLimitBytes = 128 * 1024;
const capabilityHeader = "x-kp-dev-review";

export function createKpDevReviewHttpAdapter(
  service: KpDevReviewInboxService | undefined,
  roundService?: KpDevReviewRoundInboxService | undefined
): {
  handle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean>;
} {
  return {
    async handle(request, response, url) {
      // Disabled servers deliberately look identical to servers without this route.
      if (request.headers[capabilityHeader] !== "1") return false;
      if (url.pathname.startsWith("/api/dev/reviews/v2/")) {
        if (roundService === undefined) return false;
        return handleRoundRequest(roundService, request, response, url);
      }
      if (url.pathname !== "/api/dev/reviews" || service === undefined) return false;

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

async function handleRoundRequest(
  service: KpDevReviewRoundInboxService,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL
): Promise<boolean> {
  const routes = new Set([
    "/api/dev/reviews/v2/query",
    "/api/dev/reviews/v2/rounds/open",
    "/api/dev/reviews/v2/rounds/close",
    "/api/dev/reviews/v2/notes",
    "/api/dev/reviews/v2/notes/status",
    "/api/dev/reviews/v2/cursors/advance"
  ]);
  if (!routes.has(url.pathname)) return false;
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "method_not_allowed" });
    return true;
  }
  if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
    sendJson(response, 415, { error: "unsupported_media_type" });
    return true;
  }
  try {
    const body = await readBoundedJson(request);
    if (url.pathname === "/api/dev/reviews/v2/query") {
      sendJson(response, 200, service.query(kpDevReviewQueryInputSchema.parse(body)));
    } else if (url.pathname === "/api/dev/reviews/v2/rounds/open") {
      sendJson(response, 201, await service.openRound(kpDevReviewOpenRoundOperationV2Schema.parse(body)));
    } else if (url.pathname === "/api/dev/reviews/v2/rounds/close") {
      const input = kpDevReviewCloseRoundOperationV2Schema.parse(body);
      await service.closeRound(input.roundId, input.reason);
      sendJson(response, 200, { ok: true });
    } else if (url.pathname === "/api/dev/reviews/v2/notes") {
      sendJson(response, 201, await service.createNote(body));
    } else if (url.pathname === "/api/dev/reviews/v2/notes/status") {
      const input = kpDevReviewSetStatusOperationV2Schema.parse(body);
      await service.setStatus(input.noteId, input.status, input.reason);
      sendJson(response, 200, { ok: true });
    } else {
      const input = kpDevReviewAdvanceCursorOperationV2Schema.parse(body);
      await service.advanceCursor(input.consumerId, input.roundId, input.throughSequence);
      sendJson(response, 200, { ok: true });
    }
  } catch (error) {
    if (error instanceof KpDevReviewPayloadTooLargeError) {
      sendJson(response, 413, { error: "payload_too_large" });
      return true;
    }
    sendJson(response, 400, { error: "invalid_request" });
  }
  return true;
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
