import "./kp-article-source-editor.css";

import {
  KpArticleDraftSession,
  type KpArticleDraftSnapshot
} from "./kp-article-draft-session.ts";
import type { KpArticleSemanticCompletion } from
  "./kp-article-language-service.ts";
import type {
  KpArticleSourceSaveRequest,
  KpArticleSourceSaveResult
} from "./kp-article-source-save.ts";
import type {
  KpArticleCodeMirrorCompletion,
  KpArticleCodeMirrorMount
} from "./kp-article-codemirror-runtime.ts";

export interface KpArticleSourceEditorSession {
  readonly close: (force?: boolean) => Promise<boolean>;
  readonly element: HTMLDialogElement;
}

export function mountKpArticleSourceEditor(input: {
  readonly ownerDocument: Document;
  readonly sourceId: string;
  readonly sourceFilename: string;
  readonly persistedText: string;
  readonly storageKey: string;
  readonly semantic: readonly KpArticleSemanticCompletion[];
  readonly revealText?: string | undefined;
  readonly save: (
    request: Omit<KpArticleSourceSaveRequest, "schemaVersion">
  ) => Promise<KpArticleSourceSaveResult>;
  readonly preview: (source: string) => void;
  readonly onClose?: (() => void) | undefined;
}): KpArticleSourceEditorSession {
  const dialog = input.ownerDocument.createElement("dialog");
  dialog.className = "kp-article-source-editor";
  dialog.dataset["kpArticleSourceEditor"] = input.sourceId;
  dialog.dataset["kpArticleSourceEditorEnhanced"] = "false";
  const surface = input.ownerDocument.createElement("div");
  surface.className = "kp-article-source-editor__surface";
  const fallback = input.ownerDocument.createElement("textarea");
  fallback.className = "kp-article-source-editor__fallback";
  fallback.setAttribute("aria-label", "Whole KP article");
  surface.append(fallback);
  const modeline = input.ownerDocument.createElement("div");
  modeline.className = "kp-article-source-editor__modeline";
  modeline.dataset["kpArticleSourceEditorModeline"] = "";
  const filename = input.ownerDocument.createElement("code");
  filename.textContent = input.sourceFilename;
  const dirtyState = input.ownerDocument.createElement("span");
  const validity = input.ownerDocument.createElement("span");
  const status = input.ownerDocument.createElement("span");
  status.className = "kp-article-source-editor__status";
  status.dataset["kpArticleSourceEditorValidation"] = "";
  status.setAttribute("aria-live", "polite");
  const announced = input.ownerDocument.createElement("span");
  announced.className = "kp-article-source-editor__visually-hidden";
  announced.dataset["kpArticleSourceEditorSourceStatus"] = "";
  announced.setAttribute("aria-live", "polite");
  const spacer = input.ownerDocument.createElement("span");
  spacer.className = "kp-article-source-editor__spacer";
  const vimMode = input.ownerDocument.createElement("span");
  vimMode.dataset["kpArticleSourceEditorVimMode"] = "";
  modeline.append(
    filename,
    dirtyState,
    validity,
    status,
    announced,
    spacer,
    vimMode
  );
  const exCommand = input.ownerDocument.createElement("div");
  exCommand.className = "kp-article-source-editor__ex-command";
  dialog.append(surface, modeline, exCommand);
  input.ownerDocument.body.append(dialog);

  const retained = readStoredDraft(input.storageKey, input);
  let runtime: KpArticleCodeMirrorMount | undefined;
  let disposed = false;
  const root = input.ownerDocument.documentElement;
  const previousOverflow = root.style.overflow;
  root.style.overflow = "hidden";
  const session = new KpArticleDraftSession({
    sourceId: input.sourceId,
    persistedText: retained?.persistedText ?? input.persistedText,
    ...(retained === undefined ? {} : { draftText: retained.draftText }),
    semantic: input.semantic,
    save: input.save,
    onSnapshot: renderSnapshot
  });

  function renderSnapshot(snapshot: KpArticleDraftSnapshot): void {
    fallback.value = snapshot.draftText;
    dialog.dataset["kpArticleSourceEditorStatus"] = snapshot.validity;
    dialog.dataset["kpArticleSourceEditorDirty"] = String(snapshot.dirty);
    dirtyState.textContent = snapshot.dirty ? "MODIFIED" : "SAVED";
    validity.textContent = snapshot.validity.toUpperCase();
    status.textContent = snapshot.message;
    announced.textContent = snapshot.message;
    persistDraft(input.storageKey, input, snapshot);
    if (snapshot.validity !== "valid") return;
    try {
      input.preview(snapshot.previewText);
    } catch (error) {
      dialog.dataset["kpArticleSourceEditorStatus"] = "invalid";
      status.textContent = error instanceof Error
        ? error.message
        : "The KP article preview could not be compiled.";
    }
  }

  async function write(): Promise<boolean> {
    const result = await session.execute(":w");
    renderSnapshot(result.snapshot);
    return result.saved;
  }

  async function close(force = false): Promise<boolean> {
    if (disposed) return true;
    const { snapshot } = await session.execute(force ? ":q!" : ":q");
    renderSnapshot(snapshot);
    if (snapshot.open) return false;
    dispose();
    return true;
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    runtime?.destroy();
    dialog.remove();
    root.style.overflow = previousOverflow;
    input.onClose?.();
  }

  fallback.addEventListener("input", () => session.update(fallback.value));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") event.preventDefault();
  });
  dialog.addEventListener("cancel", (event) => event.preventDefault());
  renderSnapshot(session.snapshot);
  dialog.showModal();

  const completions: readonly KpArticleCodeMirrorCompletion[] = Object.freeze([
    ...input.semantic.map(({ address, detail }) => Object.freeze({
      label: address,
      apply: address,
      detail: detail ?? "article semantic path",
      contexts: Object.freeze(["kp-ref", "semantic-id"] as const)
    })),
    ...["kp-stage", "kp-passage", "kp-focus", "kp-motion"].map((label) =>
      Object.freeze({
        label,
        apply: label,
        detail: "KP Article v1 directive",
        contexts: Object.freeze(["kp-directive"] as const)
      })
    )
  ]);
  void import("./kp-article-codemirror-runtime.ts").then(
    ({ mountKpArticleCodeMirror }) => {
      if (disposed) return;
      runtime = mountKpArticleCodeMirror({
        parent: surface,
        value: session.snapshot.draftText,
        completions,
        onChange: (value) => session.update(value),
        onQuit: close,
        onWrite: write,
        onVimModeChange: (mode) => {
          vimMode.textContent = `VIM · ${mode}`;
        }
      });
      fallback.hidden = true;
      dialog.dataset["kpArticleSourceEditorEnhanced"] = "true";
      runtime.view.focus();
      if (input.revealText !== undefined) runtime.revealText(input.revealText);
    }
  );

  return Object.freeze({ close, element: dialog });
}

function readStoredDraft(
  key: string,
  input: { readonly sourceId: string; readonly persistedText: string }
): { readonly persistedText: string; readonly draftText: string } | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (typeof value !== "object" || value === null) return undefined;
    const stored = value as Record<string, unknown>;
    if (stored["version"] !== 1 || stored["sourceId"] !== input.sourceId ||
        typeof stored["baseSource"] !== "string" ||
        typeof stored["persistedText"] !== "string" ||
        typeof stored["draftText"] !== "string" ||
        (stored["baseSource"] !== input.persistedText &&
          stored["persistedText"] !== input.persistedText)) return undefined;
    return {
      persistedText: stored["persistedText"],
      draftText: stored["draftText"]
    };
  } catch {
    return undefined;
  }
}

function persistDraft(
  key: string,
  input: { readonly sourceId: string; readonly persistedText: string },
  snapshot: KpArticleDraftSnapshot
): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      sourceId: input.sourceId,
      baseSource: input.persistedText,
      persistedText: snapshot.persistedText,
      draftText: snapshot.draftText
    }));
  } catch {
    // The editor remains usable when storage is unavailable; explicit writes
    // still cross the capability-gated source boundary.
  }
}
