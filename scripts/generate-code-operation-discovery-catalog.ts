import { readFile, writeFile } from "node:fs/promises";

import {
  createKpCodeOperationDiscoveryCatalog
} from "./code-operation-discovery-catalog.ts";

const outputPath = new URL(
  "../src/authoring/code-operation-discovery-catalog.generated.json",
  import.meta.url
);
const serialized = `${JSON.stringify(
  createKpCodeOperationDiscoveryCatalog(),
  null,
  2
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== serialized) {
    throw new Error(
      "Code operation discovery catalog is stale. Run " +
      "npm run generate:code-operation-discovery-catalog."
    );
  }
  console.log("code operation discovery catalog is current");
} else {
  await writeFile(outputPath, serialized);
  console.log("generated code operation discovery catalog");
}
