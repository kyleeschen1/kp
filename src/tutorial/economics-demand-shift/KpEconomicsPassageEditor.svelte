<script lang="ts">
  import { onMount, untrack } from "svelte";
  import "./economics-demand-shift-lesson-editor.css";

  import type {
    KpEconomicsCodeMirrorCompletion,
    KpEconomicsCodeMirrorMount
  } from "./economics-demand-shift-codemirror-runtime.ts";
  import type {
    KpEconomicsDemandShiftLessonPassage
  } from "./economics-demand-shift-lesson-compiler.ts";
  import type {
    KpEconomicsLessonDraftState
  } from "./economics-demand-shift-lesson-draft.ts";
  import {
    applyKpEconomicsLessonBufferCommand,
    type KpEconomicsLessonBufferCommand
  } from "./economics-demand-shift-lesson-buffer-commands.ts";
  import {
    KpEconomicsLessonBufferPreviewSession,
    type KpEconomicsLessonBufferPreviewSnapshot
  } from "./economics-demand-shift-lesson-buffer-preview.ts";
  import {
    compileKpEconomicsLessonBufferSource,
    createKpEconomicsLessonBuffer,
    serializeKpEconomicsLessonBuffer
  } from "./economics-demand-shift-lesson-buffer.ts";
  import {
    createKpEconomicsLessonSemanticIndex
  } from "./economics-demand-shift-semantic-index.ts";
  import {
    kpEconomicsTwoColumnSourceSchema
  } from "./economics-demand-shift-two-column-source.ts";
  import {
    kpEconomicsTwoColumnParagraphs
  } from "./economics-demand-shift-two-column-scroll.ts";

  const bufferStorageKey = "kp.economics.demand-shift.lesson-buffer.v1";

  let {
    id,
    draft,
    validation,
    onPreview,
    onClose
  }: {
    readonly id: string;
    readonly draft: KpEconomicsLessonDraftState;
    readonly validation: string;
    readonly onPreview: (input: {
      readonly draft: KpEconomicsLessonDraftState;
      readonly passages: readonly KpEconomicsDemandShiftLessonPassage[];
      readonly validation: string;
    }) => void;
    readonly onClose: () => void;
  } = $props();

  const canonicalBuffer = createKpEconomicsLessonBuffer({
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: kpEconomicsTwoColumnParagraphs.map((passage) => ({
      id: passage.id,
      role: passage.role,
      ...(passage.motionBlockId === undefined
        ? {}
        : { motionBlockId: passage.motionBlockId }),
      sourceText: passage.paragraphs[0]!.sourceText
    }))
  });
  const completions = createKpEconomicsLessonSemanticIndex(canonicalBuffer)
    .completions satisfies readonly KpEconomicsCodeMirrorCompletion[];
  const initialSource = untrack(() => initialBufferSource(draft));

  let host = $state<HTMLElement | undefined>();
  let dialog = $state<HTMLDialogElement | undefined>();
  let runtime: KpEconomicsCodeMirrorMount | undefined;
  let preview: KpEconomicsLessonBufferPreviewSession | undefined;
  let enhanced = $state(false);
  let vimMode = $state("normal");
  let sourceSavePending = $state(false);
  let sourceSaveStatus = $state("");
  let previewStatus = $state<"valid" | "pending" | "invalid">("valid");
  let previewValidation = $state("");
  let selectedPassageId = $state(untrack(() => id));
  let bufferSource = $state(initialSource);
  let savedSource = $state(initialSource);
  let dirty = $derived(bufferSource !== savedSource);

  onMount(() => {
    let disposed = false;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialog?.showModal();

    preview = new KpEconomicsLessonBufferPreviewSession({
      source: initialSource,
      passageId: selectedPassageId,
      onSnapshot: handlePreviewSnapshot
    });
    const retained = readStoredBuffer();
    if (retained !== undefined) {
      bufferSource = retained.source;
      selectedPassageId = retained.selectedPassageId;
      if (retained.source !== initialSource) {
        preview.update({
          source: retained.source,
          passageId: retained.selectedPassageId
        });
      }
    }
    handlePreviewSnapshot(preview.snapshot);

    void import("./economics-demand-shift-codemirror-runtime.ts").then(
      ({ mountKpEconomicsCodeMirror }) => {
        if (disposed || host === undefined) return;
        runtime = mountKpEconomicsCodeMirror({
          parent: host,
          value: bufferSource,
          completions,
          onChange: updateSource,
          onQuit: onClose,
          onWrite: saveToSource,
          onVimModeChange: (mode) => vimMode = mode
        });
        enhanced = true;
        runtime.view.focus();
        runtime.revealText(`\"id\":\"${selectedPassageId}\"`);
      }
    );
    return () => {
      disposed = true;
      preview?.dispose();
      preview = undefined;
      runtime?.destroy();
      runtime = undefined;
      root.style.overflow = previousOverflow;
    };
  });

  $effect(() => {
    runtime?.setValue(bufferSource);
  });

  function updateFallback(event: Event): void {
    if (event.currentTarget instanceof HTMLTextAreaElement) {
      updateSource(event.currentTarget.value);
    }
  }

  function updateSource(nextValue: string): void {
    bufferSource = nextValue;
    sourceSaveStatus = "";
    persistBuffer();
    preview?.update({ source: nextValue, passageId: selectedPassageId });
  }

  function handlePreviewSnapshot(
    snapshot: KpEconomicsLessonBufferPreviewSnapshot
  ): void {
    previewStatus = snapshot.status;
    selectedPassageId = snapshot.restoredPassageId;
    if (snapshot.status === "pending") {
      previewValidation = "Checking lesson buffer…";
      return;
    }
    if (snapshot.status === "invalid") {
      const diagnostic = snapshot.diagnostics[0];
      previewValidation = diagnostic === undefined
        ? "The lesson buffer is invalid."
        : `L${diagnostic.line}:${diagnostic.column} ${diagnostic.message}`;
      return;
    }
    previewValidation = "Lesson buffer is valid. Preview updated.";
    const source = compileKpEconomicsLessonBufferSource(snapshot.buffer);
    const nextDraft: KpEconomicsLessonDraftState = Object.freeze({
      version: 1,
      selectedPassageId: snapshot.restoredPassageId,
      passages: source.passages
    });
    onPreview({
      draft: nextDraft,
      passages: snapshot.passages,
      validation: previewValidation
    });
  }

  function applyCommand(command: KpEconomicsLessonBufferCommand): void {
    if (runtime === undefined || previewStatus !== "valid") return;
    try {
      const result = applyKpEconomicsLessonBufferCommand({
        source: runtime.getValue(),
        command
      });
      selectedPassageId = result.selectedPassageId;
      runtime.replaceValue(result.source);
      runtime.revealText(`\"id\":\"${result.selectedPassageId}\"`);
      sourceSaveStatus = result.description;
    } catch (error) {
      sourceSaveStatus = error instanceof Error
        ? error.message
        : "The lesson command failed.";
    }
  }

  function addPassage(): void {
    applyCommand({
      kind: "add-passage",
      afterPassageId: selectedPassageId
    });
  }

  function duplicatePassage(): void {
    applyCommand({ kind: "duplicate-passage", passageId: selectedPassageId });
  }

  function movePassage(direction: -1 | 1): void {
    applyCommand({
      kind: "move-passage",
      passageId: selectedPassageId,
      direction
    });
  }

  function deletePassage(): void {
    if (!window.confirm(`Delete passage ${selectedPassageId}?`)) return;
    applyCommand({
      kind: "delete-passage",
      passageId: selectedPassageId,
      confirmed: true
    });
  }

  function undoCommand(): void {
    runtime?.undo();
  }

  function redoCommand(): void {
    runtime?.redo();
  }

  async function saveToSource(): Promise<boolean> {
    if (sourceSavePending || preview === undefined) return false;
    const snapshot = preview.flush();
    if (snapshot.status !== "valid") {
      sourceSaveStatus = "Repair the lesson buffer before saving.";
      return false;
    }
    sourceSavePending = true;
    sourceSaveStatus = "Saving the lesson source…";
    const source = compileKpEconomicsLessonBufferSource(snapshot.buffer);
    const submittedDraft: KpEconomicsLessonDraftState = Object.freeze({
      version: 1,
      selectedPassageId: snapshot.restoredPassageId,
      passages: source.passages
    });
    try {
      const { saveKpEconomicsLessonSource } = await import(
        "./economics-demand-shift-source-save-client.ts"
      );
      const result = await saveKpEconomicsLessonSource(submittedDraft);
      savedSource = snapshot.source;
      sourceSaveStatus = result.changed
        ? `Saved to ${result.sourcePath}.`
        : `${result.sourcePath} already matches this buffer.`;
      return true;
    } catch (error) {
      sourceSaveStatus = error instanceof Error
        ? error.message
        : "The lesson source could not be saved.";
      return false;
    } finally {
      sourceSavePending = false;
    }
  }

  function persistBuffer(): void {
    try {
      window.localStorage.setItem(bufferStorageKey, JSON.stringify({
        version: 1,
        source: bufferSource,
        selectedPassageId
      }));
    } catch {
      sourceSaveStatus = "The browser could not autosave this buffer.";
    }
  }

  function readStoredBuffer(): {
    readonly source: string;
    readonly selectedPassageId: string;
  } | undefined {
    try {
      const serialized = window.localStorage.getItem(bufferStorageKey);
      if (serialized === null) return undefined;
      const value: unknown = JSON.parse(serialized);
      if (typeof value !== "object" || value === null ||
          (value as { version?: unknown }).version !== 1 ||
          typeof (value as { source?: unknown }).source !== "string" ||
          typeof (value as { selectedPassageId?: unknown }).selectedPassageId !==
            "string") {
        return undefined;
      }
      return value as { source: string; selectedPassageId: string };
    } catch {
      return undefined;
    }
  }

  function initialBufferSource(
    lessonDraft: KpEconomicsLessonDraftState
  ): string {
    try {
      return serializeKpEconomicsLessonBuffer(createKpEconomicsLessonBuffer({
        schemaVersion: kpEconomicsTwoColumnSourceSchema,
        passages: lessonDraft.passages
      }));
    } catch {
      // Legacy per-passage drafts could remove required semantic markup. Keep
      // the repository-valid buffer available while raw v1 buffer recovery,
      // when present, remains the first authoring source loaded on mount.
      return serializeKpEconomicsLessonBuffer(canonicalBuffer);
    }
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
      aria-label="Whole lesson buffer"
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
    <span class="kp-economics-lesson-editor__modeline-commands">
      <button type="button" data-kp-economics-buffer-command="add" onclick={addPassage}>Add</button>
      <button type="button" data-kp-economics-buffer-command="duplicate" onclick={duplicatePassage}>Copy</button>
      <button type="button" aria-label="Move passage earlier" data-kp-economics-buffer-command="earlier" onclick={() => movePassage(-1)}>↑</button>
      <button type="button" aria-label="Move passage later" data-kp-economics-buffer-command="later" onclick={() => movePassage(1)}>↓</button>
      <button type="button" data-kp-economics-buffer-command="delete" onclick={deletePassage}>Delete</button>
      <button type="button" data-kp-economics-buffer-command="undo" onclick={undoCommand}>Undo</button>
      <button type="button" data-kp-economics-buffer-command="redo" onclick={redoCommand}>Redo</button>
    </span>
    <span data-kp-economics-editor-vim-mode>VIM · {vimMode}</span>
  </div>
  <div
    class="kp-economics-lesson-editor__ex-command"
    data-kp-economics-editor-ex-command
  ></div>
</dialog>
