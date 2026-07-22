import assert from "node:assert/strict";
import test from "node:test";
import { kpCancellationPresentationCapabilities } from "../src/rendering/cancellation-presentation-capabilities.ts";

test("every cancellation renderer declares exact capabilities", () => {
  assert.deepEqual(Object.keys(kpCancellationPresentationCapabilities).sort(), [
    "counter-orbit-v1",
    "native-handoff-v1",
    "witnessed-annihilation-v1"
  ]);
  assert.deepEqual(
    kpCancellationPresentationCapabilities["witnessed-annihilation-v1"],
    {
      recipe: "witnessed-annihilation-v1",
      contact: "shared-center",
      approaches: ["direct-convergence"],
      identityBeats: ["implicit", "explicit"],
      sourceBaselines: "shared-only",
      contactDimensions: "horizontal",
      retirement: "after-contact",
      readability: "through-contact",
      minimumSourceCount: 2
    }
  );
  assert.equal(
    kpCancellationPresentationCapabilities["counter-orbit-v1"].sourceBaselines,
    "shared-or-distinct"
  );
});

test("native handoff does not claim an animated cancellation contact", () => {
  const native = kpCancellationPresentationCapabilities["native-handoff-v1"];
  assert.equal(native.contact, "none");
  assert.deepEqual(native.approaches, []);
  assert.equal(native.readability, "native");
});

test("capability declarations are deeply immutable", () => {
  assert.equal(Object.isFrozen(kpCancellationPresentationCapabilities), true);
  for (const capability of Object.values(kpCancellationPresentationCapabilities)) {
    assert.equal(Object.isFrozen(capability), true);
    assert.equal(Object.isFrozen(capability.approaches), true);
    assert.equal(Object.isFrozen(capability.identityBeats), true);
  }
});
