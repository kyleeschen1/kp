<script lang="ts">
  import { onMount, untrack } from "svelte";
  import articleSourceText from
    "../../../content/lessons/economics-demand-shift.kp.md?raw";
  import articleImportLockValue from
    "../../../content/lessons/economics-demand-shift.kp.lock.json" with { type: "json" };
  import "./economics-demand-shift-lesson-editor.css";

  import {
    KpArticleDraftSession,
    type KpArticleDraftSnapshot
  } from "../../article/kp-article-draft-session.ts";
  import type { KpArticleImportLock } from
    "../../article/kp-article-import-lock.ts";
  import type {
    KpEconomicsCodeMirrorCompletion,
    KpEconomicsCodeMirrorMount
  } from "./economics-demand-shift-codemirror-runtime.ts";
  import {
    compileKpEconomicsDemandShiftArticle,
    kpEconomicsDemandShiftArticleSemanticCompletions,
    kpEconomicsDemandShiftArticleSourceId
  } from "./economics-demand-shift-article-compiler.ts";
  import type { KpEconomicsDemandShiftLessonPassage } from
    "./economics-demand-shift-lesson-compiler.ts";

  const articleImportLock = articleImportLockValue as KpArticleImportLock;
  const articleDraftStorageKey = "kp.economics.demand-shift.article-draft.v1";
  const presenterToSourceId = new Map([
    ["graph-at-rest", "context"],
    ["movement-along-supply", "equation-check"]
  ]);
  const completions = Object.freeze([
    ...kpEconomicsDemandShiftArticleSemanticCompletions.map((completion) =>
      Object.freeze({
        label: completion.address,
        apply: completion.address,
        detail: completion.detail ?? "economics vignette semantic path",
        contexts: Object.freeze(["kp-ref", "semantic-id"] as const)
      })
    ),
    ...["kp-stage", "kp-passage", "kp-focus", "kp-motion"].map((label) =>
      Object.freeze({
        label,
        apply: label,
        detail: "KP Article v1 directive",
        contexts: Object.freeze(["kp-directive"] as const)
      })
    )
  ]) satisfies readonly KpEconomicsCodeMirrorCompletion[];

  let {
    id,
    selectedPassageId: initialSelectedPassageId,
    validation,
    onPreview,
    onClose
  }: {
    readonly id: string;
    readonly selectedPassageId: string;
    readonly validation: string;
    readonly onPreview: (input: {
      readonly selectedPassageId: string;
      readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
      readonly validation: string;
    }) => void;
    readonly onClose: () => void;
  } = $props();

  let host = $state<HTMLElement | undefined>();
  let dialog = $state<HTMLDialogElement | undefined>();
  let runtime: KpEconomicsCodeMirrorMount | undefined;
  let session: KpArticleDraftSession | undefined;
  let enhanced = $state(false);
  let vimMode = $state("normal");
  let selectedPassageId = $state(untrack(() => id || initialSelectedPassageId));
  let bufferSource = $state(articleSourceText);
  let dirty = $state(false);
  let previewStatus = $state<"valid" | "invalid">("valid");
  let previewValidation = $state(untrack(() =>
    validation || "Article source is valid."
  ));
  let sourceSaveStatus = $state("");

  onMount(() => {
    let disposed = false;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialog?.showModal();

    const retained = readStoredDraft();
    session = new KpArticleDraftSession({
      sourceId: kpEconomicsDemandShiftArticleSourceId,
      persistedText: retained?.persistedSource ?? articleSourceText,
      ...(retained === undefined ? {} : { draftText: retained.source }),
      semantic: kpEconomicsDemandShiftArticleSemanticCompletions,
      save: async (request) => {
        const { saveKpEconomicsDemandShiftArticleSource } = await import(
          "./economics-demand-shift-article-source-client.ts"
        );
        return saveKpEconomicsDemandShiftArticleSource(request);
      },
      onSnapshot: handleSnapshot
    });
    if (retained !== undefined) selectedPassageId = retained.selectedPassageId;
    handleSnapshot(session.snapshot);

    void import("./economics-demand-shift-codemirror-runtime.ts").then(
      ({ mountKpEconomicsCodeMirror }) => {
        if (disposed || host === undefined || session === undefined) return;
        runtime = mountKpEconomicsCodeMirror({
          parent: host,
          value: session.snapshot.draftText,
          completions,
          onChange: updateSource,
          onQuit: quitEditor,
          onWrite: saveToSource,
          onVimModeChange: (mode) => vimMode = mode
        });
        enhanced = true;
        runtime.view.focus();
        runtime.revealText(`#${sourcePassageId(selectedPassageId)}`);
      }
    );
    return () => {
      disposed = true;
      runtime?.destroy();
      runtime = undefined;
      root.style.overflow = previousOverflow;
    };
  });

  function updateFallback(event: Event): void {
    if (event.currentTarget instanceof HTMLTextAreaElement) {
      updateSource(event.currentTarget.value);
    }
  }

  function updateSource(nextValue: string): void {
    sourceSaveStatus = "";
    session?.update(nextValue);
  }

  function handleSnapshot(snapshot: KpArticleDraftSnapshot): void {
    bufferSource = snapshot.draftText;
    dirty = snapshot.dirty;
    previewStatus = snapshot.validity;
    previewValidation = snapshot.message;
    sourceSaveStatus = snapshot.saveStatus === "idle" ? "" : snapshot.message;
    persistDraft(snapshot);
    if (snapshot.validity !== "valid") return;
    try {
      const compiled = compileKpEconomicsDemandShiftArticle({
        text: snapshot.previewText,
        lock: articleImportLock
      });
      const passages = compiled.twoColumnParagraphs;
      const selected = passages.some(({ id }) => id === selectedPassageId)
        ? selectedPassageId
        : passages[0]!.id;
      selectedPassageId = selected;
      onPreview({
        selectedPassageId: selected,
        passages,
        validation: "KP Article v1 is valid. Preview updated."
      });
    } catch (error) {
      previewStatus = "invalid";
      previewValidation = error instanceof Error
        ? error.message
        : "The KP article cannot produce an economics preview.";
    }
  }

  async function saveToSource(): Promise<boolean> {
    if (session === undefined) return false;
    const result = await session.execute(":w");
    handleSnapshot(result.snapshot);
    return result.saved;
  }

  async function quitEditor(force: boolean): Promise<boolean> {
    if (session === undefined) return false;
    const { snapshot } = await session.execute(force ? ":q!" : ":q");
    handleSnapshot(snapshot);
    if (snapshot.open) {
      sourceSaveStatus = snapshot.message;
      return false;
    }
    runtime?.setValue(snapshot.draftText);
    onClose();
    return true;
  }

  function persistDraft(snapshot: KpArticleDraftSnapshot): void {
    try {
      window.localStorage.setItem(articleDraftStorageKey, JSON.stringify({
        version: 1,
        sourceId: snapshot.sourceId,
        baseSource: articleSourceText,
        persistedSource: snapshot.persistedText,
        source: snapshot.draftText,
        selectedPassageId
      }));
    } catch {
      sourceSaveStatus = "The browser could not autosave this article draft.";
    }
  }

  function readStoredDraft(): {
    readonly persistedSource: string;
    readonly source: string;
    readonly selectedPassageId: string;
  } | undefined {
    try {
      const serialized = window.localStorage.getItem(articleDraftStorageKey);
      if (serialized === null) return undefined;
      const value: unknown = JSON.parse(serialized);
      if (typeof value !== "object" || value === null) return undefined;
      const stored = value as {
        version?: unknown;
        sourceId?: unknown;
        baseSource?: unknown;
        persistedSource?: unknown;
        source?: unknown;
        selectedPassageId?: unknown;
      };
      if (stored.version !== 1 ||
          stored.sourceId !== kpEconomicsDemandShiftArticleSourceId ||
          typeof stored.baseSource !== "string" ||
          typeof stored.persistedSource !== "string" ||
          (stored.baseSource !== articleSourceText &&
            stored.persistedSource !== articleSourceText) ||
          typeof stored.source !== "string" ||
          typeof stored.selectedPassageId !== "string") {
        return undefined;
      }
      return {
        persistedSource: stored.persistedSource,
        source: stored.source,
        selectedPassageId: stored.selectedPassageId
      };
    } catch {
      return undefined;
    }
  }

  function sourcePassageId(presenterId: string): string {
    return presenterToSourceId.get(presenterId) ?? presenterId;
  }
