import assert from "node:assert/strict";
import test from "node:test";

import {
  formatKpCapabilityKey,
  parseKpCapabilityKey
} from "../src/semantic/capability-key.ts";

test("capability keys format with wildcard defaults", () => {
  assert.equal(
    formatKpCapabilityKey({
      library: "kp.export",
      capability: "encode.gif"
    }),
    "kp.export:encode.gif:*:*"
  );
  assert.equal(
    formatKpCapabilityKey({
      library: "kp.graph",
      capability: "render.webgl",
      objectType: "graph-3d",
      mode: "surface.mesh"
    }),
    "kp.graph:render.webgl:graph-3d:surface.mesh"
  );
});

test("capability keys parse into normalized records", () => {
  assert.deepEqual(
    parseKpCapabilityKey("kp.graph:render.webgl:graph-3d:surface.mesh"),
    {
      key: "kp.graph:render.webgl:graph-3d:surface.mesh",
      library: "kp.graph",
      capability: "render.webgl",
      objectType: "graph-3d",
      mode: "surface.mesh"
    }
  );
});

test("capability keys reject malformed strings and empty segments", () => {
  assert.throws(
    () => parseKpCapabilityKey("kp.graph:render.webgl:graph-3d"),
    /Capability key kp\.graph:render\.webgl:graph-3d must have four segments/
  );
  assert.throws(
    () =>
      formatKpCapabilityKey({
        library: "",
        capability: "render.webgl",
        objectType: "graph-3d",
        mode: "surface.mesh"
      }),
    /Capability key library is required/
  );
});
