import assert from "node:assert/strict";
import test from "node:test";

import { createKpReaderRuntimeRouteDescriptor } from "../src/reader/runtime/reader-route-descriptor.ts";

test("runtime route descriptor binds current path to compiled document identity", () => {
  assert.deepEqual(createKpReaderRuntimeRouteDescriptor({
    href: "https://kinetic.press/reader/solve-x/?kpProgress=500",
    documentId: "lesson.solve-x.x-plus-3",
    documentVersion: "1"
  }), {
    route: "/reader/solve-x/",
    documentId: "lesson.solve-x.x-plus-3",
    documentVersion: "1"
  });
});

test("runtime route descriptor rejects non-reader paths and empty identity", () => {
  assert.throws(() => createKpReaderRuntimeRouteDescriptor({
    href: "https://kinetic.press/editor/",
    documentId: "lesson.test",
    documentVersion: "1"
  }), /must start with/);
  assert.throws(() => createKpReaderRuntimeRouteDescriptor({
    href: "https://kinetic.press/reader/test/",
    documentId: "",
    documentVersion: "1"
  }), /requires document identity/);
});
