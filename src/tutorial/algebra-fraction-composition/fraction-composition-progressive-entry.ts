import {
  bindKpReaderSemanticLinks
} from "../../reader/runtime/semantic-focus-bindings.ts";
import {
  createKpReaderSemanticFocusService
} from "../../reader/runtime/semantic-focus.ts";
import {
  decodeKpFractionCompositionArticleLocation,
  encodeKpFractionCompositionArticleCheckpointLocation
} from "./fraction-composition-article-location.ts";
import {
  kpFractionCompositionArticleSemanticReferences,
  resolveKpFractionCompositionArticleSemanticReference
} from "./fraction-composition-semantic-navigation.ts";

/**
 * This enhancement intentionally preserves the static publication while the
 * certified reader host is extracted. A missing animation is honest and
 * accessible; substituting the generic editor player was not.
 */
export function mountKpFractionCompositionArticleEnhancement(
  ownerWindow: Window = window
): () => void {
  const host = ownerWindow.document.querySelector<HTMLElement>(
    "[data-kp-algebra-stage-host]"
  );
  if (host === null) return () => undefined;
  const article = ownerWindow.document.querySelector<HTMLElement>(
    "[data-kp-algebra-fraction-composition-publication]"
  ) ?? ownerWindow.document.body;
  const focus = createKpReaderSemanticFocusService(
    kpFractionCompositionArticleSemanticReferences.map(({ address }) => address)
  );
  const semanticLinks = decorateSemanticLinks(article);
  const applyFocus = (): void => {
    article.dataset["kpArticleSemanticFocusSource"] =
      focus.getSnapshot().activeSource ?? "none";
  };
  const unsubscribeFocus = focus.subscribe(applyFocus);
  const semanticBindings = bindKpReaderSemanticLinks({
    root: article,
    selector: "[data-kp-article-semantic-link]",
    setFocus: (source, refs) => focus.set(source, refs),
    clearFocus: (source) => focus.clear(source)
  });
  let pinnedAddress: string | undefined;
  const syncPinnedLink = (): void => {
    for (const link of semanticLinks) {
      link.toggleAttribute(
        "data-kp-article-semantic-pinned",
        link.dataset["kpFocus"] === pinnedAddress
      );
    }
  };
  const onSemanticClick = (event: MouseEvent): void => {
    if (!plainActivation(event)) return;
    const link = semanticLinkOwner(event.target, article);
    const address = link?.dataset["kpFocus"];
    if (address === undefined) return;
    pinnedAddress = pinnedAddress === address ? undefined : address;
    if (pinnedAddress === undefined) focus.clear("story");
    else focus.set("story", [pinnedAddress]);
    syncPinnedLink();
  };
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || pinnedAddress === undefined) return;
    pinnedAddress = undefined;
    focus.clear("story");
    syncPinnedLink();
  };
  const checkpointLinks = [...article.querySelectorAll<HTMLAnchorElement>(
    "[data-kp-algebra-checkpoint-link]"
  )];
  const selectCheckpoint = (path: string): void => {
    for (const link of checkpointLinks) {
      if (link.dataset["kpAlgebraCheckpointLink"] === path) {
        link.setAttribute("aria-current", "step");
      } else {
        link.removeAttribute("aria-current");
      }
    }
    host.dataset["kpAlgebraStaticCheckpoint"] = path;
  };
  let lastRestoredHash: string | undefined;
  const restoreLocation = (hash: string): void => {
    if (hash === lastRestoredHash) return;
    lastRestoredHash = hash;
    const location = decodeKpFractionCompositionArticleLocation(hash);
    if (location?.kind === "semantic-reference") {
      host.dataset["kpAlgebraLocationKind"] = location.kind;
      focus.set("url", [location.address]);
      return;
    }
    focus.clear("url");
    if (location?.kind !== "checkpoint") {
      delete host.dataset["kpAlgebraLocationKind"];
      return;
    }
    host.dataset["kpAlgebraLocationKind"] = location.kind;
    selectCheckpoint(location.path);
  };
  const onLocationChange = (): void => restoreLocation(ownerWindow.location.hash);
  const onCheckpointClick = (event: MouseEvent): void => {
    if (!plainActivation(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>(
      "[data-kp-algebra-checkpoint-link]"
    );
    if (link === null || !article.contains(link)) return;
    const path = link.dataset["kpAlgebraCheckpointLink"];
    if (path === undefined) return;
    event.preventDefault();
    const href = encodeKpFractionCompositionArticleCheckpointLocation(
      ownerWindow.location.href,
      path
    );
    if (ownerWindow.location.hash !== link.hash) {
      ownerWindow.history.pushState(ownerWindow.history.state, "", href);
    }
    lastRestoredHash = link.hash;
    host.dataset["kpAlgebraLocationKind"] = "checkpoint";
    selectCheckpoint(path);
  };
  article.addEventListener("click", onSemanticClick);
  article.addEventListener("click", onCheckpointClick);
  ownerWindow.addEventListener("keydown", onEscape);
  ownerWindow.addEventListener("popstate", onLocationChange);
  ownerWindow.addEventListener("hashchange", onLocationChange);
  onLocationChange();
  return () => {
    article.removeEventListener("click", onSemanticClick);
    article.removeEventListener("click", onCheckpointClick);
    ownerWindow.removeEventListener("keydown", onEscape);
    ownerWindow.removeEventListener("popstate", onLocationChange);
    ownerWindow.removeEventListener("hashchange", onLocationChange);
    semanticBindings.dispose();
    unsubscribeFocus();
    focus.dispose();
  };
}

function decorateSemanticLinks(root: HTMLElement): readonly HTMLAnchorElement[] {
  return [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#kp-ref:"]')]
    .filter((link) => {
      const address = link.getAttribute("href")?.slice("#kp-ref:".length);
      const reference = address === undefined
        ? undefined
        : resolveKpFractionCompositionArticleSemanticReference(address);
      if (reference === undefined) return false;
      link.dataset["kpArticleSemanticLink"] = "";
      link.dataset["kpFocus"] = reference.address;
      return true;
    });
}

function semanticLinkOwner(
  target: EventTarget | null,
  root: HTMLElement
): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLAnchorElement>(
    "[data-kp-article-semantic-link]"
  );
  return link !== null && root.contains(link) ? link : null;
}

function plainActivation(event: MouseEvent): boolean {
  return event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.altKey
    && !event.shiftKey;
}
