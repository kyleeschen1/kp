import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { authoredRailExample, compileAuthoredRailPublication } from "../src/tutorial/mechanics-relations/authored-rail-publication.ts";
import { readRailSource, selectAuthoredRail } from "./rail-authoring-selection.ts";

export function authorRailPublication(args: readonly string[], root = process.cwd()): number {
  if (args.length === 1 && args[0] === "--example") {
    console.log(readRailSource(resolve(root, authoredRailExample))); return 0;
  }
  if (args[0] !== "--source" || !args[1] || args.length > 3 || (args[2] !== undefined && args[2] !== "--apply"))
    throw new Error("Usage: npm run author:rail -- --source <article.md> [--apply], or --example. Checking alone does not change the preview.");
  const path = resolve(root, args[1]);
  const text = readRailSource(path), sourceId = relative(root, path).replaceAll("\\", "/");
  const result = args[2] === "--apply" ? selectAuthoredRail(root, sourceId, text) : compileAuthoredRailPublication(text, sourceId);
  if (result.status === "repair") { console.error(JSON.stringify(result, null, 2)); return 2; }
  console.log(JSON.stringify({ status: "checked", sourceId, sourceRevision: result.sourceRevision, title: result.title,
    railIds: result.railIds, editorialAuthority: result.editorialAuthority,
    selection: args[2] === "--apply" ? "applied" : "unchanged",
    preview: "http://localhost:8000/experiments/authored-rails/",
    publication: "local preview and no-JavaScript reading; not deployed" }, null, 2));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = authorRailPublication(process.argv.slice(2)); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
}
