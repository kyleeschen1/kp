import {
  createKpSuccessorSynthesisPlan,
  evaluateKpSuccessorSynthesisLaws,
  kpOpaqueGatherAndRecognizeSettlementProgress,
  sampleKpOpaqueGatherAndRecognizeSuccessorSynthesis,
  sampleKpOpaqueIdentityTransferSuccessorSynthesis,
  type KpSuccessorSynthesisBinding,
  type KpSuccessorSynthesisPlan,
  type KpSuccessorSynthesisPose,
  type KpSuccessorSynthesisFrame
} from "../animation/successor-synthesis.ts";
import type {
  KpRegisteredSuccessorSynthesisBinding
} from "../animation/successor-synthesis-presentation-plan.ts";
import type {
  KpVerifiedPaintContinuityPlan
} from "../animation/paint-continuity-plan-types.ts";
import type {
  KpExactOpaqueSuccessorSynthesisBinding
} from "./exact-fraction-quantity-symbolic-projection.ts";
import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-types.ts";
import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap-types.ts";
import type {
  KpEquationIntentionalForegroundOcclusion
} from "./equation-motion-occlusion-types.ts";
import type {
  KpNativeKatexSuccessorEvaluationContact,
  KpNativeKatexSuccessorContactAuthority,
  KpNativeKatexSuccessorMaterialOwnerFrame
} from "./native-katex-successor-contact-types.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  measureKpNativeKatexSubtreePaintRect,
  measureKpNativeKatexTextInkRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpExecutableMotifContinuityAuthority
} from "../animation/motifs/executable-motif-continuity-program.ts";
import {
  isKpExecutableMotifContinuityProgram
} from "../animation/motifs/executable-motif-continuity-program.ts";
import type {
  KpVerifiedIdentityFissionExecutableProgram
} from "../animation/motifs/identity-fission-executable-program.ts";
import type {
  KpVerifiedIdentityFusionExecutableProgram
} from "../animation/motifs/identity-fusion-executable-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "../animation/motifs/executable-successor-motif-program-authority.ts";

declare const kpNativeKatexIdentityTransferIntentBrand: unique symbol;

const sealedIdentityTransferIntents = new WeakSet<object>();

interface KpNativeKatexSuccessorSynthesisIntentBase {
  readonly direction: "forward" | "rewind";
  readonly motion: "full" | "checkpoint";
}

export type KpNativeKatexSuccessorSynthesisIntent =
  | (KpNativeKatexSuccessorSynthesisIntentBase & {
      readonly binding: KpRegisteredSuccessorSynthesisBinding;
      readonly legacyContinuityAuthority?: never;
    })
  | (KpNativeKatexSuccessorSynthesisIntentBase & {
      readonly binding: KpExactOpaqueSuccessorSynthesisBinding;
      readonly executableProgram:
        | KpVerifiedIdentityFissionExecutableProgram
        | KpVerifiedIdentityFusionExecutableProgram;
      readonly legacyContinuityAuthority?: never;
    })
  | KpNativeKatexIdentityTransferIntent;

export interface KpNativeKatexIdentityTransferIntent extends
KpNativeKatexSuccessorSynthesisIntentBase {
  readonly kind: "native-katex-identity-transfer-intent";
  readonly binding: KpSuccessorSynthesisBinding;
  readonly executableProgram:
    | KpVerifiedIdentityFissionExecutableProgram
    | KpVerifiedIdentityFusionExecutableProgram;
  readonly legacyContinuityAuthority?: never;
  readonly [kpNativeKatexIdentityTransferIntentBrand]: true;
}

/**
 * Identity fission/fusion used to enter the native compositor only through an
 * exact-fraction compatibility brand. This nominal factory makes the same
 * existing renderer path available to new typed domains without permitting a
 * caller to label an arbitrary many-to-many replacement as identity transfer.
 */
