import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { resolve } from "node:path";
import test from "node:test";

import { createExactRationalLinearProblemProvider } from
  "../providers/linear-problems/public-api.ts";
import {
  parseKpEconomicsTwoColumnSource,
  serializeKpEconomicsTwoColumnSource,
  type KpEconomicsTwoColumnSource
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";
import { createAppServer } from "./app.ts";
import { KpEconomicsLessonSourceStore } from
  "./economics-lesson-source-store.ts";

const endpoint =
  "/api/dev/lesson-sources/economics-demand-shift-two-column";
const capability = { "x-kp-lesson-source-write": "1" };

test("lesson source route is absent without both store and capability", async (
  context
) => {
  const disabled = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider()
  });
  context.after(() => close(disabled));
  const disabledUrl = await listen(disabled);
  assert.equal((await fetch(`${disabledUrl}${endpoint}`, {
    headers: capability
  })).status, 404);

  const fixture = await createFixture(context, async () => undefined);
  const enabled = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    economicsLessonSourceStore: fixture.store
  });
  context.after(() => close(enabled));
  const enabledUrl = await listen(enabled);
  assert.equal((await fetch(`${enabledUrl}${endpoint}`)).status, 404);
  assert.equal((await fetch(`${enabledUrl}${endpoint}`, {
    headers: capability
  })).status, 405);
});

test("explicit save writes canonical source and regenerates once", async (
  context
) => {
  let regenerations = 0;
  const fixture = await createFixture(context, async () => {
    regenerations += 1;
  });
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    economicsLessonSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const request = sourceSaveRequest({
    ...source().passages[0]!,
    sourceText: "Edited source with $P$."
  });
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { ...capability, "content-type": "application/json" },
    body: JSON.stringify(request)
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    schemaVersion: "kp.economics-lesson-source-save-result.v1",
    sourcePath: "content/lessons/economics-demand-shift-two-column.json",
    changed: true
  });
  assert.equal(regenerations, 1);
  const saved = parseKpEconomicsTwoColumnSource(JSON.parse(
    await readFile(fixture.sourceFile, "utf8")
  ));
  assert.equal(saved.passages[0]!.sourceText, "Edited source with $P$.");
});

test("transport and structural validation reject unsafe writes", async (
  context
) => {
  const fixture = await createFixture(context, async () => undefined);
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    economicsLessonSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const post = (body: string, contentType = "application/json") => fetch(
    `${baseUrl}${endpoint}`,
    {
      method: "POST",
      headers: { ...capability, "content-type": contentType },
      body
    }
  );

  assert.equal((await post("{}", "text/plain")).status, 415);
  assert.equal((await post("{")).status, 400);
  assert.equal((await post(JSON.stringify({
    padding: "x".repeat(70_000)
  }))).status, 413);
  const changedRole = sourceSaveRequest({
    ...source().passages[0]!,
    role: "reflection"
  });
  assert.equal((await post(JSON.stringify(changedRole))).status, 400);
  assert.equal(
    await readFile(fixture.sourceFile, "utf8"),
    serializeKpEconomicsTwoColumnSource(source())
  );
});

test("failed publication regeneration rolls the source back", async (
  context
) => {
  let regenerations = 0;
  const fixture = await createFixture(context, async () => {
    regenerations += 1;
    throw new Error("synthetic compiler failure");
  });
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    economicsLessonSourceStore: fixture.store
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { ...capability, "content-type": "application/json" },
    body: JSON.stringify(sourceSaveRequest({
      ...source().passages[0]!,
      sourceText: "This must roll back."
    }))
  });

  assert.equal(response.status, 500);
  assert.equal(regenerations, 2);
  assert.equal(
    await readFile(fixture.sourceFile, "utf8"),
    serializeKpEconomicsTwoColumnSource(source())
  );
});

function source(): KpEconomicsTwoColumnSource {
  return parseKpEconomicsTwoColumnSource({
    schemaVersion: "kp.economics-two-column-lesson.v1",
    passages: [
      {
        id: "graph-at-rest",
        role: "regular",
        sourceText: "Original source."
      },
      {
        id: "follow-shift",
        role: "transition",
        motionBlockId: "demand-shift",
        sourceText: "Follow the shift."
      }
    ]
  });
}

function sourceSaveRequest(firstPassage: unknown): unknown {
  const current = source();
  return {
    schemaVersion: "kp.economics-lesson-source-save.v1",
    draft: {
      version: 1,
      selectedPassageId: "graph-at-rest",
      passages: [firstPassage, current.passages[1]]
    }
  };
}

async function createFixture(
  context: { after(callback: () => void | Promise<void>): void },
  regenerate: () => Promise<void>
): Promise<{
  readonly sourceFile: string;
  readonly store: KpEconomicsLessonSourceStore;
}> {
  const root = resolve("tmp/codex", `economics-source-save-${randomUUID()}`);
  await mkdir(root, { recursive: true });
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourceFile = resolve(root, "lesson.json");
  await writeFile(sourceFile, serializeKpEconomicsTwoColumnSource(source()));
  return {
    sourceFile,
    store: new KpEconomicsLessonSourceStore({
      sourceFile,
      sourcePath: "content/lessons/economics-demand-shift-two-column.json",
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
