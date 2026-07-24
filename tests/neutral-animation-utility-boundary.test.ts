import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  sampleKpDotProductTraversalProgress as canonicalDotProductProgress
} from "../src/animation/dot-product-traversal-progress.ts";
import {
  kpEquationLinearRearrangementKindForTransformType as canonicalLinearKind
} from "../src/animation/equation-linear-rearrangement-kind.ts";
import {
  sampleKpMatrixMatrixCompositionProgress as canonicalMatrixMatrixProgress
} from "../src/animation/matrix-matrix-composition-progress.ts";
import {
  sampleKpMatrixVectorCompositionProgress as canonicalMatrixVectorProgress
} from "../src/animation/matrix-vector-composition-progress.ts";
import {
  sampleSaddleSurfaceMorph as canonicalSaddleMorph
} from "../src/animation/saddle-surface-morph.ts";
import {
  sampleKpDotProductTraversalProgress as compatibilityDotProductProgress
} from "../src/rendering/equation-dot-product-traversal.ts";
import {
  kpEquationLinearRearrangementKindForTransformType as compatibilityLinearKind
} from "../src/rendering/equation-linear-rearrangement.ts";
import {
  sampleKpMatrixMatrixCompositionProgress as compatibilityMatrixMatrixProgress
} from "../src/rendering/equation-matrix-matrix-composition.ts";
import {
  sampleKpMatrixVectorCompositionProgress as compatibilityMatrixVectorProgress
} from "../src/rendering/equation-matrix-vector-composition.ts";
import {
  sampleSaddleSurfaceMorph as compatibilitySaddleMorph
} from "../src/rendering/graph-svg.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const canonicalSourcePaths = [
  "src/animation/dot-product-traversal-progress.ts",
  "src/animation/easing.ts",
  "src/animation/equation-linear-rearrangement-kind.ts",
  "src/animation/matrix-matrix-composition-progress.ts",
  "src/animation/matrix-vector-composition-progress.ts",
  "src/animation/saddle-surface-morph.ts"
] as const;
const concreteRendererResources = [
  /from\s+["'][^"']*rendering\//,
  /\bHTMLElement\b/,
  /\bSVG(?:Element|SVGElement)\b/,
  /\bCanvasRenderingContext/,
  /\bWebGL/,
  /\bTHREE\b/,
  /\bKaTeX\b/,
  /\bkatex\b/,
  /\bpixels?\b/i,
  /\bdocument\./,
  /\bwindow\./,
  /\bgetBoundingClientRect\b/,
  /\bquerySelector\b/,
  /\bcreateElement(?:NS)?\b/
] as const;

test("rendering compatibility exports preserve neutral utility identities", () => {
  assert.equal(compatibilityDotProductProgress, canonicalDotProductProgress);
  assert.equal(compatibilityLinearKind, canonicalLinearKind);
  assert.equal(compatibilityMatrixMatrixProgress, canonicalMatrixMatrixProgress);
  assert.equal(compatibilityMatrixVectorProgress, canonicalMatrixVectorProgress);
  assert.equal(compatibilitySaddleMorph, canonicalSaddleMorph);
});

test("neutral utility and progression sources contain no renderer resources", () => {
  for (const sourcePath of canonicalSourcePaths) {
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    for (const resource of concreteRendererResources) {
      assert.doesNotMatch(source, resource, `${sourcePath} leaked ${resource}`);
    }
  }
});