export function createKpNativeKatexIdentityTransferIntent(input: {
  readonly binding: KpSuccessorSynthesisBinding;
  readonly executableProgram:
    | KpVerifiedIdentityFissionExecutableProgram
    | KpVerifiedIdentityFusionExecutableProgram;
  readonly direction: "forward" | "rewind";
  readonly motion: "full" | "checkpoint";
}): KpNativeKatexIdentityTransferIntent {
  if (
    !isKpVerifiedExecutableSuccessorMotifProgram(input.executableProgram) ||
    (
      input.executableProgram.kind !== "identity-fission" &&
      input.executableProgram.kind !== "identity-fusion"
    )
  ) {
    throw new Error(
      "Native identity transfer requires a verified fission or fusion program."
    );
  }
  const binding = freezeIdentityTransferBinding(input.binding);
  const materialSources = binding.sourceAnnotations.filter(
    ({ contribution }) => contribution === "material-input"
  );
  const catalysts = binding.sourceAnnotations.filter(
    ({ contribution }) => contribution === "catalyst"
  );
  const lineageSourceIds = new Set(
    binding.lineages.flatMap(({ sourceAnnotationIds }) => sourceAnnotationIds)
  );
  const lineageTargetIds = new Set(
    binding.lineages.flatMap(({ targetAnnotationIds }) => targetAnnotationIds)
  );
  const sourceIds = materialSources.map(({ id }) => id);
  const targetIds = binding.targetAnnotations.map(({ id }) => id);
  const validCardinality =
    input.executableProgram.kind === "identity-fission"
      ? sourceIds.length === 1 && targetIds.length >= 2
      : sourceIds.length >= 2 && targetIds.length === 1;
  if (
    catalysts.length !== 0 ||
    !validCardinality ||
    !sameUniqueStrings(sourceIds, lineageSourceIds) ||
    !sameUniqueStrings(targetIds, lineageTargetIds)
  ) {
    throw new Error(
      `Native ${input.executableProgram.kind} requires catalyst-free exact ` +
      "lineage with the program's one-to-many or many-to-one cardinality."
    );
  }
  const intent = Object.freeze({
    kind: "native-katex-identity-transfer-intent" as const,
    binding,
    executableProgram: input.executableProgram,
    direction: input.direction,
    motion: input.motion
  });
  sealedIdentityTransferIntents.add(intent);
  return intent as unknown as KpNativeKatexIdentityTransferIntent;
}

export function isKpNativeKatexIdentityTransferIntent(
  value: unknown
): value is KpNativeKatexIdentityTransferIntent {
  return typeof value === "object" &&
    value !== null &&
    sealedIdentityTransferIntents.has(value);
}

interface KpNativeKatexSuccessorPaintAnnotation {
  readonly annotationId: string;
  readonly contribution?: "material-input" | "catalyst" | undefined;
  readonly stage: HTMLElement;
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
  readonly continuityAuthority:
    | {
      readonly kind: "verified";
      readonly plan: KpVerifiedPaintContinuityPlan;
      readonly program:
        KpExecutableMotifContinuityAuthority & {
          readonly programKind: "operation-evaluation";
          readonly topology:
            "bounded-semantic-contact-co-presence";
        };
      }
    | {
        readonly kind: "executable-identity-transfer";
        readonly program:
          | KpVerifiedIdentityFissionExecutableProgram
          | KpVerifiedIdentityFusionExecutableProgram;
      };
  readonly motifRealization:
    | KpCertifiedOpaqueGatherAndRecognizeRealization
    | {
        readonly kind: "opaque-identity-transfer-v1";
        readonly programKind: "identity-fission" | "identity-fusion";
      };
  readonly synthesis: KpSuccessorSynthesisPlan;
  readonly sources: readonly KpNativeKatexSuccessorPaintAnnotation[];
  readonly targets: readonly KpNativeKatexSuccessorPaintAnnotation[];
  readonly claimedSourceAtomIds: readonly string[];
  readonly claimedTargetAtomIds: readonly string[];
}

const kpOpaqueGatherAndRecognizeCertificate:
unique symbol = Symbol("kp.opaque-gather-and-recognize-certificate");

export interface KpCertifiedOpaqueGatherAndRecognizeRealization {
  readonly kind: "opaque-gather-and-recognize-v1";
  readonly minimumSourceTravelPx: number;
  readonly sourceTranslationPx: number;
  readonly sourceContractionPx: number;
  readonly sourceTravelPx: number;
  readonly targetEmergence:
    "geometry-with-continuous-source-co-presence";
  readonly [kpOpaqueGatherAndRecognizeCertificate]: true;
}

export type {
  KpNativeKatexSuccessorContactAuthority,
  KpNativeKatexSuccessorMaterialOwnerFrame
} from "./native-katex-successor-contact-types.ts";

