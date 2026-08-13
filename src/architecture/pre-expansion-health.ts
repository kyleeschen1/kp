import type {
  KpRuntimeAuthorityInventoryEntry
} from "./runtime-authority-inventory.ts";
import type {
  KpSemanticAnimationCompatibilityLedgerEntry
} from "./semantic-animation-compatibility-ledger.ts";

export interface KpHealthSourceFile {
  readonly path: string;
  readonly source: string;
}

export function checkKpRuntimeAuthorityClassification(
  entries: readonly KpRuntimeAuthorityInventoryEntry[]
): readonly string[] {
  const failures: string[] = [];
  const ids = new Set<string>();
  const timeAuthorities = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) failures.push(`duplicate runtime authority ${entry.id}`);
    ids.add(entry.id);
    if (entry.kind !== "semantic-sampler" && entry.kind !== "playback-clock") {
      continue;
    }
    const key = `${entry.kind}:${entry.scope}`;
    if (timeAuthorities.has(key)) {
      failures.push(`second ${entry.kind} for ${entry.scope}`);
    }
    timeAuthorities.add(key);
  }
  return failures;
}

export function checkKpCatalogPackPurity(
  files: readonly KpHealthSourceFile[]
): readonly string[] {
  return files.flatMap((file) => {
    const failures: string[] = [];
    if (
      /from\s+["'][^"']*editor\/|import\s*(?:\(|["'])[^"']*editor\//u
        .test(file.source)
    ) {
      failures.push(`${file.path}: catalog data imports editor capability code`);
    }
    if (/^\s*registerKp\w+\([^)]*\);\s*$/mu.test(file.source)) {
      failures.push(`${file.path}: catalog data registers a capability on import`);
    }
    return failures;
  });
}

export function checkKpCompatibilityClassification(
  entries: readonly unknown[]
): readonly string[] {
  const statuses = new Set([
    "canonical",
    "compatibility-only",
    "retirement-candidate",
    "retained-fixture"
  ]);
  return entries.flatMap((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null) {
      return [`compatibility entry ${index} is not an object`];
    }
    const entry = candidate as Partial<KpSemanticAnimationCompatibilityLedgerEntry>;
    if (typeof entry.id !== "string" || !entry.id.startsWith("compatibility.")) {
      return [`compatibility entry ${index} has no classified id`];
    }
    if (!statuses.has(String(entry.status))) {
      return [`${entry.id}: compatibility status is unclassified`];
    }
    if (entry.owner === undefined || entry.consumers === undefined ||
      entry.replacementEvidence === undefined || entry.sunsetEvidence === undefined ||
      entry.requiredClosureEvidence === undefined ||
      typeof entry.retirementCondition !== "string") {
      return [`${entry.id}: compatibility evidence is incomplete`];
    }
    return [];
  });
}