</script>

<dialog
  bind:this={dialog}
  class="kp-economics-lesson-editor"
  data-kp-economics-lesson-editor
  data-kp-economics-lesson-editor-passage={selectedPassageId}
  data-kp-economics-lesson-editor-enhanced={enhanced}
  data-kp-economics-lesson-editor-status={previewStatus}
  data-kp-economics-lesson-editor-dirty={dirty}
  onkeydown={(event) => {
    // CodeMirror sees the key first; prevent the dialog's later native Escape
    // default so an extra Vim Escape never closes the modal behind the editor.
    if (event.key === "Escape") event.preventDefault();
  }}
  oncancel={(event) => {
    // Escape belongs to Vim's mode machine; closing the dialog here would
    // make the normal-mode escape key destroy the editing session.
    event.preventDefault();
  }}
>
  <div class="kp-economics-lesson-editor__surface" bind:this={host}>
    <textarea
      class="kp-economics-lesson-editor__fallback"
      class:kp-economics-lesson-editor__fallback--hidden={enhanced}
      aria-label="Whole KP article"
      oninput={updateFallback}
      value={bufferSource}
    ></textarea>
  </div>
  <div class="kp-economics-lesson-editor__modeline" data-kp-economics-editor-modeline>
    <code>economics-demand-shift.kp.md</code>
    <code>{selectedPassageId}</code>
    <span>{dirty ? "MODIFIED" : "SAVED"}</span>
    <span>{previewStatus.toUpperCase()}</span>
    <span
      class="kp-economics-lesson-editor__modeline-status"
      data-kp-economics-lesson-editor-validation
      aria-live="polite"
    >{sourceSaveStatus || previewValidation || validation}</span>
    <span
      class="kp-economics-lesson-editor__visually-hidden"
      data-kp-economics-lesson-editor-source-status
      aria-live="polite"
    >{sourceSaveStatus || (dirty ? "Autosaved locally." : "Source saved.")}</span>
    <span class="kp-economics-lesson-editor__modeline-spacer"></span>
    <span data-kp-economics-editor-vim-mode>VIM · {vimMode}</span>
  </div>
  <div
    class="kp-economics-lesson-editor__ex-command"
    data-kp-economics-editor-ex-command
  ></div>
</dialog>
