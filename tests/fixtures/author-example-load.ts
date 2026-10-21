import { registerHooks } from "node:module";

// Fresh processes expose actual lazy loads, including dynamic imports that a
// static closure walk cannot observe. Keep measurement outside compiler imports.
const files = new Set<string>();
registerHooks({ load(url, context, nextLoad) {
  if (url.startsWith("file:")) files.add(url);
  return nextLoad(url, context);
} });
const { runAuthorCheckCli } = await import("../../scripts/author-check.ts");
const example = await runAuthorCheckCli(["--task", process.argv[2]!, "--example"]);
console.log(JSON.stringify({ example, files: [...files].sort() }));
