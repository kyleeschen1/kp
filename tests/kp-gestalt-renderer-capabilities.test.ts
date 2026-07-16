import assert from "node:assert/strict";
import test from "node:test";

import {
  kpDiagramSvgGestaltRenderer,
  kpEquationDomGestaltRenderer,
  resolveKpGestaltRendererCapabilities
} from "../src/animation/gestalt-renderer-capabilities.ts";

const style = {
  id: "kp.organic-subtle",
  version: "1.0.0",
  requiredCapabilities: [
    "motion.path.arc",
    "motion.seek.direct-sampling"
  ],
  optionalCapabilities: ["focus.depth.css-2_5d"]
};

test("equation DOM renderer realizes the CSS 2.5D focus profile", () => {
  const result = resolveKpGestaltRendererCapabilities({
    style,
    renderer: kpEquationDomGestaltRenderer
  });
  assert.equal(result.status, "compatible");
  assert.deepEqual(result.realizedCapabilityIds, [
    "motion.path.arc",
    "motion.seek.direct-sampling",
    "focus.depth.css-2_5d"
  ]);
  assert.deepEqual(result.fallbackCapabilityIds, []);
  assert.deepEqual(result.diagnostics, []);
});

test("diagram SVG renderer uses the same reported optional fallback contract", () => {
  const result = resolveKpGestaltRendererCapabilities({
    style,
    renderer: kpDiagramSvgGestaltRenderer
  });
  assert.equal(result.status, "compatible");
  assert.equal(result.diagnostics[0]?.capabilityId, "focus.depth.css-2_5d");
});

test("missing required behavior creates a typed non-promotable gap", () => {
  const result = resolveKpGestaltRendererCapabilities({
    style: {
      ...style,
      requiredCapabilities: [
        ...style.requiredCapabilities,
        "fragment.webgl.texture-fold"
      ]
    },
    renderer: kpEquationDomGestaltRenderer
  });
  assert.equal(result.status, "incompatible");
  assert.deepEqual(result.gaps, [{
    kind: "gestalt-capability-gap",
    capabilityId: "fragment.webgl.texture-fold",
    rendererId: "renderer.kp.equation-dom",
    reason: "missing-required-capability",
    promotable: false,
    message:
      "Renderer renderer.kp.equation-dom cannot realize required capability fragment.webgl.texture-fold for kp.organic-subtle@1.0.0."
  }]);
});

test("unsupported optional behavior is explicitly reported when no fallback exists", () => {
  const result = resolveKpGestaltRendererCapabilities({
    style: {
      ...style,
      optionalCapabilities: ["fragment.webgl.texture-fold"]
    },
    renderer: kpDiagramSvgGestaltRenderer
  });
  assert.equal(result.status, "compatible");
  assert.deepEqual(result.diagnostics, [{
    code: "style.capability.optional-omitted",
    capabilityId: "fragment.webgl.texture-fold",
    severity: "warning",
    message:
      "Renderer renderer.kp.diagram-svg omits unsupported optional capability fragment.webgl.texture-fold."
  }]);
});
