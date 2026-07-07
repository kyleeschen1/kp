import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

import { compileHtmlDocument } from "../src/compiler/html-asset.ts";
import type { KpDocument } from "../src/semantic/document.ts";

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

export function createAppServer(): Server {
  return createServer((request, response) => {
    handleRequest(request, response).catch((error: unknown) => {
      console.error(error);
      sendJson(response, 400, { error: "invalid_request" });
    });
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "127.0.0.1"}`
  );

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
