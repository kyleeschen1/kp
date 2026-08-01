export const KP_ANIMATION_HOST_STATUS_MESSAGE =
  "kp.animation-host-status.v1";

export type KpAnimationHostStatus = "loading" | "ready" | "failed";

export interface KpAnimationHostStatusMessage {
  readonly protocol: typeof KP_ANIMATION_HOST_STATUS_MESSAGE;
  readonly status: KpAnimationHostStatus;
  readonly hostId: string;
  readonly message?: string | undefined;
}
