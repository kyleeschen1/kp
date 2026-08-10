import type {
  KpFractionCompositionArticleRangeSnapshot,
  KpFractionCompositionArticleRuntimeSession
} from "./fraction-composition-runtime-capability.ts";

const exemplar = Object.freeze({
  blockId: "distribute",
  rangePath: "distribute-and-normalize",
  targetCheckpoint: "normalized",
  controlLabel: "Play distribution"
});

export interface KpFractionCompositionMotionExemplar {
  readonly root: HTMLElement;
  readonly prepare: (
    session: KpFractionCompositionArticleRuntimeSession
  ) => void;
  readonly dispose: () => void;
}

/**
 * Binds one authored motion block all the way to its existing named range.
 * The packet reuses the published prose and endpoint figure; it adds no
 * presentation grammar and creates no animation or clock authority.
 */
export function createKpFractionCompositionMotionExemplar(input: {
  readonly article: HTMLElement;
  readonly activate: () => Promise<KpFractionCompositionArticleRuntimeSession>;
}): KpFractionCompositionMotionExemplar | undefined {
  const marker = markerParagraph(input.article, exemplar.blockId);
  const before = marker?.nextElementSibling;
  const targetMarker = markerParagraph(
    input.article,
    `kp-ref:solve/${exemplar.targetCheckpoint}`
  );
  const targetFigure = targetMarker?.nextElementSibling;
  const after = targetFigure?.nextElementSibling;
  const targetFallback = targetFigure?.querySelector<HTMLElement>(
    `[data-kp-algebra-static-checkpoint="${exemplar.targetCheckpoint}"]`
  );
  if (
    marker === null ||
    !(before instanceof HTMLParagraphElement) ||
    targetMarker === null ||
    !(targetFigure instanceof HTMLElement) ||
    targetFigure.tagName !== "FIGURE" ||
    !(after instanceof HTMLParagraphElement) ||
    targetFallback === null ||
    targetFallback === undefined
  ) return undefined;

  const motionFigure = targetFigure;
  const motionFallback = targetFallback;

  const ownerDocument = input.article.ownerDocument;
  const root = ownerDocument.createElement("section");
  root.className = "kp-algebra-article__motion-passage";
  root.dataset["kpAlgebraMotionPassage"] = exemplar.blockId;
  root.dataset["kpAlgebraMotionRun"] = exemplar.rangePath;
  root.dataset["kpAlgebraMotionState"] = "idle";
  marker.before(root);
  before.dataset["kpAlgebraMotionBefore"] = exemplar.blockId;
  after.dataset["kpAlgebraMotionAfter"] = exemplar.blockId;
  motionFigure.classList.add("kp-algebra-article__motion-figure");

  const controls = renderControls(ownerDocument);
  root.append(marker, before, controls.root, targetMarker, motionFigure, after);

  let session: KpFractionCompositionArticleRuntimeSession | undefined;
  let unsubscribeRange: (() => void) | undefined;
  let disposed = false;

  const attach = (
    ready: KpFractionCompositionArticleRuntimeSession,
    seekStart: boolean
  ): void => {
    session = ready;
    // Once the live stage is ready, it replaces this endpoint's complete
    // static figure (equation and caption), rather than visually duplicating it.
    motionFigure.dataset["kpAlgebraMotionLive"] = "true";
    ready.attachTo({ target: motionFigure, fallback: motionFallback });
    controls.button.disabled = false;
    controls.scrubber.disabled = false;
    unsubscribeRange?.();
    unsubscribeRange = ready.subscribeRange(syncControls);
    if (seekStart) ready.seekRange(exemplar.rangePath, 0);
  };

  const ensureAttached = async (seekStart: boolean): Promise<
    KpFractionCompositionArticleRuntimeSession | undefined
  > => {
    const ready = session ?? await input.activate();
    if (disposed) return undefined;
    attach(ready, seekStart);
    return ready;
  };

  const onToggle = (): void => {
    void ensureAttached(false).then((ready) => {
      if (ready === undefined) return;
      const state = root.dataset["kpAlgebraMotionState"];
      if (state === "playing") ready.pauseRange(exemplar.rangePath);
      else ready.playRange(exemplar.rangePath);
    }).catch(() => {
      controls.button.disabled = true;
      controls.scrubber.disabled = true;
    });
  };
  const onScrub = (): void => {
    void ensureAttached(false).then((ready) => {
      ready?.seekRange(exemplar.rangePath, Number(controls.scrubber.value));
    }).catch(() => {
      controls.scrubber.disabled = true;
    });
  };
  controls.button.addEventListener("click", onToggle);
  controls.scrubber.addEventListener("input", onScrub);

  const syncControls = (
    snapshot: KpFractionCompositionArticleRangeSnapshot
  ): void => {
    if (snapshot.path !== undefined && snapshot.path !== exemplar.rangePath) {
      return;
    }
    const percent = Math.round(snapshot.progress * 100);
    controls.scrubber.value = snapshot.progress.toFixed(4);
    controls.output.value = `${percent}%`;
    root.dataset["kpAlgebraMotionState"] = snapshot.status;
    controls.button.textContent = snapshot.status === "playing"
      ? "Pause distribution"
      : snapshot.status === "settled"
        ? "Replay distribution"
        : snapshot.progress > 0
          ? "Resume distribution"
          : exemplar.controlLabel;
    controls.button.setAttribute(
      "aria-label",
      controls.button.textContent
    );
  };

  return Object.freeze({
    root,
    prepare(ready: KpFractionCompositionArticleRuntimeSession) {
      attach(ready, true);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribeRange?.();
      controls.button.removeEventListener("click", onToggle);
      controls.scrubber.removeEventListener("input", onScrub);
      delete motionFigure.dataset["kpAlgebraMotionLive"];
    }
  });
}

function markerParagraph(
  root: HTMLElement,
  id: string
): HTMLParagraphElement | null {
  const anchor = root.querySelector<HTMLElement>(
    `[id="${CSS.escape(id)}"]`
  );
  return anchor?.closest("p") ?? null;
}

function renderControls(ownerDocument: Document): Readonly<{
  root: HTMLDivElement;
  button: HTMLButtonElement;
  scrubber: HTMLInputElement;
  output: HTMLOutputElement;
}> {
  const root = ownerDocument.createElement("div");
  root.className = "kp-algebra-article__motion-controls";
  root.dataset["kpAlgebraMotionControls"] = exemplar.blockId;

  const button = ownerDocument.createElement("button");
  button.type = "button";
  button.disabled = true;
  button.textContent = exemplar.controlLabel;
  button.setAttribute("aria-label", exemplar.controlLabel);

  const label = ownerDocument.createElement("label");
  label.className = "kp-algebra-article__motion-scrubber";
  const labelText = ownerDocument.createElement("span");
  labelText.className = "kp-algebra-article__visually-hidden";
  labelText.textContent = "Distribution animation progress";
  const scrubber = ownerDocument.createElement("input");
  scrubber.type = "range";
  scrubber.min = "0";
  scrubber.max = "1";
  scrubber.step = "0.001";
  scrubber.value = "0";
  scrubber.disabled = true;
  const output = ownerDocument.createElement("output");
  output.value = "0%";
  label.append(labelText, scrubber, output);
  root.append(button, label);
  return Object.freeze({ root, button, scrubber, output });
}
