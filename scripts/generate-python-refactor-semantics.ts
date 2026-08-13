import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { compileKpPythonRefactorSemantics } from "./python-refactor-semantic-compiler.ts";

const outputUrl = new URL(
  "../src/semantic/python-refactor-semantics.generated.json",
  import.meta.url
);

export function serializeKpPythonRefactorSemantics(): string {
  return `${JSON.stringify(compileKpPythonRefactorSemantics())}\n`;
}

export function generateKpPythonRefactorSemantics(checkOnly: boolean): void {
  const compiled = serializeKpPythonRefactorSemantics();
  if (checkOnly) {
    if (readFileSync(outputUrl, "utf8") !== compiled) {
      throw new Error(
        "Python refactor semantics are stale. Run npm run generate:python-refactor-semantics."
      );
    }
    return;
  }
  writeFileSync(outputUrl, compiled);
}

if (process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateKpPythonRefactorSemantics(process.argv.includes("--check"));
}
