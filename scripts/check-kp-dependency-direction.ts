import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  kpDependencyDirectionExceptionKey,
  kpDependencyDirectionExceptions,
  type KpDependencyDirectionException
} from "../src/architecture/kp-dependency-direction-exceptions.ts";
import { evaluateKpDependencyDirection } from "../src/architecture/kp-dependency-direction-policy.ts";
import { resolveKpModuleOwnershipZone } from "../src/architecture/kp-module-ownership.ts";
import {
  collectKpTypescriptImportGraph,
  type KpTypescriptImportGraph
} from "./typescript-import-extractor.ts";

export interface KpDependencyDirectionAudit {
  readonly sourceModuleCount: number;
  readonly referenceCount: number;
  readonly localEdgeCount: number;
  readonly exactExceptionCount: number;
  readonly issues: readonly string[];
}

export type KpDependencyDirectionAuditException = Omit<
  KpDependencyDirectionException,
  "owner" | "plannedSlice"
> & Readonly<{
  // Synthetic negative tests still need to exercise stale-exception handling
  // after the live zero-exception ledger deliberately narrows these to never.
  owner: string;
  plannedSlice: string;
}>;

export function auditKpDependencyDirection(
  repositoryRoot: string
): KpDependencyDirectionAudit {
  const graph = collectKpTypescriptImportGraph(repositoryRoot);
  return auditKpDependencyDirectionGraph(graph);
}

export function auditKpDependencyDirectionGraph(
  graph: KpTypescriptImportGraph,
  exceptions: readonly KpDependencyDirectionAuditException[] =
    kpDependencyDirectionExceptions
): KpDependencyDirectionAudit {
  const issues: string[] = [];
  const observedExceptionKeys = new Map<string, number>();
  const exceptionByKey = new Map(
    exceptions.map((entry) => [kpDependencyDirectionExceptionKey(entry), entry])
  );

  for (const path of graph.sourcePaths) {
    if (resolveKpModuleOwnershipZone(path) === undefined) {
      issues.push(`unowned source module: ${path}`);
    }
  }
  for (const reference of graph.unresolvedLocalReferences) {
    issues.push(
      `unresolved local module: ${reference.importer}:${reference.line}:` +
        `${reference.column} -> ${reference.specifier}`
    );
  }
  for (const edge of graph.localEdges) {
    if (!isCodeModule(edge.target)) continue;
    if (
      edge.target.startsWith("src/") &&
      resolveKpModuleOwnershipZone(edge.target) === undefined
    ) {
      issues.push(`unowned local target: ${edge.importer} -> ${edge.target}`);
      continue;
    }
    const violation = evaluateKpDependencyDirection(edge);
    if (violation === undefined) continue;
    const exception = exceptionByKey.get(
      kpDependencyDirectionExceptionKey(violation)
    );
    if (exception === undefined) {
      issues.push(
        `new dependency inversion: ${edge.importer}:${edge.line}:${edge.column} ` +
          `[${violation.sourceZone} -> ${violation.targetZone}; ${edge.kind}] ` +
          `-> ${edge.target}`
      );
      continue;
    }
    const key = kpDependencyDirectionExceptionKey(exception);
    observedExceptionKeys.set(key, (observedExceptionKeys.get(key) ?? 0) + 1);
  }

  for (const exception of exceptions) {
    const key = kpDependencyDirectionExceptionKey(exception);
    const observations = observedExceptionKeys.get(key) ?? 0;
    if (observations === 0) {
      issues.push(
        `stale dependency exception: ${exception.id} should retire with ` +
          `${exception.owner} (${exception.plannedSlice})`
      );
    } else if (observations > 1) {
      issues.push(
        `ambiguous dependency exception: ${exception.id} matched ` +
          `${observations} source edges`
      );
    }
  }

  return Object.freeze({
    sourceModuleCount: graph.sourcePaths.length,
    referenceCount: graph.references.length,
    localEdgeCount: graph.localEdges.length,
    exactExceptionCount: observedExceptionKeys.size,
    issues: Object.freeze(issues)
  });
}

function isCodeModule(path: string): boolean {
  return /\.(?:cts|mts|svelte|ts|tsx)$/.test(path);
}

function run(): void {
  const audit = auditKpDependencyDirection(process.cwd());
  if (audit.issues.length > 0) {
    for (const issue of audit.issues) console.error(issue);
    process.exitCode = 1;
    return;
  }
  console.log(
    `KP dependency-direction gate passed ` +
      `(${audit.sourceModuleCount} TypeScript modules, ` +
      `${audit.localEdgeCount}/${audit.referenceCount} local references, ` +
      `${audit.exactExceptionCount} exact retiring exceptions)`
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url === pathToFileURL(resolve(invokedPath)).href
) {
  run();
}
