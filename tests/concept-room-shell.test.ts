import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { generatedConceptCatalog } from "../content/public-api.ts";
import { resolveConceptRoomCatalogEntry } from "../src/app-adapters/concept-room-shell.ts";

test("generated concept paths resolve without a handwritten room switch", () => {
  const entry = resolveConceptRoomCatalogEntry(
    generatedConceptCatalog,
    "/concepts/mathematics/linear-equations/solve-with-balance"
  );
  assert.equal(entry?.conceptId, "mathematics.linear-equations.solve-with-balance");
  assert.equal(resolveConceptRoomCatalogEntry(generatedConceptCatalog, "/"), undefined);
});

test("bootstrap preserves the legacy entrypoint as a fallback", () => {
  const bootstrap = readFileSync(new URL("../src/bootstrap.ts", import.meta.url), "utf8");
  const conceptEntry = readFileSync(
    new URL("../src/compatibility/legacy-concept-room-entry.ts", import.meta.url),
    "utf8"
  );
  const legacyMain = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.doesNotMatch(bootstrap, /generatedConceptCatalog|authoring\/public-api/);
  assert.match(bootstrap, /legacy-concept-room-entry\.ts/);
  assert.match(bootstrap, /import\("\.\/main\.ts"\)/);
  assert.match(conceptEntry, /generatedConceptCatalog/);
  assert.match(conceptEntry, /tryMountConceptRoomRoute/);
  assert.equal(legacyMain.includes("concept-room-shell"), false);
  assert.equal(legacyMain.includes("solve-with-balance"), false);
});
