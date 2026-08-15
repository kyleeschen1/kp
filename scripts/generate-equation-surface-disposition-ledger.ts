import { readFile, writeFile } from "node:fs/promises";
import {
  createKpEquationSurfaceDispositionLedger
} from "../src/architecture/equation-surface-disposition-ledger.ts";

const target = new URL(
  "../src/architecture/equation-surface-disposition-ledger.generated.json",
  import.meta.url
);
const output =
  `${JSON.stringify(createKpEquationSurfaceDispositionLedger(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Equation surface disposition ledger is stale. Run " +
      "npm run generate:equation-surface-disposition-ledger."
    );
  }
  console.log("equation surface disposition ledger is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated equation surface disposition ledger");
}
