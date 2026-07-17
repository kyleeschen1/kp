import {
  kpCanonicalOperationRegistry
} from "../semantic/canonical-operation-registry.ts";
import type {
  KpCanonicalOperationId,
  KpCanonicalOperationRole
} from "../semantic/canonical-operation.ts";
import type { KpCanonicalOperationPackPin } from "../semantic/canonical-operation-pack.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../rendering/equation-visual-motif-defaults.ts";
import type {
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "../rendering/visual-motif.ts";

export interface KpLlmPromotedOperationAuthoringDefinition {
  readonly operationId: string;
  readonly operationPack: KpCanonicalOperationPackPin;
  readonly summary: string;
  readonly transformType: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly visualMotif: EquationVisualMotifKind;
  readonly semanticPhaseIds: readonly EquationVisualMotifPhaseId[];
}

export interface KpLlmSemanticMotionOperationCatalog {
  readonly kind: "llm-semantic-motion-operation-catalog";
  readonly schemaVersion: "kp.llm-operation-catalog.v1";
  readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  readonly operations: readonly KpLlmPromotedOperationAuthoringDefinition[];
  readonly prohibitedAuthoringFields: readonly string[];
}

export function createKpLlmSemanticMotionOperationCatalog():
  KpLlmSemanticMotionOperationCatalog {
  const operations = kpCanonicalOperationRegistry.entries
    .filter((entry) => entry.sourceTransformType !== undefined)
    .map((entry): KpLlmPromotedOperationAuthoringDefinition => {
      const rule = defaultEquationTransformVisualMotifRules.find(
        (candidate) => candidate.transformationKind === entry.sourceTransformType
      );
      if (rule === undefined) {
        throw new Error(
          `Promoted operation ${entry.id} has no equation visual motif for ${entry.sourceTransformType}.`
        );
      }
      if (entry.contract.roles.length === 0) {
        throw new Error(`Promoted operation ${entry.id} has no LLM authoring role contract.`);
      }
      const pack = kpCanonicalOperationRegistry.packs.find(
        (candidate) => candidate.id === entry.packId
      )!;
      return {
        operationId: entry.id,
        operationPack: { packId: pack.id, version: pack.version },
        summary: entry.authoringSummary ?? rule.summary ?? entry.sourceTransformType!,
        transformType: entry.sourceTransformType!,
        canonicalComposition: [...entry.canonicalComposition],
        roles: entry.contract.roles.map((role) => ({ ...role })),
        visualMotif: rule.descriptor.kind,
        semanticPhaseIds: [...rule.descriptor.phaseIds]
      };
    });
  const operationPackIds = new Set(operations.map((operation) => operation.operationPack.packId));
  const operationPacks = kpCanonicalOperationRegistry.packs
    .filter((pack) => pack.id === "kp.core" || operationPackIds.has(pack.id))
    .map((pack) => ({ packId: pack.id, version: pack.version }));
  return {
    kind: "llm-semantic-motion-operation-catalog",
    schemaVersion: "kp.llm-operation-catalog.v1",
    operationPacks,
    operations,
    // Models choose semantics and salience; KP owns all concrete realization.
    prohibitedAuthoringFields: [
      "coordinates",
      "paths",
      "keyframes",
      "timing",
      "per-token delays",
      "scale transforms",
      "shadows",
      "DOM",
      "SVG"
    ]
  };
}
