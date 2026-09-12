import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  bindKpFocusFrameToCss,
  compileKpFocusProfile,
  sampleKpFocusProfile
} from "../src/animation/focus-profile.ts";

const elevated = compileKpFocusProfile({
  id: "focus.function-wrap.argument",
  groupId: "function-wrap.argument",
  semanticEntityIds: ["argument.x"],
  fragmentIds: ["argument.x.glyph", "argument.x.shadow-fragment"],
  profile: "elevated",
  strength: 0.7,
  contextDimming: 0.24,
  accessibilityMode: "full"
});

test("focus treats one complete semantic group with one shared shadow", () => {
  assert.equal(elevated.foregroundPlane, "attention-foreground");
  assert.ok(elevated.groupTreatment.elevationPx >= 8);
  assert.ok(elevated.groupTreatment.elevationPx <= 14);
  assert.ok(elevated.groupTreatment.scale >= 1.01);
  assert.ok(elevated.groupTreatment.scale <= 1.025);
  assert.deepEqual(elevated.sharedShadow.fragmentIds, [
    "argument.x.glyph",
    "argument.x.shadow-fragment"
  ]);
  assert.equal(elevated.layoutParticipation, false);
});

test("focus never changes x or y and releases exactly to neutral", () => {
  for (const phaseId of ["orient", "reflow", "act", "settle", "release"] as const) {
    for (const phaseProgress of [0, 0.37, 1]) {
      const frame = sampleKpFocusProfile({
        plan: elevated,
        phaseId,
        phaseProgress
      });
      assert.equal(frame.translateX, 0);
      assert.equal(frame.translateY, 0);
      assert.equal(frame.layoutParticipation, false);
    }
  }
  assert.deepEqual(
    sampleKpFocusProfile({
      plan: elevated,
      phaseId: "release",
      phaseProgress: 1
    }),
    {
      phaseId: "release",
      attentionProgress: 0,
      translateX: 0,
      translateY: 0,
      translateZ: 0,
      scale: 1,
      outlineStrength: 0,
      shadowOpacity: 0,
      contextDimming: 0,
      layoutParticipation: false
    }
  );
});

test("reduced, no-depth, and high-contrast modes preserve flat focus meaning", () => {
  for (const accessibilityMode of [
    "reduced",
    "no-depth",
    "high-contrast"
  ] as const) {
    const plan = compileKpFocusProfile({
      ...{
        id: `focus.${accessibilityMode}`,
        groupId: "group",
        semanticEntityIds: ["entity"],
        fragmentIds: [],
        profile: "elevated" as const,
        strength: 0.8,
        contextDimming: 0.3
      },
      accessibilityMode
    });
    const frame = sampleKpFocusProfile({
      plan,
      phaseId: "act",
      phaseProgress: 0.5
    });
    assert.equal(plan.groupTreatment.profile, "flat");
    assert.equal(frame.translateZ, 0);
    assert.equal(frame.scale, 1);
    assert.equal(frame.shadowOpacity, 0);
    assert.ok(frame.outlineStrength > 0);
    assert.ok(frame.contextDimming > 0);
  }
});

test("CSS binding carries only composited attention variables", () => {
  const frame = sampleKpFocusProfile({
    plan: elevated,
    phaseId: "act",
    phaseProgress: 0.5
  });
  const binding = bindKpFocusFrameToCss(elevated, frame);
  assert.equal(binding.className, "kp-focus-group");
  assert.equal(
    binding.attributes["data-kp-focus-layout-participation"],
    "false"
  );
  assert.equal(binding.variables["--kp-focus-scale"], "1.0205");
  assert.equal("--kp-focus-x" in binding.variables, false);
  assert.equal("--kp-focus-y" in binding.variables, false);

  const css = readFileSync(
    new URL("../src/rendering/focus-card-runtime.css", import.meta.url),
    "utf8"
  );
  const focusRule = css.match(/\.kp-focus-group \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(focusRule, /translateZ\(var\(--kp-focus-z\)\)/);
  assert.match(focusRule, /box-shadow:/);
  assert.doesNotMatch(focusRule, /\b(left|right|top|bottom|margin|padding):/);
});
