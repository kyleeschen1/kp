import assert from "node:assert/strict";
import test from "node:test";

import { checkKpNativeKatexConformanceProductionArtifacts } from
  "../scripts/check-native-katex-compositor-conformance-production-closure.ts";

test("keeps conformance schemas out of production source and bundles", () => {
  assert.deepEqual(checkKpNativeKatexConformanceProductionArtifacts([
    {
      path: "dist/assets/entry.js",
      source: "export const runtime = 'native-katex-renderer-session';"
    }
  ]), []);

  assert.deepEqual(checkKpNativeKatexConformanceProductionArtifacts([
    {
      path: "dist/assets/leak.js",
      source: "native-katex-compositor-seam-trace"
    }
  ]), [{
    code: "native-katex-conformance.production-leak",
    path: "dist/assets/leak.js",
    marker: "native-katex-compositor-seam-trace",
    message:
      "Production artifact dist/assets/leak.js contains test-only native-katex-compositor-seam-trace."
  }]);

  assert.equal(checkKpNativeKatexConformanceProductionArtifacts([{
    path: "src/leak.ts",
    source: "native-katex-conformance-context-mutation-registry"
  }])[0]?.marker, "native-katex-conformance-context-mutation-registry");
  assert.equal(checkKpNativeKatexConformanceProductionArtifacts([{
    path: "dist/matrix.js",
    source: "native-katex-conformance-matrix-fixture"
  }])[0]?.marker, "native-katex-conformance-matrix-fixture");
});
