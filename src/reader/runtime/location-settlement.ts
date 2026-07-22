export interface KpReaderLocationSettlement {
  readonly settle: () => boolean;
  readonly updateShare: () => string;
  schedule(delayMs: number): void;
  dispose(): void;
}

/** Keeps the visible share target and canonical history URL on one snapshot. */
export function createKpReaderLocationSettlement(input: {
  readonly ownerWindow: Window;
  readonly shareLink: HTMLAnchorElement;
  readonly href: () => string | URL;
  readonly canSettle?: (() => boolean) | undefined;
  readonly scrollRestoration?: ScrollRestoration | undefined;
}): KpReaderLocationSettlement {
  let settleTimer: number | undefined;
  let disposed = false;
  if (input.scrollRestoration !== undefined) {
    input.ownerWindow.history.scrollRestoration = input.scrollRestoration;
  }
  const currentHref = (): string => String(input.href());
  const updateShare = (): string => {
    const href = currentHref();
    input.shareLink.href = href;
    return href;
  };
  const settle = (): boolean => {
    if (disposed || input.canSettle?.() === false) return false;
    const href = updateShare();
    input.ownerWindow.history.replaceState(null, "", href);
    return true;
  };

  return {
    settle,
    updateShare,
    schedule(delayMs) {
      if (disposed) return;
      if (settleTimer !== undefined) input.ownerWindow.clearTimeout(settleTimer);
      settleTimer = input.ownerWindow.setTimeout(() => {
        settleTimer = undefined;
        settle();
      }, delayMs);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (settleTimer !== undefined) input.ownerWindow.clearTimeout(settleTimer);
      settleTimer = undefined;
    }
  };
}
