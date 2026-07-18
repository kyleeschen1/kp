import assert from "node:assert/strict";
import test from "node:test";
import { sampleKpFtcFiniteStrip } from "../src/tutorial/ftc-finite-strip.ts";

test("finite FTC strip carries exact area change inside honest rectangle bounds", () => {
  const strip = sampleKpFtcFiniteStrip({
    lensId: "quadratic",
    x: 2,
    deltaX: 0.5
  });

  assert.equal(strip.lowerHeight, 4);
  assert.equal(strip.upperHeight, 6.25);
  assert.ok(strip.exactAreaChange >= strip.lowerAreaBound);
  assert.ok(strip.exactAreaChange <= strip.upperAreaBound);
  assert.deepEqual(strip.stripPolygon[0], [2, 0]);
  assert.deepEqual(strip.stripPolygon.at(-1), [2.5, 0]);
});

test("sine exact lens includes its interior maximum in finite strip bounds", () => {
  const strip = sampleKpFtcFiniteStrip({
    lensId: "sine-offset",
    x: 1,
    deltaX: 1
  });

  assert.equal(strip.upperHeight, 2);
  assert.ok(strip.exactAreaChange <= strip.upperAreaBound);
  assert.ok(strip.exactAreaChange >= strip.lowerAreaBound);
});

test("finite FTC strip rejects a zero increment and domain overflow with no width", () => {
  assert.throws(
    () => sampleKpFtcFiniteStrip({ lensId: "quadratic", x: 1, deltaX: 0 }),
    /positive delta x/
  );
  assert.throws(
    () => sampleKpFtcFiniteStrip({ lensId: "quadratic", x: 3, deltaX: 0.5 }),
    /fit inside/
  );
});
