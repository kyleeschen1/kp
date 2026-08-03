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
  connectedCallback(): void {
    this.addEventListener("click", this.handleClick);
    this.dataset["kpTutorialTocEnhancement"] = "ready";
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.handleClick);
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
