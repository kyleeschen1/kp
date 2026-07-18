import { decideKpArtifactPromotion } from "../animation/artifact-promotion.ts";
import { validateKpTutorialAccessibilityFamily } from "./accessibility-projection.ts";
import { validateKpClaimSceneGraphBundle } from "./claim-scene-graphs.ts";
import { validateKpCrossViewCorrespondenceMap } from "./cross-view-correspondence.ts";
import { validateKpTutorialEpistemicNarration } from "./epistemic-narration.ts";
import { createKpTutorialExplorationState } from "./exploration-state.ts";
import { checkKpFtcTutorialRuntimeLaws } from "./ftc-runtime.ts";
import { createKpFtcTutorialDefinition } from "./ftc-tutorial-module.ts";
import { createKpHermeneuticTutorialExportArtifact } from "./hermeneutic-export.ts";
import { validateKpInterpretiveCycle } from "./interpretive-cycle.ts";

export interface KpFtcReviewableGateReport {
  readonly id: string;
  readonly passed: boolean;
  readonly diagnostics: readonly string[];
  readonly metrics: {
    readonly claimCount: number;
    readonly checkpointCount: number;
    readonly correspondenceCount: number;
    readonly accessibilityProjectionCount: number;
    readonly exportFrameCount: number;
    readonly serializedDefinitionBytes: number;
  };
  readonly promotion: ReturnType<typeof decideKpArtifactPromotion>;
}

export function evaluateKpFtcReviewableGates(): KpFtcReviewableGateReport {
  const definition = createKpFtcTutorialDefinition();
  const diagnostics = [
    ...validateKpClaimSceneGraphBundle(definition.graphs),
    ...validateKpCrossViewCorrespondenceMap(definition.correspondence),
    ...validateKpTutorialEpistemicNarration({
      claimGraph: definition.graphs.claimGraph,
      narrations: definition.narrations
    }),
    ...definition.cycles.flatMap((cycle) =>
      validateKpInterpretiveCycle({
        cycle,
        module: definition.module,
        graphBundle: definition.graphs
      })
    ),
    ...validateKpTutorialAccessibilityFamily(definition.accessibility)
  ].map(({ path, message }) => `${path}: ${message}`);
  diagnostics.push(...checkKpFtcTutorialRuntimeLaws());
  const exportArtifact = createKpHermeneuticTutorialExportArtifact({
    id: "export.ftc.reviewable",
    module: definition.module,
    branches: [],
    includeBranches: false
  });
  const serializedDefinitionBytes = new TextEncoder().encode(
    JSON.stringify(definition)
  ).byteLength;
  if (exportArtifact.frames.length !== definition.module.checkpoints.length) {
    diagnostics.push("Canonical export does not cover every FTC checkpoint.");
  }
  if (serializedDefinitionBytes > 100_000) {
    diagnostics.push("FTC semantic definition exceeds the 100 KB static budget.");
  }
  const automatedGatesPassed = diagnostics.length === 0;
  const promotion = decideKpArtifactPromotion({
    current: "draft",
    requested: "reviewable",
    novelty: "new-combination",
    evidence: {
      automatedGatesPassed,
      humanReviewPassed: false,
      conformancePassed: false,
      canonicalExemplarReviewed: false
    }
  });

  // Constructing the reference state here proves the export/gate path does not
  // require learner history or an implicit live-state singleton.
  createKpTutorialExplorationState({
    id: "state.ftc.reviewable-gate",
    values: { upperBound: 2, deltaX: 0.5, lens: "quadratic" }
  });

  return {
    id: "gate-report.ftc.reviewable",
    passed: automatedGatesPassed && promotion.status === "approved",
    diagnostics,
    metrics: {
      claimCount: definition.graphs.claimGraph.nodes.length,
      checkpointCount: definition.module.checkpoints.length,
      correspondenceCount: definition.correspondence.correspondences.length,
      accessibilityProjectionCount: definition.accessibility.projections.length,
      exportFrameCount: exportArtifact.frames.length,
      serializedDefinitionBytes
    },
    promotion
  };
}
