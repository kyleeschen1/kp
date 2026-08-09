import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const distRoot = resolve("dist");
const forbidden = [
  "/api/dev/reviews",
  "kp:dev-review-shell-open",
  "kp:reader-dev-review-frame",
  "Review this moment",
  "reader-review-bootstrap",
  "data-kp-dev-review-shell",
  "kp-exact-review-sheet",
  "data-kp-dev-toolbar",
  "Development tools",
  "kp.dev-toolbar.v1"
] as const;
const candidates = await collectFiles(distRoot);
const violations: string[] = [];
for (const file of candidates) {
  if (![".html", ".js", ".css", ".map"].includes(extname(file))) continue;
  const source = await readFile(file, "utf8");
  for (const marker of forbidden) {
    if (source.includes(marker)) violations.push(`${relative(distRoot, file)} contains ${marker}`);
  }
}
if (violations.length > 0) throw new Error(`Dev review leaked into production:\n${violations.join("\n")}`);
console.log(`dev review production closure passed (${candidates.length} files, ${forbidden.length} forbidden markers)`);

async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  }));
  return files.flat();
}
