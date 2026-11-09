import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AnchoredAlgebraGap } from "../src/reader/app/what-counts-commentary.ts";

export interface ReadingRevision {
  readonly articlePath: string;
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly sha256?: string;
}
export interface ArchivedReadingRevision extends ReadingRevision { readonly sha256: string }
export type ReadingRegistration = ReadingRevision & { readonly previous?: readonly ArchivedReadingRevision[] };
export const whatCountsReadingsPath = "content/authoring/algebra/what-counts-readings.json";
export const whatCountsRoot = fileURLToPath(new URL("../", import.meta.url));
export const readingDigest = (text: string) => createHash("sha256").update(text).digest("hex");

function revision(value: unknown, path: string): ReadingRevision {
  if (!value || typeof value !== "object" || !("articlePath" in value) || typeof value.articlePath !== "string"
    || !/^content\/authoring\/algebra\/[a-zA-Z0-9./_-]+\.md$/.test(value.articlePath)
    || value.articlePath.split("/").some(part => part === "." || part === ".." || !part)
    || !("version" in value) || typeof value.version !== "string" || !value.version.trim()
    || !("title" in value) || typeof value.title !== "string" || !value.title.trim()
    || !("description" in value) || typeof value.description !== "string")
    throw new AnchoredAlgebraGap(path, "Require a bounded local Article, nonempty version and title, and description.");
  if ("sha256" in value && (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)))
    throw new AnchoredAlgebraGap(path, "Require an exact SHA-256 source digest.");
  return { articlePath: value.articlePath, version: value.version, title: value.title, description: value.description,
    ...("sha256" in value && typeof value.sha256 === "string" ? { sha256: value.sha256 } : {}) };
}

/** Keep versions globally distinct, and retain a source pin for every archive. */
export function registerWhatCountsReadings(input: unknown): Map<string, ReadingRegistration> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new AnchoredAlgebraGap("readings", "Require the reading registry.");
  const versions = new Set<string>(), entries = new Map<string, ReadingRegistration>();
  for (const [id, value] of Object.entries(input)) {
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new AnchoredAlgebraGap("readings", "Require a stable reading ID.");
    const current = revision(value, `readings.${id}`), previous: ArchivedReadingRevision[] = [];
    if (value && typeof value === "object" && "previous" in value) {
      if (!Array.isArray(value.previous)) throw new AnchoredAlgebraGap(`readings.${id}.previous`, "Require an archive list.");
      for (const item of value.previous) {
        const old = revision(item, `readings.${id}.previous`);
        if (!old.sha256) throw new AnchoredAlgebraGap(`readings.${id}.previous`, "Archive exact source bytes before replacing a saved reading revision.");
        previous.push({ ...old, sha256: old.sha256 });
      }
    }
    for (const item of [current, ...previous]) {
      if (versions.has(item.version)) throw new AnchoredAlgebraGap(`readings.${id}.version`, "Each reading requires its own nonempty document revision.");
      versions.add(item.version);
    }
    entries.set(id, { ...current, ...(previous.length ? { previous } : {}) });
  }
  return entries;
}

export function readWhatCountsArticle(registration: ReadingRevision, root = whatCountsRoot) {
  const markdown = readFileSync(resolve(root, registration.articlePath), "utf8");
  if (registration.sha256 && readingDigest(markdown) !== registration.sha256)
    throw new AnchoredAlgebraGap("reader.archive", "The retained reading changed. Restore its pinned source before opening saved coordinates.");
  return markdown;
}