type KpNativeKatexSuccessorMaterialContactOwnerFrame =
  KpNativeKatexSuccessorMaterialOwnerFrame & {
    readonly contactRole:
      | "fusion-input"
      | "fusion-result"
      | "fission-source"
      | "fission-result";
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
  for (const intent of input.intents) {
    if (
      "kind" in intent &&
      intent.kind === "native-katex-identity-transfer-intent" &&
      !isKpNativeKatexIdentityTransferIntent(intent)
    ) {
      throw new Error(
        "Native identity-transfer intent requires compiler-owned authority."
      );
    }
  }
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
    const sourceAnnotations =
      "executableProgram" in intent &&
        intent.executableProgram?.kind === "identity-fusion"
        ? intent.binding.sourceAnnotations.map((annotation) =>
            Object.freeze({
              ...annotation,
              // Fusion is one cohort, so propagation-rank parity must not
              // send siblings to opposite sides of unrelated native paint.
              pathFamily: annotation.pathFamily ?? "arc-below"
            })
          )
        : intent.binding.sourceAnnotations;
    const baseSynthesis = createKpSuccessorSynthesisPlan({
      id: `native-scene.${intent.binding.id}`,
      authority: intent.binding.authority,
      sourceAnnotations,
      targetAnnotations: intent.binding.targetAnnotations,
      lineages: intent.binding.lineages,
      layoutTopology: intent.binding.layoutTopology,
      convergenceAnchor: intent.binding.convergenceAnchor,
      measurements,
      junctionOwner:
        "executableProgram" in intent &&
          intent.executableProgram?.kind === "identity-fission"
          ? "source"
          : "target"
    });
    const continuityAuthority =
      "executableProgram" in intent
        ? Object.freeze({
            kind: "executable-identity-transfer" as const,
            program: intent.executableProgram
          })
        : verifiedContinuityAuthority(
            requireRegisteredSuccessorBinding(intent.binding)
          );
    const synthesis = baseSynthesis;
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
    const motifRealization = continuityAuthority.kind === "verified"
      ? certifyOpaqueGatherAndRecognizeRealization(synthesis)
      : Object.freeze({
          kind: "opaque-identity-transfer-v1" as const,
          programKind: continuityAuthority.program.kind
        });
    return Object.freeze({
      id: synthesis.id,
      relationRecordId: intent.binding.relationRecordId,
      direction: intent.direction,
      motion: intent.motion,
      continuityAuthority,
      motifRealization,
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
    const semanticProgress = plan.direction === "forward"
      ? presentationProgress
      : 1 - presentationProgress;
    const frame = plan.continuityAuthority.kind === "verified"
      ? sampleKpOpaqueGatherAndRecognizeSuccessorSynthesis({
          plan: plan.synthesis,
          progress: semanticProgress
        })
      : sampleKpOpaqueIdentityTransferSuccessorSynthesis({
          plan: plan.synthesis,
          progress: semanticProgress,
          cohortClearancePx:
            plan.continuityAuthority.program.kind === "identity-fusion"
              ? 10
              : 0
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
            ? plan.continuityAuthority.kind ===
                "executable-identity-transfer" &&
                plan.continuityAuthority.program.kind === "identity-fission"
              ? "fission-source"
              : "fusion-input"
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
          contactRole:
            plan.continuityAuthority.kind ===
                "executable-identity-transfer" &&
                plan.continuityAuthority.program.kind === "identity-fission"
              ? "fission-result"
              : "fusion-result",
          phase: frame.phase
        });
      })
    ];
    return attachSuccessorSemanticContacts(sampledOwners);
  });
  return Object.freeze([
    ...owners,
    ...(input.supplementalOwners?.(bounded) ?? [])
  ]);
}

export const kpNativeKatexSuccessorTargetSettlementProgress =
  kpOpaqueGatherAndRecognizeSettlementProgress;

function requireRegisteredSuccessorBinding(
  binding:
    | KpExactOpaqueSuccessorSynthesisBinding
    | KpRegisteredSuccessorSynthesisBinding
): KpRegisteredSuccessorSynthesisBinding {
  if (!("operationPresentationPlan" in binding)) {
    throw new Error(
      `Exact successor binding ${binding.id} lacks executable or legacy authority.`
    );
  }
  return binding;
}

