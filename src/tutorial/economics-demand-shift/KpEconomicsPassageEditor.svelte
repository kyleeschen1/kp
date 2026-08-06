<script lang="ts">
  import { onMount } from "svelte";
  import "./economics-demand-shift-lesson-editor.css";

  import type {
    KpEconomicsCodeMirrorCompletion,
    KpEconomicsCodeMirrorMount
  } from "./economics-demand-shift-codemirror-runtime.ts";
  import type {
    KpEconomicsLessonDraftState
  } from "./economics-demand-shift-lesson-draft.ts";

  let {
    id,
    value,
    draft,
    validation,
    canDelete,
    canMoveUp,
    canMoveDown,
    onChange,
    onAdd,
    onCopy,
    onDelete,
    onMoveUp,
    onMoveDown,
    onReset,
    onClose
  }: {
    readonly id: string;
    readonly value: string;
    readonly draft: KpEconomicsLessonDraftState;
    readonly validation: string;
    readonly canDelete: boolean;
    readonly canMoveUp: boolean;
    readonly canMoveDown: boolean;
    readonly onChange: (value: string) => void;
    readonly onAdd: () => void;
    readonly onCopy: () => void;
    readonly onDelete: () => void;
    readonly onMoveUp: () => void;
    readonly onMoveDown: () => void;
    readonly onReset: () => void;
    readonly onClose: () => void;
  } = $props();

  const completions = Object.freeze<KpEconomicsCodeMirrorCompletion[]>([
    Object.freeze({
      label: "price-axis-inline",
      detail: "text reference → stage object axis-price",
      info: "Use inside [$P$](kp-ref:price-axis-inline) to bind prose to the price axis."
    })
  ]);

  let host = $state<HTMLElement | undefined>();
  let dialog = $state<HTMLDialogElement | undefined>();
  let runtime: KpEconomicsCodeMirrorMount | undefined;
  let enhanced = $state(false);
  let vimMode = $state("normal");
  let sourceSavePending = $state(false);
  let sourceSaveStatus = $state(
    "Autosaved locally. Use Save to source to update the project."
  );

  onMount(() => {
    let disposed = false;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialog?.showModal();
    void import("./economics-demand-shift-codemirror-runtime.ts").then(
      ({ mountKpEconomicsCodeMirror }) => {
        if (disposed || host === undefined) return;
        runtime = mountKpEconomicsCodeMirror({
          parent: host,
          value,
          completions,
          onChange: updateSource,
          onVimModeChange: (mode) => vimMode = mode
        });
        enhanced = true;
        runtime.view.focus();
      }
    );
    return () => {
      disposed = true;
      runtime?.destroy();
      runtime = undefined;
      root.style.overflow = previousOverflow;
    };
  });

  $effect(() => {
    runtime?.setValue(value);
  });

  function updateFallback(event: Event): void {
    if (event.currentTarget instanceof HTMLTextAreaElement) {
      updateSource(event.currentTarget.value);
    }
  }

  function updateSource(nextValue: string): void {
    markSourcePending();
    onChange(nextValue);
  }

  function runDraftMutation(operation: () => void): void {
    markSourcePending();
    operation();
  }

  function markSourcePending(): void {
    sourceSaveStatus =
      "Autosaved locally. Use Save to source to update the project.";
  }

  async function saveToSource(): Promise<void> {
    if (sourceSavePending) return;
    sourceSavePending = true;
    sourceSaveStatus = "Saving the lesson source…";
    const submittedDraft = draft;
    try {
      const { saveKpEconomicsLessonSource } = await import(
        "./economics-demand-shift-source-save-client.ts"
      );
      const result = await saveKpEconomicsLessonSource(submittedDraft);
      sourceSaveStatus = draft === submittedDraft
        ? result.changed
          ? `Saved to ${result.sourcePath}.`
          : `${result.sourcePath} already matches this draft.`
        : "Saved the submitted revision; newer edits remain local.";
    } catch (error) {
      sourceSaveStatus = error instanceof Error
        ? error.message
        : "The lesson source could not be saved.";
    } finally {
      sourceSavePending = false;
    }
  }
</script>

<dialog
  bind:this={dialog}
  class="kp-economics-lesson-editor"
  data-kp-economics-lesson-editor
  data-kp-economics-lesson-editor-passage={id}
  data-kp-economics-lesson-editor-enhanced={enhanced}
  oncancel={(event) => {
    event.preventDefault();
    onClose();
  }}
>
  <div class="kp-economics-lesson-editor__toolbar">
    <span>Edit one passage; the lesson remains frozen behind this window.</span>
    <button
      type="button"
      class="kp-economics-lesson-editor__close"
      aria-label="Close lesson editor"
      onclick={onClose}
    >Close</button>
  </div>
  <div class="kp-economics-lesson-editor__surface" bind:this={host}>
    <textarea
      class="kp-economics-lesson-editor__fallback"
      class:kp-economics-lesson-editor__fallback--hidden={enhanced}
      aria-label="Lesson passage Markdown"
      oninput={updateFallback}
      {value}
    ></textarea>
  </div>
  <p
    class="kp-economics-lesson-editor__validation"
    data-kp-economics-lesson-editor-validation
    aria-live="polite"
  >{validation}</p>
  <p
    class="kp-economics-lesson-editor__source-status"
    data-kp-economics-lesson-editor-source-status
    aria-live="polite"
  >{sourceSaveStatus}</p>
  <div class="kp-economics-lesson-editor__actions" aria-label="Passage actions">
    <button
      type="button"
      data-kp-economics-lesson-editor-save-source
      onclick={saveToSource}
      disabled={sourceSavePending}
    >{sourceSavePending ? "Saving…" : "Save to source"}</button>
    <button type="button" onclick={() => runDraftMutation(onAdd)}>
      Add after
    </button>
    <button type="button" onclick={() => runDraftMutation(onCopy)}>
      Duplicate
    </button>
    <button
      type="button"
      onclick={() => runDraftMutation(onMoveUp)}
      disabled={!canMoveUp}
    >
      Move up
    </button>
    <button
      type="button"
      onclick={() => runDraftMutation(onMoveDown)}
      disabled={!canMoveDown}
    >
      Move down
    </button>
    <button
      type="button"
      onclick={() => runDraftMutation(onDelete)}
      disabled={!canDelete}
    >
      Delete
    </button>
    <button
      type="button"
      data-kp-economics-lesson-editor-reset
      onclick={() => runDraftMutation(onReset)}
    >Reset draft</button>
  </div>
  <div class="kp-economics-lesson-editor__modeline" data-kp-economics-editor-modeline>
    <code>{id}</code>
    <span>Markdown + KaTeX</span>
    <span class="kp-economics-lesson-editor__modeline-spacer"></span>
    <span data-kp-economics-editor-vim-mode>VIM · {vimMode}</span>
  </div>
</dialog>
