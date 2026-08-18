import {
  mountKpDevToolbar,
  type KpMountedDevToolbar
} from "./dev-toolbar-dom.ts";
import {
  kpDevToolbarCopyLinkControlId,
  kpDevToolbarReviewControlId,
  kpDevToolbarThemeControlId,
  type KpDevToolbarCommand,
  type KpDevToolbarControl,
  type KpDevToolbarRouteContribution
} from "./dev-toolbar-protocol.ts";
export type KpDevelopmentDockTheme = "light" | "dark";

const kpDevelopmentThemeEvent = "kp-development-theme-change";

export interface KpDevelopmentToolbarOptions {
  readonly defaultTheme?: KpDevelopmentDockTheme;
  readonly resolveExactHref?: (() => string | Promise<string>) | undefined;
  readonly navigateLink?: ((link: Readonly<{
    id: string;
    href: string;
  }>) => boolean) | undefined;
}

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
  ownerWindow: Window = window,
  options: KpDevelopmentToolbarOptions = {}
): KpDevelopmentToolbarSession {
  const existing = sessions.get(ownerWindow);
  if (existing !== undefined) return existing;

  const ownerDocument = ownerWindow.document;
  const defaultTheme = options.defaultTheme ?? "dark";
  let theme = readDevelopmentTheme(ownerWindow.location.search, defaultTheme);
  let executeRoute: ((command: KpDevToolbarCommand) => void) | undefined;
  let syncLocation = (): void => undefined;
  let mounted: KpMountedDevToolbar;
  mounted = mountKpDevToolbar({
    ownerDocument,
    globals: createGlobalControls(theme),
    ...(options.navigateLink === undefined
      ? {}
      : {
          navigateLink: (link: Readonly<{ id: string; href: string }>) => {
            const handled = options.navigateLink?.(link) ?? false;
            if (handled) ownerWindow.queueMicrotask(syncLocation);
            return handled;
          }
        }),
    execute: (command) => {
      if (command.controlId === kpDevToolbarReviewControlId) {
        currentReviewLauncher(ownerDocument)?.click();
        return;
      }
      if (
        command.controlId === kpDevToolbarThemeControlId
        && typeof command.value === "boolean"
      ) {
        theme = command.value ? "dark" : "light";
        const url = new URL(ownerWindow.location.href);
        url.searchParams.set("theme", theme);
        ownerWindow.history.replaceState(ownerWindow.history.state, "", url);
        applyDevelopmentTheme(ownerDocument, theme);
        mounted.updateGlobals(createGlobalControls(theme));
        ownerWindow.dispatchEvent(new CustomEvent(kpDevelopmentThemeEvent, {
          detail: Object.freeze({ theme, href: ownerWindow.location.href })
        }));
        return;
      }
      if (command.controlId === kpDevToolbarCopyLinkControlId) {
        void copyExactHref({ ownerWindow, ownerDocument, options });
        return;
      }
      executeRoute?.(command);
    }
  });
  applyDevelopmentTheme(ownerDocument, theme);

  syncLocation = (): void => {
    theme = readDevelopmentTheme(ownerWindow.location.search, defaultTheme);
    applyDevelopmentTheme(ownerDocument, theme);
    mounted.updateGlobals(createGlobalControls(theme));
    mounted.updateLocation({
      pathname: ownerWindow.location.pathname,
      search: ownerWindow.location.search
    });
  };
  ownerWindow.addEventListener("popstate", syncLocation);

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
      ownerWindow.removeEventListener("popstate", syncLocation);
      observer.disconnect();
      mounted.dispose();
      sessions.delete(ownerWindow);
    }
  });
  sessions.set(ownerWindow, session);
  return session;
}

function createGlobalControls(
  theme: KpDevelopmentDockTheme
): readonly KpDevToolbarControl[] {
  return Object.freeze([{
    kind: "action",
    id: kpDevToolbarCopyLinkControlId,
    label: "Copy link",
    group: "primary",
    order: 10
  }, {
    kind: "toggle",
    id: kpDevToolbarThemeControlId,
    label: "Dark mode",
    group: "preferences",
    order: 20,
    pressed: theme === "dark"
  }]);
}

function readDevelopmentTheme(
  search: string,
  fallback: KpDevelopmentDockTheme
): KpDevelopmentDockTheme {
  const theme = new URLSearchParams(search).get("theme");
  return theme === "light" || theme === "dark" ? theme : fallback;
}

function applyDevelopmentTheme(
  ownerDocument: Document,
  theme: KpDevelopmentDockTheme
): void {
  ownerDocument.documentElement.dataset["kpDevelopmentTheme"] = theme;
}

async function copyExactHref(input: {
  readonly ownerWindow: Window;
  readonly ownerDocument: Document;
  readonly options: KpDevelopmentToolbarOptions;
}): Promise<void> {
  const href = await input.options.resolveExactHref?.()
    ?? input.ownerWindow.location.href;
  await input.ownerWindow.navigator.clipboard.writeText(href);
  const button = input.ownerDocument.querySelector<HTMLButtonElement>(
    `[data-kp-dev-toolbar-control="${kpDevToolbarCopyLinkControlId}"]`
  );
  if (button === null) return;
  button.dataset["kpDevToolbarCopied"] = "true";
  button.textContent = "Copied";
  input.ownerWindow.setTimeout(() => {
    if (!button.isConnected) return;
    delete button.dataset["kpDevToolbarCopied"];
    button.textContent = "Copy link";
  }, 1_200);
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