function verifiedContinuityAuthority(
  binding: KpRegisteredSuccessorSynthesisBinding
): KpNativeKatexSuccessorSynthesisScenePlan["continuityAuthority"] {
  const plan = binding.paintContinuityPlan;
  if (
    plan.operationPresentationPlanId !== binding.operationPresentationPlan.id ||
    plan.ownership !== "exclusive-continuous-carrier" ||
    plan.nonZeroPaint !== "opaque" ||
    plan.endpointSettlement !== "native-source-and-target" ||
    plan.carriers.length === 0 ||
    plan.carriers.some(
      ({ transferTopology }) =>
        transferTopology !==
          "bounded-semantic-contact-co-presence"
    )
  ) {
    throw new Error(
      `Successor binding ${binding.id} lacks verified semantic-contact ` +
      "paint continuity authority."
    );
  }
  const program = binding.continuityProgram;
  if (
    !isKpExecutableMotifContinuityProgram(program) ||
    program.programKind !== "operation-evaluation" ||
    program.topology !== "bounded-semantic-contact-co-presence"
  ) {
    throw new Error(
      `Successor binding ${binding.id} lacks compiled operation-evaluation ` +
      "continuity authority."
    );
  }
  return Object.freeze({ kind: "verified", plan, program });
}

function certifyOpaqueGatherAndRecognizeRealization(
  plan: KpSuccessorSynthesisPlan
): KpCertifiedOpaqueGatherAndRecognizeRealization {
  const minimumSourceTravelPx = observableSuccessorMinimumTravel(plan);
  const sourceTranslationPx = Math.min(
    ...plan.materialInputs.map((source) =>
      distance(center(source.rect), plan.sourceJunction)
    )
  );
  const sourceContractionPx = Math.min(
    ...plan.materialInputs.map(({ rect }) =>
      Math.max(rect.width, rect.height) *
      (1 - plan.inputJunctionScale) /
      2
    )
  );
  // A viewer observes the outer paint edge, whose motion includes both center
  // translation and contraction. Center-only certification was viewport
  // fragile and rejected visibly identical compact layouts by subpixels.
  const sourceTravelPx = sourceTranslationPx + sourceContractionPx;
  if (sourceTravelPx + 0.001 < minimumSourceTravelPx) {
    throw new Error(
      `Successor synthesis ${plan.id} has an unobservable gather: source ` +
      `translation ${sourceTranslationPx.toFixed(3)}px plus contraction ` +
      `${sourceContractionPx.toFixed(3)}px produces ` +
      `${sourceTravelPx.toFixed(3)}px travel, which must reach ` +
      `${minimumSourceTravelPx.toFixed(3)}px.`
    );
  }
  return Object.freeze({
    kind: "opaque-gather-and-recognize-v1",
    minimumSourceTravelPx,
    sourceTranslationPx,
    sourceContractionPx,
    sourceTravelPx,
    targetEmergence:
      "geometry-with-continuous-source-co-presence",
    [kpOpaqueGatherAndRecognizeCertificate]: true as const
  });
}

