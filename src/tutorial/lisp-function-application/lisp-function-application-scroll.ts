import {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT
} from "../kp-tutorial-scrub-bar-events.ts";
import type { KpTutorialScrubBarElement } from "../kp-tutorial-scrub-bar.ts";
import type { KpLispLessonMotionController } from "./lisp-function-application-motion-controller.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId,
  type KpLispLessonMotionCorridor
} from "./lisp-function-application-motion-blocks.ts";

export interface KpLispScrollBlockProjection {
  readonly id: KpLispLessonMotionBlockId;
  readonly anchorTop: number;
  readonly travel: number;
  readonly progress: number;
  readonly ownsScroll: boolean;
}

export interface KpLispScrollFrameProjection {
  readonly activeBlockId: KpLispLessonMotionBlockId | undefined;
  readonly readingBandY: number;
  readonly blocks: readonly KpLispScrollBlockProjection[];
}

export function projectKpLispScrollCorridor(input: {
  readonly corridor: KpLispLessonMotionCorridor;
  readonly anchorTop: number;
  readonly viewportHeight: number;
}): { readonly travel: number; readonly progress: number } {
  const height = finitePositive(input.viewportHeight);
  const start = input.corridor.startViewportRatio * height;
  const end = input.corridor.endViewportRatio * height;
  const rawTravel = start > end && Number.isFinite(input.anchorTop)
    ? clamp((start - input.anchorTop) / (start - end))
    : 0;
  const travel = snapTravel(input.corridor, rawTravel);
  return Object.freeze({
    travel,
    progress: projectKpLispCorridorProgress(input.corridor, travel)
  });
}

function snapTravel(
  corridor: KpLispLessonMotionCorridor,
  travel: number
): number {
  const nearest = [...corridor.keyframes].sort((left, right) =>
    Math.abs(left.travel - travel) - Math.abs(right.travel - travel)
  )[0];
  return nearest !== undefined && Math.abs(nearest.travel - travel) <= 0.002
    ? nearest.travel
    : travel;
}

export function projectKpLispScrollFrame(input: {
  readonly viewportHeight: number;
  readonly blocks: readonly {
    readonly id: KpLispLessonMotionBlockId;
    readonly anchorTop: number;
    readonly corridor: KpLispLessonMotionCorridor;
  }[];
}): KpLispScrollFrameProjection {
  const height = finitePositive(input.viewportHeight);
  const readingBandY = height * 0.38;
  const candidates = input.blocks.map((block) => ({
    ...block,
    ...projectKpLispScrollCorridor({
      corridor: block.corridor,
      anchorTop: block.anchorTop,
      viewportHeight: height
    }),
    distance: Math.abs(block.anchorTop - readingBandY)
  }));
  const travelling = candidates.filter(({ travel }) => travel > 0 && travel < 1);
  const owner = [...(travelling.length > 0 ? travelling : candidates)]
    .sort((left, right) => left.distance - right.distance)[0];
  return Object.freeze({
    activeBlockId: owner?.id,
    readingBandY,
    blocks: Object.freeze(candidates.map((candidate) => Object.freeze({
      id: candidate.id,
      anchorTop: candidate.anchorTop,
      travel: candidate.travel,
      progress: candidate.progress,
      ownsScroll: candidate.id === owner?.id
    })))
  });
}

