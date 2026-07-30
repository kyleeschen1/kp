export type KpEquationVisiblePaintAuthority =
  | "source-native"
  | "target-native"
  | "material";

export type KpEquationVisiblePaintContactReason =
  | "native-handoff"
  | "semantic-fusion"
  | "semantic-fission"
  | "semantic-evaluation"
  | "semantic-cancellation"
  | "semantic-reconciliation"
  | "typographic-adjacency";

export type KpEquationVisiblePaintContactPhase =
  | "transit"
  | "fusion-contact"
  | "evaluation-recognition"
  | "native-settlement"
  | "endpoint-typography";

export interface KpEquationVisiblePaintCertifiedContact {
  readonly id: string;
  readonly ownerIds: readonly [string, string];
  readonly reason: KpEquationVisiblePaintContactReason;
  readonly phase: KpEquationVisiblePaintContactPhase;
  readonly maximumOverlapWidthPx: number;
  readonly maximumOverlapHeightPx: number;
}
