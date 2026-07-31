import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

export interface KpBundleFileAttribution {
  readonly file: string;
  readonly gzipBytes: number;
}

export interface KpBundleClosureAttribution {
  readonly gzipBytes: number;
  readonly files: readonly KpBundleFileAttribution[];
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
