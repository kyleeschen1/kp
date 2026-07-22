import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeKpDistributionAreaUrl,
  encodeKpDistributionAreaUrl
} from "../src/reader/runtime/distribution-area-url-codec.ts";

test("distribution URL codec round trips operation-relative progress and direction", () => {
  const encoded = encodeKpDistributionAreaUrl(
    "https://kinetic.press/reader/distribution-area/?utm_source=teacher&kpProgress=old",
    {
      route: "/reader/distribution-area/",
      documentId: "lesson.algebra.distribution-area",
      documentVersion: "1"
    },
    { checkpoint: "distributed", progressPermille: 640, direction: "inverse" }
  );
  assert.equal(new URL(encoded).searchParams.get("utm_source"), "teacher");
  assert.deepEqual(decodeKpDistributionAreaUrl(encoded), {
    checkpoint: "distributed",
    progressPermille: 640,
    direction: "inverse"
  });
});

test("distribution URL codec supplies route defaults and rejects malformed progress", () => {
  assert.deepEqual(decodeKpDistributionAreaUrl("https://kinetic.press/reader/distribution-area/"), {
    checkpoint: "factored",
    progressPermille: undefined,
    direction: "forward"
  });
  assert.throws(
    () => decodeKpDistributionAreaUrl("https://kinetic.press/reader/distribution-area/?kpProgress=continuous"),
    /must be an integer/
  );
});
