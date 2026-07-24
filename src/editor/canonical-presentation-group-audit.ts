import type {
  KpPresentationGroupExemptionReason
} from "../animation/presentation-group-continuity.ts";
import {
  createKpSemanticAnimationPreservationManifest,
  type KpSemanticAnimationPreservationTopic
} from "./semantic-animation-preservation-manifest.ts";

export type KpCanonicalPresentationTargetDisposition =
  | "declared-contract"
  | "typed-exemption"
  | "missing-contract";

export interface KpCanonicalPresentationTargetAudit {
  readonly targetId: string;
  readonly disposition: KpCanonicalPresentationTargetDisposition;
  readonly declarationId?: string | undefined;
  readonly exemptionReason?: KpPresentationGroupExemptionReason | undefined;
  readonly rationale: string;
}

export interface KpCanonicalPresentationResidual {
  readonly id: string;
  readonly summary: string;
  readonly sourceRef: string;
}

export interface KpCanonicalPresentationAuditEntry {
  readonly schemaVersion: "kp.canonical-presentation-audit-entry.v1";
  readonly topic: KpSemanticAnimationPreservationTopic;
  readonly animationId: string;
  readonly status: "pass" | "blocked";
  readonly targets: readonly KpCanonicalPresentationTargetAudit[];
  readonly residuals: readonly KpCanonicalPresentationResidual[];
}

export interface KpCanonicalPresentationAuditReport {
  readonly schemaVersion: "kp.canonical-presentation-audit-report.v1";
  readonly entries: readonly KpCanonicalPresentationAuditEntry[];
  readonly declaredTargetCount: number;
  readonly exemptTargetCount: number;
  readonly missingTargetCount: number;
  readonly blockedAnimationIds: readonly string[];
}

export interface KpCanonicalPresentationPromotionDiagnostic {
  readonly code:
    | "promotion.presentation.missing-contract"
    | "promotion.presentation.known-residual";
  readonly severity: "error";
  readonly sourceId: string;
  readonly message: string;
}

export interface KpCanonicalPresentationPromotionResult {
  readonly schemaVersion: "kp.canonical-presentation-promotion-result.v1";
  readonly animationId: string;
  readonly status: "pass" | "blocked";
  readonly promotable: boolean;
  readonly declaredTargetCount: number;
  readonly exemptTargetCount: number;
  readonly diagnostics: readonly KpCanonicalPresentationPromotionDiagnostic[];
}

type AuditDefinition = Omit<
  KpCanonicalPresentationAuditEntry,
  "schemaVersion" | "animationId" | "status"
>;

const definitions = new Map<
  KpSemanticAnimationPreservationTopic,
  AuditDefinition
>([
  ["solve-x", {
    topic: "solve-x",
    targets: [exemption({
      targetId: "solve-x.paired-both-sides-operations",
      reason: "independent-targets",
      rationale:
        "The left and right operation witnesses occupy independent equation-side coordinate spaces and settle through the accepted solve-x choreography."
    })],
    residuals: []
  }],
  ["distribution", {
    topic: "distribution",
    targets: [
      contract(
        "transform.generated.distribution.expand-a-sum.distribute.distribution-choreography.product.0",
        "transform.generated.distribution.expand-a-sum.distribute.distribution-choreography.product.0",
        "The first factor/addend product is compiled as one target-native presentation group."
      ),
      contract(
        "transform.generated.distribution.expand-a-sum.distribute.distribution-choreography.product.1",
        "transform.generated.distribution.expand-a-sum.distribute.distribution-choreography.product.1",
        "The second factor/addend product is compiled as one target-native presentation group."
      )
    ],
    residuals: []
  }],
  ["factoring", {
    topic: "factoring",
    targets: [missing(
      "factoring.grouped-product",
      "The inverse product/grouping settlement has browser continuity evidence but no renderer-neutral presentation-group declaration yet."
    )],
    residuals: []
  }],
  ["fractions", {
    topic: "fractions",
    targets: [missing(
      "fractions.split-merge-numerator",
      "The lesson-owned numerator split/merge is canonical but has not been audited into a presentation-group contract."
    )],
    residuals: []
  }],
  ["radical", {
    topic: "radical",
    targets: [missing(
      "radical.complete-notation",
      "The source fraction and target radical fragments have explicit lineage and settlement diagnostics but no promotable family-level presentation-group declaration."
    )],
    residuals: [{
      id: "known-residual.radical.initial-fraction-handoff",
      summary:
        "Human review retains a small initial 1/2 jerk at the animation-specific DOM/KaTeX-to-WebGL ownership boundary.",
      sourceRef:
        "docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md"
    }]
  }],
  ["structural-wrap", {
    topic: "structural-wrap",
    targets: [missing(
      "structural-wrap.wrapper",
      "Function name and delimiter introduction is compound native notation without a presentation-group declaration."
    )],
    residuals: []
  }],
  ["matrix-composition", {
    topic: "matrix-composition",
    targets: [exemption({
      targetId: "matrix-composition.native-result-grid",
      reason: "nonvisual-structure",
      rationale:
        "Result entries are introduced independently while the native KaTeX matrix owner supplies brackets and grid structure; no moving compound owner is transferred."
    })],
    residuals: []
  }],
  ["equation-graph", {
    topic: "equation-graph",
    targets: [exemption({
      targetId: "equation-graph.synchronized-views",
      reason: "independent-targets",
      rationale:
        "Equation and graph views share semantic progress but remain independently rendered owners with no compound native handoff."
    })],
    residuals: []
  }],
  ["program-trace", {
    topic: "program-trace",
    targets: [],
    residuals: []
  }]
]);

