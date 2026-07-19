import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { kpConceptRoomBoundaries } from "../src/architecture/concept-room-boundaries.ts";
import { checkKpConceptRoomImports } from "../src/architecture/concept-room-import-fitness.ts";
import { kpLegacyArchitectureExceptionBaseline } from "../src/architecture/legacy-exception-baseline.ts";

const projectRoot = process.cwd();
const sourceFiles = kpConceptRoomBoundaries.flatMap((boundary) =>
  collectTypeScriptFiles(join(projectRoot, boundary.root)).map((path) => ({
    path: relative(projectRoot, path),
    source: readFileSync(path, "utf8")
  }))
);
const violations = checkKpConceptRoomImports(sourceFiles);
const staleLegacyEvidence = kpLegacyArchitectureExceptionBaseline.flatMap((exception) => {
  const source = readFileSync(join(projectRoot, exception.sourceFile), "utf8");
  return exception.evidencePatterns
    .filter((pattern) => !source.includes(pattern))
    .map((pattern) => `${exception.id}: missing ${pattern}`);
});

if (violations.length > 0 || staleLegacyEvidence.length > 0) {
  for (const violation of violations) {
    console.error(`${violation.kind}: ${violation.sourceFile} -> ${violation.specifier}: ${violation.message}`);
  }
  for (const stale of staleLegacyEvidence) console.error(`stale-legacy-exception: ${stale}`);
  process.exitCode = 1;
} else {
  console.log(
    `concept-room architecture gate passed (${sourceFiles.length} files, ${kpLegacyArchitectureExceptionBaseline.length} frozen legacy exceptions)`
  );
}

function collectTypeScriptFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

