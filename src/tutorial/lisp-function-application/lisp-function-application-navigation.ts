import {
  parseKpTutorialDestinationHash,
  serializeKpTutorialDestinationHash
} from "../kp-tutorial-url.ts";
import type {
  KpTutorialTocElement,
  KpTutorialTocNavigateDetail
} from "../kp-tutorial-toc-element.ts";
import type { KpTutorialTocDestination } from "../kp-tutorial-toc.ts";
import type { KpLispFunctionApplicationLesson } from "./lisp-function-application-lesson-compiler.ts";
import type { KpLispLessonMotionController } from "./lisp-function-application-motion-controller.ts";
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";

const KP_TUTORIAL_TOC_NAVIGATE_EVENT = "kp:tutorial-toc-navigate";

export interface KpLispLessonNavigationTarget {
  readonly destination: KpTutorialTocDestination;
  readonly blockId: KpLispLessonMotionBlockId;
  readonly localProgress: number;
  readonly elementId: string;
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
}): { readonly dispose: () => void } {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Lisp navigation requires a browser view.");
  const toc = required<KpTutorialTocElement>(input.root, "kp-tutorial-toc");
  let lastAppliedHash: string | undefined;

  const apply = (
    destination: KpTutorialTocDestination,
    options: { readonly scroll: boolean }
  ): boolean => {
    const resolved = resolveKpLispLessonNavigationTarget({
      lesson: input.lesson,
      destination
    });
    if (resolved === undefined) return false;
    // Restore semantic state before moving the viewport so observers never see
    // the destination paired with an intermediate animation frame.
    input.motion.restore(resolved.blockId, resolved.localProgress);
    toc.setActiveDestination(destination);
    input.root.dataset["kpLispTutorialDestinationKind"] = destination.kind;
    input.root.dataset["kpLispTutorialDestinationId"] = destination.id;
    lastAppliedHash = serializeKpTutorialDestinationHash(destination);
    if (options.scroll) {
      input.root.ownerDocument.getElementById(resolved.elementId)?.scrollIntoView({
        behavior: "auto",
        block: destination.kind === "section" ? "start" : "center"
      });
    }
    return true;
  };

  const restoreLocation = (scroll: boolean): void => {
    const destination = parseKpTutorialDestinationHash(view.location.hash);
    if (destination === undefined || view.location.hash === lastAppliedHash) return;
    apply(destination, { scroll });
  };

  const onNavigate = (event: Event): void => {
    const custom = event as CustomEvent<KpTutorialTocNavigateDetail>;
    const destination = Object.freeze({
      kind: custom.detail.kind,
      id: custom.detail.id
    });
    const resolved = resolveKpLispLessonNavigationTarget({
      lesson: input.lesson,
      destination
    });
    if (resolved === undefined) return;
    custom.preventDefault();
    const hash = serializeKpTutorialDestinationHash(destination);
    view.history.pushState({ kpTutorialDestination: destination }, "", hash);
    apply(destination, { scroll: true });
  };
  const onHistory = (): void => restoreLocation(true);

  input.root.addEventListener(KP_TUTORIAL_TOC_NAVIGATE_EVENT, onNavigate);
  view.addEventListener("popstate", onHistory);
  view.addEventListener("hashchange", onHistory);
  const initial = parseKpTutorialDestinationHash(view.location.hash);
  if (initial === undefined || !apply(initial, { scroll: initial !== undefined })) {
    apply({ kind: "section", id: input.lesson.sections[0]!.id }, { scroll: false });
  }

  return Object.freeze({
    dispose: () => {
      input.root.removeEventListener(KP_TUTORIAL_TOC_NAVIGATE_EVENT, onNavigate);
      view.removeEventListener("popstate", onHistory);
      view.removeEventListener("hashchange", onHistory);
    }
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
