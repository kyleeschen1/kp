import {
  createKpSuccessorSynthesisPlan,
  evaluateKpSuccessorSynthesisLaws,
  sampleKpSuccessorSynthesis,
  type KpSuccessorSynthesisBinding,
  type KpSuccessorSynthesisPlan,
  type KpSuccessorSynthesisPose
} from "../animation/successor-synthesis.ts";
import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-dom.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export interface KpNativeKatexSuccessorSynthesisIntent {
  readonly binding: KpSuccessorSynthesisBinding;
  readonly direction: "forward" | "rewind";
  readonly motion: "full" | "checkpoint";
}

interface KpNativeKatexSuccessorPaintAnnotation {
  readonly annotationId: string;
  readonly contribution?: "material-input" | "catalyst" | undefined;
  readonly atoms: readonly KpNativeKatexPaintAtomObservation[];
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface KpNativeKatexSuccessorSynthesisScenePlan {
  readonly id: string;
  readonly relationRecordId: string;
  readonly direction: "forward" | "rewind";
  readonly motion: "full" | "checkpoint";
  readonly synthesis: KpSuccessorSynthesisPlan;
  readonly sources: readonly KpNativeKatexSuccessorPaintAnnotation[];
  readonly targets: readonly KpNativeKatexSuccessorPaintAnnotation[];
  readonly claimedSourceAtomIds: readonly string[];
  readonly claimedTargetAtomIds: readonly string[];
}

export interface KpNativeKatexSuccessorMaterialOwnerFrame
  extends KpEquationMaterialLayerOwnerFrame {
  readonly synthesisId: string;
  readonly relationRecordId: string;
  readonly annotationId: string;
  readonly synthesisSide: "source" | "target";
  readonly synthesisPhase: ReturnType<typeof sampleKpSuccessorSynthesis>["phase"];
}

/**
 * Successor bindings claim paint by semantic identity before visual-key
 * reconciliation. This is what prevents a changed result glyph from silently
 * degrading into unrelated eliminate/introduce tracks.
 */
export function compileKpNativeKatexSuccessorSynthesisScenePlans(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly intents: readonly KpNativeKatexSuccessorSynthesisIntent[];
}): readonly KpNativeKatexSuccessorSynthesisScenePlan[] {
  assertUnique(
    input.intents.map(({ binding }) => binding.id),
    "successor synthesis binding"
  );
  assertUnique(
    input.intents.map(({ binding }) => binding.relationRecordId),
    "successor synthesis relation"
  );
  const plans = input.intents.map((intent) => {
    const semanticSource =
      intent.direction === "forward" ? input.source : input.target;
    const semanticTarget =
      intent.direction === "forward" ? input.target : input.source;
    const sources = intent.binding.sourceAnnotations.map((annotation) =>
      paintAnnotation({
        scene: semanticSource,
        annotationId: annotation.id,
        selectorIds: annotation.selectorIds,
        contribution: annotation.contribution
      })
    );
    const targets = intent.binding.targetAnnotations.map((annotation) =>
      paintAnnotation({
        scene: semanticTarget,
        annotationId: annotation.id,
        selectorIds: annotation.selectorIds
      })
    );
    const measurements = Object.fromEntries([
      ...sources.map(({ annotationId, rect }) => [annotationId, rect] as const),
      ...targets.map(({ annotationId, rect }) => [annotationId, rect] as const)
    ]);
    const synthesis = createKpSuccessorSynthesisPlan({
      id: `native-scene.${intent.binding.id}`,
      authority: intent.binding.authority,
      sourceAnnotations: intent.binding.sourceAnnotations,
      targetAnnotations: intent.binding.targetAnnotations,
      lineages: intent.binding.lineages,
      measurements
    });
    const violations = evaluateKpSuccessorSynthesisLaws(synthesis);
    if (violations.length > 0) {
      throw new Error(
        `Successor synthesis ${intent.binding.id} violates ` +
        violations.map(({ lawId }) => lawId).join(", ") + "."
      );
    }
    const semanticSourceAtomIds = sources.flatMap(({ atoms }) =>
      atoms.map(({ id }) => id)
    );
    const semanticTargetAtomIds = targets.flatMap(({ atoms }) =>
      atoms.map(({ id }) => id)
    );
    return Object.freeze({
      id: synthesis.id,
      relationRecordId: intent.binding.relationRecordId,
      direction: intent.direction,
      motion: intent.motion,
      synthesis,
      sources: Object.freeze(sources),
      targets: Object.freeze(targets),
      claimedSourceAtomIds: Object.freeze(
        intent.direction === "forward"
          ? semanticSourceAtomIds
          : semanticTargetAtomIds
      ),
      claimedTargetAtomIds: Object.freeze(
        intent.direction === "forward"
          ? semanticTargetAtomIds
          : semanticSourceAtomIds
      )
    });
  });
  assertUnique(
    plans.flatMap(({ claimedSourceAtomIds }) => claimedSourceAtomIds),
    "successor-owned source atom"
  );
  assertUnique(
    plans.flatMap(({ claimedTargetAtomIds }) => claimedTargetAtomIds),
    "successor-owned target atom"
  );
  return Object.freeze(plans);
}

