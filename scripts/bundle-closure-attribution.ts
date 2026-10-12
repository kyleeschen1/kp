import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

export interface KpBundleFileAttribution {
  readonly file: string;
  readonly gzipBytes: number;
}

export interface KpBundleClosureAttribution {
  readonly gzipBytes: number;
  readonly files: readonly KpBundleFileAttribution[];
}

export type KpBundleManifest = Readonly<Record<string, {
  readonly file: string;
  readonly imports?: readonly string[] | undefined;
  readonly dynamicImports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}>>;

/** A module imported both statically and dynamically can become a shared chunk
 * with a generated manifest key. Resolve through emitted ownership evidence,
 * never by guessing filenames or silently dropping that activation. */
export function resolveKpBundleActivationRoots(manifest: KpBundleManifest,
  inventory: readonly { readonly file: string; readonly modules: readonly string[] }[], sources: readonly string[]): readonly string[] {
  const byFile = new Map(Object.entries(manifest).map(([key, chunk]) => [chunk.file, key]));
  const roots = sources.flatMap(source => {
    if (manifest[source]) return [source];
    const owners = inventory.filter(chunk => chunk.modules.includes(source));
    if (!owners.length) throw new Error(`Production inventory lacks activation module ${source}.`);
    return owners.map(owner => {
      const key = byFile.get(owner.file);
      if (!key) throw new Error(`Production manifest lacks activation owner ${owner.file}.`);
      return key;
    });
  });
  return Object.freeze([...new Set(roots)]);
}

/** Vite can coalesce identical HTML entries and omit their manifest keys.
 * Actual emitted script/link roots still own their full dependency closure. */
export function collectKpHtmlBundleFiles(html: string, manifest: KpBundleManifest, includeDynamicImports = false): readonly string[] {
  const files = new Set([...html.matchAll(/(?:src|href)="\/?(assets\/[^\"]+\.(?:js|css))"/g)].map(match => match[1]!));
  const byFile = new Map(Object.entries(manifest).map(([key, chunk]) => [chunk.file, key]));
  const roots: string[] = [];
  for (const file of files) {
    const key = byFile.get(file);
    if (key) roots.push(key);
    else if (extname(file) === ".js") throw new Error(`Production manifest lacks HTML script ${file}.`);
  }
  for (const file of collectKpBundleManifestFiles(manifest, roots, includeDynamicImports)) files.add(file);
  return Object.freeze([...files].sort());
}

/** Declared activation is a conservative reachable closure, not a claim that
 * every conditional capability is requested by one observed interaction. */
export function collectKpBundleManifestFiles(
  manifest: KpBundleManifest, roots: readonly string[], includeDynamicImports = false
): readonly string[] {
  const visited = new Set<string>(), files = new Set<string>(), queue = [...roots];
  while (queue.length) {
    const key = queue.pop()!;
    if (visited.has(key)) continue;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Production manifest lacks closure key ${key}.`);
    if ([".js", ".css"].includes(extname(chunk.file))) files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    queue.push(...(chunk.imports ?? []));
    if (includeDynamicImports) queue.push(...(chunk.dynamicImports ?? []));
  }
  return Object.freeze([...files].sort());
}

export async function measureKpBundleClosureAttribution(
  distRoot: string,
  files: readonly string[]
): Promise<KpBundleClosureAttribution> {
  const stableFiles = [...new Set(files)].sort();
  const attributions = await Promise.all(stableFiles.map(async (file) => ({
    file,
    gzipBytes: gzipSync(await readFile(resolve(distRoot, file))).byteLength
  })));
  return Object.freeze({
    gzipBytes: attributions.reduce(
      (total, attribution) => total + attribution.gzipBytes,
      0
    ),
    files: Object.freeze(attributions.map((attribution) =>
      Object.freeze(attribution)
    ))
  });
}

export function kpBundleBudgetDeltaBytes(
  measuredBytes: number,
  allowedBytes: number
): number {
  return measuredBytes - allowedBytes;
}
