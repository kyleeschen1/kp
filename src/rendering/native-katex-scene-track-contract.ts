export type KpNativeKatexSceneTrackOpacityContract =
  | {
      readonly lifecycle: "persist" | "split" | "merge";
      readonly startOpacity: 1;
      readonly endOpacity: 1;
      readonly opacityStepAt?: never;
    }
  | {
      readonly lifecycle: "introduce";
      readonly startOpacity: 0;
      readonly endOpacity: 1;
      readonly opacityStepAt?: number | undefined;
    }
  | {
      readonly lifecycle: "eliminate";
      readonly startOpacity: 1;
      readonly endOpacity: 0;
      readonly opacityStepAt?: number | undefined;
    };

export type KpNativeKatexSceneTrackContract<
  CollisionTrack,
  PaintKind
> = Omit<
  CollisionTrack,
  "lifecycle" | "startOpacity" | "endOpacity" | "opacityStepAt"
> & {
  readonly sourceAtomId?: string | undefined;
  readonly targetAtomId?: string | undefined;
  readonly visualAtomId: string;
  readonly paintKind: PaintKind;
  readonly sizingMode: "rect" | "rule-length";
  readonly sampleProgress?: (progress: number) => number;
  readonly sampleOpacityProgress?: (progress: number) => number;
} & KpNativeKatexSceneTrackOpacityContract;

export interface KpNativeKatexSceneTrackFrameContract<
  Lifecycle,
  PaintKind,
  Rect
> {
  readonly trackId: string;
  readonly componentId: string;
  readonly lifecycle: Lifecycle;
  readonly visualAtomId: string;
  readonly paintKind: PaintKind;
  readonly sizingMode: "rect" | "rule-length";
  readonly rect: Rect;
  readonly expectedPaintRect?: Rect | undefined;
  readonly opacity: number;
  readonly intentionalContactGroupId?: string | undefined;
  readonly verifiedOperationCohortId?: string | undefined;
}

export type KpNativeKatexPaintMeasuredSceneTrackFrameContract<
  Frame,
  Rect
> = Frame & { readonly expectedPaintRect: Rect };

export interface KpNativeKatexSceneOwnershipFrameContract<Frame> {
  readonly visualOwner: "source-native" | "material-scene" | "target-native";
  readonly sourceNativeOpacity: 0 | 1;
  readonly materialSceneOpacity: 0 | 1;
  readonly targetNativeOpacity: 0 | 1;
  readonly frames: readonly Frame[];
}

export interface KpNativeKatexRendererDispositionContract {
  readonly mode: "motion" | "checkpoint-settlement";
  readonly reason:
    | "clear"
    | "semantic-ambiguity"
    | "blocked-geometry"
    | "unsupported-typography";
  readonly affectedIds: readonly string[];
}

export interface KpNativeKatexRendererSessionContract<
  Disposition,
  Track,
  Frame,
  OwnershipFrame
> {
  readonly kind: "native-katex-renderer-session";
  readonly lifecycle: "renderer-session";
  readonly mode:
    | "native-continuity"
    | "atom-transit"
    | "checkpoint-settlement";
  readonly disposition: Disposition;
  readonly tracks: readonly Track[];
  readonly sample: (progress: number) => readonly Frame[];
  readonly apply: (progress: number) => OwnershipFrame;
  readonly dispose: (options?: {
    readonly preserveStructuralSuccession?: boolean | undefined;
  }) => void;
}