function observableSuccessorMinimumTravel(
  plan: KpSuccessorSynthesisPlan
): number {
  const bounds = unionRects([
    ...plan.materialInputs.map(({ rect }) => rect),
    ...plan.catalysts.map(({ rect }) => rect),
    ...plan.targets.map(({ rect }) => rect)
  ]);
  if (distance(plan.sourceJunction, plan.junction) > 0.75) {
    // Separate source/result bands express the gather through translation and
    // contraction together. Requiring the inline 12px travel ceiling would
    // push a middle-row contributor toward the structural separator merely to
    // satisfy a metric that ignores its already-observable scale change.
    return 6;
  }
  return Math.max(6, Math.min(12, bounds.height * 0.5));
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
    readonly materialScale?: number | undefined;
    readonly intentionalContactGroupId?: string | undefined;
    readonly intentionalForegroundOcclusion?:
      KpEquationIntentionalForegroundOcclusion | undefined;
    readonly verifiedOperationCohortId?: string | undefined;
    readonly endpointPaintAtomId?: string | undefined;
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
        endpointPaintAtomId: frame.endpointPaintAtomId,
        semanticContacts: contacts.get(frame.trackId),
        verifiedOperationCohortId: frame.verifiedOperationCohortId,
        intentionalForegroundOcclusion:
          frame.intentionalForegroundOcclusion,
        rect: frame.rect,
        // Structural SVG paths scale through their preserved viewBox and have
        // no HTML text/rule inset to normalize. Glyphs and CSS rules retain
        // measured-paint alignment; paths keep their exact owner rectangle.
        ...(frame.paintKind === "path"
          ? {}
          : { expectedPaintRect: frame.expectedPaintRect }),
        opacity: input.visible ? frame.opacity : 0,
        // Scale paint on its stationary measured owner. This keeps the ink
        // center fixed while an operation-specific adapter contracts a glyph.
        transform: frame.materialScale === undefined || frame.materialScale === 1
          ? "none"
          : `scale(${frame.materialScale})`,
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
    readonly intentionalForegroundOcclusion?:
      KpEquationIntentionalForegroundOcclusion | undefined;
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
      const leftOcclusion = left.intentionalForegroundOcclusion;
      const rightOcclusion = right.intentionalForegroundOcclusion;
      if (
        leftOcclusion !== undefined &&
        rightOcclusion !== undefined &&
        leftOcclusion.id === rightOcclusion.id &&
        leftOcclusion.counterpartTrackId === right.trackId &&
        rightOcclusion.counterpartTrackId === left.trackId &&
        leftOcclusion.role !== rightOcclusion.role
      ) {
        addContact(
          ids,
          left.trackId,
          right.trackId,
          Object.freeze({
            id: `foreground-occlusion-contact.${leftOcclusion.id}`,
            ownerIds,
            reason: "semantic-foreground-occlusion",
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
    stage: input.scene.stage,
    atoms: Object.freeze(atoms),
    rect: Object.freeze(unionRects(atoms.map(({ rect }) => rect)))
  });
}

function ownerFrames(input: {
  readonly plan: KpNativeKatexSuccessorSynthesisScenePlan;
  readonly annotation: KpNativeKatexSuccessorPaintAnnotation;
  readonly pose: KpSuccessorSynthesisPose;
  readonly phase: KpSuccessorSynthesisFrame["phase"];
} & (
  | {
      readonly side: "source";
      readonly contactRole:
        | "fusion-input"
        | "fission-source"
        | "catalyst";
    }
  | {
      readonly side: "target";
      readonly contactRole: "fusion-result" | "fission-result";
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
            contactRole: input.contactRole
          };
    return Object.freeze({
      ownerId:
        `native-scene-owner.successor.${input.plan.relationRecordId}.` +
        `${input.annotation.annotationId}.${atom.id}`,
      sourceElement: atom.sourceElement,
      sourceMotionId: input.annotation.annotationId,
      semanticEntityId: input.annotation.annotationId,
      endpointPaintAtomId: atom.id,
      rect: Object.freeze({
        left: scaledCenter.x - atom.rect.width / 2,
        top: scaledCenter.y - atom.rect.height / 2,
        width: atom.rect.width,
        height: atom.rect.height
      }),
      ...(atom.paintKind === "path"
        ? {}
        : {
            expectedPaintRect: successorAtomPaintRect(
              input.annotation.stage,
              atom
            )
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

function successorAtomPaintRect(
  stage: HTMLElement,
  atom: KpNativeKatexPaintAtomObservation
) {
  if (
    typeof stage.getBoundingClientRect !== "function" ||
    typeof atom.sourceElement.getBoundingClientRect !== "function" ||
    typeof atom.sourceElement.ownerDocument.createRange !== "function"
  ) {
    return atom.rect;
  }
  return atom.paintKind === "glyph"
    ? measureKpNativeKatexTextInkRect(stage, atom.sourceElement)
    : measureKpNativeKatexSubtreePaintRect(stage, atom.sourceElement) ??
      atom.rect;
}

function attachSuccessorSemanticContacts(
  frames: readonly KpNativeKatexSuccessorMaterialOwnerFrame[]
): readonly KpNativeKatexSuccessorMaterialOwnerFrame[] {
  const contacts = new Map(frames.map(({ ownerId }) => [
    ownerId,
    [] as KpEquationVisiblePaintCertifiedContact[]
  ] as const));
  const participants = frames.filter(isSuccessorMaterialContactOwner);
  for (const [leftIndex, left] of participants.entries()) {
    for (const [rightOffset, right] of participants.slice(leftIndex + 1)
      .entries()) {
      // Result glyph fragments retain native typography; they do not fuse
      // with each other merely because they share one synthesis result.
      if (
        left.contactRole === "fusion-result" &&
        right.contactRole === "fusion-result"
      ) continue;
      const fissionContact =
        left.contactRole === "fission-source" ||
        left.contactRole === "fission-result" ||
        right.contactRole === "fission-source" ||
        right.contactRole === "fission-result";
      const contact = Object.freeze({
        id:
          `successor-contact.${left.relationRecordId}.` +
          `${leftIndex}.${leftIndex + rightOffset + 1}`,
        ownerIds: [left.ownerId, right.ownerId] as const,
        reason: fissionContact
          ? "semantic-fission" as const
          : "semantic-fusion" as const,
        phase: fissionContact
          ? "transit" as const
          : "fusion-contact" as const,
        maximumOverlapWidthPx: Math.min(left.rect.width, right.rect.width),
        maximumOverlapHeightPx: Math.min(left.rect.height, right.rect.height)
      });
      contacts.get(left.ownerId)!.push(contact);
      contacts.get(right.ownerId)!.push(contact);
    }
  }
  const catalysts = frames.filter(
    (frame) => frame.contactRole === "catalyst"
  );
  const targets = frames.filter(
    (frame) => frame.contactRole === "fusion-result"
  );
  for (const [catalystIndex, catalyst] of catalysts.entries()) {
    for (const [targetIndex, target] of targets.entries()) {
      const contact = Object.freeze({
        id:
          `successor-evaluation-contact.${catalyst.relationRecordId}.` +
          `${catalystIndex}.${targetIndex}`,
        ownerIds: [catalyst.ownerId, target.ownerId] as const,
        reason: "semantic-evaluation" as const,
        phase: "evaluation-recognition" as const,
        maximumOverlapWidthPx: Math.min(
          catalyst.rect.width,
          target.rect.width
        ),
        maximumOverlapHeightPx: Math.min(
          catalyst.rect.height,
          target.rect.height
        )
      });
      contacts.get(catalyst.ownerId)!.push(contact);
      contacts.get(target.ownerId)!.push(contact);
    }
  }
  return Object.freeze(frames.map((frame) => {
    const semanticContacts = contacts.get(frame.ownerId)!;
    if (semanticContacts.length === 0) return frame;
    if (frame.contactRole === "catalyst") {
      const evaluationContacts = semanticContacts.filter(
        (
          contact
        ): contact is KpNativeKatexSuccessorEvaluationContact =>
          contact.reason === "semantic-evaluation" &&
          contact.phase === "evaluation-recognition"
      );
      if (evaluationContacts.length !== semanticContacts.length) {
        throw new Error(
          `Successor catalyst ${frame.ownerId} cannot receive material ` +
          "contact authority."
        );
      }
      return Object.freeze({
        ...frame,
        semanticContacts: Object.freeze(evaluationContacts)
      });
    }
    return Object.freeze({
      ...frame,
      semanticContacts: Object.freeze(semanticContacts)
    });
  }));
}

function isSuccessorMaterialContactOwner(
  frame: KpNativeKatexSuccessorMaterialOwnerFrame
): frame is KpNativeKatexSuccessorMaterialContactOwnerFrame {
  return frame.contactRole === "fusion-input" ||
    frame.contactRole === "fusion-result" ||
    frame.contactRole === "fission-source" ||
    frame.contactRole === "fission-result";
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

function distance(
  left: { readonly x: number; readonly y: number },
  right: { readonly x: number; readonly y: number }
): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicates = values.filter(
    (value, index) => values.indexOf(value) !== index
  );
  if (duplicates.length > 0) {
    throw new Error(`${label} ${duplicates[0]} is duplicated.`);
  }
}

function freezeIdentityTransferBinding(
  binding: KpSuccessorSynthesisBinding
): KpSuccessorSynthesisBinding {
  return Object.freeze({
    id: binding.id,
    relationRecordId: binding.relationRecordId,
    authority: Object.freeze({ ...binding.authority }),
    ...(binding.layoutTopology === undefined
      ? {}
      : { layoutTopology: binding.layoutTopology }),
    ...(binding.convergenceAnchor === undefined
      ? {}
      : { convergenceAnchor: binding.convergenceAnchor }),
    sourceAnnotations: Object.freeze(binding.sourceAnnotations.map(
      (annotation) => Object.freeze({
        ...annotation,
        selectorIds: Object.freeze([...annotation.selectorIds])
      })
    )),
    targetAnnotations: Object.freeze(binding.targetAnnotations.map(
      (annotation) => Object.freeze({
        ...annotation,
        selectorIds: Object.freeze([...annotation.selectorIds])
      })
    )),
    lineages: Object.freeze(binding.lineages.map((lineage) =>
      Object.freeze({
        ...lineage,
        sourceAnnotationIds:
          Object.freeze([...lineage.sourceAnnotationIds]),
        targetAnnotationIds:
          Object.freeze([...lineage.targetAnnotationIds])
      })
    ))
  });
}

function sameUniqueStrings(
  expected: readonly string[],
  actual: ReadonlySet<string>
): boolean {
  return expected.length === actual.size &&
    new Set(expected).size === expected.length &&
    expected.every((id) => actual.has(id));
}
