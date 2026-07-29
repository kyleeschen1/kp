import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-types.ts";
import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap-types.ts";

export type KpNativeKatexSuccessorSynthesisPhase =
  | "orient"
  | "converge"
  | "synthesize"
  | "recognize"
  | "retire"
  | "settled";

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
  readonly synthesisPhase: KpNativeKatexSuccessorSynthesisPhase;
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
