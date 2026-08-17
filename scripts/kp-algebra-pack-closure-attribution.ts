import type {
  KpBundleExperienceMeasurement
} from "./measure-kp-bundle-experiences.ts";

export const KP_ALGEBRA_CLOSURE_OWNERS = Object.freeze([
  "caller",
  "semantic",
  "runtime",
  "renderer",
  "katex"
] as const);

export type KpAlgebraClosureOwner =
  typeof KP_ALGEBRA_CLOSURE_OWNERS[number];

type KpMeasuredFile = KpBundleExperienceMeasurement["files"][number];

export interface KpAlgebraClosureOwnerAttribution {
  readonly owner: KpAlgebraClosureOwner;
  readonly gzipBytes: number;
  readonly permille: number;
  readonly files: readonly KpMeasuredFile[];
}

export interface KpAlgebraPackClosureAttribution {
  readonly schemaVersion: "kp.algebra-pack-closure-attribution.v1";
  readonly scenarioId: string;
  readonly activationId: "load-domain-pack";
  readonly gzipBytes: number;
  readonly owners: readonly KpAlgebraClosureOwnerAttribution[];
}

const OWNER_RULES: Readonly<Record<
  Exclude<KpAlgebraClosureOwner, "caller">,
  readonly string[]
>> = Object.freeze({
  katex: Object.freeze(["katex"]),
  renderer: Object.freeze([
    "adapter",
    "surface",
    "presentation",
    "paint",
    "material-layer",
    "computed-style",
    "visual-motif",
    "focus-profile",
    "texture-atlas",
    "geometry",
    "diagram"
  ]),
  runtime: Object.freeze([
    "runtime",
    "sampler",
    "timeline",
    "choreography",
    "motion-profile",
    "stage-hot-path-cache",
    "animation-diagnostics"
  ]),
  semantic: Object.freeze([
    "semantic",
    "semantics",
    "lineage",
    "expression-node",
    "operation-",
    "transformation-",
    "compiler",
    "validator",
    "-policy",
    "-law",
    "-plan",
    "-spec",
    "selector-annotated-latex",
    "fragment",
    "definition-binding",
    "exact-rational",
    "decomposition",
    "fission-fusion",
    "linear-map",
    "matrix"
  ])
});

export function classifyKpAlgebraClosureFile(
  file: KpMeasuredFile
): KpAlgebraClosureOwner {
  const evidence = [file.file, ...file.ownerSources].join("\n").toLowerCase();
  for (const owner of ["katex", "renderer", "runtime", "semantic"] as const) {
    if (OWNER_RULES[owner].some((token) => evidence.includes(token))) {
      return owner;
    }
  }
  return "caller";
}

export function attributeKpAlgebraPackClosure(input: {
  readonly scenarioId: string;
  readonly files: readonly KpMeasuredFile[];
}): KpAlgebraPackClosureAttribution {
  const filesByOwner = new Map<KpAlgebraClosureOwner, KpMeasuredFile[]>(
    KP_ALGEBRA_CLOSURE_OWNERS.map((owner) => [owner, []])
  );
  const stableFiles = [...input.files].sort((left, right) =>
    left.file.localeCompare(right.file)
  );
  for (const file of stableFiles) {
    filesByOwner.get(classifyKpAlgebraClosureFile(file))!.push(file);
  }
  const gzipBytes = stableFiles.reduce(
    (total, file) => total + file.gzipBytes,
    0
  );
  return Object.freeze({
    schemaVersion: "kp.algebra-pack-closure-attribution.v1" as const,
    scenarioId: input.scenarioId,
    activationId: "load-domain-pack" as const,
    gzipBytes,
    owners: Object.freeze(KP_ALGEBRA_CLOSURE_OWNERS.map((owner) => {
      const files = filesByOwner.get(owner)!;
      const ownerBytes = files.reduce(
        (total, file) => total + file.gzipBytes,
        0
      );
      return Object.freeze({
        owner,
        gzipBytes: ownerBytes,
        permille: gzipBytes === 0 ? 0 : Math.round(ownerBytes * 1_000 / gzipBytes),
        files: Object.freeze(files)
      });
    }))
  });
}

