import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

import type { LinearProblemProviderV1 } from "../protocols/public-api.ts";
import { compileHtmlDocument } from "../src/compiler/html-asset.ts";
import type { KpDocument } from "../src/semantic/document.ts";
import { createLinearProblemHttpAdapter } from "./linear-problem-http-adapter.ts";

interface HealthResponse {
  status: "ok";
  service: "kinetic-press-api";
}

interface NotFoundResponse {
  error: "not_found";
}

interface InvalidRequestResponse {
  error: "invalid_request";
}

type ApiResponse = HealthResponse | NotFoundResponse | InvalidRequestResponse;

export function createAppServer(options: {
  readonly linearProblemProvider: LinearProblemProviderV1;
}): Server {
  const linearProblemAdapter = createLinearProblemHttpAdapter(options.linearProblemProvider);
  return createServer((request, response) => {
    handleRequest(request, response, linearProblemAdapter).catch((error: unknown) => {
      console.error(error);
      sendJson(response, 400, { error: "invalid_request" });
    });
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  linearProblemAdapter: ReturnType<typeof createLinearProblemHttpAdapter>
): Promise<void> {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "127.0.0.1"}`
  );

  if (await linearProblemAdapter.handle(request, response, url)) return;

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "kinetic-press-api"
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/compile") {
    const document = await readJsonBody<KpDocument>(request);
    sendHtml(response, 200, compileHtmlDocument(document));
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  let body = "";

  for await (const chunk of request) {
    body += String(chunk);
  }

  return JSON.parse(body) as T;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: ApiResponse
): void {
  const payload = JSON.stringify(body);

  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
    "content-type": "application/json; charset=utf-8"
  });
  response.end(payload);
}

function sendHtml(
  response: ServerResponse,
  statusCode: number,
  body: string
): void {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
    "content-type": "text/html; charset=utf-8"
  });
  response.end(body);
}
