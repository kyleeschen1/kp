import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { resolveKpRadicalFragmentSemantics } from "../semantic/radical-fragment-semantics.ts";
import type {
  EquationMotionPrimitiveId,
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "./motifs/visual-motif.ts";
import {
  kpRadicalConventionalMorphProfile
} from "./radical-morph-profile.ts";
import type { EasingName } from "./easing.ts";

export interface KpEquationVisualMotifIntent {
  readonly kind: EquationVisualMotifKind;
  readonly motionPrimitiveIds: readonly EquationMotionPrimitiveId[];
  readonly phaseIds: readonly EquationVisualMotifPhaseId[];
  readonly summary: string;
}

export interface KpEquationStructuralSuccessionIntent {
  readonly kind: "equation-structural-succession-intent";
  readonly id: string;
  readonly motifKind: EquationVisualMotifKind;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly actPhaseIds: readonly EquationVisualMotifPhaseId[];
  readonly paintStrategy: KpEquationStructuralSuccessionPaintStrategy;
}

export interface KpEquationStructuralSuccessionPaintStrategy {
  readonly kind: "solid-mask-succession";
  readonly profileId: string;
  readonly morph: {
    readonly start: number;
    readonly end: number;
    readonly easing: EasingName;
  };
  readonly settlement: {
    readonly start: number;
    readonly end: number;
    readonly easing: EasingName;
  };
  readonly solidMask: {
    readonly maximumDistancePx: number;
    readonly edgeSoftnessPx: number;
    readonly boundsPaddingPx: number;
    readonly sourceTravelFraction: number;
    readonly sourceArcHeightPx: number;
    readonly shapeLeadFraction: number;
    readonly targetGrowthOriginXFraction: number;
    readonly targetGrowthOriginYFraction: number;
    readonly targetGrowthSoftnessPx: number;
    readonly bridgeExpansionPx: number;
    readonly endpointBlendFraction: number;
  };
}

interface KpEquationStructuralSuccessionCompiler {
  readonly motifKind: EquationVisualMotifKind;
  compile(
    transformation: KpSemanticTransformation
  ): KpEquationStructuralSuccessionIntent;
}

const structuralSuccessionCompilers:
  readonly KpEquationStructuralSuccessionCompiler[] = [{
    motifKind: "radical-corner-transfer",
    compile(transformation) {
      const fragments = resolveKpRadicalFragmentSemantics(transformation);
      return Object.freeze({
        kind: "equation-structural-succession-intent",
        id: `structural-succession.${transformation.id}`,
        motifKind: "radical-corner-transfer",
        sourceEntityIds: Object.freeze(fragments.notationRecords.flatMap(
          ({ sourceSelectorIds }) => sourceSelectorIds
        )),
        targetEntityIds: Object.freeze(fragments.notationRecords.flatMap(
          ({ targetSelectorIds }) => targetSelectorIds
        )),
        actPhaseIds: Object.freeze([
          "radical-representation-handoff" as const
        ]),
        paintStrategy: Object.freeze({
          kind: "solid-mask-succession",
          profileId: kpRadicalConventionalMorphProfile.id,
          morph: kpRadicalConventionalMorphProfile.morph,
          settlement: kpRadicalConventionalMorphProfile.settlement,
          solidMask: kpRadicalConventionalMorphProfile.solidMask
        })
      });
    }
  }];

/**
 * Operation-specific knowledge is registered at compile time. Renderers
 * receive only typed intent and never infer notation from KaTeX class names.
 */
export function compileKpEquationStructuralSuccessionIntent(input: {
  readonly transformation: KpSemanticTransformation;
  readonly motif: KpEquationVisualMotifIntent;
  readonly direction: "forward" | "rewind";
}): KpEquationStructuralSuccessionIntent | undefined {
  const compiler = structuralSuccessionCompilers.find(
    ({ motifKind }) => motifKind === input.motif.kind
  );
  if (compiler === undefined) return undefined;
  const forward = compiler.compile(input.transformation);
  if (input.direction === "forward") return forward;
  return Object.freeze({
    ...forward,
    id: `${forward.id}.rewind`,
    sourceEntityIds: forward.targetEntityIds,
    targetEntityIds: forward.sourceEntityIds
  });
}
