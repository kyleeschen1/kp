import type {
  KpDistributionAreaExemplarConceptId
} from "../semantic/distribution-area-exemplar-cross-surface.ts";

export type KpDistributionAreaAttentionKind = "orient" | "act" | "settle" | "inspect";
export type KpDistributionAreaAttentionSurface = "prose" | "algebra-and-area" | "area" | "all";

export interface KpDistributionAreaAttentionPhase {
  readonly id: string;
  readonly beatId: "distribute" | "evaluate";
  readonly kind: KpDistributionAreaAttentionKind;
  readonly startPermille: number;
  readonly endPermille: number;
  readonly primarySurface: KpDistributionAreaAttentionSurface;
  readonly proseDimmed: boolean;
  readonly conceptIds: readonly KpDistributionAreaExemplarConceptId[];
  readonly cue: string;
}

export interface KpDistributionAreaAttentionPlan {
  readonly id: string;
  readonly phases: readonly KpDistributionAreaAttentionPhase[];
}

export function createKpDistributionAreaAttentionPlan(): KpDistributionAreaAttentionPlan {
  return {
    id: "exemplar.distribution-area.3-times-x-plus-2.attention",
    phases: [
      phase("distribute.orient", "distribute", "orient", 0, 80, "prose", false,
        ["factor.3"], "First, find the shared three."),
      phase("distribute.act", "distribute", "act", 80, 360, "algebra-and-area", true,
        ["factor.3", "term.x", "term.2"], "Watch the three reach both terms as the rectangle partitions."),
      phase("distribute.settle", "distribute", "settle", 360, 460, "area", true,
        ["term.x", "term.2", "product.3x"], "Let the two widths and left area settle."),
      phase("distribute.inspect", "distribute", "inspect", 460, 500, "all", false,
        ["factor.3", "term.x", "term.2", "product.3x"], "Pause and inspect the same quantities in both forms."),
      phase("evaluate.orient", "evaluate", "orient", 500, 570, "prose", false,
        ["product.6"], "Now focus on the fixed right region."),
      phase("evaluate.act", "evaluate", "act", 570, 820, "algebra-and-area", true,
        ["factor.3", "term.2", "product.6"], "See three times two become the area six."),
      phase("evaluate.settle", "evaluate", "settle", 820, 930, "area", true,
        ["product.6"], "Let six settle in the right region."),
      phase("evaluate.inspect", "evaluate", "inspect", 930, 1000, "all", false,
        ["product.3x", "product.6"], "Read the final sum as the two rectangle areas.")
    ]
  };
}

export function attentionPhaseAt(
  plan: KpDistributionAreaAttentionPlan,
  progressPermille: number
): KpDistributionAreaAttentionPhase {
  const progress = Math.max(0, Math.min(1000, Math.round(progressPermille)));
  return plan.phases.find((phase, index) =>
    progress >= phase.startPermille &&
    (progress < phase.endPermille || index === plan.phases.length - 1)
  )!;
}

function phase(
  id: string,
  beatId: KpDistributionAreaAttentionPhase["beatId"],
  kind: KpDistributionAreaAttentionKind,
  startPermille: number,
  endPermille: number,
  primarySurface: KpDistributionAreaAttentionSurface,
  proseDimmed: boolean,
  conceptIds: readonly KpDistributionAreaExemplarConceptId[],
  cue: string
): KpDistributionAreaAttentionPhase {
  return { id, beatId, kind, startPermille, endPermille, primarySurface, proseDimmed, conceptIds, cue };
}
