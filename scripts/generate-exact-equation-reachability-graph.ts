import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

import {
  compileKpExactEquationReachabilityGraph,
  kpExactEquationReachabilityGeneratedPath
} from "../src/architecture/exact-equation-reachability-graph.ts";

const repositoryRoot = resolve(".");
const target = new URL(
  "../src/architecture/exact-equation-reachability-graph.generated.json",
  import.meta.url
);
const files = (await Promise.all([
  readTree(resolve("src")),
  readTree(resolve("tests")),
  readTree(resolve("scripts")),
  readTree(resolve("server"))
])).flat()
  .filter(({ path }) => path !== kpExactEquationReachabilityGeneratedPath)
  .sort((left, right) => left.path.localeCompare(right.path));
const graph = compileKpExactEquationReachabilityGraph({ files });
const output = `${JSON.stringify(graph, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Exact equation reachability graph is stale. Run " +
      "npm run generate:equation-reachability."
    );
  }
  console.log(
    `exact equation reachability graph is current (${graph.roots.length} roots)`
  );
} else {
  await writeFile(target, output, "utf8");
  console.log(`generated exact equation reachability graph (${graph.roots.length} roots)`);
}

async function readTree(root: string): Promise<{
  readonly path: string;
  readonly source: string;
}[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return readTree(path);
    if (!entry.isFile() || ![".ts", ".svelte", ".json"].includes(extname(path))) {
      return [];
    }
    return [{
      path: relative(repositoryRoot, path).replaceAll("\\", "/"),
      source: await readFile(path, "utf8")
    }];
  }));
  return files.flat();
}
