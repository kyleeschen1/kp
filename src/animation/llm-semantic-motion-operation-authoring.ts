import {
  kpCanonicalOperationRegistry
} from "../semantic/canonical-operation-registry.ts";
import type {
  KpCanonicalOperationId,
  KpCanonicalOperationRole
} from "../semantic/canonical-operation.ts";
import type { KpCanonicalOperationPackPin } from "../semantic/canonical-operation-pack.ts";
import type { KpCanonicalOperationOwnershipMode } from "../semantic/canonical-operation-contract.ts";
import type { SelectorCorrespondenceRelationId } from "../semantic/correspondence.ts";
import type { KpLlmAnimationExplanationDepth } from "./llm-animation-draft-v2.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "./motifs/equation-visual-motif-defaults.ts";
import type {
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "./motifs/visual-motif.ts";

export interface KpLlmPromotedOperationAuthoringDefinition {
  readonly operationId: string;
  readonly operationPack: KpCanonicalOperationPackPin;
  readonly summary: string;
  readonly transformType: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly allowedLineageRelations: readonly SelectorCorrespondenceRelationId[];
  readonly ownershipMode: KpCanonicalOperationOwnershipMode;
  readonly pacing: {
    readonly kind: "single" | "per-descendant" | "per-index" | "per-cell";
    readonly unitRoleId?: string | undefined;
  };
  readonly reverse: {
    readonly validity: "identity" | "mathematical-inverse" | "authored-history-only";
    readonly choreographyKind: string;
    readonly causalEmphasis: string;
  };
  readonly cost: {
    readonly tokenRoleIds: readonly string[];
    readonly simultaneousGroupRoleIds: readonly string[];
    readonly fragmentRoleIds: readonly string[];
    readonly shadowPolicy: "none" | "optional" | "required";
    readonly threeDPolicy: "none" | "optional";
  };
  readonly explanationDepths: readonly KpLlmAnimationExplanationDepth[];
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
        allowedLineageRelations: [...entry.contract.lineageRelationIds],
        ownershipMode: entry.contract.ownershipMode,
        pacing: { ...entry.contract.pacing },
        reverse: {
          validity: entry.contract.reverse.validity,
          choreographyKind: entry.contract.reverse.choreography.kind,
          causalEmphasis: entry.contract.reverse.choreography.causalEmphasis
        },
        cost: {
          ...entry.contract.cost,
          tokenRoleIds: [...entry.contract.cost.tokenRoleIds],
          simultaneousGroupRoleIds: [
            ...entry.contract.cost.simultaneousGroupRoleIds
          ],
          fragmentRoleIds: [...entry.contract.cost.fragmentRoleIds]
        },
        explanationDepths: ["compact", "standard", "expanded"],
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
      "durations",
      "per-token delays",
      "motion primitives",
      "easing",
      "scale transforms",
      "opacity",
      "shadows",
      "DOM",
      "SVG"
    ]
  };
}
