import { strict as assert } from "node:assert";
import test from "node:test";

import { createKpDocument } from "../src/semantic/document.ts";

test("createKpDocument creates a JSON-compatible semantic document", () => {
  const document = createKpDocument({
    id: "lesson-identity",
    title: "Identity matrix"
  });

  assert.deepEqual(document, {
    id: "lesson-identity",
    title: "Identity matrix",
    version: 1,
    objects: []
  });
  assert.equal(JSON.parse(JSON.stringify(document)).id, "lesson-identity");
});
