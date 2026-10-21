import assert from "node:assert/strict";
import test from "node:test";
import { editionHash, editionPosition } from "../src/experiments/matrix-column-combinations/edition-location.ts";

const revision = `sha256:${"a".repeat(64)}`;
const url = (suffix: string) => new URL(`https://example.test/edition/${suffix}`);
test("edition restoration binds both columns and exact fractional positions to a source revision", () => {
  for (const column of [0, 1]) for (const progress of [0, 1 / 6, 0.421371, 1]) {
    assert.deepEqual(editionPosition(url(`?column=${column}${editionHash(revision, progress)}`), revision), { column, progress });
  }
  assert.deepEqual(editionPosition(url(""), revision), { column: 0, progress: 0 });
});
test("foreign, unpinned, ambiguous and invalid edition locations fail instead of selecting a fallback", () => {
  for (const suffix of ["?column=2", "?column=", "?column=0&column=1", "?input=dependent-columns", "#weights", "#p=0.5", `${editionHash(revision, .5)}&p=1`, `${editionHash(revision, .5)}&extra=1`, `#revision=${revision}&p=`, `#revision=${revision}&p=Infinity`, `#revision=${revision}&p=-1`, editionHash(`sha256:${"b".repeat(64)}`, .5)]) {
    assert.throws(() => editionPosition(url(suffix), revision), suffix);
  }
  for (const value of [NaN, Infinity, -1, 2]) assert.throws(() => editionHash(revision, value));
  assert.throws(() => editionHash("unverified", .5));
});
