import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

import {
  checkKpEquationGovernanceV2Ratchets,
  type KpEquationGovernanceV2RatchetCode,
  type KpEquationGovernanceV2SourceFile
} from "../src/architecture/equation-governance-v2-ratchet.ts";

const root = new URL("..", import.meta.url).pathname;
const planImport =
  'import type { KpCompiledEquationPresentationPlanV2 } from "../domain-ir/equation-presentation-plan-v2.ts";\n';

test("repository v2 equation sources keep presentation authority in owners", () => {
  assert.deepEqual(checkKpEquationGovernanceV2Ratchets(sourceFiles()), []);
});

test("each v2 bypass class rejects an opted-in caller", () => {
  const fixtures = [
    file("src/reader/v2-route-bypass.ts", planImport +
      'export const route = { motionPath: "arc-above" };'),
    file("src/reader/v2-timing-bypass.ts", planImport +
      "export const timing = { durationMs: 900 };"),
    file("src/reader/v2-display-bypass.ts", planImport +
      "export const katex = { displayMode: true };"),
    file("src/reader/v2-css-clock.ts", planImport +
      'export const css = "transition-duration: 200ms";'),
    file("src/reader/v2-evaluation-bypass.ts", planImport +
      "resolveKpEquationEvaluationAuthoritiesV2({});"),
    file("src/reader/v2-compiler-bypass.ts", planImport +
      "resolveKpEquationTypographyV2({});")
  ];
  const codes = new Set(checkKpEquationGovernanceV2Ratchets(fixtures)
    .map(({ code }) => code));
  assert.deepEqual(codes, new Set<KpEquationGovernanceV2RatchetCode>([
    "v2-caller-owned-route",
    "v2-caller-owned-timing",
    "v2-uncontrolled-display-mode",
    "v2-css-clock",
    "v2-unregistered-evaluation",
    "v2-adapter-bypass"
  ]));
});

test("graph, code, and 3D sources do not inherit equation-only policy", () => {
  const outsideDomains = [
    file("src/rendering/graph-webgl-three-fixture.ts",
      "export const clock = { durationMs: 1000, coordinates: [0, 1] };"),
    file("src/rendering/code-token-theater-fixture.ts",
      'export const css = "animation: token-step 1s";')
  ];
  assert.deepEqual(
    checkKpEquationGovernanceV2Ratchets(outsideDomains),
    []
  );
});

function sourceFiles(): readonly KpEquationGovernanceV2SourceFile[] {
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
): KpEquationGovernanceV2SourceFile {
  return Object.freeze({ path, source });
}
