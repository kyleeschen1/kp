import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { bindKpCanonicalTaxInstruction } from "../src/experiments/kinetic-figure-supply-tax/canonical-tax-instruction.ts";

const output = new URL("../src/experiments/kinetic-figure-supply-tax/canonical-tax-source.generated.json", import.meta.url);

/** Trusted local author code runs in the build, never through a reader service. */
export function compileKpCanonicalTaxSource() {
  // Publishing the reference must not follow an author's temporary preview selection.
  const data = bindKpCanonicalTaxInstruction(buildKpAuthoringMarketPreview("reference"),
    readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.md", import.meta.url), "utf8"));
  return {
    schemaVersion: "kp.canonical-tax-source.v1" as const,
    sourceRevision: createHash("sha256").update(JSON.stringify(data)).digest("hex"),
    data
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const serialized = `${JSON.stringify(compileKpCanonicalTaxSource(), null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== serialized) {
      throw new Error("Canonical tax source is stale. Run npm run compile:canonical-tax-source and review its diff.");
    }
    console.log("Canonical tax source is current (data-only reference revision).");
  } else {
    writeFileSync(output, serialized);
    console.log("Compiled canonical tax source (data-only reference revision).");
  }
}
