import { readFile, writeFile } from "node:fs/promises";

import {
  compileKpGenericEquationFallbackAudit
} from "../src/architecture/generic-equation-fallback-audit.ts";
import authority from
  "../src/architecture/equation-surface-authority-graph.generated.json" with {
    type: "json"
  };
import reachability from
  "../src/architecture/exact-equation-reachability-graph.generated.json" with {
    type: "json"
  };

const target = new URL(
  "../src/architecture/generic-equation-fallback-audit.generated.json",
  import.meta.url
);
const audit = compileKpGenericEquationFallbackAudit({
  authority: authority as Parameters<
    typeof compileKpGenericEquationFallbackAudit
  >[0]["authority"],
  reachability: reachability as Parameters<
    typeof compileKpGenericEquationFallbackAudit
  >[0]["reachability"]
});
const output = `${JSON.stringify(audit, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Generic equation fallback audit is stale. Run " +
      "npm run generate:equation-fallback-audit."
    );
  }
  console.log(`generic equation fallback audit is current (${audit.entries.length} paths)`);
} else {
  await writeFile(target, output, "utf8");
  console.log(`generated generic equation fallback audit (${audit.entries.length} paths)`);
}
