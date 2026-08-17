import { readFile, writeFile } from "node:fs/promises";
import { createKpAnimationTransformationCoverage } from
  "../src/architecture/animation-transformation-coverage.ts";

const target = new URL(
  "../src/architecture/animation-transformation-coverage.generated.json",
  import.meta.url
);
const output = `${JSON.stringify(
  createKpAnimationTransformationCoverage(),
  null,
  2
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Animation transformation coverage is stale. Run " +
      "npm run generate:animation-transformation-coverage."
    );
  }
  console.log("animation transformation coverage is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated animation transformation coverage");
}
