import {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT
} from "../kp-tutorial-scrub-bar-events.ts";
import type { KpTutorialScrubBarElement } from "../kp-tutorial-scrub-bar.ts";
import {
  KpTutorialScrollCoordinator,
  projectKpTutorialMotionCorridor,
  projectKpTutorialRebasedCorridor,
  projectKpTutorialScrollFrame,
  type KpTutorialCoordinatedScrollProjection,
  type KpTutorialScrollBlockProjection,
  type KpTutorialScrollFrameProjection
} from "../kp-tutorial-motion.ts";
import type { KpLispLessonMotionController } from "./lisp-function-application-motion-controller.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId,
  type KpLispLessonMotionCorridor
} from "./lisp-function-application-motion-blocks.ts";

export interface KpLispScrollBlockProjection
  extends KpTutorialScrollBlockProjection<KpLispLessonMotionBlockId> {}

export interface KpLispScrollFrameProjection
  extends KpTutorialScrollFrameProjection<KpLispLessonMotionBlockId> {}

export function projectKpLispScrollCorridor(input: {
  readonly corridor: KpLispLessonMotionCorridor;
  readonly anchorTop: number;
  readonly viewportHeight: number;
}): { readonly travel: number; readonly progress: number } {
  return projectKpTutorialMotionCorridor({ ...input, snapTolerance: 0.002 });
}

export function projectKpLispScrollFrame(input: {
  readonly viewportHeight: number;
  readonly blocks: readonly {
    readonly id: KpLispLessonMotionBlockId;
    readonly anchorTop: number;
    readonly corridor: KpLispLessonMotionCorridor;
  }[];
}): KpLispScrollFrameProjection {
  return projectKpTutorialScrollFrame({
    ...input,
    blocks: input.blocks.map((block) => ({ ...block, snapTolerance: 0.002 }))
  });
}

export function projectKpLispRebasedScroll(input: {
  readonly corridor: KpLispLessonMotionCorridor;
  readonly rawTravelAtTakeover: number;
  readonly manualProgress: number;
  readonly rawTravel: number;
}): { readonly travel: number; readonly progress: number } {
  return projectKpTutorialRebasedCorridor(input);
}

export function createKpLispLessonScrollController(input: {
  readonly root: HTMLElement;
  readonly motion: KpLispLessonMotionController;
}): { readonly dispose: () => void } {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Lisp scroll coordination requires a browser view.");
  const controls = Object.fromEntries(kpLispLessonMotionBlocks.map(({ id }) => [
    id,
    required<KpTutorialScrubBarElement>(
      input.root,
      `[data-kp-tutorial-motion-controls="${id}"]`
    )
  ])) as Record<KpLispLessonMotionBlockId, KpTutorialScrubBarElement>;
  const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)");
  let latest: KpLispScrollFrameProjection | undefined;
  let userIntent = false;
  let rebase: {
    readonly blockId: KpLispLessonMotionBlockId;
    readonly rawTravelAtTakeover: number;
    readonly manualProgress: number;
  } | undefined;

  const project = (
    projection: KpTutorialCoordinatedScrollProjection<KpLispLessonMotionBlockId>
  ): void => {
    const scrollChanged = projection.scrollChanged;
    latest = projection;
    input.root.dataset["kpLispTutorialScrollActiveBlock"] =
      projection.activeBlockId ?? "";
    for (const block of projection.blocks) {
      controls[block.id].setReadingBandProjection({
        distance: block.anchorTop - projection.readingBandY,
        proximity: clamp(1 - Math.abs(block.anchorTop - projection.readingBandY) / 96)
      });
    }
    if (reducedMotion.matches) {
      input.root.dataset["kpLispTutorialScrollTimeline"] = "reduced-motion";
      return;
    }
    const active = projection.blocks.find(({ ownsScroll }) => ownsScroll);
    if (
      active === undefined ||
      !scrollChanged ||
      !userIntent
    ) return;

    const snapshot = input.motion.snapshot();
    let localProgress = active.progress;
    if (rebase?.blockId === active.id) {
      localProgress = projectKpLispRebasedScroll({
        corridor: kpLispLessonMotionBlocks.find(({ id }) => id === active.id)!.corridor,
        rawTravelAtTakeover: rebase.rawTravelAtTakeover,
        manualProgress: snapshot.activeBlockId === active.id
          ? snapshot.localProgress
          : rebase.manualProgress,
        rawTravel: active.travel
      }).progress;
    }
    input.motion.projectScroll(active.id, localProgress);
    rebase = undefined;
    userIntent = false;
  };

  const noteIntent = (): void => {
    userIntent = true;
  };
  const captureRebase = (event: Event): void => {
    const blockId = blockFromEvent(event);
    if (blockId === undefined) return;
    const block = latest?.blocks.find(({ id }) => id === blockId);
    const snapshot = input.motion.snapshot();
    rebase = {
      blockId,
      rawTravelAtTakeover: block?.travel ?? 0,
      manualProgress: snapshot.activeBlockId === blockId ? snapshot.localProgress : 0
    };
  };
  const onKeydown = (event: KeyboardEvent): void => {
    if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]
        .includes(event.key)) noteIntent();
      return;
    }
    event.preventDefault();
    const active = input.motion.snapshot().activeBlockId;
    controls[active].dispatchEvent(new CustomEvent(
      event.key === "ArrowLeft"
        ? KP_TUTORIAL_SCRUB_PREVIOUS_EVENT
        : KP_TUTORIAL_SCRUB_NEXT_EVENT,
      { bubbles: true, composed: true }
    ));
  };
  const manualEvents = [
    KP_TUTORIAL_SCRUB_SEEK_EVENT,
    KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
    KP_TUTORIAL_SCRUB_REWIND_EVENT,
    KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
    KP_TUTORIAL_SCRUB_NEXT_EVENT
  ];
  for (const type of manualEvents) input.root.addEventListener(type, captureRebase);
  view.addEventListener("wheel", noteIntent, { passive: true });
  view.addEventListener("touchmove", noteIntent, { passive: true });
  view.addEventListener("keydown", onKeydown);
  const coordinator = new KpTutorialScrollCoordinator(
    view,
    () => kpLispLessonMotionBlocks.map((block) => ({
      id: block.id,
      anchor: controls[block.id],
      corridor: block.corridor,
      snapTolerance: 0.002
    })),
    project
  );
  reducedMotion.addEventListener("change", coordinator.scheduleProjection);
  input.root.dataset["kpLispTutorialScrollCoordinator"] = "connected";
  coordinator.connect();

  return Object.freeze({
    dispose: () => {
      coordinator.disconnect();
      for (const type of manualEvents) input.root.removeEventListener(type, captureRebase);
      view.removeEventListener("wheel", noteIntent);
      view.removeEventListener("touchmove", noteIntent);
      view.removeEventListener("keydown", onKeydown);
      reducedMotion.removeEventListener("change", coordinator.scheduleProjection);
      delete input.root.dataset["kpLispTutorialScrollCoordinator"];
    }
  });
}

function blockFromEvent(event: Event): KpLispLessonMotionBlockId | undefined {
  if (!(event.target instanceof Element)) return undefined;
  const id = event.target.closest<HTMLElement>("[data-kp-tutorial-motion-controls]")
    ?.dataset["kpTutorialMotionControls"];
  return id === "bind-and-reconstruct" || id === "evaluate-and-gather" ? id : undefined;
}

function required<ElementType extends Element>(root: ParentNode, selector: string): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) throw new Error(`Lisp scroll coordination is missing ${selector}.`);
  return element;
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
