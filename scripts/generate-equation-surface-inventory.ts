import { readFile, writeFile } from "node:fs/promises";
import {
  createKpEquationSurfaceInventory
} from "../src/architecture/equation-surface-inventory.ts";

const target = new URL(
  "../src/architecture/equation-surface-inventory.generated.json",
  import.meta.url
);
const output = `${JSON.stringify(createKpEquationSurfaceInventory(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Equation surface inventory is stale. Run " +
      "npm run generate:equation-surface-inventory."
    );
  }
  console.log("equation surface inventory is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated canonical equation surface inventory");
}
