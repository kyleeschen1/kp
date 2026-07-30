export const KP_ANIMATION_HOST_STATUS_MESSAGE =
  "kp.animation-host-status.v1";

export type KpAnimationHostStatus = "loading" | "ready" | "failed";

export interface KpAnimationHostStatusMessage {
  readonly protocol: typeof KP_ANIMATION_HOST_STATUS_MESSAGE;
  readonly status: KpAnimationHostStatus;
  readonly hostId: string;
  readonly message?: string | undefined;
}

const installedWindows = new WeakSet<Window>();
const hostIds = new WeakMap<Window, string>();

/**
 * Installs one failure reporter per browsing context. A document load is not
 * animation readiness; hosts explicitly report ready only after their first
 * semantic frame survives compilation and paint.
 */
export function installKpAnimationHostStatus(
  ownerWindow: Window,
  hostId: string
): void {
  hostIds.set(ownerWindow, hostId);
  reflect(ownerWindow, {
    protocol: KP_ANIMATION_HOST_STATUS_MESSAGE,
    status: "loading",
    hostId
  });
  if (installedWindows.has(ownerWindow)) return;
  installedWindows.add(ownerWindow);
  ownerWindow.addEventListener("error", (event) => {
    const message = event.message || "Animation host runtime error.";
    if (isBenignResizeObserverNotification(message)) return;
    markKpAnimationHostFailed(ownerWindow, message);
  });
  ownerWindow.addEventListener("unhandledrejection", (event) => {
    markKpAnimationHostFailed(ownerWindow, errorMessage(event.reason));
  });
}

export function markKpAnimationHostLoading(
  ownerWindow: Window,
  hostId: string = requiredHostId(ownerWindow)
): void {
  hostIds.set(ownerWindow, hostId);
  reflect(ownerWindow, {
    protocol: KP_ANIMATION_HOST_STATUS_MESSAGE,
    status: "loading",
    hostId
  });
}

export function markKpAnimationHostReady(ownerWindow: Window): void {
  reflect(ownerWindow, {
    protocol: KP_ANIMATION_HOST_STATUS_MESSAGE,
    status: "ready",
    hostId: requiredHostId(ownerWindow)
  });
}

export function markKpAnimationHostFailed(
  ownerWindow: Window,
  message: string
): void {
  reflect(ownerWindow, {
    protocol: KP_ANIMATION_HOST_STATUS_MESSAGE,
    status: "failed",
    hostId: requiredHostId(ownerWindow),
    message: message.trim() || "Animation host failed to render."
  });
}

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

function reflect(
  ownerWindow: Window,
  message: KpAnimationHostStatusMessage
): void {
  const body = ownerWindow.document.body;
  if (body !== null) {
    body.dataset["kpAnimationHostStatus"] = message.status;
    body.dataset["kpAnimationHostId"] = message.hostId;
    if (message.message === undefined) {
      delete body.dataset["kpAnimationHostError"];
    } else {
      body.dataset["kpAnimationHostError"] = message.message;
    }
  }
  if (ownerWindow.parent !== ownerWindow) {
    ownerWindow.parent.postMessage(message, ownerWindow.location.origin);
  }
}

function requiredHostId(ownerWindow: Window): string {
  const hostId = hostIds.get(ownerWindow);
  if (hostId === undefined) {
    throw new Error("Animation host status was not installed.");
  }
  return hostId;
}

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string" && value.trim() !== "") return value;
  return "Animation host promise rejected.";
}

function isBenignResizeObserverNotification(message: string): boolean {
  // Browsers report this delivery deferral through `window.error` even though
  // the observer retries on the next frame. It is not a renderer exception.
  return message ===
    "ResizeObserver loop completed with undelivered notifications.";
}
