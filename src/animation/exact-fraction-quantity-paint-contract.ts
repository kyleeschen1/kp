export interface KpExactQuantityOpaquePaintBinding {
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly atomicPartIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly paintOpacity: 1;
  readonly ownership:
    | "continuous-owned-paint"
    | "atomic-exclusive-handoff";
}
