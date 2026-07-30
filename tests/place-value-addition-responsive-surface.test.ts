import assert from "node:assert/strict";
import test from "node:test";

import {
  kpPlaceValueAdditionResponsivePolicy
} from "../src/rendering/place-value-addition-responsive-surface.ts";

test("responsive policy preserves native readable geometry", () => {
  assert.deepEqual(kpPlaceValueAdditionResponsivePolicy, {
    schemaVersion: "kp.place-value-addition-responsive-policy.v1",
    wideMinimumWidth: 881,
    minimumReadableFontPx: 32,
    nativeFontPx: 40,
    outlineMaximumBlockPx: 192,
    equationFit: "intrinsic-native-no-wrap",
    motionGeometry: "viewport-independent",
    reviewOwner: "external-animation-library-review"
  });
  assert.ok(
    kpPlaceValueAdditionResponsivePolicy.nativeFontPx >=
      kpPlaceValueAdditionResponsivePolicy.minimumReadableFontPx
  );
  assert.equal(Object.isFrozen(kpPlaceValueAdditionResponsivePolicy), true);
});
