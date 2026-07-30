import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

interface ViteManifestChunk {
  readonly file: string;
  readonly name?: string | undefined;
  readonly imports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}

type ViteManifest = Readonly<Record<string, ViteManifestChunk>>;

export interface KpAnimationLibraryBundleBoundaryMeasurement {
  readonly outerGzipBytes: number;
  readonly mainHostGzipBytes: number;
  readonly placeValueIncrementalGzipBytes: number;
  readonly outerFiles: readonly string[];
  readonly forbiddenOuterFiles: readonly string[];
}

export const kpAnimationLibraryBundleBoundary = Object.freeze({
  // The catalog shell is metadata and navigation, not an animation runtime.
  outerGzipBytes: 50_000,
  // This freezes the existing editor host while later route-splitting remains
  // independently measurable instead of blocking the addition exemplar.
  // The repaired production closure measures 476,810 bytes; the ceiling
  // leaves less than 3% headroom while making subsequent growth explicit.
  mainHostGzipBytes: 490_000,
  // Selecting place-value addition may pay for its pack; merely opening the
  // library may not.
  placeValueIncrementalGzipBytes: 75_000
});

export async function inspectKpAnimationLibraryBundleBoundary(
  distRoot = resolve("dist")
): Promise<KpAnimationLibraryBundleBoundaryMeasurement> {
  const manifest = JSON.parse(await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  )) as ViteManifest;
  const outerKeys = collectClosureKeys(
    manifest,
    ["canonical-animation-review.html"]
  );
  const mainKeys = collectClosureKeys(manifest, ["src/main.ts"]);
  const placeValueRoots = Object.entries(manifest)
    .filter(([key, chunk]) =>
      /(?:src\/animation\/catalog-packs\/place-value\.ts|place-value-addition)/
        .test(`${key} ${chunk.name ?? ""} ${chunk.file}`)
    )
    .map(([key]) => key);
  if (placeValueRoots.length === 0) {
    throw new Error("Production manifest lacks the place-value addition pack.");
  }
  const placeValueKeys = collectClosureKeys(manifest, placeValueRoots);
  const incrementalPlaceValueKeys = new Set(
    [...placeValueKeys].filter((key) => !mainKeys.has(key))
  );
  const outerFiles = filesForKeys(manifest, outerKeys);
  const forbiddenOuterFiles = outerFiles.filter((file) =>
    /(?:place-value|native-katex|katex-|runtime-controller|equation-surface|graph-webgl)/i
      .test(file)
  );
  return Object.freeze({
    outerGzipBytes: await gzipFiles(distRoot, outerFiles),
    mainHostGzipBytes:
      await gzipFiles(distRoot, filesForKeys(manifest, mainKeys)),
    placeValueIncrementalGzipBytes:
      await gzipFiles(
        distRoot,
        filesForKeys(manifest, incrementalPlaceValueKeys)
      ),
    outerFiles: Object.freeze(outerFiles),
    forbiddenOuterFiles: Object.freeze(forbiddenOuterFiles)
  });
}

function collectClosureKeys(
  manifest: ViteManifest,
  roots: readonly string[]
): ReadonlySet<string> {
  const keys = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || keys.has(key)) continue;
    const chunk = manifest[key];
    if (chunk === undefined) {
      throw new Error(`Production manifest lacks entry ${key}.`);
    }
    keys.add(key);
    queue.push(...(chunk.imports ?? []));
  }
  return keys;
}

function filesForKeys(
  manifest: ViteManifest,
  keys: ReadonlySet<string>
): readonly string[] {
  const files = new Set<string>();
  for (const key of keys) {
    const chunk = manifest[key];
    if (chunk === undefined) continue;
    files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
  }
  return [...files]
    .filter((file) => extname(file) === ".js" || extname(file) === ".css")
    .sort();
}

async function gzipFiles(
  distRoot: string,
  files: readonly string[]
): Promise<number> {
  const sources = await Promise.all(files.map((file) =>
    readFile(resolve(distRoot, file))
  ));
  return sources.reduce(
    (total, source) => total + gzipSync(source).byteLength,
    0
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const measurement = await inspectKpAnimationLibraryBundleBoundary();
  const failures = [
    measurement.outerGzipBytes >
      kpAnimationLibraryBundleBoundary.outerGzipBytes
      ? `outer shell is ${measurement.outerGzipBytes} gzip bytes`
      : undefined,
    measurement.mainHostGzipBytes >
      kpAnimationLibraryBundleBoundary.mainHostGzipBytes
      ? `main host is ${measurement.mainHostGzipBytes} gzip bytes`
      : undefined,
    measurement.placeValueIncrementalGzipBytes >
      kpAnimationLibraryBundleBoundary.placeValueIncrementalGzipBytes
      ? "place-value incremental pack is " +
        `${measurement.placeValueIncrementalGzipBytes} gzip bytes`
      : undefined,
    measurement.forbiddenOuterFiles.length > 0
      ? "outer shell contains forbidden runtime files: " +
        measurement.forbiddenOuterFiles.join(", ")
      : undefined
  ].filter((failure): failure is string => failure !== undefined);
  if (failures.length > 0) {
    throw new Error(`Animation Library bundle boundary failed:\n${
      failures.join("\n")
    }`);
  }
  console.log(JSON.stringify({
    limits: kpAnimationLibraryBundleBoundary,
    measurement
  }, null, 2));
}
