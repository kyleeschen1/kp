import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  compileKpGeneratedCancellationPresentation,
  kpGeneratedCancellationDraftSchemaVersion
} from "../src/animation/generated-cancellation-presentation-boundary.ts";
import {
  kpSemanticAnimationRenderingImportBaseline
} from "../src/architecture/semantic-animation-import-baseline.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("semantic-animation dependency inversion baseline is closed", () => {
  assert.deepEqual(kpSemanticAnimationRenderingImportBaseline, []);
});

test("generated cancellation derives roles behind the neutral compiler seam", () => {
  const result = compileKpGeneratedCancellationPresentation(
    {
      schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
      familyId: "generated.linear-solve",
      id: "generated.linear-solve.dependency-closeout",
      title: "Generated dependency closeout",
      variable: "x",
      addend: 3,
      solution: 4
    }
  );

  assert.equal(result.kind, "accepted");
  if (result.kind !== "accepted") return;
  assert.equal(result.presentations.length, 1);
  assert.equal(result.presentations[0]?.plan.planKind, "inverse-cancellation");
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
