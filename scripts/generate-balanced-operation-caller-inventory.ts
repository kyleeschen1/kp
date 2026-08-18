import { readFile, writeFile } from "node:fs/promises";
import {
  createKpBalancedOperationCallerInventory
} from "../src/architecture/balanced-operation-caller-inventory.ts";

const target = new URL(
  "../src/architecture/balanced-operation-caller-inventory.generated.json",
  import.meta.url
);
const output = `${JSON.stringify(
  createKpBalancedOperationCallerInventory(),
  null,
  2
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Balanced-operation caller inventory is stale. Run " +
      "npm run generate:balanced-operation-inventory."
    );
  }
  console.log("balanced-operation caller inventory is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated balanced-operation caller inventory");
}
