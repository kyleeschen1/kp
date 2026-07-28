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
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap.ts";
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

interface KpNativeKatexSuccessorMaterialOwnerFrameBase
  extends Omit<KpEquationMaterialLayerOwnerFrame, "semanticContacts"> {
  readonly synthesisId: string;
  readonly relationRecordId: string;
  readonly annotationId: string;
  /**
   * A discriminant—not a boolean—keeps catalysts outside the fusion-member
   * type. The compositor previously attached one relation-wide allowance, so
   * an operator or surrounding continuant could accidentally inherit it.
   */
  readonly synthesisPhase: ReturnType<typeof sampleKpSuccessorSynthesis>["phase"];
}

export type KpNativeKatexSuccessorContactAuthority =
    | {
        readonly synthesisSide: "source";
        readonly contactRole: "fusion-input";
        readonly semanticContacts?:
          readonly KpEquationVisiblePaintCertifiedContact[] | undefined;
      }
    | {
        readonly synthesisSide: "source";
        readonly contactRole: "catalyst";
        readonly semanticContacts?: never;
      }
    | {
        readonly synthesisSide: "target";
        readonly contactRole: "fusion-result";
        readonly semanticContacts?:
          readonly KpEquationVisiblePaintCertifiedContact[] | undefined;
      };

export type KpNativeKatexSuccessorMaterialOwnerFrame =
  KpNativeKatexSuccessorMaterialOwnerFrameBase &
  KpNativeKatexSuccessorContactAuthority;

type KpNativeKatexSuccessorFusionOwnerFrame =
  KpNativeKatexSuccessorMaterialOwnerFrame & {
    readonly contactRole: "fusion-input" | "fusion-result";
  };

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
    const sampledOwners = [
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
          contactRole: sample.contribution === "material-input"
            ? "fusion-input"
            : "catalyst",
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
          contactRole: "fusion-result",
          phase: frame.phase
        });
      })
    ];
    return attachSuccessorFusionContacts(sampledOwners);
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
    readonly lifecycle: string;
    readonly opacityStepAt?: number | undefined;
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
  const claimedTracks =
    supplemental?.claimTracks(unclaimedTracks) ?? unclaimedTracks;
  return {
    tracks: plans.length === 0
      ? claimedTracks
      : Object.freeze(claimedTracks.map((track) =>
          track.lifecycle === "eliminate"
            ? Object.freeze({ ...track, opacityStepAt: 0.08 }) as T
            : track.lifecycle === "introduce"
              ? Object.freeze({ ...track, opacityStepAt: 0.94 }) as T
              : track
        )),
    claimedTargetAtomIds: new Set([
      ...claimedTargetAtomIds,
      ...(supplemental?.claimedTargetAtomIds ?? [])
    ])
  };
}

