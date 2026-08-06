import type { IncomingMessage, ServerResponse } from "node:http";

import {
  KpEconomicsLessonSourceRegenerationError,
  KpEconomicsLessonSourceStore,
  KpEconomicsLessonSourceValidationError
} from "./economics-lesson-source-store.ts";

export const kpEconomicsLessonSourceEndpoint =
  "/api/dev/lesson-sources/economics-demand-shift-two-column";
export const kpEconomicsLessonSourceCapabilityHeader =
  "x-kp-lesson-source-write";

const requestBodyLimitBytes = 64 * 1024;

export function createKpEconomicsLessonSourceHttpAdapter(
  store: KpEconomicsLessonSourceStore | undefined
): {
  handle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean>;
} {
  return {
    async handle(request, response, url) {
      if (url.pathname !== kpEconomicsLessonSourceEndpoint ||
          store === undefined ||
          request.headers[kpEconomicsLessonSourceCapabilityHeader] !== "1") {
        return false;
      }
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "method_not_allowed" });
        return true;
      }
      if (!request.headers["content-type"]?.toLowerCase().startsWith(
        "application/json"
      )) {
        sendJson(response, 415, { error: "unsupported_media_type" });
        return true;
      }
      try {
        sendJson(response, 200, await store.save(await readBoundedJson(request)));
      } catch (error) {
        if (error instanceof KpLessonSourcePayloadTooLargeError) {
          sendJson(response, 413, { error: "payload_too_large" });
        } else if (error instanceof KpLessonSourceInvalidJsonError) {
          sendJson(response, 400, { error: "invalid_json" });
        } else if (error instanceof KpEconomicsLessonSourceValidationError) {
          sendJson(response, 400, {
            error: "invalid_lesson_source",
            message: error.message
          });
        } else if (error instanceof KpEconomicsLessonSourceRegenerationError) {
          sendJson(response, 500, {
            error: "publication_regeneration_failed",
            message: error.message
          });
        } else {
          sendJson(response, 500, { error: "lesson_source_save_failed" });
        }
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
    if (receivedBytes > requestBodyLimitBytes) {
      throw new KpLessonSourcePayloadTooLargeError();
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new KpLessonSourceInvalidJsonError();
  }
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
    "content-type": "application/json; charset=utf-8"
  });
  response.end(payload);
}

class KpLessonSourcePayloadTooLargeError extends Error {}
class KpLessonSourceInvalidJsonError extends Error {}
