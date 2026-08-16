import { readFile, writeFile } from "node:fs/promises";
import {
  createKpPostConvergenceInfrastructureInventory
} from "../src/architecture/post-convergence-infrastructure-inventory.ts";

const target = new URL(
  "../src/architecture/post-convergence-infrastructure-inventory.generated.json",
  import.meta.url
);
const inventory = createKpPostConvergenceInfrastructureInventory();
const output = `${JSON.stringify(inventory, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Post-convergence infrastructure inventory is stale. Run " +
      "npm run generate:post-convergence-inventory."
    );
  }
  console.log("post-convergence infrastructure inventory is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated post-convergence infrastructure inventory");
}