export function sampleKpNativeKatexSuccessorSynthesisScenePlans(input: {
  readonly plans: readonly KpNativeKatexSuccessorSynthesisScenePlan[];
  readonly progress: number;
  readonly supplementalOwners?:
    ((progress: number) => readonly KpEquationMaterialLayerOwnerFrame[]) |
    undefined;
}): readonly KpEquationMaterialLayerOwnerFrame[] {
  if (!Number.isFinite(input.progress)) {
    throw new Error("Native successor synthesis progress must be finite.");
  }
  const bounded = Math.max(0, Math.min(1, input.progress));
  const owners = input.plans.flatMap((plan) => {
    const presentationProgress =
      plan.motion === "full" || bounded === 1 ? bounded : 0;
    const frame = sampleKpSuccessorSynthesis({
      plan: plan.synthesis,
      progress: plan.direction === "forward"
        ? presentationProgress
        : 1 - presentationProgress
    });
    return [
      ...frame.sources.flatMap((sample) => {
        const annotation = requiredAnnotation(
          plan.sources,
          sample.annotationId,
          plan.id
        );
        return ownerFrames({
          plan,
          annotation,
          pose: sample.pose,
          side: "source",
          phase: frame.phase
        });
      }),
      ...frame.targets.flatMap((sample) => {
        const annotation = requiredAnnotation(
          plan.targets,
          sample.annotationId,
          plan.id
        );
        return ownerFrames({
          plan,
          annotation,
          pose: sample.pose,
          side: "target",
          phase: frame.phase
        });
      })
    ];
  });
  return Object.freeze([
    ...owners,
    ...(input.supplementalOwners?.(bounded) ?? [])
  ]);
}

function collectKpNativeKatexSuccessorClaimedAtomIds(
  plans: readonly KpNativeKatexSuccessorSynthesisScenePlan[],
  endpoint: "source" | "target"
): ReadonlySet<string> {
  return new Set(plans.flatMap((plan) =>
    endpoint === "source"
      ? plan.claimedSourceAtomIds
      : plan.claimedTargetAtomIds
  ));
}

function excludeKpNativeKatexSuccessorOwnedTracks<
  T extends {
    readonly sourceAtomId?: string | undefined;
    readonly targetAtomId?: string | undefined;
    readonly visualAtomId: string;
  }
>(input: {
  readonly tracks: readonly T[];
  readonly claimedSourceAtomIds: ReadonlySet<string>;
  readonly claimedTargetAtomIds: ReadonlySet<string>;
}): readonly T[] {
  return Object.freeze(input.tracks.filter((track) =>
    !input.claimedSourceAtomIds.has(track.sourceAtomId ?? "") &&
    !input.claimedTargetAtomIds.has(track.targetAtomId ?? "") &&
    !input.claimedSourceAtomIds.has(track.visualAtomId) &&
    !input.claimedTargetAtomIds.has(track.visualAtomId)
  ));
}

export function partitionKpNativeKatexSuccessorOwnedTracks<
  T extends {
    readonly sourceAtomId?: string | undefined;
    readonly targetAtomId?: string | undefined;
    readonly visualAtomId: string;
  }
>(
  plans: readonly KpNativeKatexSuccessorSynthesisScenePlan[],
  tracks: readonly T[],
  supplemental?: {
    readonly claimTracks: (tracks: readonly T[]) => readonly T[];
    readonly claimedTargetAtomIds: ReadonlySet<string>;
  } | undefined
): {
  readonly tracks: readonly T[];
  readonly claimedTargetAtomIds: ReadonlySet<string>;
} {
  const claimedSourceAtomIds =
    collectKpNativeKatexSuccessorClaimedAtomIds(plans, "source");
  const claimedTargetAtomIds =
    collectKpNativeKatexSuccessorClaimedAtomIds(plans, "target");
  const unclaimedTracks = excludeKpNativeKatexSuccessorOwnedTracks({
    tracks,
    claimedSourceAtomIds,
    claimedTargetAtomIds
  });
  return {
    tracks: supplemental?.claimTracks(unclaimedTracks) ?? unclaimedTracks,
    claimedTargetAtomIds: new Set([
      ...claimedTargetAtomIds,
      ...(supplemental?.claimedTargetAtomIds ?? [])
    ])
  };
}

