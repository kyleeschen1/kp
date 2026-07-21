import type { KpDevReviewCaptureV1, KpDevReviewNoteV1 } from "../../protocols/dev-review-v1.ts";
import {
  KP_DEV_REVIEW_SHELL_CLOSE_EVENT,
  KP_DEV_REVIEW_SHELL_OPEN_EVENT,
  type KpDevReviewShell
} from "./review-shell.ts";

export interface KpDevReviewComposer {
  dispose(): void;
}

export function mountKpDevReviewComposer(options: {
  readonly shell: KpDevReviewShell;
  readonly capture: () => Promise<KpDevReviewCaptureV1>;
  readonly submit: (input: {
    readonly comment: string;
    readonly capture: KpDevReviewCaptureV1;
  }) => Promise<KpDevReviewNoteV1>;
}): KpDevReviewComposer {
  const ownerDocument = options.shell.host.ownerDocument;
  const intro = ownerDocument.createElement("p");
  intro.className = "intro";
  intro.textContent = "Describe what looks wrong. The exact reader state is attached automatically.";
  const meta = ownerDocument.createElement("div");
  meta.className = "meta";
  meta.setAttribute("aria-label", "Captured reader state");
  const captureRow = ownerDocument.createElement("div");
  captureRow.className = "capture-row";
  const retake = ownerDocument.createElement("button");
  retake.className = "retake";
  retake.type = "button";
  retake.textContent = "Retake moment";
  retake.hidden = true;
  captureRow.append(meta, retake);
  const route = ownerDocument.createElement("p");
  route.className = "route";
  const form = ownerDocument.createElement("form");
  const label = ownerDocument.createElement("label");
  label.htmlFor = "review-comment";
  label.textContent = "What should change?";
  const textarea = ownerDocument.createElement("textarea");
  textarea.id = "review-comment";
  textarea.name = "comment";
  textarea.maxLength = 4_000;
  textarea.placeholder = "Example: the +3 changes size during the handoff…";
  textarea.disabled = true;
  const footer = ownerDocument.createElement("div");
  footer.className = "form-footer";
  const count = ownerDocument.createElement("span");
  count.className = "count";
  count.textContent = "0 / 4000";
  const save = ownerDocument.createElement("button");
  save.className = "save";
  save.type = "submit";
  save.textContent = "Save note";
  save.disabled = true;
  footer.append(count, save);
  form.append(label, textarea, footer);
  options.shell.content.append(intro, captureRow, route, form);

  let snapshot: KpDevReviewCaptureV1 | undefined;
  let capturePromise: Promise<KpDevReviewCaptureV1 | undefined> | undefined;
  let generation = 0;
  let submitting = false;

  const renderCapturePrompt = (): void => {
    meta.replaceChildren(pill(ownerDocument, "Type to capture this moment"));
    retake.hidden = true;
    retake.disabled = false;
    route.textContent = "";
  };
  const lockCapture = (): Promise<KpDevReviewCaptureV1 | undefined> => {
    if (snapshot !== undefined) return Promise.resolve(snapshot);
    if (capturePromise !== undefined) return capturePromise;
    const currentGeneration = generation;
    meta.replaceChildren(pill(ownerDocument, "Capturing state…"));
    retake.hidden = true;
    retake.disabled = true;
    route.textContent = "";
    const pending = options.capture().then((capture) => {
      if (generation !== currentGeneration) return undefined;
      snapshot = capture;
      renderCaptureMeta(meta, route, capture);
      retake.textContent = "Retake moment";
      retake.hidden = false;
      retake.disabled = false;
      options.shell.status.value = "Moment captured for this note.";
      return capture;
    }).catch(() => {
      if (generation === currentGeneration) {
        meta.replaceChildren(pill(ownerDocument, "State unavailable"));
        retake.textContent = "Try capture again";
        retake.hidden = false;
        retake.disabled = false;
        options.shell.status.value = "Could not capture this moment. Try saving again.";
      }
      return undefined;
    }).finally(() => {
      // An obsolete capture may settle after close/reopen. It must not clear a
      // newer note's in-flight lock.
      if (capturePromise === pending) capturePromise = undefined;
      updateSubmitState();
    });
    capturePromise = pending;
    updateSubmitState();
    return pending;
  };
  const onOpen = (): void => {
    generation += 1;
    snapshot = undefined;
    capturePromise = undefined;
    textarea.value = "";
    count.textContent = "0 / 4000";
    textarea.disabled = false;
    renderCapturePrompt();
    options.shell.status.value = "";
    updateSubmitState();
    textarea.focus();
  };
  const onClose = (): void => {
    generation += 1;
    snapshot = undefined;
    capturePromise = undefined;
    textarea.value = "";
    count.textContent = "0 / 4000";
  };
  const updateSubmitState = (): void => {
    count.textContent = `${textarea.value.length} / 4000`;
    save.disabled = textarea.value.trim().length === 0 || submitting || capturePromise !== undefined;
  };
  const onSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const comment = textarea.value.trim();
    if (comment.length === 0 || submitting) return;
    submitting = true;
    updateSubmitState();
    const captured = await lockCapture();
    if (captured === undefined) {
      submitting = false;
      updateSubmitState();
      return;
    }
    options.shell.status.value = "Saving…";
    try {
      const note = await options.submit({ comment, capture: captured });
      textarea.value = "";
      // A successful save ends the note's immutable capture lifetime. The next
      // input can therefore lock a later reader frame without closing the tool.
      snapshot = undefined;
      renderCapturePrompt();
      options.shell.setInboxCount(note.sequence);
      options.shell.status.value = `Saved note ${note.sequence}.`;
    } catch {
      options.shell.status.value = "Could not save. Your text is still here.";
    } finally {
      submitting = false;
      updateSubmitState();
    }
  };
  const onTextKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  };
  const onTextInput = (): void => {
    updateSubmitState();
    if (textarea.value.trim().length > 0 && snapshot === undefined) {
      void lockCapture();
    }
  };
  const onRetake = (): void => {
    if (submitting || capturePromise !== undefined) return;
    snapshot = undefined;
    retake.textContent = "Retake moment";
    options.shell.status.value = "Retaking the moment for this note…";
    void lockCapture();
  };

  options.shell.host.addEventListener(KP_DEV_REVIEW_SHELL_OPEN_EVENT, onOpen);
  options.shell.host.addEventListener(KP_DEV_REVIEW_SHELL_CLOSE_EVENT, onClose);
  textarea.addEventListener("input", onTextInput);
  textarea.addEventListener("keydown", onTextKeyDown);
  retake.addEventListener("click", onRetake);
  form.addEventListener("submit", onSubmit);

  return {
    dispose() {
      generation += 1;
      options.shell.host.removeEventListener(KP_DEV_REVIEW_SHELL_OPEN_EVENT, onOpen);
      options.shell.host.removeEventListener(KP_DEV_REVIEW_SHELL_CLOSE_EVENT, onClose);
      textarea.removeEventListener("input", onTextInput);
      textarea.removeEventListener("keydown", onTextKeyDown);
      retake.removeEventListener("click", onRetake);
      form.removeEventListener("submit", onSubmit);
      intro.remove();
      captureRow.remove();
      route.remove();
      form.remove();
    }
  };
}

function renderCaptureMeta(
  meta: HTMLElement,
  route: HTMLElement,
  capture: KpDevReviewCaptureV1
): void {
  const semantic = capture.semantic;
  const labels = [
    "Locked",
    semantic.checkpointId ?? "Current frame",
    semantic.progressPermille === undefined ? undefined : `${semantic.progressPermille / 10}%`,
    semantic.activePhase
  ].filter((label): label is string => label !== undefined);
  meta.replaceChildren(...labels.map((label) => pill(meta.ownerDocument, label)));
  route.textContent = new URL(capture.route).pathname;
}

function pill(ownerDocument: Document, label: string): HTMLSpanElement {
  const element = ownerDocument.createElement("span");
  element.textContent = label;
  return element;
}
