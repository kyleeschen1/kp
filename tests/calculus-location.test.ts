import test from "node:test";
import assert from "node:assert/strict";
import { readChangeLocation, writeChangeLocation } from "../src/tutorial/change-propagation/location.ts";
const source = { revision: `sha256:${"a".repeat(64)}`, x: .75, h: .4, allowLegacy: true };

test("location round trips signed controls and fractional travel deterministically", () => {
  for (const step of [0, .125, 2.5, 3.5, 4]) for (const x of [-2, -.75, 0, 2]) for (const h of [-.5, -.001, 0, .5]) {
    const location = { step, x, h };
    assert.deepEqual(readChangeLocation(writeChangeLocation(source.revision, location), source), { status: "restored", location });
  }
  assert.deepEqual(readChangeLocation("", source), { status: "restored", location: { step: 0, x: .75, h: .4 } });
  assert.deepEqual(readChangeLocation("#step=3.5&h=-3e-1", source), { status: "restored", location: { step: 3.5, x: .75, h: -.3 } });
});
test("malformed locations are whole-location gaps rather than partial control restoration", () => {
  for (const hash of ["#step=", "#x=NaN", "#h=Infinity", "#x=0x1", "#h=%20", "#step=4.1", "#x=-2.1", "#h=.6", "#step=1&step=2", "#unknown=1", "#x=%xx", "#" + "x".repeat(1025)]) {
    const result = readChangeLocation(hash, source);
    assert.equal(result.status, "repair-gap", hash);
    if (result.status === "repair-gap") assert.equal(result.code, "location", hash);
  }
  assert.equal(readChangeLocation("#step=2", { ...source, allowLegacy: false }).status, "repair-gap");
  assert.equal(readChangeLocation("#revision=other&step=2", source).status, "repair-gap");
  assert.throws(() => writeChangeLocation(source.revision, { step: 1, x: 0, h: NaN }), /Playback h/);
});
