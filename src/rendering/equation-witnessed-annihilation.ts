import {
  createKpWitnessedAnnihilationPlan,
  sampleKpWitnessedAnnihilation,
  type KpWitnessedAnnihilationFrame,
  type KpWitnessedAnnihilationPlan
} from "../animation/witnessed-annihilation.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type { KpEquationTokenMotionFrameToken } from "./semantic-equation-token-renderer.ts";

export function createKpEquationWitnessedAnnihilationPlan(
  geometry: KpMeasuredEquationTransitionGeometry
): KpWitnessedAnnihilationPlan | undefined {
  const binding = geometry.witnessedAnnihilationBinding;
  if (binding === undefined) return undefined;
  const cancellation = requiredRelation(geometry, binding.relationRecordId);
  if (cancellation.source === undefined) {
    throw new Error(`Annihilation binding ${binding.id} requires measured cancellation sources.`);
  }
  const motionIdBySelector = new Map(cancellation.source.selectorIds.map(
    (selectorId, index) => [selectorId, cancellation.source!.motionIds[index]!] as const
  ));
  const sources = binding.sources.map((source) => ({
    ...source,
    id: requiredMotionId(motionIdBySelector, source.id, binding.id)
  }));
  const measurements = Object.fromEntries(sources.map((source) => {
    const token = requiredToken(geometry.sourceTokens, source.id, "source");
    return [source.id, token.localRect] as const;
  }));
  const survivors = binding.survivorRecordIds.flatMap((recordId) => {
    const relation = requiredRelation(geometry, recordId);
    if (relation.source === undefined || relation.target === undefined) {
      throw new Error(`Annihilation survivor ${recordId} requires measured source and target.`);
    }
    if (relation.source.motionIds.length !== relation.target.motionIds.length) {
      throw new Error(`Annihilation survivor ${recordId} requires one-to-one token identity.`);
    }
    return relation.source.motionIds.map((sourceMotionId, index) => {
      const targetMotionId = relation.target!.motionIds[index]!;
      return {
        id: sourceMotionId,
        sourceSelectorIds: [relation.source!.selectorIds[index]!],
        targetSelectorIds: [relation.target!.selectorIds[index]!],
        sourceRect: requiredToken(geometry.sourceTokens, sourceMotionId, "source").localRect,
        targetRect: requiredToken(geometry.targetTokens, targetMotionId, "target").localRect
      };
    });
  });
  return createKpWitnessedAnnihilationPlan({
    id: binding.id,
    witness: binding.witness,
    sources,
    measurements,
    survivors
  });
}

export function sampleKpEquationWitnessedAnnihilationRelation(input: {
  readonly plan: KpWitnessedAnnihilationPlan;
  readonly frame: KpWitnessedAnnihilationFrame;
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
}): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (input.relation.recordId === input.plan.witness.correspondenceRecordId) {
    return input.frame.sources.map((source) => ({
      motionId: requiredToken(input.sourceTokens, source.id, "annihilation source").motionId,
      side: "source" as const,
      pose: source.pose
    }));
  }
  const survivorIds = new Set(input.plan.survivors.map((survivor) => survivor.id));
  const relationSourceIds = input.relation.source?.motionIds ?? [];
  if (!relationSourceIds.some((id) => survivorIds.has(id))) return undefined;
  return [
    ...relationSourceIds.map((motionId) => {
      const survivor = input.frame.survivors.find((candidate) => candidate.id === motionId);
      if (survivor === undefined) throw new Error(`Missing annihilation survivor ${motionId}.`);
      return {
        motionId,
        side: "source" as const,
        pose: survivor.pose
      };
    }),
    ...input.targetTokens.map((token) => {
      const sourceIndex = input.targetTokens.indexOf(token);
      const sourceMotionId = relationSourceIds[sourceIndex];
      const survivor = input.frame.survivors.find((candidate) =>
        candidate.id === sourceMotionId
      );
      if (survivor === undefined) throw new Error(`Missing native annihilation survivor for ${token.motionId}.`);
      return {
        motionId: token.motionId,
        side: "target" as const,
        pose: { opacity: survivor.nativeOpacity, x: 0, y: 0, scale: 1 }
      };
    })
  ];
}

export function sampleKpEquationWitnessedAnnihilation(
  plan: KpWitnessedAnnihilationPlan,
  progress: number
): KpWitnessedAnnihilationFrame {
  return sampleKpWitnessedAnnihilation({ plan, progress });
}

function requiredRelation(
  geometry: KpMeasuredEquationTransitionGeometry,
  recordId: string
): KpMeasuredEquationTransitionRelationGeometry {
  const relation = geometry.relations.find((candidate) => candidate.recordId === recordId);
  if (relation === undefined) throw new Error(`Missing annihilation relation ${recordId}.`);
  return relation;
}

function requiredMotionId(
  motionIds: ReadonlyMap<string, string>,
  selectorId: string,
  ownerId: string
): string {
  const motionId = motionIds.get(selectorId);
  if (motionId === undefined) {
    throw new Error(`${ownerId} cannot bind semantic selector ${selectorId} to measured motion.`);
  }
  return motionId;
}

function requiredToken(
  tokens: readonly AnnotatedMotionToken[],
  motionId: string,
  role: string
): AnnotatedMotionToken {
  const token = tokens.find((candidate) => candidate.motionId === motionId);
  if (token === undefined) throw new Error(`Missing measured ${role} ${motionId}.`);
  return token;
}
