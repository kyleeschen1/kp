import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderSessionSnapshot,
  decodeKpReaderSessionUrl,
  encodeKpReaderSessionUrl
} from "../src/reader/runtime/public-api.ts";

test("lesson location round trips through a canonical shareable URL", () => {
  const session = createKpReaderSessionSnapshot({
    documentId: "lesson.solve-x.x-plus-3",
    documentVersion: "1",
    checkpointId: "checkpoint.beat.cancel",
    progressPermille: 667,
    projectionId: "projection.symbolic",
    focusRefs: ["equation.x", "equation.left"],
    motionPreference: "reduced"
  });
  const encoded = encodeKpReaderSessionUrl(
    "https://kinetic.press/lessons/solve-x?utm_source=teacher#beat.cancel",
    session
  );
  const url = new URL(encoded);
  assert.equal(url.searchParams.get("utm_source"), "teacher");
  assert.equal(url.hash, "#beat.cancel");
  assert.equal(url.searchParams.get("kpProgress"), "667");
  assert.equal(url.searchParams.get("kpMotion"), "reduced");
  assert.deepEqual(url.searchParams.getAll("kpFocus"), ["equation.left", "equation.x"]);
  assert.deepEqual(decodeKpReaderSessionUrl(encoded), {
    ...session,
    location: { ...session.location, focusRefs: ["equation.left", "equation.x"] }
  });
});

test("decoder distinguishes ordinary route URLs from reader locations", () => {
  assert.equal(decodeKpReaderSessionUrl("https://kinetic.press/lessons/solve-x"), undefined);
});

test("decoder rejects malformed progress and cross-version links", () => {
  assert.throws(
    () => decodeKpReaderSessionUrl(
      "https://kinetic.press/lesson?kpLesson=lesson.solve-x&kpVersion=1&kpProgress=continuous"
    ),
    /reader progress must be an integer/
  );
  assert.throws(
    () => decodeKpReaderSessionUrl(
      "https://kinetic.press/lesson?kpLesson=lesson.solve-x&kpVersion=2",
      { documentId: "lesson.solve-x", documentVersion: "1" }
    ),
    /targets lesson.solve-x@2, expected lesson.solve-x@1/
  );
  assert.throws(
    () => decodeKpReaderSessionUrl(
      "https://kinetic.press/lesson?kpLesson=lesson.solve-x"
    ),
    /kpVersion is required/
  );
});

test("encoding replaces stale KP state without disturbing unrelated parameters", () => {
  const encoded = encodeKpReaderSessionUrl(
    "https://kinetic.press/lesson?kpLesson=old&kpVersion=0&kpFocus=old&utm_campaign=class",
    createKpReaderSessionSnapshot({
      documentId: "lesson.new",
      documentVersion: "3"
    })
  );
  const url = new URL(encoded);
  assert.equal(url.searchParams.get("kpLesson"), "lesson.new");
  assert.deepEqual(url.searchParams.getAll("kpFocus"), []);
  assert.equal(url.searchParams.get("utm_campaign"), "class");
});
