import { relative } from "node:path";

import type { Plugin } from "vite";

import {
  isKpProductionDevelopmentModule
} from "../src/architecture/kp-production-development-erasure.ts";

export function findKpRenderedProductionDevelopmentModules(
  moduleIds: Iterable<string>,
  projectRoot: string
): readonly string[] {
  const violations = new Set<string>();
  for (const moduleId of moduleIds) {
    const path = toProjectPath(moduleId, projectRoot);
    if (path !== undefined && isKpProductionDevelopmentModule(path)) {
      violations.add(path);
    }
  }
  return Object.freeze([...violations].sort());
}

/** Rollup's rendered-module set proves erasure even when it merges a module into another chunk. */
export function kpProductionDevelopmentErasurePlugin(input: {
  readonly projectRoot: string;
}): Plugin {
  return {
    name: "kp-production-development-erasure",
    apply: "build",
    generateBundle(_options, bundle) {
      const renderedModuleIds = Object.values(bundle).flatMap((output) =>
        output.type === "chunk" ? Object.keys(output.modules) : []
      );
      const violations = findKpRenderedProductionDevelopmentModules(
        renderedModuleIds,
        input.projectRoot
      );
      if (violations.length > 0) {
        this.error(
          `Development implementations survived production tree-shaking:\n${
            violations.map((path) => `- ${path}`).join("\n")
          }`
        );
      }
    }
  };
}

function toProjectPath(
  moduleId: string,
  projectRoot: string
): string | undefined {
  const withoutQuery = moduleId.split("?", 1)[0]!;
  const normalizedRoot = projectRoot.replaceAll("\\", "/").replace(/\/$/u, "");
  const normalizedId = withoutQuery.replaceAll("\\", "/");
  const normalizedPath = normalizedId.startsWith(`${normalizedRoot}/`)
    ? relative(projectRoot, withoutQuery).replaceAll("\\", "/")
    : normalizedId.startsWith("src/")
      ? normalizedId
      : undefined;
  return normalizedPath?.startsWith("../") === false ? normalizedPath : undefined;
}
