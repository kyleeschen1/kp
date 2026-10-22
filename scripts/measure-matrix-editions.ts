import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { buildLocalReader } from "./local-reader-build.ts";
import { buildMatrixEdition } from "./build-matrix-edition.ts";
import { example } from "../content/authoring/convergence/matrix-example.ts";
import { projectionLoss } from "../content/authoring/linear-algebra/projection-loss.ts";
import { evaluate } from "../src/math/authoring/matrices.ts";
import budgets from "./matrix-edition-budgets.json" with { type: "json" };

export async function measureMatrixEditions() {
  const built = await buildLocalReader("src/experiments/matrix-column-combinations/edition-reader.ts");
  const chunks = [...built.files].filter(([path]) => path.endsWith(".js"))
    .map(([path, bytes]) => ({ path, raw: bytes.length, gzip: gzipSync(bytes).length }));
  const reader = { chunks, raw: chunks.reduce((sum, chunk) => sum + chunk.raw, 0),
    gzip: chunks.reduce((sum, chunk) => sum + chunk.gzip, 0), modules: [...new Set(built.chunks.flatMap(chunk => chunk.modules))].sort() };
  const sources = [example(), { schemaVersion: "kp.matrix-columns.v1", id: projectionLoss.id,
    left: evaluate(projectionLoss.product.left, {}), right: evaluate(projectionLoss.product.right, {}), reading: projectionLoss.reading }];
  mkdirSync("tmp/codex", { recursive: true }); const scratch = mkdtempSync("tmp/codex/matrix-edition-cost-");
  const editions = [];
  try {
    for (const source of sources) {
      const path = join(scratch, `${source.id}.json`); writeFileSync(path, JSON.stringify(source, null, 2) + "\n");
      for (const interactive of [false, true]) {
        const edition = await buildMatrixEdition(path, { interactive });
        const manifestBytes = readFileSync(join(edition.directory, "edition.json"));
        const manifest = JSON.parse(manifestBytes.toString());
        const files = Object.keys(manifest.files).map(path => {
          const bytes = readFileSync(join(edition.directory, path));
          return { path, raw: bytes.length, gzip: gzipSync(bytes).length };
        });
        editions.push({ source: source.id, mode: edition.mode, directory: edition.directory, files,
          raw: files.reduce((sum, file) => sum + file.raw, 0), gzip: files.reduce((sum, file) => sum + file.gzip, 0), manifestBytes: manifestBytes.length });
      }
    }
  } finally { rmSync(scratch, { recursive: true, force: true }); }
  return { qualification: "Complete production JavaScript includes every emitted chunk. Editions include every local font, CSS, source and evidence file; the manifest is counted separately. Per-file gzip sums estimate size, not browser transfer or timing.", reader, editions };
}

export function checkMatrixEditionCosts(report: Awaited<ReturnType<typeof measureMatrixEditions>>) {
  if (report.reader.gzip > budgets.readerJsGzip || report.reader.raw > budgets.readerJsRaw) throw new Error("Complete matrix reader exceeds budget; diagnose before amending.");
  if (report.reader.modules.some(path => /content\/authoring\/|src\/(?:editor|authoring\/examples)\/|matrix-column-combinations\/(?:entry|page|author|basis-composition)\.ts|authoring\/(?:matrix-columns\/session|prepared-revision-session|staged-preview)\.ts|matrix-sources\.ts|research\/|node_modules\/three\//.test(path))) {
    throw new Error("Matrix edition acquired registry, authored lesson, editor or unrelated domain dependencies.");
  }
  const cohort = report.editions.map(edition => `${edition.source}:${edition.mode}`).sort();
  if (JSON.stringify(cohort) !== JSON.stringify(["dependent-columns:interactive", "dependent-columns:static", "projection-loss:interactive", "projection-loss:static"])) throw new Error("Measure every matrix edition consumer exactly once.");
  for (const edition of report.editions) {
    const raw = edition.mode === "static" ? budgets.staticClosureRaw : budgets.interactiveClosureRaw;
    const gzip = edition.mode === "static" ? budgets.staticClosureGzip : budgets.interactiveClosureGzip;
    if (edition.raw > raw || edition.gzip > gzip || edition.manifestBytes > budgets.manifestRaw) throw new Error(`${edition.source} ${edition.mode} complete edition exceeds budget; retain every file while diagnosing.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new Error("Run the complete fixed cohort without arguments.");
  const report = await measureMatrixEditions();
  writeFileSync("tmp/codex/matrix-edition-costs.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ qualification: report.qualification,
    reader: { ...report.reader, modules: report.reader.modules.length },
    editions: report.editions.map(({ files, ...rest }) => ({ ...rest, files: files.length })) }, null, 2));
  checkMatrixEditionCosts(report);
}
