export const kpLegacyEquationSdkPaths = Object.freeze([
  "src/public/equation-animation-manifest.ts",
  "src/public/kp-animation-sdk.ts"
] as const);

export interface KpLegacyEquationSdkReachabilityAudit {
  readonly status: "retired";
  readonly packageExposure: "private-without-exports";
  readonly productionImporters: Readonly<Record<
    typeof kpLegacyEquationSdkPaths[number],
    readonly string[]
  >>;
  readonly testImporters: Readonly<Record<
    typeof kpLegacyEquationSdkPaths[number],
    readonly string[]
  >>;
  readonly scriptImporters: Readonly<Record<
    typeof kpLegacyEquationSdkPaths[number],
    readonly string[]
  >>;
  readonly descriptiveReferences: readonly string[];
  readonly replacementAuthorities: readonly string[];
}

/**
 * This records the observable boundary before removal. The package is private
 * and exports no SDK path, so repository importers are the complete supported
 * consumer set rather than a proxy for an undocumented public package API.
 */
export const kpLegacyEquationSdkReachabilityAudit = Object.freeze({
  status: "retired",
  packageExposure: "private-without-exports",
  productionImporters: Object.freeze({
    "src/public/equation-animation-manifest.ts": Object.freeze([
      "src/public/kp-animation-sdk.ts"
    ]),
    "src/public/kp-animation-sdk.ts": Object.freeze([])
  }),
  testImporters: Object.freeze({
    "src/public/equation-animation-manifest.ts": Object.freeze([
      "tests/manifest-projection-authority.test.ts"
    ]),
    "src/public/kp-animation-sdk.ts": Object.freeze([
      "tests/kp-animation-sdk.test.ts"
    ])
  }),
  scriptImporters: Object.freeze({
    "src/public/equation-animation-manifest.ts": Object.freeze([]),
    "src/public/kp-animation-sdk.ts": Object.freeze([])
  }),
  descriptiveReferences: Object.freeze([
    "docs/superpowers/specs/2026-07-09-kp-animation-sdk-api.md",
    "src/architecture/exact-equation-reachability-graph.ts",
    "src/architecture/manifest-projection-authority.ts",
    "src/project-dashboard/data.ts"
  ]),
  replacementAuthorities: Object.freeze([
    "src/animation/kernel.ts",
    "src/animation/catalog-loader.ts",
    "src/authoring/public-api.ts",
    "src/authoring/canonical-animation-public-api.ts"
  ])
} as const satisfies KpLegacyEquationSdkReachabilityAudit);
