import { readFile } from "node:fs/promises";

import { inspectKpAlgebraPackSplit } from
  "./kp-algebra-pack-split-policy.ts";
import { measureKpAlgebraPackClosure } from
  "./measure-kp-algebra-pack-closure.ts";
import type { KpViteManifest } from "./vite-manifest-closure.ts";

const [report, manifestSource] = await Promise.all([
  measureKpAlgebraPackClosure(),
  readFile("dist/.vite/manifest.json", "utf8")
]);
const inspection = inspectKpAlgebraPackSplit({
  currentGzipBytes: report.gzipBytes,
  manifest: JSON.parse(manifestSource) as KpViteManifest
});
if (inspection.violations.length > 0) {
  throw new Error(
    `Algebra pack split checks failed:\n${inspection.violations.join("\n")}`
  );
}
console.info(
  `Algebra pack split saves ${inspection.savingsGzipBytes} gzip bytes ` +
  `(${inspection.savingsPermille / 10}%) with one shared runtime chunk.`
);

