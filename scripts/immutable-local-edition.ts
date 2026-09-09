import { createHash } from "node:crypto";
import { dirname, join, relative, isAbsolute } from "node:path";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";

export const digestEditionBytes = (text: string | Uint8Array): `sha256:${string}` => `sha256:${createHash("sha256").update(text).digest("hex")}`;

/** Extracted from the Bayesian edition writer. Domain compilers own payload
 * truth; this only preserves exact, content-addressed local bytes. */
export function writeKpImmutableLocalEdition(input: {
  readonly repo: string; readonly editionRoot: string; readonly schemaVersion: string; readonly revisionId: string;
  readonly files: ReadonlyMap<string, string | Buffer>; readonly check: boolean;
}) {
  const rootRelative = relative(input.repo, input.editionRoot);
  if (!rootRelative || rootRelative.startsWith("..") || isAbsolute(rootRelative)) throw new Error("Edition root must be a strict repository descendant.");
  const files = new Map(input.files);
  for (const name of files.keys()) if (!name || isAbsolute(name) || name.split(/[\\/]/).some(part => part === ".." || part === "." || part === ""))
    throw new Error("Edition files require bounded relative paths.");
  if (files.has("edition.json")) throw new Error("The writer owns the edition manifest.");
  const manifest = { schemaVersion: input.schemaVersion, revisionId: input.revisionId,
    files: Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, bytes]) => [name, digestEditionBytes(bytes)])) };
  const directory = join(input.editionRoot, digestEditionBytes(JSON.stringify(manifest)).slice(7));
  files.set("edition.json", JSON.stringify(manifest, null, 2) + "\n");
  for (const name of files.keys()) {
    let current = input.repo;
    for (const part of relative(input.repo, join(directory, name)).split("/")) {
      current = join(current, part);
      if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error("Edition output cannot traverse symlinks.");
    }
  }
  if (input.check || existsSync(directory)) {
    for (const [name, bytes] of files) if (!readFileSync(join(directory, name)).equals(Buffer.from(bytes)))
      throw new Error(`Edition is stale or altered: ${name}`);
  } else {
    mkdirSync(input.editionRoot, { recursive: true });
    const staging = mkdtempSync(join(input.editionRoot, ".building-"));
    try {
      for (const [name, bytes] of files) { const target = join(staging, name); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes, { flag: "wx" }); }
      renameSync(staging, directory);
    } finally { rmSync(staging, { recursive: true, force: true }); }
  }
  return directory;
}
