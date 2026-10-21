import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { buildCalculusReader } from "./calculus-reader-build.ts";
import { buildCalculusEdition } from "./build-calculus-edition.ts";
import budgets from "./calculus-edition-budgets.json" with { type: "json" };

export async function measureCalculusEditions() {
  const consumers = [];
  for (const mode of ["edition", "editor"] as const) {
    const built = await buildCalculusReader(mode);
    const chunks = [...built.files].map(([path, bytes]) => ({ path, raw: bytes.length, gzip: gzipSync(bytes).length }));
    consumers.push({ mode, chunks, raw: chunks.reduce((n, c) => n + c.raw, 0), gzip: chunks.reduce((n, c) => n + c.gzip, 0),
      modules: [...new Set(built.chunks.flatMap(c => c.modules))].sort() });
  }
  const editions = ["stationary-change", "two-reversals"].map(name => {
    const source = `content/authoring/transfer/${name}.json`, edition = buildCalculusEdition(source);
    const manifest = JSON.parse(readFileSync(join(edition.directory, "edition.json"), "utf8"));
    const files = Object.keys(manifest.files).map(path => {
      const bytes = readFileSync(join(edition.directory, path));
      return { path, raw: bytes.length, gzip: gzipSync(bytes).length };
    });
    return { source, files, raw: files.reduce((n, f) => n + f.raw, 0), gzip: files.reduce((n, f) => n + f.gzip, 0),
      manifestBytes: readFileSync(join(edition.directory, "edition.json")).length };
  });
  return { qualification: "Independent complete production JS consumers, including lazy chunks; static manifest closure includes all font formats and publication/source evidence. Sum of per-file gzip is an estimate, not measured HTTP transfer. Manifest bytes reported separately. Interactive closure adds edition JS to static assets plus a script tag.", consumers, editions };
}
export function checkCalculusCosts(report: Awaited<ReturnType<typeof measureCalculusEditions>>) {
  for (const consumer of report.consumers) if (consumer.gzip > budgets[consumer.mode === "edition" ? "editionJsGzip" : "editorJsGzip"])
    throw new Error(`${consumer.mode} complete JS closure exceeds budget; diagnose dependencies before amending.`);
  for (const edition of report.editions) if (edition.raw > budgets.staticClosureRaw || edition.gzip > budgets.staticClosureGzip || edition.manifestBytes > budgets.manifestRaw)
    throw new Error(`${edition.source} complete static closure exceeds budget; preserve all declared assets when diagnosing.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new Error("Run the complete fixed cohort without arguments.");
  const report = await measureCalculusEditions();
  console.log(JSON.stringify(report, null, 2));
  checkCalculusCosts(report);
}
