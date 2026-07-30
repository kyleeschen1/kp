import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-types.ts";
import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap-types.ts";

export type KpNativeKatexSuccessorEvaluationContact =
  KpEquationVisiblePaintCertifiedContact & {
    readonly reason: "semantic-evaluation";
    readonly phase: "evaluation-recognition";
  };

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
      readonly contactRole: "fusion-input" | "fission-source";
      readonly semanticContacts?:
        readonly KpEquationVisiblePaintCertifiedContact[] | undefined;
    }
  | {
      readonly synthesisSide: "source";
      readonly contactRole: "catalyst";
      /**
       * A catalyst may touch the emerging result without acquiring material
       * lineage. The narrower contact type prevents that visual participation
       * from being mistaken for fusion authority.
       */
      readonly semanticContacts?:
        readonly KpNativeKatexSuccessorEvaluationContact[] | undefined;
    }
  | {
      readonly synthesisSide: "target";
      readonly contactRole: "fusion-result" | "fission-result";
      readonly semanticContacts?:
        readonly KpEquationVisiblePaintCertifiedContact[] | undefined;
    };

export type KpNativeKatexSuccessorMaterialOwnerFrame =
  KpNativeKatexSuccessorMaterialOwnerFrameBase &
  KpNativeKatexSuccessorContactAuthority;
