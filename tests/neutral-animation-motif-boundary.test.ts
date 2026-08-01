import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const canonicalSourcePaths = [
  "src/animation/motifs/equation-visual-motif-defaults.ts",
  "src/animation/motifs/executable-motif-grammar.ts",
  "src/animation/motifs/visual-motif-composition.ts",
  "src/animation/motifs/visual-motif.ts"
] as const;
const retiredRenderingFacadePaths = [
  "src/rendering/equation-visual-motif-defaults.ts",
  "src/rendering/executable-motif-grammar.ts",
  "src/rendering/visual-motif-composition.ts",
  "src/rendering/visual-motif.ts"
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
  /\bdocument\./,
  /\bwindow\./,
  /\bgetBoundingClientRect\b/,
  /\bquerySelector\b/,
  /\bcreateElement(?:NS)?\b/
] as const;

test("rendering motif compatibility facades stay retired", () => {
  for (const sourcePath of retiredRenderingFacadePaths) {
    assert.equal(existsSync(join(projectRoot, sourcePath)), false, sourcePath);
  }
});

test("canonical motif contracts contain no concrete renderer resources", () => {
  for (const sourcePath of canonicalSourcePaths) {
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    for (const resource of concreteRendererResources) {
      assert.doesNotMatch(source, resource, `${sourcePath} leaked ${resource}`);
    }
  }
});
