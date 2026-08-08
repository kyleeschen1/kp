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
  import {
    createKpEconomicsLessonBuffer
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

  let {
    id,
    value,
    draft,
    validation,
    onChange,
    onClose
  }: {
    readonly id: string;
    readonly value: string;
    readonly draft: KpEconomicsLessonDraftState;
    readonly validation: string;
    readonly onChange: (value: string) => void;
    readonly onClose: () => void;
  } = $props();

  const completions = createKpEconomicsLessonSemanticIndex(
    createKpEconomicsLessonBuffer({
      schemaVersion: kpEconomicsTwoColumnSourceSchema,
      // Completion reflects committed repository truth even while the draft is
      // temporarily invalid or names not-yet-saved local passages.
      passages: kpEconomicsTwoColumnParagraphs.map((passage) => ({
        id: passage.id,
        role: passage.role,
        ...(passage.motionBlockId === undefined
          ? {}
          : { motionBlockId: passage.motionBlockId }),
        sourceText: passage.paragraphs[0]!.sourceText
      }))
    })
  ).completions satisfies readonly KpEconomicsCodeMirrorCompletion[];

  let host = $state<HTMLElement | undefined>();
  let dialog = $state<HTMLDialogElement | undefined>();
  let runtime: KpEconomicsCodeMirrorMount | undefined;
  let enhanced = $state(false);
  let vimMode = $state("normal");
  let sourceSavePending = $state(false);
  let sourceStatusHasPriority = $state(false);
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
          onQuit: onClose,
          onWrite: saveToSource,
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

  function markSourcePending(): void {
    sourceStatusHasPriority = false;
    sourceSaveStatus =
      "Autosaved locally. Use Save to source to update the project.";
  }

  async function saveToSource(): Promise<boolean> {
    if (sourceSavePending) return false;
    sourceSavePending = true;
    sourceStatusHasPriority = true;
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
</script>

<dialog
  bind:this={dialog}
  class="kp-economics-lesson-editor"
  data-kp-economics-lesson-editor
  data-kp-economics-lesson-editor-passage={id}
  data-kp-economics-lesson-editor-enhanced={enhanced}
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
      aria-label="Lesson passage Markdown"
      oninput={updateFallback}
      {value}
    ></textarea>
  </div>
  <div class="kp-economics-lesson-editor__modeline" data-kp-economics-editor-modeline>
    <code>{id}</code>
    <span>Markdown + KaTeX</span>
    <span
      class="kp-economics-lesson-editor__modeline-status"
      data-kp-economics-lesson-editor-validation
      aria-live="polite"
    >{sourceStatusHasPriority ? sourceSaveStatus : validation || sourceSaveStatus}</span>
    <span
      class="kp-economics-lesson-editor__visually-hidden"
      data-kp-economics-lesson-editor-source-status
      aria-live="polite"
    >{sourceSaveStatus}</span>
    <span class="kp-economics-lesson-editor__modeline-spacer"></span>
    <span data-kp-economics-editor-vim-mode>VIM · {vimMode}</span>
  </div>
</dialog>
