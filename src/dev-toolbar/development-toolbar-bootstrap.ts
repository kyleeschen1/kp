import {
  mountKpDevToolbar,
  type KpMountedDevToolbar
} from "./dev-toolbar-dom.ts";
import {
  kpDevToolbarReviewControlId,
  type KpDevToolbarCommand,
  type KpDevToolbarRouteContribution
} from "./dev-toolbar-protocol.ts";

export interface KpDevelopmentToolbarSession {
  readonly setRoute: (
    contribution: KpDevToolbarRouteContribution,
    execute?: (command: KpDevToolbarCommand) => void
  ) => void;
  readonly clearRoute: (routeId: string) => void;
  readonly dispose: () => void;
}

const sessions = new WeakMap<Window, KpDevelopmentToolbarSession>();

/**
 * The application shell owns one toolbar for the lifetime of a development
 * page. Route clients contribute controls but never create competing shells.
 */
export function mountKpDevelopmentToolbar(
  ownerWindow: Window = window
): KpDevelopmentToolbarSession {
  const existing = sessions.get(ownerWindow);
  if (existing !== undefined) return existing;

  const ownerDocument = ownerWindow.document;
  let executeRoute: ((command: KpDevToolbarCommand) => void) | undefined;
  let mounted: KpMountedDevToolbar;
  mounted = mountKpDevToolbar({
    ownerDocument,
    execute: (command) => {
      if (command.controlId === kpDevToolbarReviewControlId) {
        currentReviewLauncher(ownerDocument)?.click();
        return;
      }
      executeRoute?.(command);
    }
  });

  const hideReviewLauncher = (): void => {
    const launcher = currentReviewLauncher(ownerDocument);
    if (launcher !== undefined) launcher.style.display = "none";
  };
  hideReviewLauncher();
  const observer = new MutationObserver(hideReviewLauncher);
  observer.observe(ownerDocument.body, { childList: true, subtree: true });

  const session: KpDevelopmentToolbarSession = Object.freeze({
    setRoute: (
      contribution: KpDevToolbarRouteContribution,
      execute?: (command: KpDevToolbarCommand) => void
    ) => {
      executeRoute = execute;
      mounted.update(contribution);
    },
    clearRoute: (routeId: string) => {
      mounted.clear(routeId);
      executeRoute = undefined;
    },
    dispose: () => {
      observer.disconnect();
      mounted.dispose();
      sessions.delete(ownerWindow);
    }
  });
  sessions.set(ownerWindow, session);
  return session;
}

export function getKpDevelopmentToolbar(
  ownerWindow: Window = window
): KpDevelopmentToolbarSession | undefined {
  return sessions.get(ownerWindow);
}

function currentReviewLauncher(
  ownerDocument: Document
): HTMLButtonElement | undefined {
  const shell = ownerDocument.querySelector<HTMLElement>(
    "[data-kp-dev-review-shell]"
  );
  return shell?.shadowRoot?.querySelector<HTMLButtonElement>(".launcher")
    ?? undefined;
}
