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
