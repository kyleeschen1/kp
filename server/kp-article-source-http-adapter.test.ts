import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { resolve } from "node:path";
import test from "node:test";

import { createExactRationalLinearProblemProvider } from
  "../providers/linear-problems/public-api.ts";
import {
  kpArticleSourceSaveSchema,
  type KpArticleSourceSaveRequest
} from "../src/article/kp-article-source-save.ts";
import { createAppServer } from "./app.ts";
import { KpArticleSourceStore } from "./kp-article-source-store.ts";

const endpoint = "/api/dev/article-sources/economics-demand-shift";
const legacyEndpoint =
  "/api/dev/lesson-sources/economics-demand-shift-two-column";
const capability = { "x-kp-article-source-write": "1" };
const sourcePath = "content/lessons/economics-demand-shift.kp.md";
const original = "---\nkp:\n  schema: kp.article.v1\n---\n\nValid article.\n";

test("canonical article route is capability gated and legacy writes stay absent", async (
  context
) => {
  const fixture = await createFixture(context, async () => undefined);
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    articleSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);

  assert.equal((await fetch(`${baseUrl}${endpoint}`)).status, 404);
  assert.equal((await fetch(`${baseUrl}${endpoint}`, { headers: capability })).status, 405);
  assert.equal((await fetch(`${baseUrl}${legacyEndpoint}`, {
    method: "POST",
    headers: { ...capability, "content-type": "application/json" },
    body: "{}"
  })).status, 404);
});

test("valid v1 source writes atomically and regenerates once", async (context) => {
  let regenerations = 0;
  const fixture = await createFixture(context, async () => {
    regenerations += 1;
  });
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    articleSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const text = original.replace("Valid article.", "Edited valid article.");
  const response = await post(baseUrl, request(text));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    schemaVersion: "kp.article-source-save-result.v1",
    sourcePath,
    changed: true
  });
  assert.equal(await readFile(fixture.sourceFile, "utf8"), text);
  assert.equal(regenerations, 1);
});

test("invalid article source never reaches disk", async (context) => {
  const fixture = await createFixture(context, async () => undefined);
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    articleSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);

  assert.equal((await post(baseUrl, request("invalid"))).status, 400);
  assert.equal((await post(baseUrl, {
    ...request(original),
    sourceId: "content/lessons/foreign.kp.md"
  })).status, 400);
  assert.equal(await readFile(fixture.sourceFile, "utf8"), original);
});

test("compiler failure restores canonical source before reporting failure", async (
  context
) => {
  let regenerations = 0;
  const fixture = await createFixture(context, async () => {
    regenerations += 1;
    throw new Error("synthetic compiler failure");
  });
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    articleSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const response = await post(
    baseUrl,
    request(original.replace("Valid article.", "Must roll back."))
  );

  assert.equal(response.status, 500);
  assert.equal(regenerations, 2);
  assert.equal(await readFile(fixture.sourceFile, "utf8"), original);
});

test("registered article endpoints select one exact source store", async (context) => {
  const economics = await createFixture(context, async () => undefined);
  const algebraRoot = resolve(
    "tmp/codex",
    `article-source-save-algebra-${randomUUID()}`
  );
  await mkdir(algebraRoot, { recursive: true });
  context.after(() => rm(algebraRoot, { recursive: true, force: true }));
  const algebraSourcePath = "content/lessons/algebra-fraction-composition.kp.md";
  const algebraSourceFile = resolve(algebraRoot, "algebra.kp.md");
  await writeFile(algebraSourceFile, original);
  const algebra = new KpArticleSourceStore({
    sourceFile: algebraSourceFile,
    sourcePath: algebraSourcePath,
    validate: () => undefined,
    regenerate: async () => undefined
  });
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    articleSourceRoutes: [{ endpoint, store: economics.store }, {
      endpoint: "/api/dev/article-sources/algebra-fraction-composition",
      store: algebra
    }]
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const text = original.replace("Valid article.", "Algebra article.");
  const response = await fetch(
    `${baseUrl}/api/dev/article-sources/algebra-fraction-composition`,
    {
      method: "POST",
      headers: { ...capability, "content-type": "application/json" },
      body: JSON.stringify({
        ...request(text),
        sourceId: algebraSourcePath
      })
    }
  );

  assert.equal(response.status, 200);
  assert.equal(await readFile(algebraSourceFile, "utf8"), text);
  assert.equal(await readFile(economics.sourceFile, "utf8"), original);
  const wrongStore = await post(baseUrl, {
    ...request(text),
    sourceId: algebraSourcePath
  });
  assert.equal(wrongStore.status, 400);
});

function request(text: string): KpArticleSourceSaveRequest {
  return {
    schemaVersion: kpArticleSourceSaveSchema,
    sourceId: sourcePath,
    text,
    revision: 1
  };
}

function post(baseUrl: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { ...capability, "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function createFixture(
  context: { after(callback: () => void | Promise<void>): void },
  regenerate: () => Promise<void>
): Promise<{ readonly sourceFile: string; readonly store: KpArticleSourceStore }> {
  const root = resolve("tmp/codex", `article-source-save-${randomUUID()}`);
  await mkdir(root, { recursive: true });
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourceFile = resolve(root, "lesson.kp.md");
  await writeFile(sourceFile, original);
  return {
    sourceFile,
    store: new KpArticleSourceStore({
      sourceFile,
      sourcePath,
      validate: (text) => {
        if (text === "invalid") {
          throw new Error("Synthetic article validation failed.");
        }
      },
      regenerate
    })
  };
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolveListening) =>
    server.listen(0, "127.0.0.1", resolveListening)
  );
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected TCP address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolveClosing, reject) =>
    server.close((error) => error ? reject(error) : resolveClosing())
  );
}
