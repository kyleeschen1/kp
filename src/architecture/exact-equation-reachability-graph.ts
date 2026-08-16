import {
  deriveKpDirectModuleCallers,
  kpAnimationApiCallerAuditTargets,
  type KpAnimationApiCallerSourceFile
} from "./animation-api-caller-ledger.ts";
import {
  kpEquationSurfaceAuthorityNodes
} from "./equation-surface-authority-graph.ts";
import {
  kpSemanticAnimationCompatibilityLedger
} from "./semantic-animation-compatibility-ledger.ts";

export type KpEquationReachabilityConcern =
  | "compiler"
  | "generic-fallback"
  | "manifest"
  | "capability-loader"
  | "compatibility"
  | "public-projection";

export interface KpEquationReachabilityRootDeclaration {
  readonly id: string;
  readonly concern: KpEquationReachabilityConcern;
  readonly sourcePath: `src/${string}`;
  readonly authorityId: string;
}

export interface KpEquationReachabilityRoot {
  readonly id: string;
  readonly concern: KpEquationReachabilityConcern;
  readonly sourcePath: `src/${string}`;
  readonly authorityId: string;
  readonly sourceCallers: readonly string[];
  readonly testCallers: readonly string[];
  readonly scriptCallers: readonly string[];
  readonly otherCallers: readonly string[];
  readonly reachability: "live-callers" | "no-observed-caller";
}

export interface KpExactEquationReachabilityGraph {
  readonly schemaVersion: "kp.exact-equation-reachability-graph.v1";
  readonly kind: "exact-equation-reachability-graph";
  readonly scannedFileCount: number;
  readonly roots: readonly KpEquationReachabilityRoot[];
}

export class KpExactEquationReachabilityGraphError extends Error {
  override readonly name = "KpExactEquationReachabilityGraphError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

export const kpExactEquationReachabilityGeneratedPath =
  "src/architecture/exact-equation-reachability-graph.generated.json";

const manifestPaths = Object.freeze([
  "src/architecture/equation-asset-manifest.ts",
  "src/architecture/equation-surface-inventory.ts",
  "src/architecture/equation-surface-disposition-ledger.ts",
  "src/editor/semantic-animation-preservation-manifest.ts",
  "src/public/equation-animation-manifest.ts"
] as const);

const capabilityLoaderPaths = Object.freeze([
  "src/editor/animation-surface-adapter-registry.ts",
  "src/editor/selected-surface-capability-host.ts",
  "src/editor/selected-surface-capability.ts"
] as const);

export const kpExactEquationReachabilityRootDeclarations = Object.freeze([
  ...kpEquationSurfaceAuthorityNodes
    .filter(({ category }) => category === "compiler")
    .map((node) => root("compiler", node.sourcePath, node.id)),
  ...kpEquationSurfaceAuthorityNodes
    .filter(({ category }) => category === "fallback")
    .map((node) => root("generic-fallback", node.sourcePath, node.id)),
  ...manifestPaths.map((path) => root("manifest", path, `manifest.${path}`)),
  ...capabilityLoaderPaths.map((path) =>
    root("capability-loader", path, `capability-loader.${path}`)
  ),
  ...kpSemanticAnimationCompatibilityLedger.flatMap((entry) =>
    unique([
      entry.owner.path,
      ...entry.authors.map(({ path }) => path),
      ...entry.consumers.map(({ path }) => path),
      ...entry.replacementEvidence.map(({ path }) => path)
    ]).map((path) => root("compatibility", path, entry.id))
  ),
  ...kpAnimationApiCallerAuditTargets
    .filter(({ tier }) =>
      tier === "authoring-seam" ||
      tier === "integration-facade" ||
      tier === "reader-facade" ||
      tier === "renderer-facade" ||
      tier === "motif-facade"
    )
    .map((target) =>
      root("public-projection", target.targetPath, target.id)
    )
] satisfies readonly KpEquationReachabilityRootDeclaration[]);

export function compileKpExactEquationReachabilityGraph(input: {
  readonly files: readonly KpAnimationApiCallerSourceFile[];
  readonly roots?: readonly KpEquationReachabilityRootDeclaration[];
}): KpExactEquationReachabilityGraph {
  const roots = input.roots ?? kpExactEquationReachabilityRootDeclarations;
  const diagnostics: string[] = [];
  const filePaths = new Set(input.files.map(({ path }) => path));
  requireUnique(roots.map(({ id }) => id), "reachability root id", diagnostics);
  requireUnique(input.files.map(({ path }) => path), "scanned source path", diagnostics);
  for (const declaration of roots) {
    if (!filePaths.has(declaration.sourcePath)) {
      diagnostics.push(
        `Unknown reachability root ${declaration.id}: ${declaration.sourcePath}.`
      );
    }
  }
  if (diagnostics.length > 0) {
    throw new KpExactEquationReachabilityGraphError(Object.freeze(diagnostics));
  }

  const callers = deriveKpDirectModuleCallers(
    roots.map(({ id, sourcePath }) => ({ id, targetPath: sourcePath })),
    input.files
  );
  return Object.freeze({
    schemaVersion: "kp.exact-equation-reachability-graph.v1" as const,
    kind: "exact-equation-reachability-graph" as const,
    scannedFileCount: input.files.length,
    roots: Object.freeze(roots.map((declaration) => {
      const paths = callers.find(({ id }) => id === declaration.id)!.callers;
      return Object.freeze({
        ...declaration,
        sourceCallers: Object.freeze(paths.filter((path) => path.startsWith("src/"))),
        testCallers: Object.freeze(paths.filter((path) => path.startsWith("tests/"))),
        scriptCallers: Object.freeze(paths.filter((path) => path.startsWith("scripts/"))),
        otherCallers: Object.freeze(paths.filter((path) =>
          !path.startsWith("src/") &&
          !path.startsWith("tests/") &&
          !path.startsWith("scripts/")
        )),
        reachability: paths.length === 0
          ? "no-observed-caller" as const
          : "live-callers" as const
      });
    }))
  });
}

function root(
  concern: KpEquationReachabilityConcern,
  sourcePath: `src/${string}`,
  authorityId: string
): KpEquationReachabilityRootDeclaration {
  return Object.freeze({
    id: `reachability.${concern}.${authorityId}.${sourcePath}`,
    concern,
    sourcePath,
    authorityId
  });
}

function unique<const Value extends string>(values: readonly Value[]): Value[] {
  return [...new Set(values)];
}

function requireUnique(
  values: readonly string[],
  label: string,
  diagnostics: string[]
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) diagnostics.push(`Duplicate ${label} ${value}.`);
    seen.add(value);
  }
}
