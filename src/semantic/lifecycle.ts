export type SemanticSelectorLifecycle =
  | "identity-preserved"
  | "role-changed"
  | "introduced"
  | "removed"
  | "cancelled"
  | "derived"
  | "visual-only";

export type VisualTokenLifecycle =
  | "persist"
  | "shift"
  | "enter"
  | "exit"
  | "vanish"
  | "wrap"
  | "unwrap";