export function composeKpNativeKatexSceneMaterialOwners(input: {
  readonly frames: readonly {
    readonly trackId: string;
    readonly visualAtomId: string;
    readonly paintKind: KpNativeKatexPaintAtomObservation["paintKind"];
    readonly sizingMode: "rect" | "rule-length";
    readonly rect: KpEquationMaterialLayerOwnerFrame["rect"];
    readonly opacity: number;
  }[];
  readonly sourceAtoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>;
  readonly targetAtoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>;
  readonly supplementalOwners: readonly KpEquationMaterialLayerOwnerFrame[];
  readonly visible: boolean;
}): readonly KpEquationMaterialLayerOwnerFrame[] {
  return [
    ...input.frames.map((frame) => {
      const atom =
        input.sourceAtoms.get(frame.visualAtomId) ??
        input.targetAtoms.get(frame.visualAtomId);
      if (atom === undefined) {
        throw new Error(`Unknown scene material atom ${frame.visualAtomId}.`);
      }
      return {
        ownerId: `native-scene-owner.${frame.trackId}`,
        sourceElement: atom.sourceElement,
        semanticEntityId: atom.semanticEntityId,
        rect: frame.rect,
        opacity: input.visible ? frame.opacity : 0,
        transform: "none",
        fragmentRole: `${frame.paintKind}:${frame.sizingMode}`
      };
    }),
    ...input.supplementalOwners.map((owner) => ({
      ...owner,
      opacity: input.visible ? owner.opacity : 0
    }))
  ];
}

function paintAnnotation(input: {
  readonly scene: KpNativeKatexRenderedSceneObservation;
  readonly annotationId: string;
  readonly selectorIds: readonly string[];
  readonly contribution?: "material-input" | "catalyst" | undefined;
}): KpNativeKatexSuccessorPaintAnnotation {
  const selectorIds = new Set(input.selectorIds);
  const atoms = input.scene.atoms.filter(({ semanticEntityId }) =>
    selectorIds.has(semanticEntityId)
  );
  if (atoms.length === 0) {
    throw new Error(
      `Successor annotation ${input.annotationId} has no measured native paint.`
    );
  }
  return Object.freeze({
    annotationId: input.annotationId,
    ...(input.contribution === undefined
      ? {}
      : { contribution: input.contribution }),
    atoms: Object.freeze(atoms),
    rect: Object.freeze(unionRects(atoms.map(({ rect }) => rect)))
  });
}

function ownerFrames(input: {
  readonly plan: KpNativeKatexSuccessorSynthesisScenePlan;
  readonly annotation: KpNativeKatexSuccessorPaintAnnotation;
  readonly pose: KpSuccessorSynthesisPose;
  readonly side: "source" | "target";
  readonly phase: ReturnType<typeof sampleKpSuccessorSynthesis>["phase"];
}): readonly KpNativeKatexSuccessorMaterialOwnerFrame[] {
  const groupCenter = center(input.annotation.rect);
  return input.annotation.atoms.map((atom) => {
    const atomCenter = center(atom.rect);
    const scaledCenter = {
      x: groupCenter.x + (atomCenter.x - groupCenter.x) * input.pose.scale,
      y: groupCenter.y + (atomCenter.y - groupCenter.y) * input.pose.scale
    };
    return Object.freeze({
      ownerId:
        `native-scene-owner.successor.${input.plan.relationRecordId}.` +
        `${input.annotation.annotationId}.${atom.id}`,
      sourceElement: atom.sourceElement,
      sourceMotionId: input.annotation.annotationId,
      semanticEntityId: input.annotation.annotationId,
      rect: Object.freeze({
        left: scaledCenter.x - atom.rect.width / 2,
        top: scaledCenter.y - atom.rect.height / 2,
        width: atom.rect.width,
        height: atom.rect.height
      }),
      opacity: input.pose.opacity,
      transform:
        `translate(${input.pose.x}px, ${input.pose.y}px) ` +
        `scale(${input.pose.scale})`,
      fragmentRole:
        `successor-${input.side}:` +
        `${input.annotation.contribution ?? "result"}`,
      synthesisId: input.plan.id,
      relationRecordId: input.plan.relationRecordId,
      annotationId: input.annotation.annotationId,
      synthesisSide: input.side,
      synthesisPhase: input.phase
    });
  });
}

function requiredAnnotation(
  annotations: readonly KpNativeKatexSuccessorPaintAnnotation[],
  annotationId: string,
  planId: string
): KpNativeKatexSuccessorPaintAnnotation {
  const annotation = annotations.find(
    (candidate) => candidate.annotationId === annotationId
  );
  if (annotation === undefined) {
    throw new Error(
      `Successor scene ${planId} is missing annotation ${annotationId}.`
    );
  }
  return annotation;
}

function unionRects(
  rects: readonly {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  }[]
): {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
} {
  const left = Math.min(...rects.map(({ left }) => left));
  const top = Math.min(...rects.map(({ top }) => top));
  const right = Math.max(...rects.map(({ left, width }) => left + width));
  const bottom = Math.max(...rects.map(({ top, height }) => top + height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicates = values.filter(
    (value, index) => values.indexOf(value) !== index
  );
  if (duplicates.length > 0) {
    throw new Error(`${label} ${duplicates[0]} is duplicated.`);
  }
}
