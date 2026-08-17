import type { KpViteManifest } from "./vite-manifest-closure.ts";

export const KP_ALGEBRA_PACK_BASELINE_GZIP_BYTES = 83_877;
export const KP_ALGEBRA_PACK_MINIMUM_SAVINGS_PERMILLE = 100;

const LINEAR_SOLVE_ROOT =
  "src/animation/catalog-packs/algebra-linear-solve.ts";
const REMAINING_ALGEBRA_ROOT = "src/animation/catalog-packs/algebra.ts";
const SHARED_RUNTIME_NAME = "algebra-choreography-capabilities";

export interface KpAlgebraPackSplitInspection {
  readonly baselineGzipBytes: number;
  readonly currentGzipBytes: number;
  readonly savingsGzipBytes: number;
  readonly savingsPermille: number;
  readonly sharedRuntimeChunkKey: string;
  readonly violations: readonly string[];
}

export function inspectKpAlgebraPackSplit(input: {
  readonly currentGzipBytes: number;
  readonly manifest: KpViteManifest;
}): KpAlgebraPackSplitInspection {
  const savingsGzipBytes =
    KP_ALGEBRA_PACK_BASELINE_GZIP_BYTES - input.currentGzipBytes;
  const savingsPermille = Math.round(
    savingsGzipBytes * 1_000 / KP_ALGEBRA_PACK_BASELINE_GZIP_BYTES
  );
  const runtimeEntries = Object.entries(input.manifest).filter(
    ([, chunk]) => chunk.name === SHARED_RUNTIME_NAME
  );
  const sharedRuntimeChunkKey = runtimeEntries[0]?.[0] ?? "";
  const linearSolveImports = input.manifest[LINEAR_SOLVE_ROOT]?.imports ?? [];
  const remainingAlgebraImports =
    input.manifest[REMAINING_ALGEBRA_ROOT]?.imports ?? [];
  const violations = [
    ...(savingsPermille < KP_ALGEBRA_PACK_MINIMUM_SAVINGS_PERMILLE
      ? [`algebra split saves ${savingsPermille} permille; expected at least ` +
        `${KP_ALGEBRA_PACK_MINIMUM_SAVINGS_PERMILLE}`]
      : []),
    ...(runtimeEntries.length !== 1
      ? [`expected one ${SHARED_RUNTIME_NAME} chunk, found ${runtimeEntries.length}`]
      : []),
    ...(!linearSolveImports.includes(sharedRuntimeChunkKey)
      ? ["linear-solve pack does not import the shared algebra runtime"]
      : []),
    ...(!remainingAlgebraImports.includes(sharedRuntimeChunkKey)
      ? ["remaining algebra pack does not import the shared algebra runtime"]
      : [])
  ];
  return Object.freeze({
    baselineGzipBytes: KP_ALGEBRA_PACK_BASELINE_GZIP_BYTES,
    currentGzipBytes: input.currentGzipBytes,
    savingsGzipBytes,
    savingsPermille,
    sharedRuntimeChunkKey,
    violations: Object.freeze(violations)
  });
}

