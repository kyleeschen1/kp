import assert from "node:assert/strict";
import test from "node:test";
import { checkMatrixEditionCosts } from "../scripts/measure-matrix-editions.ts";

function report(): Parameters<typeof checkMatrixEditionCosts>[0] {
  return { qualification: "negative-control fixture", reader: { chunks: [], raw: 1, gzip: 1, modules: [] },
    editions: (["dependent-columns", "projection-loss"] as const).flatMap(source => (["static", "interactive"] as const).map(mode =>
      ({ source, mode, directory: "unused", files: [], raw: 1, gzip: 1, manifestBytes: 1 }))) };
}
test("matrix cost gates reject omitted consumers, forbidden authority and hidden closure growth", () => {
  checkMatrixEditionCosts(report());
  const missing = report(); missing.editions.pop(); assert.throws(() => checkMatrixEditionCosts(missing), /every matrix edition/);
  const duplicate = report(); duplicate.editions[3] = duplicate.editions[2]!; assert.throws(() => checkMatrixEditionCosts(duplicate), /every matrix edition/);
  for (const module of ["content/authoring/linear-algebra/dependent-columns.ts", "src/editor/main.ts", "src/experiments/matrix-column-combinations/page.ts",
    "src/experiments/matrix-column-combinations/author.ts", "src/authoring/matrix-columns/session.ts", "src/authoring/staged-preview.ts"]) {
    const forbidden = report(); forbidden.reader.modules.push(module); assert.throws(() => checkMatrixEditionCosts(forbidden), /dependencies/);
  }
  const reader = report(); reader.reader.gzip = 112001; assert.throws(() => checkMatrixEditionCosts(reader), /reader exceeds/);
  for (const key of ["raw", "gzip", "manifestBytes"] as const) {
    const oversized = report(); oversized.editions[1]![key] = 2_000_000; assert.throws(() => checkMatrixEditionCosts(oversized), /complete edition exceeds/);
  }
});
