import type {
  KpSemanticAnimationWorkbenchIndex
} from "./semantic-animation-workbench-index.ts";
import type {
  KpWorkbenchRoadmap
} from "./semantic-animation-workbench-roadmap.ts";

export interface KpWorkbenchRoadmapAnimationLink {
  readonly phaseId: string;
  readonly animationId: string;
  readonly representationId: string;
}

const candidates = [
  {
    phaseId: "gold-equation-reader",
    animationId: "animation.linear-solve.solve-x"
  },
  {
    phaseId: "distribution-factoring-grammar",
    animationId: "animation.generated.distribution.expand-a-sum"
  },
  {
    phaseId: "generated-symbolic-transform-library",
    animationId: "animation.generated.exponent.square-as-product"
  },
  {
    phaseId: "derivative-secant-to-tangent",
    animationId: "animation.derivative-rules.tangent-graph"
  },
  {
    phaseId: "radical-native-settlement",
    animationId: "animation.generated.radical.square-root-as-power"
  }
] as const;

export function projectKpWorkbenchRoadmapAnimationLinks(input: {
  readonly roadmap: KpWorkbenchRoadmap;
  readonly index: KpSemanticAnimationWorkbenchIndex;
}): readonly KpWorkbenchRoadmapAnimationLink[] {
  const rows = new Map(input.roadmap.rows.map((row) => [row.id, row]));
  const entries = new Map(
    input.index.entries.map((entry) => [entry.identity.animationId, entry])
  );

  return candidates.map(({ phaseId, animationId }) => {
    if (!rows.has(phaseId)) {
      throw new Error(`Roadmap animation link references unknown phase ${phaseId}.`);
    }
    const entry = entries.get(animationId);
    if (entry === undefined || entry.lifecycle.playability !== "playable") {
      throw new Error(
        `Roadmap phase ${phaseId} cannot link unavailable animation ${animationId}.`
      );
    }
    const representationId = `editor-animation.${animationId}`;
    const representation = entry.representations.find(
      (candidate) =>
        candidate.representationId === representationId &&
        candidate.playable
    );
    if (representation === undefined) {
      throw new Error(
        `Roadmap phase ${phaseId} requires real representation ${representationId}.`
      );
    }
    return Object.freeze({ phaseId, animationId, representationId });
  });
}
