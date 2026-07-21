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
  options.shell.content.append(intro, meta, route, form);

  let snapshot: KpDevReviewCaptureV1 | undefined;
  let generation = 0;
  let submitting = false;

  const onOpen = async (): Promise<void> => {
    const currentGeneration = ++generation;
    snapshot = undefined;
    textarea.value = "";
    count.textContent = "0 / 4000";
    textarea.disabled = true;
    save.disabled = true;
    meta.replaceChildren(pill(ownerDocument, "Capturing state…"));
    route.textContent = "";
    options.shell.status.value = "";
    try {
      const capture = await options.capture();
      if (generation !== currentGeneration) return;
      snapshot = capture;
      renderCaptureMeta(meta, route, capture);
      textarea.disabled = false;
      updateSubmitState();
      textarea.focus();
    } catch {
      if (generation !== currentGeneration) return;
      meta.replaceChildren(pill(ownerDocument, "State unavailable"));
      options.shell.status.value = "Could not capture this moment.";
    }
  };
  const onClose = (): void => {
    generation += 1;
    snapshot = undefined;
    textarea.value = "";
    count.textContent = "0 / 4000";
  };
  const updateSubmitState = (): void => {
    count.textContent = `${textarea.value.length} / 4000`;
    save.disabled = snapshot === undefined || textarea.value.trim().length === 0 || submitting;
  };
  const onSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const comment = textarea.value.trim();
    const captured = snapshot;
    if (captured === undefined || comment.length === 0 || submitting) return;
    submitting = true;
    updateSubmitState();
    options.shell.status.value = "Saving…";
    try {
      const note = await options.submit({ comment, capture: captured });
      textarea.value = "";
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

  options.shell.host.addEventListener(KP_DEV_REVIEW_SHELL_OPEN_EVENT, onOpen);
  options.shell.host.addEventListener(KP_DEV_REVIEW_SHELL_CLOSE_EVENT, onClose);
  textarea.addEventListener("input", updateSubmitState);
  textarea.addEventListener("keydown", onTextKeyDown);
  form.addEventListener("submit", onSubmit);

  return {
    dispose() {
      generation += 1;
      options.shell.host.removeEventListener(KP_DEV_REVIEW_SHELL_OPEN_EVENT, onOpen);
      options.shell.host.removeEventListener(KP_DEV_REVIEW_SHELL_CLOSE_EVENT, onClose);
      textarea.removeEventListener("input", updateSubmitState);
      textarea.removeEventListener("keydown", onTextKeyDown);
      form.removeEventListener("submit", onSubmit);
      intro.remove();
      meta.remove();
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