export function composeKpNativeKatexSceneMaterialOwners(input: {
  readonly frames: readonly {
    readonly trackId: string;
    readonly componentId: string;
    readonly visualAtomId: string;
    readonly paintKind: KpNativeKatexPaintAtomObservation["paintKind"];
    readonly sizingMode: "rect" | "rule-length";
    readonly rect: KpEquationMaterialLayerOwnerFrame["rect"];
    readonly expectedPaintRect:
      NonNullable<KpEquationMaterialLayerOwnerFrame["expectedPaintRect"]>;
    readonly opacity: number;
    readonly intentionalContactGroupId?: string | undefined;
    readonly verifiedOperationCohortId?: string | undefined;
  }[];
  readonly sourceAtoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>;
  readonly targetAtoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>;
  readonly supplementalOwners: readonly KpEquationMaterialLayerOwnerFrame[];
  readonly visible: boolean;
}): readonly KpEquationMaterialLayerOwnerFrame[] {
  const contacts = sceneMaterialContacts(input);
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
        semanticContacts: contacts.get(frame.trackId),
        rect: frame.rect,
        // Structural SVG paths scale through their preserved viewBox and have
        // no HTML text/rule inset to normalize. Glyphs and CSS rules retain
        // measured-paint alignment; paths keep their exact owner rectangle.
        ...(frame.paintKind === "path"
          ? {}
          : { expectedPaintRect: frame.expectedPaintRect }),
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

function sceneMaterialContacts(input: {
  readonly frames: readonly {
    readonly trackId: string;
    readonly componentId: string;
    readonly visualAtomId: string;
    readonly intentionalContactGroupId?: string | undefined;
    readonly verifiedOperationCohortId?: string | undefined;
  }[];
  readonly sourceAtoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>;
  readonly targetAtoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>;
}): ReadonlyMap<
  string,
  NonNullable<KpEquationMaterialLayerOwnerFrame["semanticContacts"]>
> {
  const ids = new Map(input.frames.map((frame) => [
    frame.trackId,
    new Map<string, KpEquationVisiblePaintCertifiedContact>()
  ] as const));
  for (const [leftIndex, left] of input.frames.entries()) {
    const leftAtom = input.sourceAtoms.get(left.visualAtomId) ??
      input.targetAtoms.get(left.visualAtomId);
    if (leftAtom === undefined) continue;
    for (const [rightOffset, right] of input.frames.slice(leftIndex + 1)
      .entries()) {
      const rightAtom = input.sourceAtoms.get(right.visualAtomId) ??
        input.targetAtoms.get(right.visualAtomId);
      if (rightAtom === undefined) continue;
      const ownerIds = [
        sceneMaterialOwnerId(left.trackId),
        sceneMaterialOwnerId(right.trackId)
      ] as const;
      if (
        left.intentionalContactGroupId !== undefined &&
        left.intentionalContactGroupId ===
          right.intentionalContactGroupId &&
        left.verifiedOperationCohortId !== undefined &&
        left.verifiedOperationCohortId ===
          right.verifiedOperationCohortId
      ) {
        addContact(
          ids,
          left.trackId,
          right.trackId,
          Object.freeze({
            id:
              `cancellation-contact.${left.verifiedOperationCohortId}.` +
              `${leftIndex}.${leftIndex + rightOffset + 1}`,
            ownerIds,
            reason: "semantic-cancellation",
            phase: "fusion-contact",
            maximumOverlapWidthPx: Math.min(
              leftAtom.rect.width,
              rightAtom.rect.width
            ),
            maximumOverlapHeightPx: Math.min(
              leftAtom.rect.height,
              rightAtom.rect.height
            )
          })
        );
      }
      if (left.componentId === right.componentId) {
        addContact(
          ids,
          left.trackId,
          right.trackId,
          Object.freeze({
            id:
              `component-contact.${left.componentId}.` +
              `${leftIndex}.${leftIndex + rightOffset + 1}`,
            ownerIds,
            reason: "semantic-reconciliation",
            phase: "transit",
            maximumOverlapWidthPx: Math.min(
              leftAtom.rect.width,
              rightAtom.rect.width
            ),
            maximumOverlapHeightPx: Math.min(
              leftAtom.rect.height,
              rightAtom.rect.height
            )
          })
        );
      }
      if (
        leftAtom.endpoint !== rightAtom.endpoint ||
        !rectsHaveNativeInkContact(leftAtom.rect, rightAtom.rect)
      ) continue;
      const width = Math.min(
        leftAtom.rect.left + leftAtom.rect.width,
        rightAtom.rect.left + rightAtom.rect.width
      ) - Math.max(leftAtom.rect.left, rightAtom.rect.left);
      const height = Math.min(
        leftAtom.rect.top + leftAtom.rect.height,
        rightAtom.rect.top + rightAtom.rect.height
      ) - Math.max(leftAtom.rect.top, rightAtom.rect.top);
      addContact(
        ids,
        left.trackId,
        right.trackId,
        Object.freeze({
          id: `native-contact.${leftIndex}.${leftIndex + rightOffset + 1}`,
          ownerIds,
          reason: "typographic-adjacency",
          phase: "endpoint-typography",
          maximumOverlapWidthPx: width,
          maximumOverlapHeightPx: height
        })
      );
    }
  }
  return new Map([...ids].map(([trackId, contactIds]) => [
    trackId,
    Object.freeze([...contactIds.values()].map((contact) =>
      Object.freeze(contact)
    ))
  ]));
}

function sceneMaterialOwnerId(trackId: string): string {
  return `native-scene-owner.${trackId}`;
}

function addContact(
  contacts: Map<
    string,
    Map<string, KpEquationVisiblePaintCertifiedContact>
  >,
  leftTrackId: string,
  rightTrackId: string,
  contact: KpEquationVisiblePaintCertifiedContact
): void {
  contacts.get(leftTrackId)!.set(contact.id, contact);
  contacts.get(rightTrackId)!.set(contact.id, contact);
}

function rectsHaveNativeInkContact(
  left: KpNativeKatexPaintAtomObservation["rect"],
  right: KpNativeKatexPaintAtomObservation["rect"]
): boolean {
  return Math.min(left.left + left.width, right.left + right.width) -
      Math.max(left.left, right.left) > 0.75 &&
    Math.min(left.top + left.height, right.top + right.height) -
      Math.max(left.top, right.top) > 0.75;
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
  readonly phase: ReturnType<typeof sampleKpSuccessorSynthesis>["phase"];
} & (
  | {
      readonly side: "source";
      readonly contactRole: "fusion-input" | "catalyst";
    }
  | {
      readonly side: "target";
      readonly contactRole: "fusion-result";
    }
)): readonly KpNativeKatexSuccessorMaterialOwnerFrame[] {
  const groupCenter = center(input.annotation.rect);
  return input.annotation.atoms.map((atom) => {
    const atomCenter = center(atom.rect);
    const scaledCenter = {
      x: groupCenter.x + (atomCenter.x - groupCenter.x) * input.pose.scale,
      y: groupCenter.y + (atomCenter.y - groupCenter.y) * input.pose.scale
    };
    const contactAuthority: KpNativeKatexSuccessorContactAuthority =
      input.side === "source"
        ? {
            synthesisSide: "source",
            contactRole: input.contactRole
          }
        : {
            synthesisSide: "target",
            contactRole: "fusion-result"
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
      ...contactAuthority,
      synthesisPhase: input.phase
    });
  });
}

