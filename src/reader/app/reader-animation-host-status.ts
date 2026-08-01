import {
  KP_ANIMATION_HOST_STATUS_MESSAGE,
  type KpAnimationHostStatus
} from "../../rendering/animation-host-status-protocol.ts";

/**
 * Reader entries install exactly one host reporter. A closure is sufficient
 * here; the general application service retains its multi-install API without
 * making every reader load that extra state-management surface.
 */
export function installKpReaderAnimationHostStatus(
  ownerWindow: Window,
  hostId: string
): () => void {
  const reflect = (
    status: KpAnimationHostStatus,
    message?: string
  ): void => {
    const body = ownerWindow.document.body;
    if (body !== null) {
      body.dataset["kpAnimationHostStatus"] = status;
      body.dataset["kpAnimationHostId"] = hostId;
      if (message === undefined) {
        delete body.dataset["kpAnimationHostError"];
      } else {
        body.dataset["kpAnimationHostError"] = message;
      }
    }
    if (ownerWindow.parent !== ownerWindow) {
      ownerWindow.parent.postMessage({
        protocol: KP_ANIMATION_HOST_STATUS_MESSAGE,
        status,
        hostId,
        ...(message === undefined ? {} : { message })
      }, ownerWindow.location.origin);
    }
  };
  const fail = (message: string): void => {
    reflect(
      "failed",
      message.trim() || "Animation host failed to render."
    );
  };
  reflect("loading");
  ownerWindow.addEventListener("error", (event) => {
    const message = event.message || "Animation host runtime error.";
    if (
      message !==
        "ResizeObserver loop completed with undelivered notifications."
    ) {
      fail(message);
    }
  });
  ownerWindow.addEventListener("unhandledrejection", (event) => {
    fail(event.reason instanceof Error
      ? event.reason.message
      : typeof event.reason === "string" && event.reason.trim() !== ""
        ? event.reason
        : "Animation host promise rejected.");
  });
  return () => reflect("ready");
}
