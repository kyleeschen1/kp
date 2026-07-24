export type KpEasingName =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

// Compatibility alias retained while equation consumers converge on the
// renderer-neutral name.
export type EasingName = KpEasingName;
