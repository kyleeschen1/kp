import { readFile, writeFile } from "node:fs/promises";

import {
  createKpEquationOperationDiscoveryCatalog
} from "../src/authoring/equation-operation-discovery-catalog.ts";

const outputPath = new URL(
  "../src/authoring/equation-operation-discovery-catalog.generated.json",
  import.meta.url
);
const serialized = `${JSON.stringify(
  createKpEquationOperationDiscoveryCatalog(),
  null,
  2
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== serialized) {
    throw new Error(
      "Equation operation discovery catalog is stale. Run " +
      "npm run generate:equation-operation-discovery-catalog."
    );
  }
  console.log("equation operation discovery catalog is current");
} else {
  await writeFile(outputPath, serialized);
  console.log("generated equation operation discovery catalog");
}
