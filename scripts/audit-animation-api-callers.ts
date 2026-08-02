import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  deriveKpAnimationApiCallerLedger,
  kpAnimationApiCallerAuditTargets,
  type KpAnimationApiCallerSourceFile
} from "../src/architecture/animation-api-caller-ledger.ts";

const roots = ["src", "tests", "scripts"] as const;
const files = (
  await Promise.all(roots.map((root) => readSourceFiles(root)))
).flat();
const ledger = deriveKpAnimationApiCallerLedger(files);
const summaryOnly = process.argv.includes("--summary");

console.log(JSON.stringify({
  schemaVersion: "kp.animation-api-caller-ledger.v1",
  targetCount: kpAnimationApiCallerAuditTargets.length,
  surfaces: ledger.map((entry) => ({
    ...(summaryOnly
      ? {
          id: entry.id,
          tier: entry.tier,
          disposition: entry.disposition
        }
      : entry),
    sourceCallerCount: entry.sourceCallers.length,
    testCallerCount: entry.testCallers.length,
    scriptCallerCount: entry.scriptCallers.length,
    otherCallerCount: entry.otherCallers.length,
    callerCount:
      entry.sourceCallers.length +
      entry.testCallers.length +
      entry.scriptCallers.length +
      entry.otherCallers.length
  }))
}, null, 2));

async function readSourceFiles(root: string): Promise<KpAnimationApiCallerSourceFile[]> {
  const paths = await collectPaths(root);
  return Promise.all(paths.map(async (relativePath) => ({
    path: relativePath,
    source: await readFile(path.resolve(relativePath), "utf8")
  })));
}

async function collectPaths(relativeDirectory: string): Promise<string[]> {
  const entries = await readdir(path.resolve(relativeDirectory), {
    withFileTypes: true
  });
  const paths = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return collectPaths(relativePath);
    return /\.(?:ts|json)$/.test(entry.name) ? [relativePath] : [];
  }));
  return paths.flat().sort();
}
