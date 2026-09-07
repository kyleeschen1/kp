import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { readKpAuthoringMarketSourceBranch } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { compileKpAuthoringMarketPublication, serializeKpAuthoringMarketPublication,
  verifyKpAuthoringMarketPublication } from "./compile-authoring-market-publication.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export const kpAuthoringMarketEditionRoot = join(repo, "tmp/codex/authoring-market-editions");

/** Explicit file input; output is confined to generated local editions, never deployment. */
export function buildKpAuthoringMarketEdition(input: {
  readonly sourcePath: string; readonly name?: string; readonly check?: boolean;
}) {
  const sourcePath = resolve(input.sourcePath);
  const sourceText = readFileSync(sourcePath, "utf8");
  const branch = readKpAuthoringMarketSourceBranch(JSON.parse(sourceText));
  const name = input.name ?? branch.name;
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(name)) throw new Error("Invalid local edition name.");
  const directory = join(kpAuthoringMarketEditionRoot, name);
  if (sourcePath === directory || sourcePath.startsWith(`${directory}/`)) {
    throw new Error("The selected source must remain outside its generated edition directory.");
  }
  const compilerInput = { sourceText, sourcePath };
  const artifact = compileKpAuthoringMarketPublication(compilerInput);
  const serialized = serializeKpAuthoringMarketPublication(artifact, compilerInput);
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selected market reading</title><link rel="stylesheet" href="./katex.min.css"></head><body data-kp-authoring-market-edition><p>Reading-only edition · source ${artifact.source.sha256}</p>${artifact.payload.reading.html}</body></html>\n`;
  const katex = join(repo, "node_modules/katex/dist");
  const files = new Map<string, string | Buffer>([
    ["publication.json", serialized],
    ["katex.min.css", readFileSync(join(katex, "katex.min.css"))],
    ...readdirSync(join(katex, "fonts")).sort().map(file =>
      [`fonts/${file}`, readFileSync(join(katex, "fonts", file))] as [string, Buffer]),
    ["index.html", html]
  ]);
  for (const file of files.keys()) assertGeneratedPath(join(directory, file));
  if (input.check) {
    verifyKpAuthoringMarketPublication(JSON.parse(readFileSync(join(directory, "publication.json"), "utf8")), compilerInput);
    for (const [file, contents] of files) {
      if (!readFileSync(join(directory, file)).equals(Buffer.from(contents))) throw new Error(`Local edition is stale: ${file}.`);
    }
  } else {
    if (existsSync(directory) && readdirSync(directory).length > 0) {
      const previous = JSON.parse(readFileSync(join(directory, "publication.json"), "utf8"));
      if (previous.compiler?.id !== "kp.authoring-market-publication") throw new Error("Refusing to overwrite an unrelated directory.");
    }
    // The reading consumes its inline snapshot, never a separately fetched JSON revision.
    for (const [file, contents] of files) {
      const target = join(directory, file);
      mkdirSync(dirname(target), { recursive: true });
      const temporary = join(dirname(target), `.building-${process.pid}-${basename(target)}`);
      writeFileSync(temporary, contents, { flag: "wx" });
      try { renameSync(temporary, target); }
      catch (error) { unlinkSync(temporary); throw error; }
    }
  }
  return Object.freeze({ directory, sourceRevision: artifact.source.sha256, payloadRevision: artifact.payloadSha256,
    fileCount: files.size, checked: input.check === true });
}

function assertGeneratedPath(path: string): void {
  const parts = relative(repo, path).split("/");
  if (parts.includes("..") || !path.startsWith(`${kpAuthoringMarketEditionRoot}/`)) throw new Error("Edition output must stay in its generated root.");
  let current = repo;
  for (const part of parts) {
    current = join(current, part);
    if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error("Edition output cannot traverse symlinks.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: {
    source: { type: "string" }, name: { type: "string" }, check: { type: "boolean", default: false }
  } });
  if (values.source === undefined) throw new Error("Use --source <named.market.json>; source selection is never implicit.");
  console.log(JSON.stringify(buildKpAuthoringMarketEdition({ sourcePath: values.source,
    ...(values.name === undefined ? {} : { name: values.name }), check: values.check }), null, 2));
}
