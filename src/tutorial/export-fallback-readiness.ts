import type { KpTutorialCardExportArtifact } from "./export-artifact.ts";

export interface KpTutorialExportFallbackReadinessDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpTutorialExportFallbackReadiness(
  artifact: KpTutorialCardExportArtifact
): readonly KpTutorialExportFallbackReadinessDiagnostic[] {
  const diagnostics: KpTutorialExportFallbackReadinessDiagnostic[] = [];

  if (artifact.fallback.strategy.trim() === "") {
    diagnostics.push({
      path: "fallback.strategy",
      message: `Export artifact ${artifact.id} fallback strategy is required.`
    });
  }

  if (!artifact.fallback.preservesLayout) {
    diagnostics.push({
      path: "fallback.preservesLayout",
      message: `Export artifact ${artifact.id} fallback must preserve layout.`
    });
  }

  if ((artifact.fallback.message ?? "").trim() === "") {
    diagnostics.push({
      path: "fallback.message",
      message: `Export artifact ${artifact.id} fallback message is required.`
    });
  }

  const metadataFallbackStrategy = artifact.metadata?.["fallbackStrategy"];

  if (
    typeof metadataFallbackStrategy === "string" &&
    metadataFallbackStrategy !== artifact.fallback.strategy
  ) {
    diagnostics.push({
      path: "metadata.fallbackStrategy",
      message: `Export artifact ${artifact.id} metadata fallbackStrategy must match fallback.strategy.`
    });
  }

  return diagnostics;
}