export function createKpCanonicalPresentationAuditReport():
  KpCanonicalPresentationAuditReport {
  const manifest = createKpSemanticAnimationPreservationManifest();
  const entries = manifest.map((item): KpCanonicalPresentationAuditEntry => {
    const definition = definitions.get(item.topic);
    if (definition === undefined) {
      throw new Error(`Missing presentation audit definition for ${item.topic}.`);
    }
    const blocked = definition.targets.some(
      (target) => target.disposition === "missing-contract"
    );
    return {
      schemaVersion: "kp.canonical-presentation-audit-entry.v1",
      topic: item.topic,
      animationId: item.animationId,
      status: blocked ? "blocked" : "pass",
      targets: definition.targets.map((target) => ({ ...target })),
      residuals: definition.residuals.map((residual) => ({ ...residual }))
    };
  });
  const targets = entries.flatMap((entry) => entry.targets);
  return {
    schemaVersion: "kp.canonical-presentation-audit-report.v1",
    entries,
    declaredTargetCount: targets.filter(
      (target) => target.disposition === "declared-contract"
    ).length,
    exemptTargetCount: targets.filter(
      (target) => target.disposition === "typed-exemption"
    ).length,
    missingTargetCount: targets.filter(
      (target) => target.disposition === "missing-contract"
    ).length,
    blockedAnimationIds: entries
      .filter((entry) => entry.status === "blocked")
      .map((entry) => entry.animationId)
  };
}

export function gateKpCanonicalPresentationPromotion(
  audit: KpCanonicalPresentationAuditEntry
): KpCanonicalPresentationPromotionResult {
  const diagnostics: KpCanonicalPresentationPromotionDiagnostic[] = [
    ...audit.targets
      .filter((target) => target.disposition === "missing-contract")
      .map((target) => ({
        code: "promotion.presentation.missing-contract" as const,
        severity: "error" as const,
        sourceId: target.targetId,
        message:
          `Compound target ${target.targetId} has no presentation-group contract or typed exemption.`
      })),
    ...audit.residuals.map((residual) => ({
      code: "promotion.presentation.known-residual" as const,
      severity: "error" as const,
      sourceId: residual.sourceRef,
      message: residual.summary
    }))
  ];
  return {
    schemaVersion: "kp.canonical-presentation-promotion-result.v1",
    animationId: audit.animationId,
    status: diagnostics.length === 0 ? "pass" : "blocked",
    promotable: diagnostics.length === 0,
    declaredTargetCount: audit.targets.filter(
      (target) => target.disposition === "declared-contract"
    ).length,
    exemptTargetCount: audit.targets.filter(
      (target) => target.disposition === "typed-exemption"
    ).length,
    diagnostics
  };
}

function contract(
  targetId: string,
  declarationId: string,
  rationale: string
): KpCanonicalPresentationTargetAudit {
  return {
    targetId,
    disposition: "declared-contract",
    declarationId,
    rationale
  };
}

function exemption(input: {
  readonly targetId: string;
  readonly reason: KpPresentationGroupExemptionReason;
  readonly rationale: string;
}): KpCanonicalPresentationTargetAudit {
  return {
    targetId: input.targetId,
    disposition: "typed-exemption",
    exemptionReason: input.reason,
    rationale: input.rationale
  };
}

function missing(
  targetId: string,
  rationale: string
): KpCanonicalPresentationTargetAudit {
  return {
    targetId,
    disposition: "missing-contract",
    rationale
  };
}
