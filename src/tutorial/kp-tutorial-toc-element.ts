import type {
  KpTutorialTocDestination,
  KpTutorialTocDestinationKind
} from "./kp-tutorial-toc.ts";

export const KP_TUTORIAL_TOC_TAG = "kp-tutorial-toc";
export const KP_TUTORIAL_TOC_NAVIGATE_EVENT = "kp:tutorial-toc-navigate";

export interface KpTutorialTocNavigateDetail extends KpTutorialTocDestination {
  readonly href: string;
}

/**
 * Enhances complete semantic light DOM. The element owns active-link
 * presentation and navigation intent only; the host retains lesson state,
 * history, scrolling, and animation authority.
 */
export class KpTutorialTocElement extends HTMLElement {
  private activeObserver: IntersectionObserver | undefined;
  private activeProjectionFrame: number | undefined;
  private disclosureMedia: MediaQueryList | undefined;
  private outlineTargets: readonly {
    readonly destination: KpTutorialTocDestination;
    readonly element: HTMLElement;
  }[] = [];

  connectedCallback(): void {
    this.addEventListener("click", this.handleClick);
    const view = this.ownerDocument.defaultView;
    this.disclosureMedia = view?.matchMedia("(max-width: 760px)");
    this.disclosureMedia?.addEventListener("change", this.syncDisclosure);
    this.syncDisclosure();
    this.dataset["kpTutorialTocEnhancement"] = "ready";
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.handleClick);
    this.disclosureMedia?.removeEventListener("change", this.syncDisclosure);
    this.disclosureMedia = undefined;
    this.stopObservingReadingOutline();
  }

  setActiveDestination(destination: KpTutorialTocDestination): void {
    const links = this.querySelectorAll<HTMLAnchorElement>(
      "[data-kp-tutorial-toc-link]"
    );
    for (const link of links) {
      const active =
        link.dataset["kpTutorialDestinationKind"] === destination.kind &&
        link.dataset["kpTutorialDestinationId"] === destination.id;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    this.dataset["kpTutorialTocActiveKind"] = destination.kind;
    this.dataset["kpTutorialTocActiveId"] = destination.id;
  }

  observeReadingOutline(): void {
    if (this.activeObserver !== undefined) return;
    this.connectActiveOutline();
  }

  stopObservingReadingOutline(): void {
    this.activeObserver?.disconnect();
    this.activeObserver = undefined;
    const view = this.ownerDocument.defaultView;
    if (view !== null && this.activeProjectionFrame !== undefined) {
      view.cancelAnimationFrame(this.activeProjectionFrame);
    }
    this.activeProjectionFrame = undefined;
    this.outlineTargets = [];
  }

  private readonly handleClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>(
      "a[data-kp-tutorial-toc-link]"
    );
    if (link === null || !this.contains(link)) return;
    const kind = link.dataset["kpTutorialDestinationKind"];
    const id = link.dataset["kpTutorialDestinationId"];
    if (!isDestinationKind(kind) || id === undefined) return;
    const proceed = this.dispatchEvent(new CustomEvent<KpTutorialTocNavigateDetail>(
      KP_TUTORIAL_TOC_NAVIGATE_EVENT,
      {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { kind, id, href: link.href }
      }
    ));
    if (!proceed) event.preventDefault();
  };

  private readonly syncDisclosure = (): void => {
    const disclosure = this.querySelector<HTMLDetailsElement>(
      "[data-kp-tutorial-toc-disclosure]"
    );
    if (disclosure === null || this.disclosureMedia === undefined) return;
    // Published markup starts open and fully useful without JavaScript. The
    // enhancement changes only native details state at the compact breakpoint.
    disclosure.open = !this.disclosureMedia.matches;
  };

  private connectActiveOutline(): void {
    const view = this.ownerDocument.defaultView;
    if (view === null || view.IntersectionObserver === undefined) return;
    this.outlineTargets = [...this.querySelectorAll<HTMLAnchorElement>(
      "a[data-kp-tutorial-toc-link]"
    )].flatMap((link) => {
      const kind = link.dataset["kpTutorialDestinationKind"];
      const id = link.dataset["kpTutorialDestinationId"];
      if ((kind !== "section" && kind !== "block") || id === undefined) {
        return [];
      }
      const hash = new URL(link.href, this.ownerDocument.baseURI).hash;
      if (hash.length <= 1) return [];
      const element = this.ownerDocument.getElementById(
        decodeURIComponent(hash.slice(1))
      );
      return element === null
        ? []
        : [{ destination: { kind, id }, element }];
    });
    if (this.outlineTargets.length === 0) return;
    this.activeObserver = new view.IntersectionObserver(
      () => this.scheduleActiveProjection(),
      {
        // A narrow reading band triggers sparse updates while the projection
        // itself remains local-object based and independent of passage height.
        rootMargin: "-34% 0px -65% 0px",
        threshold: 0
      }
    );
    for (const { element } of this.outlineTargets) {
      this.activeObserver.observe(element);
    }
    this.scheduleActiveProjection();
  }

  private scheduleActiveProjection(): void {
    const view = this.ownerDocument.defaultView;
    if (view === null || this.activeProjectionFrame !== undefined) return;
    this.activeProjectionFrame = view.requestAnimationFrame(() => {
      this.activeProjectionFrame = undefined;
      const readingAnchor = view.innerHeight * 0.35;
      const ordered = this.outlineTargets.map((target) => ({
        ...target,
        top: target.element.getBoundingClientRect().top
      })).sort((left, right) => left.top - right.top);
      const passed = ordered.filter(({ top }) => top <= readingAnchor + 1);
      const active = passed.at(-1) ?? ordered[0];
      if (active !== undefined) this.setActiveDestination(active.destination);
    });
  }
}

export function defineKpTutorialToc(
  registry: CustomElementRegistry = customElements
): void {
  if (registry.get(KP_TUTORIAL_TOC_TAG) === undefined) {
    registry.define(KP_TUTORIAL_TOC_TAG, KpTutorialTocElement);
  }
}

function isDestinationKind(
  value: string | undefined
): value is KpTutorialTocDestinationKind {
  return value === "section" || value === "block" || value === "checkpoint";
}
