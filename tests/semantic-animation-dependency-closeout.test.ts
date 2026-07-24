import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  compileKpGeneratedCancellationPresentation
} from "../src/animation/generated-cancellation-presentation-boundary.ts";
import {
  kpSemanticAnimationRenderingImportBaseline
} from "../src/architecture/semantic-animation-import-baseline.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("semantic-animation dependency inversion baseline is closed", () => {
  assert.deepEqual(kpSemanticAnimationRenderingImportBaseline, []);
});

test("generated cancellation consumes an injected typed presentation seam", () => {
  let observedSourceCount = 0;
  const result = compileKpGeneratedCancellationPresentation(
    {
      operationId: "kp.algebra.cancel-additive-inverses",
      teachingGoal: "preserve-flow",
      topology: { sourceCount: 2, sourceBaselines: "shared" }
    },
    ({ topology }) => {
      observedSourceCount = topology.sourceCount;
      return { kind: "resolved", recipe: "native-handoff-v1" };
    }
  );

  assert.equal(observedSourceCount, 2);
  assert.deepEqual(result, {
    kind: "accepted",
    resolution: { kind: "resolved", recipe: "native-handoff-v1" }
  });
});

test("neutral contracts exclude concrete renderer resources", () => {
  for (const sourcePath of [
    "src/animation/cancellation-presentation-contract.ts",
    "src/animation/runtime-visual-frame-sample.ts"
  ]) {
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    assert.doesNotMatch(source, /from\s+["'][^"']*rendering\//);
    assert.doesNotMatch(
      source,
      /\b(?:HTMLElement|SVGElement|CanvasRenderingContext|WebGL|KaTeX|katex)\b/
    );
  }
});

test("concrete annihilation registration belongs to the equation adapter", () => {
  const algebraPack = readFileSync(
    join(projectRoot, "src/animation/catalog-packs/algebra.ts"),
    "utf8"
  );
  const equationAdapter = readFileSync(
    join(projectRoot, "src/editor/equation-surface-adapter.ts"),
    "utf8"
  );

  assert.doesNotMatch(algebraPack, /rendering\//);
  assert.match(
    equationAdapter,
    /rendering\/equation-witnessed-annihilation-register\.ts/
  );
});
