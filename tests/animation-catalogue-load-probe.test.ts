import assert from "node:assert/strict";
import test from "node:test";

import {
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  probeKpAnimationCatalogueLoads
} from "../src/editor/animation-catalogue-load-probe.ts";

test("all concrete catalogue rows round trip their route and exact lazy asset", async () => {
  const results = await probeKpAnimationCatalogueLoads();

  assert.equal(results.length, 34);
  assert.equal(new Set(results.map(({ animationId }) => animationId)).size, 34);
  assert.equal(results.every(({ status }) => status === "loaded"), true);
  assert.equal(new Set(results.map(({ packId }) => packId)).size, 11);
  for (const result of results) {
    assert.equal(
      result.route,
      `?artifact=${encodeURIComponent(result.animationId)}`
    );
    assert.equal(
      result.descriptorId,
      `editor-animation.${result.animationId}`
    );
    assert.equal(
      result.status === "loaded" && result.packAssetCount > 0,
      true
    );
  }
});

test("one load failure stays attached to its row without aborting the batch", async () => {
  const failedAnimationId = "animation.programming.add.execution-trace";
  const results = await probeKpAnimationCatalogueLoads({
    loadAsset: async (animationId) => {
      if (animationId === failedAnimationId) {
        throw new Error("Injected programming pack failure.");
      }
      return loadKpAnimationAsset(animationId);
    }
  });
  const failures = results.filter(
    (result) => result.status === "load-failure"
  );

  assert.equal(results.length, 34);
  assert.equal(failures.length, 1);
  assert.equal(failures[0]?.animationId, failedAnimationId);
  assert.equal(failures[0]?.outcome.status, "load-failure");
  assert.equal(
    failures[0]?.outcome.message,
    "Injected programming pack failure."
  );
  assert.equal(
    results.filter(({ status }) => status === "loaded").length,
    33
  );
});

test("identity drift becomes explicit load failure evidence", async () => {
  const results = await probeKpAnimationCatalogueLoads({
    loadAsset: async (animationId) => {
      const loaded = await loadKpAnimationAsset(animationId);
      return animationId === "animation.linear-solve.solve-x"
        ? { ...loaded, packId: "graph" }
        : loaded;
    }
  });
  const drift = results.find(
    ({ animationId }) => animationId === "animation.linear-solve.solve-x"
  );

  assert.equal(drift?.status, "load-failure");
  assert.match(
    drift?.status === "load-failure" ? drift.outcome.message : "",
    /expected animation\.linear-solve\.solve-x from algebra/
  );
});
