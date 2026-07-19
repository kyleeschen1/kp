import { strict as assert } from "node:assert";
import type { Server } from "node:http";
import test from "node:test";

import { createExactRationalLinearProblemProvider } from "../providers/linear-problems/public-api.ts";
import { createAppServer } from "./app.ts";

test("GET /api/health returns the backend health payload", async () => {
  const server = testServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ok",
      service: "kinetic-press-api"
    });
  } finally {
    await close(server);
  }
});

test("unknown API routes return a JSON 404", async () => {
  const server = testServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/missing`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found" });
  } finally {
    await close(server);
  }
});

test("POST /api/compile returns a compiled HTML asset", async () => {
  const server = testServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/compile`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "identity-matrix-demo",
        title: "Identity Matrix",
        version: 1,
        objects: [
          {
            id: "identity-3x3",
            type: "matrix",
            label: "I_3",
            rows: [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1]
            ]
          }
        ]
      })
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await response.text(), /data-kp-document="identity-matrix-demo"/);
  } finally {
    await close(server);
  }
});

test("GET canonical concept route returns meaningful no-JS Review HTML", async () => {
  const server = testServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(
      `${baseUrl}/concepts/mathematics/linear-equations/solve-with-balance`
    );
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.match(response.headers.get("x-kp-artifact-integrity") ?? "", /^sha256:/);
    assert.match(html, /data-kp-concept-review="true"/);
    assert.match(html, /Keep both sides equal/);
    assert.match(html, /class="katex-display"/);
    assert.match(html, /data-kp-review-balance-svg/);
    assert.match(html, /data-kp-review-inspection/);
    assert.doesNotMatch(html, /<script type="module"/);
  } finally {
    await close(server);
  }
});

test("POST /api/v1/linear-problems dispatches deterministic validated protocol requests", async () => {
  const server = testServer();
  const baseUrl = await listen(server);
  const request = {
    schemaVersion: "linear-problem.generate.request.v1",
    seed: "http-fixture",
    constraints: {
      minimumCoefficient: -9,
      maximumCoefficient: 9,
      allowFractionalSolution: true
    }
  };

  try {
    const first = await postJson(baseUrl, request);
    const second = await postJson(baseUrl, request);
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), await second.json());
  } finally {
    await close(server);
  }
});

test("linear-problem transport returns structured errors for malformed and oversized bodies", async () => {
  const server = testServer();
  const baseUrl = await listen(server);

  try {
    const malformed = await fetch(`${baseUrl}/api/v1/linear-problems`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{"
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json() as { code: string }).code, "invalid-request");

    const oversized = await fetch(`${baseUrl}/api/v1/linear-problems`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schemaVersion: "linear-problem.generate.request.v1", padding: "x".repeat(70_000) })
    });
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json() as { code: string }).code, "payload-too-large");
  } finally {
    await close(server);
  }
});

function testServer(): Server {
  return createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider()
  });
}

function postJson(baseUrl: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/api/v1/linear-problems`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Expected test server to listen on a TCP port.");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
        return;
      }

      reject(error);
    });
  });
}