export function projectKpLispRebasedScroll(input: {
  readonly corridor: KpLispLessonMotionCorridor;
  readonly rawTravelAtTakeover: number;
  readonly manualProgress: number;
  readonly rawTravel: number;
}): { readonly travel: number; readonly progress: number } {
  const manualTravel = resolveTravelForProgress(
    input.corridor,
    input.manualProgress,
    input.rawTravelAtTakeover
  );
  const travel = clamp(manualTravel + input.rawTravel - input.rawTravelAtTakeover);
  return Object.freeze({
    travel,
    progress: projectKpLispCorridorProgress(input.corridor, travel)
  });
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
  let frame: number | undefined;
  let previousScrollY = view.scrollY;
  let latest: KpLispScrollFrameProjection | undefined;
  let userIntent = false;
  let rebase: {
    readonly blockId: KpLispLessonMotionBlockId;
    readonly rawTravelAtTakeover: number;
    readonly manualProgress: number;
  } | undefined;

  const project = (): void => {
    frame = undefined;
    const projection = projectKpLispScrollFrame({
      viewportHeight: view.innerHeight,
      blocks: kpLispLessonMotionBlocks.map((block) => ({
        id: block.id,
        corridor: block.corridor,
        anchorTop: controls[block.id].getBoundingClientRect().top
      }))
    });
    const scrollChanged = Math.abs(view.scrollY - previousScrollY) > 0.01;
    previousScrollY = view.scrollY;
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

  const schedule = (): void => {
    if (frame !== undefined) return;
    frame = view.requestAnimationFrame(project);
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
  view.addEventListener("scroll", schedule, { passive: true });
  view.addEventListener("resize", schedule);
  view.addEventListener("wheel", noteIntent, { passive: true });
  view.addEventListener("touchmove", noteIntent, { passive: true });
  view.addEventListener("keydown", onKeydown);
  reducedMotion.addEventListener("change", schedule);
  input.root.dataset["kpLispTutorialScrollCoordinator"] = "connected";
  schedule();

  return Object.freeze({
    dispose: () => {
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      for (const type of manualEvents) input.root.removeEventListener(type, captureRebase);
      view.removeEventListener("scroll", schedule);
      view.removeEventListener("resize", schedule);
      view.removeEventListener("wheel", noteIntent);
      view.removeEventListener("touchmove", noteIntent);
      view.removeEventListener("keydown", onKeydown);
      reducedMotion.removeEventListener("change", schedule);
      delete input.root.dataset["kpLispTutorialScrollCoordinator"];
    }
  });
}

function projectKpLispCorridorProgress(
  corridor: KpLispLessonMotionCorridor,
  travel: number
): number {
  const keyframes = corridor.keyframes;
  if (keyframes.length < 2) throw new Error("Lisp scroll corridor needs two keyframes.");
  if (travel <= keyframes[0]!.travel) return keyframes[0]!.progress;
  for (let index = 1; index < keyframes.length; index += 1) {
    const before = keyframes[index - 1]!;
    const after = keyframes[index]!;
    if (travel > after.travel) continue;
    const span = after.travel - before.travel;
    if (span <= 0) throw new Error("Lisp corridor travel must increase strictly.");
    const position = (travel - before.travel) / span;
    return before.progress + (after.progress - before.progress) * position;
  }
  return keyframes.at(-1)!.progress;
}

function resolveTravelForProgress(
  corridor: KpLispLessonMotionCorridor,
  progressValue: number,
  preferredTravelValue: number
): number {
  const progress = clamp(progressValue);
  const preferred = clamp(preferredTravelValue);
  const candidates: number[] = [];
  for (let index = 1; index < corridor.keyframes.length; index += 1) {
    const before = corridor.keyframes[index - 1]!;
    const after = corridor.keyframes[index]!;
    const span = after.progress - before.progress;
    if (Math.abs(span) <= Number.EPSILON) {
      if (Math.abs(progress - before.progress) <= Number.EPSILON) {
        candidates.push(Math.max(before.travel, Math.min(after.travel, preferred)));
      }
    } else {
      const position = (progress - before.progress) / span;
      if (position >= 0 && position <= 1) {
        candidates.push(before.travel + (after.travel - before.travel) * position);
      }
    }
  }
  return candidates.sort((left, right) =>
    Math.abs(left - preferred) - Math.abs(right - preferred)
  )[0] ?? (progress <= corridor.keyframes[0]!.progress ? 0 : 1);
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

function finitePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
