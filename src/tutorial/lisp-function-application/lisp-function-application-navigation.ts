import { parseKpTutorialDestinationHash } from "../kp-tutorial-url.ts";
import type { KpTutorialTocElement } from "../kp-tutorial-toc-element.ts";
import type { KpTutorialTocDestination } from "../kp-tutorial-toc.ts";
import { createKpTutorialNavigationController } from "../kp-tutorial-navigation.ts";
import type { KpLispFunctionApplicationLesson } from "./lisp-function-application-lesson-compiler.ts";
import type { KpLispLessonMotionController } from "./lisp-function-application-motion-controller.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";

export interface KpLispLessonNavigationTarget {
  readonly destination: KpTutorialTocDestination;
  readonly blockId: KpLispLessonMotionBlockId;
  readonly localProgress: number;
  readonly elementId: string;
}

export interface KpLispLessonNavigationController {
  readonly setReadingDestination: (
    destination: KpTutorialTocDestination
  ) => boolean;
  readonly dispose: () => void;
}

export function resolveKpLispLessonNavigationTarget(input: {
  readonly lesson: KpLispFunctionApplicationLesson;
  readonly destination: KpTutorialTocDestination;
}): KpLispLessonNavigationTarget | undefined {
  const { destination } = input;
  if (destination.kind === "section") {
    if (!input.lesson.sections.some(({ id }) => id === destination.id)) return undefined;
    const state = sectionState(destination.id);
    return state === undefined ? undefined : target(destination, state, `kp-section-${destination.id}`);
  }
  if (destination.kind === "block") {
    const block = kpLispLessonMotionBlocks.find(({ id }) => id === destination.id);
    return block === undefined
      ? undefined
      : target(destination, { blockId: block.id, localProgress: 0 }, `kp-block-${block.id}`);
  }
  for (const block of kpLispLessonMotionBlocks) {
    const checkpoint = block.checkpoints.find(({ id }) => id === destination.id);
    if (checkpoint !== undefined) {
      return target(
        destination,
        { blockId: block.id, localProgress: checkpoint.progress },
        `kp-checkpoint-${checkpoint.id}`
      );
    }
  }
  return undefined;
}

export function createKpLispLessonNavigationController(input: {
  readonly root: HTMLElement;
  readonly lesson: KpLispFunctionApplicationLesson;
  readonly motion: KpLispLessonMotionController;
}): KpLispLessonNavigationController {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Lisp navigation requires a browser view.");
  const toc = required<KpTutorialTocElement>(input.root, "kp-tutorial-toc");
  const controller = createKpTutorialNavigationController({
    root: input.root,
    toc,
    resolve: (destination) => resolveKpLispLessonNavigationTarget({
      lesson: input.lesson,
      destination
    }),
    restore: (resolved) => {
      input.motion.restore(resolved.blockId, resolved.localProgress);
    },
    scroll: (resolved, destination) => {
      const element = input.root.ownerDocument.getElementById(
        resolved.elementId
      );
      if (element === null) return;
      const bounds = element.getBoundingClientRect();
      const targetTop = destination.kind === "section"
        ? bounds.top
        : bounds.top - (view.innerHeight - bounds.height) / 2;
      // Direct scrollTop assignment keeps semantic jumps atomic even when the
      // publication's reading stylesheet opts into smooth ordinary scrolling.
      const scroller = input.root.ownerDocument.scrollingElement;
      if (scroller === null) return;
      const documentElement = input.root.ownerDocument.documentElement;
      const previousScrollBehavior = documentElement.style.scrollBehavior;
      documentElement.style.scrollBehavior = "auto";
      scroller.scrollTop = Math.max(0, scroller.scrollTop + targetTop);
      documentElement.style.scrollBehavior = previousScrollBehavior;
    },
    onApplied: ({ destination }) => {
      input.root.dataset["kpLispTutorialDestinationKind"] = destination.kind;
      input.root.dataset["kpLispTutorialDestinationId"] = destination.id;
    }
  });
  controller.connect();
  const initial = parseKpTutorialDestinationHash(view.location.hash);
  if (initial === undefined || !controller.apply(initial, {
    source: "initial",
    scroll: true
  })) {
    controller.apply(
      { kind: "section", id: input.lesson.sections[0]!.id },
      { source: "initial", scroll: false }
    );
  }

  return Object.freeze({
    // Reading projection only moves the visible TOC cursor. URL changes and
    // semantic restoration remain atomic navigation transactions above.
    setReadingDestination: (destination: KpTutorialTocDestination): boolean => {
      if (resolveKpLispLessonNavigationTarget({
        lesson: input.lesson,
        destination
      }) === undefined) return false;
      toc.setActiveDestination(destination);
      input.root.dataset["kpLispTutorialReadingDestinationKind"] =
        destination.kind;
      input.root.dataset["kpLispTutorialReadingDestinationId"] = destination.id;
      return true;
    },
    dispose: controller.dispose
  });
}

function sectionState(id: string): {
  readonly blockId: KpLispLessonMotionBlockId;
  readonly localProgress: number;
} | undefined {
  switch (id) {
    case "read-application":
    case "bind-argument": return { blockId: "bind-and-reconstruct", localProgress: 0 };
    case "evaluate-form": return { blockId: "evaluate-and-gather", localProgress: 0 };
    case "metaphor-scope": return { blockId: "evaluate-and-gather", localProgress: 1 };
    default: return undefined;
  }
}

function target(
  destination: KpTutorialTocDestination,
  state: { readonly blockId: KpLispLessonMotionBlockId; readonly localProgress: number },
  elementId: string
): KpLispLessonNavigationTarget {
  return Object.freeze({ destination, ...state, elementId });
}

function required<ElementType extends Element>(root: ParentNode, selector: string): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) throw new Error(`Lisp navigation is missing ${selector}.`);
  return element;
}
