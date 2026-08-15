import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

import {
  checkKpEquationCompilerAuthorityRatchets,
  type KpEquationAuthoritySourceFile,
  type KpEquationAuthorityRatchetCode
} from "../src/architecture/equation-compiler-authority-ratchet.ts";
import {
  createKpEquationSurfaceAuthorityGraph
} from "../src/architecture/equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceDispositionLedger
} from "../src/architecture/equation-surface-disposition-ledger.ts";

const root = new URL("..", import.meta.url).pathname;

test("complete source scan permits only inventoried equation authority paths", () => {
  assert.deepEqual(check(sourceFiles()), []);
});

test("each forbidden authority class rejects a novel production path", () => {
  const fixtures = [
    file("src/editor/new-equation-motif.ts",
      "createKpEditorEquationTransitionMotifFrame({});"),
    file("src/animation/new-equation-timing.ts", "export const beat = 1;"),
    file("src/rendering/new-equation-measure.ts",
      "measureKpEquationTransitionGeometry({});"),
    file("src/editor/new-equation-clock.ts", "requestAnimationFrame(tick);"),
    file("src/animation/new-equation-motion.ts",
      "export function sampleKpNewEquationMotion() {}"),
    file("src/rendering/new-equation-fallback.ts",
      'export const mode = "whole-equation-fallback";'),
    file("src/animation/new-symbolic-registry.ts", "export const entries = [];")
  ];
  const violations = check([...sourceFiles(), ...fixtures]);
  const codes = new Set(violations.map(({ code }) => code));
  const expected = new Set<KpEquationAuthorityRatchetCode>([
    "raw-motif-selection",
    "local-timing-table",
    "renderer-inference",
    "private-clock",
    "direct-production-sampler",
    "unclassified-fallback",
    "parallel-manual-registry"
  ]);
  assert.deepEqual(codes, expected);
});

function check(files: readonly KpEquationAuthoritySourceFile[]) {
  return checkKpEquationCompilerAuthorityRatchets({
    files,
    authority: createKpEquationSurfaceAuthorityGraph(),
    disposition: createKpEquationSurfaceDispositionLedger()
  });
}

function sourceFiles(): readonly KpEquationAuthoritySourceFile[] {
  return collect(join(root, "src")).map((path) => file(
    relative(root, path) as `src/${string}.ts`,
    readFileSync(path, "utf8")
  ));
}

function collect(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collect(path);
    return entry.isFile() && path.endsWith(".ts") ? [path] : [];
  });
}

function file(
  path: `src/${string}.ts`,
  source: string
): KpEquationAuthoritySourceFile {
  return Object.freeze({ path, source });
}
