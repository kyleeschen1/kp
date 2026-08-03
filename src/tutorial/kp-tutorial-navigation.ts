import type {
  KpTutorialTocElement,
  KpTutorialTocNavigateDetail
} from "./kp-tutorial-toc-element.ts";
import type { KpTutorialTocDestination } from "./kp-tutorial-toc.ts";
import {
  parseKpTutorialDestinationHash,
  serializeKpTutorialDestinationHash
} from "./kp-tutorial-url.ts";

// Keep the framework-neutral controller safe to import in Node/static builds.
const KP_TUTORIAL_TOC_NAVIGATE_EVENT = "kp:tutorial-toc-navigate";

export type KpTutorialNavigationSource = "initial" | "push" | "history";

export interface KpTutorialNavigationApplyOptions {
  readonly source: KpTutorialNavigationSource;
  readonly scroll: boolean;
}

export interface KpTutorialNavigationController {
  readonly connect: () => void;
  readonly apply: (
    destination: KpTutorialTocDestination,
    options: KpTutorialNavigationApplyOptions
  ) => boolean;
  readonly navigate: (destination: KpTutorialTocDestination) => boolean;
  readonly restoreLocation: (scroll: boolean) => boolean;
  readonly dispose: () => void;
}

export function applyKpTutorialNavigationTransaction<Target>(input: {
  readonly target: Target;
  readonly destination: KpTutorialTocDestination;
  readonly source: KpTutorialNavigationSource;
  readonly scroll: boolean;
  readonly writeHistory: () => void;
  readonly restore: () => void;
  readonly setActive: () => void;
  readonly onApplied: () => void;
  readonly moveViewport: () => void;
}): void {
  if (input.source === "push") input.writeHistory();
  input.restore();
  input.setActive();
  input.onApplied();
  if (input.scroll) input.moveViewport();
}

/**
 * Owns the browser transaction, never domain reconstruction: resolve and
 * restore callbacks run before TOC/viewport projection so observers cannot
 * see a destination paired with an intermediate semantic frame.
 */
export function createKpTutorialNavigationController<Target>(input: {
  readonly root: HTMLElement;
  readonly toc: KpTutorialTocElement;
  readonly resolve: (destination: KpTutorialTocDestination) => Target | undefined;
  readonly restore: (target: Target, destination: KpTutorialTocDestination) => void;
  readonly scroll: (target: Target, destination: KpTutorialTocDestination) => void;
  readonly onApplied?: ((input: {
    readonly target: Target;
    readonly destination: KpTutorialTocDestination;
    readonly source: KpTutorialNavigationSource;
  }) => void) | undefined;
}): KpTutorialNavigationController {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Tutorial navigation requires a browser view.");
  let connected = false;
  let lastAppliedHash: string | undefined;

  const apply = (
    destination: KpTutorialTocDestination,
    options: KpTutorialNavigationApplyOptions
  ): boolean => {
    const target = input.resolve(destination);
    if (target === undefined) return false;
    const hash = serializeKpTutorialDestinationHash(destination);
    applyKpTutorialNavigationTransaction({
      target,
      destination,
      source: options.source,
      scroll: options.scroll,
      writeHistory: () => {
        view.history.pushState({ kpTutorialDestination: destination }, "", hash);
      },
      restore: () => input.restore(target, destination),
      setActive: () => {
        input.toc.setActiveDestination(destination);
        input.root.dataset["kpTutorialDestinationKind"] = destination.kind;
        input.root.dataset["kpTutorialDestinationId"] = destination.id;
        lastAppliedHash = hash;
      },
      onApplied: () => input.onApplied?.({
        target,
        destination,
        source: options.source
      }),
      moveViewport: () => input.scroll(target, destination)
    });
    return true;
  };

  const restoreLocation = (scroll: boolean): boolean => {
    const destination = parseKpTutorialDestinationHash(view.location.hash);
    if (destination === undefined || view.location.hash === lastAppliedHash) return false;
    return apply(destination, { source: "history", scroll });
  };

  const onNavigate = (event: Event): void => {
    if (!(event instanceof CustomEvent) || event.defaultPrevented) return;
    const detail = event.detail as KpTutorialTocNavigateDetail | undefined;
    if (
      detail === undefined ||
      typeof detail.id !== "string" ||
      !["section", "block", "checkpoint"].includes(detail.kind)
    ) return;
    const destination = Object.freeze({ kind: detail.kind, id: detail.id });
    if (input.resolve(destination) === undefined) return;
    event.preventDefault();
    apply(destination, { source: "push", scroll: true });
  };
  const onHistory = (): void => { restoreLocation(true); };

  return Object.freeze({
    connect: () => {
      if (connected) return;
      connected = true;
      input.root.addEventListener(KP_TUTORIAL_TOC_NAVIGATE_EVENT, onNavigate);
      view.addEventListener("popstate", onHistory);
      view.addEventListener("hashchange", onHistory);
    },
    apply,
    navigate: (destination: KpTutorialTocDestination) =>
      apply(destination, { source: "push", scroll: true }),
    restoreLocation,
    dispose: () => {
      if (!connected) return;
      connected = false;
      input.root.removeEventListener(KP_TUTORIAL_TOC_NAVIGATE_EVENT, onNavigate);
      view.removeEventListener("popstate", onHistory);
      view.removeEventListener("hashchange", onHistory);
    }
  });
}
