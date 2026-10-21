import assert from "node:assert/strict";
import test from "node:test";
import { algebraEditionHash, readAlgebraEditionLocation } from "../src/experiments/composed-algebra-intuition/edition-location.ts";

test("algebra edition positions are finite, bounded and pinned to their source", () => {
  const revision = "sha256:abc";
  for (const step of [0, Number.MIN_VALUE, 1e-7, .125, 1, 2.999999999, 3])
    assert.deepEqual(readAlgebraEditionLocation(algebraEditionHash(revision, step), revision, 3), { status: "ready", step });
  assert.deepEqual(readAlgebraEditionLocation("", revision, 3), { status: "ready", step: 0 });
  for (const hash of ["#step=1", "#revision=sha256:abc", "#step=1&revision=other", "#step=1&step=2&revision=sha256:abc",
    "#step=1&revision=sha256:abc&revision=sha256:abc", "#step=1&revision=sha256:abc&extra=yes",
    ...["", "NaN", "Infinity", "-1", "4", "0x1", "1e500", "%20", "1%20", "1.2.3"].map(step => `#step=${step}&revision=sha256:abc`)])
    assert.equal(readAlgebraEditionLocation(hash, revision, 3).status, "repair-gap", hash);
  for (const invalid of [NaN, Infinity, -1]) assert.throws(() => algebraEditionHash(revision, invalid));
});
