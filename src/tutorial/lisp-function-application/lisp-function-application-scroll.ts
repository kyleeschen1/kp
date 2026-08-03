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
  projectKpTutorialRebasedCorridor,
  type KpTutorialCoordinatedScrollProjection,
  type KpTutorialScrollFrameProjection
} from "../kp-tutorial-motion.ts";
import type { KpLispLessonMotionController } from "./lisp-function-application-motion-controller.ts";
import type { KpLispLessonNavigationController } from "./lisp-function-application-navigation.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";

export function createKpLispLessonScrollController(input: {
  readonly root: HTMLElement;
  readonly motion: KpLispLessonMotionController;
  readonly navigation: KpLispLessonNavigationController;
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
  const passages = Array.from(input.root.querySelectorAll<HTMLElement>(
    "[data-kp-lisp-tutorial-passage]"
  ));
  const readingMarker = required<HTMLElement>(
    input.root,
    "[data-kp-lisp-tutorial-reading-band]"
  );
  let latest:
    KpTutorialScrollFrameProjection<KpLispLessonMotionBlockId> | undefined;
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
    const active = projection.blocks.find(({ ownsScroll }) => ownsScroll);
    if (reducedMotion.matches) {
      input.root.dataset["kpLispTutorialScrollTimeline"] = "reduced-motion";
    } else if (active !== undefined && scrollChanged && userIntent) {
      const snapshot = input.motion.snapshot();
      let localProgress = active.progress;
      if (rebase?.blockId === active.id) {
        localProgress = projectKpTutorialRebasedCorridor({
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
    }
    projectReadingState(projection);
  };

  const projectReadingState = (
    projection: KpTutorialCoordinatedScrollProjection<KpLispLessonMotionBlockId>
  ): void => {
    const travelling = projection.blocks.find(({ ownsScroll, travel }) =>
      ownsScroll && travel > 0 && travel < 1
    );
    const nearby = projection.blocks.find(({ ownsScroll, distanceFromReadingBand }) =>
      ownsScroll && distanceFromReadingBand <= 128
    );
    const motionBlock = travelling ?? nearby;
    const motionElement = motionBlock === undefined
      ? undefined
      : controls[motionBlock.id].closest<HTMLElement>(
        "[data-kp-tutorial-motion-block]"
      ) ?? undefined;
    const introductionId = motionElement?.dataset["kpTutorialMotionIntroduction"];
    const motionPassage = introductionId === undefined
      ? undefined
      : passages.find(({ dataset }) =>
        dataset["kpLispTutorialPassage"] === introductionId
      );
    const activePassage = motionPassage ?? [...passages].sort((left, right) =>
      Math.abs(left.getBoundingClientRect().top - projection.readingBandY) -
      Math.abs(right.getBoundingClientRect().top - projection.readingBandY)
    )[0];
    if (activePassage === undefined) return;

    for (const passage of passages) {
      passage.dataset["kpLispReadingActive"] = String(passage === activePassage);
    }
    const passageId = activePassage.dataset["kpLispTutorialPassage"] ?? "";
    input.root.dataset["kpLispTutorialReadingPassage"] = passageId;
    const passageBounds = activePassage.getBoundingClientRect();
    readingMarker.style.setProperty(
      "--kp-lisp-reading-pointer-left",
      `${Math.max(0, passageBounds.left - 22)}px`
    );
    readingMarker.dataset["kpReadingBandState"] =
      Math.abs(passageBounds.top - projection.readingBandY) <= 12
        ? "crossing"
        : "tracking";

    if (motionBlock !== undefined) {
      const snapshot = input.motion.snapshot();
      const definition = kpLispLessonMotionBlocks.find(
        ({ id }) => id === motionBlock.id
      )!;
      const localProgress = snapshot.activeBlockId === motionBlock.id
        ? snapshot.localProgress
        : motionBlock.progress;
      const checkpoint = [...definition.checkpoints].sort((left, right) =>
        Math.abs(left.progress - localProgress) -
        Math.abs(right.progress - localProgress)
      )[0]!;
      input.navigation.setReadingDestination({
        kind: "checkpoint",
        id: checkpoint.id
      });
      return;
    }
    const sectionId = activePassage.closest<HTMLElement>(
      '[data-kp-tutorial-destination="section"]'
    )?.dataset["kpTutorialDestinationId"];
    if (sectionId !== undefined) {
      input.navigation.setReadingDestination({ kind: "section", id: sectionId });
    }
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
  const coordinator = new KpTutorialScrollCoordinator<KpLispLessonMotionBlockId>(
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
