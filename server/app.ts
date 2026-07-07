import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

interface HealthResponse {
  status: "ok";
  service: "kinetic-press-api";
}

interface NotFoundResponse {
  error: "not_found";
}

type ApiResponse = HealthResponse | NotFoundResponse;

export function createAppServer(): Server {
  return createServer((request, response) => {
    handleRequest(request, response);
  });
}

function handleRequest(request: IncomingMessage, response: ServerResponse): void {
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

  sendJson(response, 404, { error: "not_found" });
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
