import type {
  KpEquationVisiblePaintCertifiedContact
} from "./equation-visible-paint-overlap-types.ts";
import type {
  KpEquationIntentionalForegroundOcclusion
} from "./equation-motion-occlusion-types.ts";

/**
 * This frame contract is intentionally independent of the DOM implementation.
 * Type-level callers can prove paint ownership without instantiating KaTeX
 * measurement and cloning machinery in the compiler's inference graph.
 */
export interface KpEquationMaterialLayerOwnerFrame {
  readonly ownerId: string;
  readonly sourceElement: HTMLElement;
  readonly sourceMotionId?: string | undefined;
  readonly semanticEntityId?: string | undefined;
  /**
   * Renderer-session correlation only. Endpoint diagnostics use the observed
   * atom ID instead of guessing identity from glyph text or nearby geometry.
   */
  readonly endpointPaintAtomId?: string | undefined;
  readonly semanticContacts?:
    readonly KpEquationVisiblePaintCertifiedContact[] | undefined;
  readonly verifiedOperationCohortId?: string | undefined;
  readonly intentionalForegroundOcclusion?:
    KpEquationIntentionalForegroundOcclusion | undefined;
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly expectedPaintRect?: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined;
  readonly opacity: number;
  readonly transform: string;
  readonly filter?: string | undefined;
  readonly semanticDepth?: string | undefined;
  readonly clipPath?: string | undefined;
  readonly visualTransform?: string | undefined;
  readonly fragmentRole?: string | undefined;
}
