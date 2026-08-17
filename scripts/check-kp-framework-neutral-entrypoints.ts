import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { auditKpFrameworkNeutralEntrypoints } from
  "../src/architecture/kp-framework-neutral-entrypoint-policy.ts";
import { collectKpTypescriptImportGraph } from
  "./typescript-import-extractor.ts";

export function checkKpFrameworkNeutralEntrypoints(
  repositoryRoot: string
): readonly string[] {
  const graph = collectKpTypescriptImportGraph(repositoryRoot);
  return auditKpFrameworkNeutralEntrypoints(graph).map((issue) =>
    `${issue.kind}: ${issue.importer} -> ${issue.target}: ${issue.message}`
  );
}

function run(): void {
  const graph = collectKpTypescriptImportGraph(process.cwd());
  const issues = auditKpFrameworkNeutralEntrypoints(graph);
  if (issues.length > 0) {
    for (const entrypointIssue of issues) {
      console.error(
        `${entrypointIssue.kind}: ${entrypointIssue.importer} -> ` +
          `${entrypointIssue.target}: ${entrypointIssue.message}`
      );
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `framework-neutral entrypoint gate passed ` +
      `(${graph.sourcePaths.length} modules, ` +
      `${graph.localEdges.length}/${graph.references.length} local references)`
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url === pathToFileURL(resolve(invokedPath)).href
) {
  run();
}
