import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adapterSource = readFileSync(new URL(
  "../src/editor/exact-fraction-quantity-surface-adapter.ts",
  import.meta.url
), "utf8");
const preparedHostSource = readFileSync(new URL(
  "../src/rendering/prepared-native-scene-host.ts",
  import.meta.url
), "utf8");

test("symbolic preparation cannot hide the committed scene with opacity", () => {
  // This source boundary complements runtime paint sampling: it prevents the
  // async-measurement blanking mechanism from being reintroduced between the
  // sampled frames of a browser test.
  assert.doesNotMatch(adapterSource, /\bstage\.style\.opacity\b/u);
  assert.doesNotMatch(preparedHostSource, /\.style\.opacity\b/u);
  assert.match(adapterSource, /prepareKpNativeSceneCandidate/u);
  assert.match(adapterSource, /commitKpNativeSceneCandidate/u);
  assert.match(preparedHostSource, /kpPreparedSceneState.*preparing/su);
  assert.match(preparedHostSource, /kpPreparedSceneState.*committed/su);
});
