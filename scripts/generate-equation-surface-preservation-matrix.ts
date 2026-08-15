import { readFile, writeFile } from "node:fs/promises";
import {
  createKpEquationSurfacePreservationMatrix
} from "../src/architecture/equation-surface-preservation-matrix.ts";

const target = new URL(
  "../src/architecture/equation-surface-preservation-matrix.generated.json",
  import.meta.url
);
const output =
  `${JSON.stringify(createKpEquationSurfacePreservationMatrix(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Equation surface preservation matrix is stale. Run " +
      "npm run generate:equation-surface-preservation-matrix."
    );
  }
  console.log("equation surface preservation matrix is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated equation surface preservation matrix");
}
