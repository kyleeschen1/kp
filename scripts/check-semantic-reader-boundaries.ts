import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { kpSemanticReaderLayers } from "../src/architecture/semantic-reader-boundaries.ts";
import { checkKpSemanticReaderImports } from "../src/architecture/semantic-reader-import-fitness.ts";

const projectRoot = process.cwd();
const sourceFiles = kpSemanticReaderLayers.flatMap((layer) => {
  const root = join(projectRoot, layer.root);
  if (!existsSync(root)) return [];
  return collectTypeScriptFiles(root).map((path) => ({
    path: relative(projectRoot, path),
    source: readFileSync(path, "utf8")
  }));
});
const violations = checkKpSemanticReaderImports(sourceFiles);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `${violation.kind}: ${violation.sourceFile} -> ${violation.specifier}: ${violation.message}`
    );
  }
  process.exitCode = 1;
} else {
  console.log(`semantic-reader architecture gate passed (${sourceFiles.length} files)`);
}

function collectTypeScriptFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}
