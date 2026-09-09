import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isSupportedAuthorTask, supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";
import { authorSourceByteLimit, inspectAuthorSourceLimits } from "../src/authoring/author-source-limits.ts";

export { authorSourceByteLimit } from "../src/authoring/author-source-limits.ts";
const gap = (code: string, expected: string) => ({ kind: "author-invocation-gap" as const,
  status: "repair-gap" as const, diagnostic: { code, path: "$", expected } });

/** Bound the actual read, not merely the string after allocating an arbitrary file. */
export function readAuthorSource(path: string): string {
  const fd = path === "-" ? 0 : openSync(resolve(path), constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    if (path !== "-" && !fstatSync(fd).isFile()) throw new Error("Select a regular source file.");
    const bytes = Buffer.alloc(authorSourceByteLimit + 1);
    let size = 0;
    while (size < bytes.length) {
      const count = readSync(fd, bytes, size, bytes.length - size, null);
      if (count === 0) break;
      size += count;
    }
    if (size > authorSourceByteLimit) throw new Error("Source exceeds 100,000 UTF-8 bytes.");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size));
  } finally { if (path !== "-") closeSync(fd); }
}

export async function runAuthorCheckCli(args: readonly string[], readSource = readAuthorSource) {
  if (args.length === 1 && args[0] === "--list") return { kind: "author-task-inventory" as const,
    authority: "discovery-only" as const, tasks: supportedAuthorTasks };
  const [flag, task, mode, path, ...extra] = args;
  if (flag !== "--task" || !isSupportedAuthorTask(task) || extra.length ||
      !((mode === "--example" && path === undefined) || (mode === "--request" && typeof path === "string" && path.length > 0)))
    return gap("author.usage", "Use --list, or --task <exact listed task> followed by --example or --request path|-.");
  let json: string | undefined;
  if (mode === "--request") {
    try { json = readSource(path!); }
    catch (error) { return gap("author.source-read", error instanceof Error ? error.message : "Provide a readable UTF-8 source file or stdin."); }
    const limit = inspectAuthorSourceLimits(json);
    if (limit) return gap(limit.diagnostic.code, limit.diagnostic.expected);
  }
  // Selection and input checks precede any owner load. There is no path-derived import.
  const owner = await import("./author-check-owner-dispatch.ts");
  return json === undefined ? owner.authorTaskExample(task) : owner.checkAuthorTask(task, json);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await runAuthorCheckCli(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result && typeof result === "object" && "status" in result && result.status === "repair-gap") process.exitCode = 2;
}
