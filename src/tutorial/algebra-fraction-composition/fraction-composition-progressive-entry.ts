import {
  bindKpReaderSemanticLinks
} from "../../reader/runtime/semantic-focus-bindings.ts";
import {
  createKpReaderSemanticFocusService
} from "../../reader/runtime/semantic-focus.ts";
import {
  mountKpCanonicalEquationStageShell
} from "../../reader/app/canonical-equation-stage-shell.ts";
import {
  createKpChromeFreeCanonicalEquationSession,
  type KpChromeFreeCanonicalEquationSession
} from "../../reader/app/chrome-free-canonical-equation-session.ts";
import {
  bindKpReaderEquationLessonStructuralAnchors
} from "../../reader/app/equation-lesson-descriptor.ts";
import {
  fractionCompositionDescriptor
} from "../../reader/app/equation-lesson-descriptors/fraction-composition.ts";
import {
  resolveKpReaderEquationPresentationProfile
} from "../../reader/document/equation-presentation.ts";
import {
  planKpFractionCompositionLayout
} from "../../reader/runtime/fraction-composition-layout.ts";
import {
  createKpFractionCompositionSalienceReaderCapability
} from "../../reader/app/fraction-composition-salience-adapter.ts";
import {
  decodeKpFractionCompositionArticleLocation,
  encodeKpFractionCompositionArticleCheckpointLocation,
  encodeKpFractionCompositionArticleSemanticLocation
} from "./fraction-composition-article-location.ts";
import {
  createKpFractionCompositionArticleRuntimeCheckpoints,
  createKpFractionCompositionArticleRuntimeRanges
} from "./fraction-composition-runtime-ranges.ts";
import {
  mountKpFractionCompositionArticleTransport,
  type KpFractionCompositionArticleTransport
} from "./fraction-composition-article-transport.ts";
import {
  kpFractionCompositionArticleSemanticReferences,
  projectKpFractionCompositionArticleFocusSnapshot,
  resolveKpFractionCompositionArticleSemanticReference
} from "./fraction-composition-semantic-navigation.ts";
import type {
  KpReaderFocusSnapshot
} from "../../reader/runtime/semantic-focus.ts";
import {
  isKpFractionCompositionAttentionStageRequested,
  mountKpFractionCompositionAttentionStage
} from "./fraction-composition-attention-stage.ts";

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
  const attentionStageRequested =
    isKpFractionCompositionAttentionStageRequested(ownerWindow.location.search);
  const canonicalStage = mountCanonicalRanges({
    ownerWindow,
    article,
    host,
    initialFocus: projectKpFractionCompositionArticleFocusSnapshot(
      focus.getSnapshot()
    ),
    fixedLiveSurface: attentionStageRequested
  });
  const attentionStage = mountKpFractionCompositionAttentionStage({
    ownerWindow,
    publication: article,
    stageHost: host,
    selectCheckpoint: (path) => canonicalStage.seekCheckpoint(path),
    selectRange: (path, direction) =>
      canonicalStage.selectRange(path, direction)
  });
  const semanticLinks = decorateSemanticLinks(article);
  const applyFocus = (): void => {
    article.dataset["kpArticleSemanticFocusSource"] =
      focus.getSnapshot().activeSource ?? "none";
    canonicalStage.setFocus(projectKpFractionCompositionArticleFocusSnapshot(
      focus.getSnapshot()
    ));
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
    event.preventDefault();
    pinnedAddress = pinnedAddress === address ? undefined : address;
    focus.clear("url");
    if (pinnedAddress === undefined) {
      focus.clear("story");
      delete host.dataset["kpAlgebraLocationKind"];
    } else {
      focus.set("story", [pinnedAddress]);
      host.dataset["kpAlgebraLocationKind"] = "semantic-reference";
    }
    const href = encodeKpFractionCompositionArticleSemanticLocation(
      ownerWindow.location.href,
      pinnedAddress
    );
    ownerWindow.history.pushState(ownerWindow.history.state, "", href);
    lastRestoredHash = ownerWindow.location.hash;
    syncPinnedLink();
  };
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || pinnedAddress === undefined) return;
    pinnedAddress = undefined;
    focus.clear("story");
    focus.clear("url");
    ownerWindow.history.pushState(
      ownerWindow.history.state,
      "",
      encodeKpFractionCompositionArticleSemanticLocation(
        ownerWindow.location.href
      )
    );
    lastRestoredHash = ownerWindow.location.hash;
    delete host.dataset["kpAlgebraLocationKind"];
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
    canonicalStage.seekCheckpoint(path);
  };
  let lastRestoredHash: string | undefined;
  const restoreLocation = (hash: string): void => {
    if (hash === lastRestoredHash) return;
    lastRestoredHash = hash;
    const location = decodeKpFractionCompositionArticleLocation(hash);
    if (location?.kind === "semantic-reference") {
      host.dataset["kpAlgebraLocationKind"] = location.kind;
      pinnedAddress = location.address;
      focus.set("url", [location.address]);
      syncPinnedLink();
      return;
    }
    pinnedAddress = undefined;
    focus.clear("story");
    focus.clear("url");
    syncPinnedLink();
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
  applyFocus();
  return () => {
    attentionStage.dispose();
    canonicalStage.dispose();
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

interface KpFractionCompositionCanonicalStageMount {
  seekCheckpoint(path: string): void;
  selectRange(path: string, direction: "forward" | "rewind"): void;
  setFocus(focus: KpReaderFocusSnapshot): void;
  dispose(): void;
}

function mountCanonicalRanges(input: {
  readonly ownerWindow: Window;
  readonly article: HTMLElement;
  readonly host: HTMLElement;
  readonly initialFocus: KpReaderFocusSnapshot;
  readonly fixedLiveSurface: boolean;
}): KpFractionCompositionCanonicalStageMount {
  const template = input.article.querySelector<HTMLTemplateElement>(
    "template[data-kp-reader-exemplar-template]"
  );
  if (template === null) {
    return Object.freeze({
      seekCheckpoint() {},
      selectRange() {},
      setFocus() {},
      dispose() {}
    });
  }
  const profile = resolveKpReaderEquationPresentationProfile("standard");
  const animation = fractionCompositionDescriptor.createAnimation();
  const durationMs = animation.timeline?.durationMs;
  if (durationMs === undefined) {
    throw new Error("Algebra Article requires its canonical full timeline.");
  }
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  const firstRange = ranges[0];
  if (firstRange === undefined || firstRange.path !== "distribute-and-normalize") {
    throw new Error("Algebra Article lacks its canonical first motion range.");
  }
  const fallback = input.host.querySelector<Element>(
    "[data-kp-algebra-stage-fallback]"
  );
  const motionSlots = new Map(
    [...input.article.querySelectorAll<HTMLElement>(
      "[data-kp-algebra-motion-slot]"
    )].map((slot) => [requiredRange(slot), slot] as const)
  );
  if (motionSlots.size !== ranges.length || ranges.some(({ path }) =>
    !motionSlots.has(path)
  )) {
    throw new Error("Algebra Article requires one slot for every motion range.");
  }
  const shell = mountKpCanonicalEquationStageShell({
    target: input.host,
    template,
    bindStructuralAnchors: (root) => {
      bindKpReaderEquationLessonStructuralAnchors({
        root,
        animation,
        descriptor: fractionCompositionDescriptor
      });
    }
  });
  const liveSurface = input.ownerWindow.document.createElement("div");
  liveSurface.dataset["kpAlgebraLiveSurface"] = "";
  liveSurface.dataset["kpAlgebraLiveRange"] = "initial";
  liveSurface.append(shell.stage);
  input.host.querySelector("[data-kp-algebra-checkpoint-navigation]")
    ?.before(liveSurface);
  const salience = createKpFractionCompositionSalienceReaderCapability({
    root: liveSurface,
    href: input.ownerWindow.location.href
  });
  let disposed = false;
  let session: KpChromeFreeCanonicalEquationSession | undefined;
  let transport: KpFractionCompositionArticleTransport | undefined;
  let pendingCheckpointPath: string | undefined;
  let pendingFocus = input.initialFocus;
  const checkpoints = new Map(
    createKpFractionCompositionArticleRuntimeCheckpoints().map(
      (checkpoint) => [checkpoint.path, checkpoint.progress]
    )
  );
  const rangesByTargetCheckpoint = new Map(
    createKpFractionCompositionArticleRuntimeCheckpoints().slice(1).map(
      (checkpoint, index) => [checkpoint.path, ranges[index]!]
    )
  );
  let activeMotionSlot: HTMLElement | undefined;
  const reattachLiveSurface = (rangePath: string | undefined): void => {
    activeMotionSlot?.querySelector<HTMLElement>(
      ":scope > [data-kp-algebra-static-checkpoint]"
    )?.removeAttribute("hidden");
    if (input.fixedLiveSurface) {
      input.host.querySelector("[data-kp-algebra-checkpoint-navigation]")
        ?.before(liveSurface);
      fallback?.toggleAttribute("hidden", true);
      activeMotionSlot = undefined;
    } else if (rangePath === undefined) {
      input.host.querySelector("[data-kp-algebra-checkpoint-navigation]")
        ?.before(liveSurface);
      fallback?.toggleAttribute("hidden", true);
      activeMotionSlot = undefined;
    } else {
      const nextSlot = motionSlots.get(rangePath);
      if (nextSlot === undefined) {
        throw new Error(`Unknown algebra motion slot ${rangePath}.`);
      }
      fallback?.removeAttribute("hidden");
      nextSlot.querySelector<HTMLElement>(
        ":scope > [data-kp-algebra-static-checkpoint]"
      )?.toggleAttribute("hidden", true);
      nextSlot.append(liveSurface);
      activeMotionSlot = nextSlot;
    }
    liveSurface.dataset["kpAlgebraLiveRange"] = rangePath ?? "initial";
    session?.invalidate();
  };
  const selectCheckpoint = (
    mountedTransport: KpFractionCompositionArticleTransport,
    path: string
  ): void => {
    const progress = checkpoints.get(path);
    if (progress === undefined) {
      throw new Error(`Unknown algebra checkpoint ${path}.`);
    }
    const range = rangesByTargetCheckpoint.get(path) ?? firstRange;
    reattachLiveSurface(path === "factored" ? undefined : range.path);
    mountedTransport.selectRange({
      id: range.path,
      start: range.start,
      end: range.end
    }, progress, "url");
  };
  input.host.dataset["kpAlgebraCanonicalHostStatus"] = "mounting";
  void createKpChromeFreeCanonicalEquationSession({
    shell,
    animation,
    descriptor: fractionCompositionDescriptor,
    equationPresentationProfile: profile,
    linkRoot: input.article,
    createStageLayoutIntent: planKpFractionCompositionLayout,
    renderSalience: (frame) => salience.render(frame)
  }).then((mounted) => {
    if (disposed) {
      mounted.dispose();
      shell.stage.remove();
      liveSurface.remove();
      return;
    }
    session = mounted;
    transport = mountKpFractionCompositionArticleTransport({
      ownerWindow: input.ownerWindow,
      host: input.host,
      stage: shell.stage,
      session: mounted,
      range: {
        id: firstRange.path,
        start: firstRange.start,
        end: firstRange.end
      },
      durationMs,
      initialFocus: pendingFocus
    });
    input.host.dataset["kpAlgebraCanonicalHostStatus"] = "active";
    fallback?.toggleAttribute("hidden", true);
    if (pendingCheckpointPath !== undefined) {
      selectCheckpoint(transport, pendingCheckpointPath);
    }
  }).catch((error: unknown) => {
    if (disposed) return;
    input.host.dataset["kpAlgebraCanonicalHostStatus"] = "failed";
    transport?.dispose();
    session?.dispose();
    shell.stage.remove();
    liveSurface.remove();
    fallback?.removeAttribute("hidden");
    for (const slot of motionSlots.values()) {
      slot.querySelector<HTMLElement>(
        ":scope > [data-kp-algebra-static-checkpoint]"
      )?.removeAttribute("hidden");
    }
    console.error("Canonical algebra stage failed to mount.", error);
  });
  return Object.freeze({
    seekCheckpoint(path: string) {
      const progress = checkpoints.get(path);
      if (progress === undefined) {
        throw new Error(`Unknown algebra checkpoint ${path}.`);
      }
      pendingCheckpointPath = path;
      if (transport !== undefined) selectCheckpoint(transport, path);
    },
    selectRange(path: string, direction: "forward" | "rewind") {
      const range = ranges.find((candidate) => candidate.path === path);
      if (range === undefined) {
        throw new Error(`Unknown algebra attention range ${path}.`);
      }
      pendingCheckpointPath = undefined;
      reattachLiveSurface(range.path);
      if (transport === undefined) return;
      const progress = direction === "forward" ? range.start : range.end;
      transport.selectRange({
        id: range.path,
        start: range.start,
        end: range.end
      }, progress, "controls");
      transport.play(direction);
    },
    setFocus(nextFocus: KpReaderFocusSnapshot) {
      pendingFocus = nextFocus;
      transport?.setFocus(nextFocus);
    },
    dispose() {
      disposed = true;
      transport?.dispose();
      session?.dispose();
      shell.stage.remove();
      liveSurface.remove();
      fallback?.removeAttribute("hidden");
      for (const slot of motionSlots.values()) {
        slot.querySelector<HTMLElement>(
          ":scope > [data-kp-algebra-static-checkpoint]"
        )?.removeAttribute("hidden");
      }
      delete input.host.dataset["kpAlgebraCanonicalHostStatus"];
      delete input.host.dataset["kpAlgebraCanonicalGlobalProgress"];
    }
  });
}

function requiredRange(slot: HTMLElement): string {
  const range = slot.dataset["kpAlgebraMotionSlot"];
  if (range === undefined || range.length === 0) {
    throw new Error("Algebra motion slot lacks its canonical range.");
  }
  return range;
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
