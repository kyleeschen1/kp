import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractKpTypescriptImportReferences, resolveKpTypescriptImportTarget } from "./typescript-import-extractor.ts";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { createUrnBayesDraft } from "../src/experiments/bayesian-reasoning/urn-source.ts";
import { compileBayesPublication } from "./build-bayesian-edition.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
function closure(entry: string) {
  const visited = new Set<string>(), queue = [entry], external = new Set<string>();
  while (queue.length) {
    const path = queue.pop()!; if (visited.has(path)) continue; visited.add(path);
    const source = readFileSync(resolve(root, path), "utf8");
    for (const reference of extractKpTypescriptImportReferences(path, source)) {
      if (reference.kind === "type-only") continue;
      if (!reference.specifier.startsWith(".")) { external.add(reference.specifier); continue; }
      const target = resolveKpTypescriptImportTarget(root, path, reference.specifier);
      if (target && /\.[cm]?tsx?$/.test(target)) queue.push(target);
    }
  }
  return { localModules: visited.size, sourceBytes: [...visited].reduce((sum, path) => sum + readFileSync(resolve(root, path)).length, 0),
    external: [...external].sort() };
}
export function measureBayesReuse() {
  const secondPath = "src/experiments/bayesian-reasoning/urn-source.ts";
  const imports = extractKpTypescriptImportReferences(secondPath, readFileSync(resolve(root, secondPath), "utf8"));
  if (imports.some(reference => reference.kind === "runtime")) throw new Error("The second original source must not acquire private runtime plumbing.");
  const callers = [createBayesDraft(), createUrnBayesDraft()].map(source => {
    const result = checkBayesDraft(JSON.stringify(source)); if (result.status !== "compiled") throw new Error(result.diagnostic.expected);
    return { sourceId: result.draft.model.sourceId, sourceBytes: Buffer.byteLength(JSON.stringify(source)),
      revisionId: result.draft.revisionId, publicationPayload: compileBayesPublication(JSON.stringify(source), "source.json").payloadSha256,
      mechanism: result.draft.notation.mechanism,
      operations: result.draft.trace.operations.map(operation => operation.kind), checkpoints: result.draft.trace.states.length };
  });
  if (JSON.stringify(callers[0]!.operations) !== JSON.stringify(callers[1]!.operations) || callers[0]!.mechanism !== callers[1]!.mechanism)
    throw new Error("Both callers must use the same declared operation and notation mechanisms.");
  return { callers, secondSourceRuntimeImports: imports.filter(reference => reference.kind === "runtime").length,
    authoringImportClosure: closure("src/experiments/bayesian-reasoning/draft.ts"),
    readerImportClosure: closure("src/experiments/bayesian-reasoning/entry.ts"),
    qualification: "Source graph counts are not production bundle bytes or runtime performance. Inference uses the unchanged separate project gate." };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(measureBayesReuse(), null, 2));
