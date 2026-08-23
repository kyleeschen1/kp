import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import {
  checkKpEquationGovernanceV2Ratchets,
  type KpEquationGovernanceV2SourceFile
} from "../src/architecture/equation-governance-v2-ratchet.ts";

const root = process.cwd();
const files = collect(join(root, "src")).map((path) => Object.freeze({
  path: relative(root, path) as `src/${string}.ts`,
  source: readFileSync(path, "utf8")
})) satisfies readonly KpEquationGovernanceV2SourceFile[];
const violations = checkKpEquationGovernanceV2Ratchets(files);

if (violations.length > 0) {
  violations.forEach((violation) => console.error(
    `${violation.code}: ${violation.path}: ${violation.message}`
  ));
  process.exitCode = 1;
} else {
  console.log(
    `equation governance v2 ratchets passed (${files.length} source files)`
  );
}

function collect(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collect(path);
    return entry.isFile() && path.endsWith(".ts") ? [path] : [];
  });
}
