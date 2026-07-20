import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const parserPackage = "mdast-util-from-markdown";

if (packageJson.devDependencies?.[parserPackage] === undefined) {
  throw new Error(`${parserPackage} must be declared as a build-only devDependency`);
}
if (packageJson.dependencies?.[parserPackage] !== undefined) {
  throw new Error(`${parserPackage} must not be declared as a learner runtime dependency`);
}

const distAssets = join(projectRoot, "dist", "assets");
const bundleFiles = readdirSync(distAssets)
  .map((name) => join(distAssets, name))
  .filter((path) => statSync(path).isFile() && path.endsWith(".js"));
const leakedFiles = bundleFiles.filter((path) => {
  const source = readFileSync(path, "utf8");
  return source.includes("mdast-util-from-markdown")
    || source.includes("micromark-util-")
    || source.includes("mdast-util-to-string");
});

if (leakedFiles.length > 0) {
  throw new Error(`Markdown parser signatures leaked into: ${leakedFiles.join(", ")}`);
}

console.log(
  `semantic-reader parser isolation passed (${bundleFiles.length} production JavaScript assets scanned)`
);
