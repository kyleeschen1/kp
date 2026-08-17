import {
  kpFrameworkNeutralEntrypoints,
  type KpFrameworkNeutralEntrypoint
} from "./kp-framework-neutral-entrypoints.ts";
import { resolveKpModuleOwnershipZone } from "./kp-module-ownership.ts";

export interface KpFrameworkNeutralImportReference {
  readonly importer: string;
  readonly specifier: string;
}

export interface KpFrameworkNeutralImportEdge
  extends KpFrameworkNeutralImportReference {
  readonly target: string;
}

export interface KpFrameworkNeutralImportGraph {
  readonly sourcePaths: readonly string[];
  readonly references: readonly KpFrameworkNeutralImportReference[];
  readonly localEdges: readonly KpFrameworkNeutralImportEdge[];
}

export type KpFrameworkNeutralEntrypointIssueKind =
  | "missing-entrypoint"
  | "unregistered-public-entrypoint"
  | "unsupported-public-target"
  | "forbidden-transitive-module"
  | "forbidden-transitive-zone"
  | "undeclared-external-package";

export interface KpFrameworkNeutralEntrypointIssue {
  readonly entrypointId?: string | undefined;
  readonly kind: KpFrameworkNeutralEntrypointIssueKind;
  readonly importer: string;
  readonly target: string;
  readonly message: string;
}

const publicRoot = "src/public/";
const forbiddenPathPrefixes = [
  "src/app-adapters/",
  "src/article/",
  "src/compatibility/",
  "src/compiler/",
  "src/dev-review/",
  "src/dev-toolbar/",
  "src/editor/",
  "src/experiments/",
  "src/internal-studio/",
  "src/project-dashboard/",
  "src/public-web/",
  "src/reader/app/",
  "src/tutorial/"
] as const;

/**
 * The audit follows both value and type edges: a portable facade cannot expose
 * an implementation type that forces consumers to understand a product host.
 */
export function auditKpFrameworkNeutralEntrypoints(
  graph: KpFrameworkNeutralImportGraph,
  entrypoints: readonly KpFrameworkNeutralEntrypoint[] =
    kpFrameworkNeutralEntrypoints
): readonly KpFrameworkNeutralEntrypointIssue[] {
  const issues: KpFrameworkNeutralEntrypointIssue[] = [];
  const entrypointByPath = new Map(
    entrypoints.map((definition) => [definition.modulePath, definition])
  );
  const sourcePaths = new Set(graph.sourcePaths);

  for (const definition of entrypoints) {
    if (!sourcePaths.has(definition.modulePath)) {
      issues.push(issue({
        entrypointId: definition.id,
        kind: "missing-entrypoint",
        importer: definition.modulePath,
        target: definition.modulePath,
        message: "registered framework-neutral entrypoint does not exist"
      }));
      continue;
    }
    auditTransitiveClosure(graph, definition, issues);
  }

  for (const path of graph.sourcePaths) {
    if (!path.startsWith(publicRoot) || entrypointByPath.has(path)) continue;
    issues.push(issue({
      kind: "unregistered-public-entrypoint",
      importer: path,
      target: path,
      message: "every src/public module must be a governed public entrypoint"
    }));
  }

  for (const edge of graph.localEdges) {
    if (!edge.target.startsWith(publicRoot)) continue;
    if (entrypointByPath.has(edge.target)) continue;
    issues.push(issue({
      kind: "unsupported-public-target",
      importer: edge.importer,
      target: edge.target,
      message: "consumers may import only registered public entrypoint modules"
    }));
  }

  return Object.freeze(issues.sort(compareIssues));
}

function auditTransitiveClosure(
  graph: KpFrameworkNeutralImportGraph,
  definition: KpFrameworkNeutralEntrypoint,
  issues: KpFrameworkNeutralEntrypointIssue[]
): void {
  const edgesByImporter = groupByImporter(graph.localEdges);
  const referencesByImporter = groupByImporter(graph.references);
  const visited = new Set<string>();
  const pending = [definition.modulePath];

  while (pending.length > 0) {
    const importer = pending.pop()!;
    if (visited.has(importer)) continue;
    visited.add(importer);

    for (const reference of referencesByImporter.get(importer) ?? []) {
      if (reference.specifier.startsWith(".")) continue;
      const packageName = externalPackageName(reference.specifier);
      if (definition.allowedExternalPackages.includes(packageName)) continue;
      issues.push(issue({
        entrypointId: definition.id,
        kind: "undeclared-external-package",
        importer,
        target: reference.specifier,
        message: `${definition.id} does not declare external package ${packageName}`
      }));
    }

    for (const edge of edgesByImporter.get(importer) ?? []) {
      if (forbiddenPath(edge.target)) {
        issues.push(issue({
          entrypointId: definition.id,
          kind: "forbidden-transitive-module",
          importer,
          target: edge.target,
          message: `${definition.id} reaches host or product composition code`
        }));
        continue;
      }
      const targetZone = resolveKpModuleOwnershipZone(edge.target)?.id;
      if (
        targetZone !== undefined &&
        targetZone !== "public-api" &&
        !definition.allowedOwnershipZones.includes(targetZone)
      ) {
        issues.push(issue({
          entrypointId: definition.id,
          kind: "forbidden-transitive-zone",
          importer,
          target: edge.target,
          message: `${definition.id} may not reach ownership zone ${targetZone}`
        }));
        continue;
      }
      if (edge.target.startsWith("src/")) pending.push(edge.target);
    }
  }
}

function forbiddenPath(path: string): boolean {
  return path.endsWith(".svelte") ||
    forbiddenPathPrefixes.some((prefix) => path.startsWith(prefix));
}

function groupByImporter<T extends { readonly importer: string }>(
  values: readonly T[]
): ReadonlyMap<string, readonly T[]> {
  const grouped = new Map<string, T[]>();
  for (const value of values) {
    const bucket = grouped.get(value.importer) ?? [];
    bucket.push(value);
    grouped.set(value.importer, bucket);
  }
  return grouped;
}

function externalPackageName(specifier: string): string {
  if (!specifier.startsWith("@")) return specifier.split("/")[0]!;
  return specifier.split("/").slice(0, 2).join("/");
}

function issue(
  definition: KpFrameworkNeutralEntrypointIssue
): KpFrameworkNeutralEntrypointIssue {
  return Object.freeze(definition);
}

function compareIssues(
  left: KpFrameworkNeutralEntrypointIssue,
  right: KpFrameworkNeutralEntrypointIssue
): number {
  return left.importer.localeCompare(right.importer) ||
    left.target.localeCompare(right.target) ||
    left.kind.localeCompare(right.kind);
}
