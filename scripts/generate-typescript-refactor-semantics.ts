import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { compileKpTypeScriptRefactorSemantics } from "./typescript-refactor-semantic-compiler.ts";

const outputUrl = new URL(
  "../src/semantic/typescript-refactor-semantics.generated.json",
  import.meta.url
);

export function serializeKpTypeScriptRefactorSemantics(): string {
  return `${JSON.stringify(compileKpTypeScriptRefactorSemantics())}\n`;
}

export function generateKpTypeScriptRefactorSemantics(checkOnly: boolean): void {
  const compiled = serializeKpTypeScriptRefactorSemantics();
  if (checkOnly) {
    if (readFileSync(outputUrl, "utf8") !== compiled) {
      throw new Error(
        "TypeScript refactor semantics are stale. Run npm run generate:typescript-refactor-semantics."
      );
    }
    return;
  }
  writeFileSync(outputUrl, compiled);
}

if (process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateKpTypeScriptRefactorSemantics(process.argv.includes("--check"));
}
