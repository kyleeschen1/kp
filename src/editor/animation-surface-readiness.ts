export const KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT =
  "kp-editor-animation-surface-readiness";

export type KpEditorAnimationSurfaceReadiness =
  | "preparing"
  | "ready"
  | "failed";

export function publishKpEditorAnimationSurfaceReadiness(input: {
  readonly player: HTMLElement;
  readonly readiness: KpEditorAnimationSurfaceReadiness;
}): void {
  input.player.dataset["kpEditorAnimationSurfaceReadiness"] = input.readiness;
  input.player.setAttribute(
    "aria-busy",
    String(input.readiness === "preparing")
  );
  input.player.dispatchEvent(new CustomEvent(
    KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT,
    {
      detail: Object.freeze({ readiness: input.readiness })
    }
  ));
}

export function readKpEditorAnimationSurfaceReadiness(
  player: HTMLElement
): KpEditorAnimationSurfaceReadiness {
  const readiness = player.dataset["kpEditorAnimationSurfaceReadiness"];
  return readiness === "preparing" || readiness === "failed"
    ? readiness
    : "ready";
}
