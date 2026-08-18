export const KP_EDITOR_ANIMATION_SURFACE_READINESS_EVENT =
  "kp-editor-animation-surface-readiness";

export type KpEditorAnimationSurfaceReadiness =
  | "preparing"
  | "ready"
  | "failed";

export type KpEditorAnimationLoadOutcome =
  | Readonly<{ readonly status: "loading" }>
  | Readonly<{ readonly status: "ready" }>
  | Readonly<{ readonly status: "failed"; readonly message: string }>;

export function publishKpEditorAnimationSurfaceReadiness(input: {
  readonly player: HTMLElement;
  readonly readiness: KpEditorAnimationSurfaceReadiness;
  readonly error?: string | undefined;
}): void {
  input.player.dataset["kpEditorAnimationSurfaceReadiness"] = input.readiness;
  if (input.error === undefined) {
    delete input.player.dataset["kpEditorAnimationSurfaceError"];
  } else {
    input.player.dataset["kpEditorAnimationSurfaceError"] = input.error;
  }
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

export function deriveKpEditorAnimationLoadOutcome(input: {
  readonly readiness: KpEditorAnimationSurfaceReadiness;
  readonly error?: string | undefined;
}): KpEditorAnimationLoadOutcome {
  if (input.readiness === "preparing") {
    return Object.freeze({ status: "loading" as const });
  }
  if (input.readiness === "ready") {
    return Object.freeze({ status: "ready" as const });
  }
  return Object.freeze({
    status: "failed" as const,
    message: input.error ?? "Animation surface failed to prepare."
  });
}

export function readKpEditorAnimationSurfaceReadiness(
  player: HTMLElement
): KpEditorAnimationSurfaceReadiness {
  const readiness = player.dataset["kpEditorAnimationSurfaceReadiness"];
  return readiness === "preparing" || readiness === "failed"
    ? readiness
    : "ready";
}
