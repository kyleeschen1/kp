import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as canonicalDefaults from "../src/animation/motifs/equation-visual-motif-defaults.ts";
import * as canonicalGrammar from "../src/animation/motifs/executable-motif-grammar.ts";
import * as canonicalComposition from "../src/animation/motifs/visual-motif-composition.ts";
import * as canonicalVocabulary from "../src/animation/motifs/visual-motif.ts";
import * as compatibilityDefaults from "../src/rendering/equation-visual-motif-defaults.ts";
import * as compatibilityGrammar from "../src/rendering/executable-motif-grammar.ts";
import * as compatibilityComposition from "../src/rendering/visual-motif-composition.ts";
import * as compatibilityVocabulary from "../src/rendering/visual-motif.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const canonicalSourcePaths = [
  "src/animation/motifs/equation-visual-motif-defaults.ts",
  "src/animation/motifs/executable-motif-grammar.ts",
  "src/animation/motifs/visual-motif-composition.ts",
  "src/animation/motifs/visual-motif.ts"
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

test("rendering motif facades preserve every runtime export identity", () => {
  assertRuntimeExportIdentity(canonicalDefaults, compatibilityDefaults);
  assertRuntimeExportIdentity(canonicalGrammar, compatibilityGrammar);
  assertRuntimeExportIdentity(canonicalComposition, compatibilityComposition);
  assertRuntimeExportIdentity(canonicalVocabulary, compatibilityVocabulary);
});

test("canonical motif contracts contain no concrete renderer resources", () => {
  for (const sourcePath of canonicalSourcePaths) {
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    for (const resource of concreteRendererResources) {
      assert.doesNotMatch(source, resource, `${sourcePath} leaked ${resource}`);
    }
  }
});

function assertRuntimeExportIdentity(
  canonical: Record<string, unknown>,
  compatibility: Record<string, unknown>
): void {
  assert.deepEqual(Object.keys(compatibility), Object.keys(canonical));
  for (const name of Object.keys(canonical)) {
    assert.equal(
      compatibility[name],
      canonical[name],
      `compatibility export ${name} changed identity`
    );
  }
}
