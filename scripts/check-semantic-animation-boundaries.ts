import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import {
  checkKpSemanticAnimationImports
} from "../src/architecture/semantic-animation-import-fitness.ts";
import {
  kpSemanticAnimationRenderingImportBaseline
} from "../src/architecture/semantic-animation-import-baseline.ts";

const projectRoot = process.cwd();
const roots = ["src/semantic", "src/animation"] as const;
const sourceFiles = roots.flatMap((root) =>
  collectTypeScriptFiles(join(projectRoot, root)).map((path) => ({
    path: relative(projectRoot, path),
    source: readFileSync(path, "utf8")
  }))
);
const violations = checkKpSemanticAnimationImports(sourceFiles);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `${violation.kind}: ${violation.sourceFile} -> ` +
      `${violation.specifier}: ${violation.message}`
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `semantic-animation architecture gate passed ` +
    `(${sourceFiles.length} files, ` +
    `${kpSemanticAnimationRenderingImportBaseline.length} frozen exceptions)`
  );
}

function collectTypeScriptFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}
