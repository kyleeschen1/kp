import { readFile, writeFile } from "node:fs/promises";
import {
  createKpEquationSurfaceAuthorityGraph
} from "../src/architecture/equation-surface-authority-graph.ts";

const target = new URL(
  "../src/architecture/equation-surface-authority-graph.generated.json",
  import.meta.url
);
const output =
  `${JSON.stringify(createKpEquationSurfaceAuthorityGraph(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Equation surface authority graph is stale. Run " +
      "npm run generate:equation-surface-authority-graph."
    );
  }
  console.log("equation surface authority graph is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated equation surface authority graph");
}
