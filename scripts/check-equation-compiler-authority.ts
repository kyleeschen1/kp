import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import {
  checkKpEquationCompilerAuthorityRatchets,
  type KpEquationAuthoritySourceFile
} from "../src/architecture/equation-compiler-authority-ratchet.ts";
import {
  createKpEquationSurfaceAuthorityGraph
} from "../src/architecture/equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceDispositionLedger
} from "../src/architecture/equation-surface-disposition-ledger.ts";

const root = process.cwd();
const files = collect(join(root, "src")).map((path) => Object.freeze({
  path: relative(root, path) as `src/${string}.ts`,
  source: readFileSync(path, "utf8")
})) satisfies readonly KpEquationAuthoritySourceFile[];
const violations = checkKpEquationCompilerAuthorityRatchets({
  files,
  authority: createKpEquationSurfaceAuthorityGraph(),
  disposition: createKpEquationSurfaceDispositionLedger()
});

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`${violation.code}: ${violation.path}: ${violation.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `equation compiler authority ratchets passed (${files.length} source files)`
  );
}

function collect(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collect(path);
    return entry.isFile() && path.endsWith(".ts") ? [path] : [];
  });
}
