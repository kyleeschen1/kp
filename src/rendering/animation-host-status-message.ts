import {
  KP_ANIMATION_HOST_STATUS_MESSAGE,
  type KpAnimationHostStatusMessage
} from "./animation-host-status-protocol.ts";

export function isKpAnimationHostStatusMessage(
  value: unknown
): value is KpAnimationHostStatusMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KpAnimationHostStatusMessage>;
  return candidate.protocol === KP_ANIMATION_HOST_STATUS_MESSAGE &&
    (candidate.status === "loading" ||
      candidate.status === "ready" ||
      candidate.status === "failed") &&
    typeof candidate.hostId === "string" &&
    candidate.hostId.length > 0 &&
    (candidate.message === undefined ||
      typeof candidate.message === "string");
}
