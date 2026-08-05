import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpTutorialMotionPassagePageFixture,
  kpTutorialMotionPassageFixtureSizes,
  kpTutorialOnePassagePageFixture,
  kpTutorialThreePassagePageFixture,
  kpTutorialTwelvePassagePageFixture
} from "../src/tutorial/kp-tutorial-motion-passage-fixtures.ts";
import {
  projectKpTutorialMotionPassageLifecycle
} from "../src/tutorial/kp-tutorial-motion-passage-lifecycle.ts";

test("one, three, and twelve passage fixtures are exact and deterministic", () => {
  const fixtures = [
    kpTutorialOnePassagePageFixture,
    kpTutorialThreePassagePageFixture,
    kpTutorialTwelvePassagePageFixture
  ];
  assert.deepEqual(fixtures.map(({ passages }) => passages.length), [1, 3, 12]);
  for (const size of kpTutorialMotionPassageFixtureSizes) {
    const first = createKpTutorialMotionPassagePageFixture(size);
    const second = createKpTutorialMotionPassagePageFixture(size);
    assert.deepEqual(first, second);
    assert.ok(Object.isFrozen(first));
    assert.ok(Object.isFrozen(first.passages));
    assert.ok(first.passages.every(Object.isFrozen));
  }
});

test("fixture geometry and semantic state remain stable across page scale", () => {
  for (const size of kpTutorialMotionPassageFixtureSizes) {
    const fixture = createKpTutorialMotionPassagePageFixture(size);
    const focusedIndex = fixture.passages.findIndex(
      ({ id }) => id === fixture.focusedPassageId
    );
    assert.equal(focusedIndex, Math.floor((size - 1) / 2));
    assert.equal(
      fixture.passages[0]!.documentTop,
      fixture.viewportBlockSize * fixture.readingBandRatio
    );
    assert.ok(fixture.passages.every(
      ({ reservedStageBlockSize }) => reservedStageBlockSize === 480
    ));
    assert.deepEqual(
      fixture.passages.map(({ semanticProgress }) => semanticProgress),
      fixture.passages.map((_, index) =>
        index < focusedIndex ? 1 : index === focusedIndex ? 0.5 : 0
      )
    );
    assert.equal(
      new Set(fixture.passages.map(({ id }) => id)).size,
      fixture.passages.length
    );
  }
});

test("every fixture projects one bounded active window and static distant state", () => {
  for (const size of kpTutorialMotionPassageFixtureSizes) {
    const fixture = createKpTutorialMotionPassagePageFixture(size);
    const plan = projectKpTutorialMotionPassageLifecycle({
      passages: fixture.passages,
      focusedPassageId: fixture.focusedPassageId,
      reducedMotion: false,
      policy: fixture.policy
    });
    assert.equal(plan.activeMotionPassageId, fixture.focusedPassageId);
    assert.equal(
      plan.passages.filter(({ motion }) => motion === "active").length,
      1
    );
    assert.ok(plan.hydratedPassageIds.length <= 3);
    assert.ok(plan.passages
      .filter(({ proximity }) => proximity === "distant")
      .every(({ geometry, runtime, motion, accessibility }) =>
        geometry === "reserved" &&
        runtime === "dehydrated" &&
        motion === "paused" &&
        accessibility === "static"
      ));
  }
});

test("the twelve-passage fixture reuses two capabilities across three live stages", () => {
  const fixture = kpTutorialTwelvePassagePageFixture;
  const plan = projectKpTutorialMotionPassageLifecycle({
    passages: fixture.passages,
    focusedPassageId: fixture.focusedPassageId,
    reducedMotion: false,
    policy: fixture.policy
  });
  assert.equal(plan.hydratedPassageIds.length, 3);
  assert.deepEqual(plan.requiredCapabilityIds, [
    "physics.work-energy-graph",
    "economics.equilibrium-graph"
  ]);
  assert.equal(plan.passages.length, 12);
  assert.equal(plan.passages.filter(({ runtime }) => runtime === "dehydrated").length, 9);
});

test("fixture definitions stay outside browser and renderer ownership", async () => {
  const source = await readFile(
    new URL("../src/tutorial/kp-tutorial-motion-passage-fixtures.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /\b(?:HTMLElement|Window|IntersectionObserver|SVGElement|WebGLRenderingContext)\b/
  );
  assert.doesNotMatch(source, /from\s+["'][^"']*(?:svelte|three)[^"']*["']/i);
});
