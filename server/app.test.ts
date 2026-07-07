import { strict as assert } from "node:assert";
import type { Server } from "node:http";
import test from "node:test";

import { createAppServer } from "./app.ts";

test("GET /api/health returns the backend health payload", async () => {
  const server = createAppServer();
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
  const server = createAppServer();
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
  const server = createAppServer();
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
