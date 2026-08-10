import {
  createKpArticleStageActivationController
} from "../../article/kp-article-stage-activation.ts";
import {
  bindKpReaderSemanticLinks
} from "../../reader/runtime/semantic-focus-bindings.ts";
import {
  createKpReaderSemanticFocusService
} from "../../reader/runtime/semantic-focus.ts";
import {
  kpFractionCompositionArticleRuntimeManifest
} from "./fraction-composition-runtime-manifest.ts";
import {
  decodeKpFractionCompositionArticleLocation,
  encodeKpFractionCompositionArticleCheckpointLocation
} from "./fraction-composition-article-location.ts";
import {
  kpFractionCompositionArticleSemanticReferences,
  resolveKpFractionCompositionArticleSemanticReference
} from "./fraction-composition-semantic-navigation.ts";
import {
  createKpFractionCompositionMotionExemplar
} from "./fraction-composition-motion-exemplar.ts";
import type {
  KpFractionCompositionArticleRuntimeSession
} from "./fraction-composition-runtime-capability.ts";

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
  let runtimeSession: KpFractionCompositionArticleRuntimeSession | undefined;
  let disposed = false;
  let locationRevision = 0;
  let lastRestoredHash: string | undefined;
  const activation = createKpArticleStageActivationController({
    manifests: [kpFractionCompositionArticleRuntimeManifest],
    load: async (manifest) => {
      const capability = await import("./fraction-composition-runtime-capability.ts");
      runtimeSession = await capability.mountKpFractionCompositionArticleRuntime({
        host,
        manifest
      });
      runtimeSession.setSemanticFocus(focus.getSnapshot().objectRefs);
      return runtimeSession;
    },
    onChange: ({ state }) => {
      host.dataset["kpAlgebraStageActivation"] = state;
    }
  });
  const activateNearViewport = (): void => {
    void activation.activateStage("solve", "near-viewport").catch(() => {
      // The complete static projection remains visible when enhancement fails.
    });
  };
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
    observer.disconnect();
    activateNearViewport();
  }, { rootMargin: "50% 0px" });
  observer.observe(host);
  const motionExemplar = createKpFractionCompositionMotionExemplar({
    article,
    activate: () => activation.activateStage("solve", "near-viewport")
  });
  const motionObserver = motionExemplar === undefined
    ? undefined
    : new IntersectionObserver((entries) => {
      if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
      if (decodeKpFractionCompositionArticleLocation(
        ownerWindow.location.hash
      ) !== undefined) return;
      motionObserver?.disconnect();
      void activation.activateStage("solve", "near-viewport").then((ready) => {
        if (!disposed) motionExemplar.prepare(ready);
      }).catch(() => {
        // The settled static endpoint remains the no-enhancement fallback.
      });
    }, { rootMargin: "75% 0px" });
  if (motionExemplar !== undefined) motionObserver?.observe(motionExemplar.root);
  const applyFocus = (): void => {
    const snapshot = focus.getSnapshot();
    article.dataset["kpArticleSemanticFocusSource"] =
      snapshot.activeSource ?? "none";
    const session = runtimeSession;
    if (session !== undefined) {
      session.setSemanticFocus(snapshot.objectRefs);
      return;
    }
    const address = snapshot.objectRefs[0];
    if (address === undefined) return;
    void activation.activateAddress(`#kp-ref:${address}`).then((ready) => {
      if (!disposed) ready?.setSemanticFocus(focus.getSnapshot().objectRefs);
    }).catch(() => {
      // Static semantic anchors remain usable when the stage cannot enhance.
    });
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
      const pinned = link.dataset["kpFocus"] === pinnedAddress;
      link.toggleAttribute("data-kp-article-semantic-pinned", pinned);
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
  };
  const onCheckpointChange = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const path = (event.detail as { readonly path?: unknown }).path;
    if (typeof path === "string") selectCheckpoint(path);
  };
  const restoreLocation = async (hash: string): Promise<void> => {
    if (hash === lastRestoredHash) return;
    lastRestoredHash = hash;
    const revision = ++locationRevision;
    const location = decodeKpFractionCompositionArticleLocation(hash);
    if (location?.kind === "semantic-reference") {
      host.dataset["kpAlgebraLocationKind"] = location.kind;
      focus.set("url", [location.address]);
      await activation.activateAddress(`#kp-ref:${location.address}`);
      return;
    }
    focus.clear("url");
    if (location?.kind !== "checkpoint") {
      delete host.dataset["kpAlgebraLocationKind"];
      return;
    }
    host.dataset["kpAlgebraLocationKind"] = location.kind;
    const session = await activation.activateStage("solve", "direct-address");
    if (disposed || revision !== locationRevision) return;
    session.seekCheckpoint(location.path);
  };
  const onLocationChange = (): void => {
    void restoreLocation(ownerWindow.location.hash).catch(() => {
      // A malformed or unavailable enhancement leaves the static anchor valid.
    });
  };
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
    void activation.activateStage("solve", "direct-address").then((session) => {
      if (disposed) return;
      session.seekCheckpoint(path);
      const href = encodeKpFractionCompositionArticleCheckpointLocation(
        ownerWindow.location.href,
        path
      );
      if (ownerWindow.location.hash !== link.hash) {
        ownerWindow.history.pushState(ownerWindow.history.state, "", href);
      }
      lastRestoredHash = link.hash;
      host.dataset["kpAlgebraLocationKind"] = "checkpoint";
    }).catch(() => {
      // A failed enhancement falls back to the static checkpoint anchor.
      ownerWindow.location.hash = link.hash;
    });
  };
  article.addEventListener("click", onSemanticClick);
  article.addEventListener("click", onCheckpointClick);
  ownerWindow.addEventListener("keydown", onEscape);
  ownerWindow.addEventListener("popstate", onLocationChange);
  ownerWindow.addEventListener("hashchange", onLocationChange);
  host.addEventListener(
    "kp-algebra-article-checkpoint-change",
    onCheckpointChange
  );
  onLocationChange();
  return () => {
    disposed = true;
    locationRevision += 1;
    observer.disconnect();
    motionObserver?.disconnect();
    motionExemplar?.dispose();
    article.removeEventListener("click", onSemanticClick);
    article.removeEventListener("click", onCheckpointClick);
    ownerWindow.removeEventListener("keydown", onEscape);
    ownerWindow.removeEventListener("popstate", onLocationChange);
    ownerWindow.removeEventListener("hashchange", onLocationChange);
    host.removeEventListener(
      "kp-algebra-article-checkpoint-change",
      onCheckpointChange
    );
    semanticBindings.dispose();
    unsubscribeFocus();
    focus.dispose();
    runtimeSession?.dispose();
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
