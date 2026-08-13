import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { kpSchemeFactorialFullEvaluation } from
  "../src/animation/scheme-factorial-canonical-full-evaluation.ts";
import { packKpSchemeFactorialFullEvaluation } from
  "../src/animation/scheme-factorial-full-evaluation-codec.ts";

const outputUrl = new URL(
  "../src/animation/scheme-factorial-full-evaluation.generated.json",
  import.meta.url
);

export function serializeKpSchemeFactorialFullEvaluation(): string {
  return `${JSON.stringify(
    packKpSchemeFactorialFullEvaluation(kpSchemeFactorialFullEvaluation)
  )}\n`;
}

export function generateKpSchemeFactorialFullEvaluation(checkOnly: boolean): void {
  const compiled = serializeKpSchemeFactorialFullEvaluation();
  if (checkOnly) {
    if (readFileSync(outputUrl, "utf8") !== compiled) {
      throw new Error(
        "Scheme factorial evaluation is stale. Run " +
        "npm run generate:scheme-factorial-full-evaluation."
      );
    }
    return;
  }
  writeFileSync(outputUrl, compiled);
}

if (process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateKpSchemeFactorialFullEvaluation(process.argv.includes("--check"));
}