function attachSuccessorFusionContacts(
  frames: readonly KpNativeKatexSuccessorMaterialOwnerFrame[]
): readonly KpNativeKatexSuccessorMaterialOwnerFrame[] {
  const contacts = new Map(frames.map(({ ownerId }) => [
    ownerId,
    [] as KpEquationVisiblePaintCertifiedContact[]
  ] as const));
  const participants = frames.filter(isSuccessorFusionOwner);
  for (const [leftIndex, left] of participants.entries()) {
    for (const [rightOffset, right] of participants.slice(leftIndex + 1)
      .entries()) {
      // Result glyph fragments retain native typography; they do not fuse
      // with each other merely because they share one synthesis result.
      if (
        left.contactRole === "fusion-result" &&
        right.contactRole === "fusion-result"
      ) continue;
      const contact = Object.freeze({
        id:
          `successor-contact.${left.relationRecordId}.` +
          `${leftIndex}.${leftIndex + rightOffset + 1}`,
        ownerIds: [left.ownerId, right.ownerId] as const,
        reason: "semantic-fusion" as const,
        phase: "fusion-contact" as const,
        maximumOverlapWidthPx: Math.min(left.rect.width, right.rect.width),
        maximumOverlapHeightPx: Math.min(left.rect.height, right.rect.height)
      });
      contacts.get(left.ownerId)!.push(contact);
      contacts.get(right.ownerId)!.push(contact);
    }
  }
  return Object.freeze(frames.map((frame) => {
    const semanticContacts = contacts.get(frame.ownerId)!;
    if (semanticContacts.length === 0) return frame;
    if (!isSuccessorFusionOwner(frame)) {
      throw new Error(
        `Successor catalyst ${frame.ownerId} cannot receive fusion contact authority.`
      );
    }
    return Object.freeze({
      ...frame,
      semanticContacts: Object.freeze(semanticContacts)
    });
  }));
}

function isSuccessorFusionOwner(
  frame: KpNativeKatexSuccessorMaterialOwnerFrame
): frame is KpNativeKatexSuccessorFusionOwnerFrame {
  return frame.contactRole === "fusion-input" ||
    frame.contactRole === "fusion-result";
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
