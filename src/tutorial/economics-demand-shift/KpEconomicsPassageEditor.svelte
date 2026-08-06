<script lang="ts">
  import { onMount } from "svelte";
  import "./economics-demand-shift-lesson-editor.css";

  import type {
    KpEconomicsCodeMirrorCompletion,
    KpEconomicsCodeMirrorMount
  } from "./economics-demand-shift-codemirror-runtime.ts";

  let {
    passageId,
    value,
    validationMessage,
    canDelete,
    canMovePrevious,
    canMoveNext,
    onChange,
    onAddAfter,
    onDuplicate,
    onDelete,
    onMovePrevious,
    onMoveNext,
    onReset
  }: {
    readonly passageId: string;
    readonly value: string;
    readonly validationMessage: string;
    readonly canDelete: boolean;
    readonly canMovePrevious: boolean;
    readonly canMoveNext: boolean;
    readonly onChange: (value: string) => void;
    readonly onAddAfter: () => void;
    readonly onDuplicate: () => void;
    readonly onDelete: () => void;
    readonly onMovePrevious: () => void;
    readonly onMoveNext: () => void;
    readonly onReset: () => void;
  } = $props();

  const completions = Object.freeze<KpEconomicsCodeMirrorCompletion[]>([
    Object.freeze({
      label: "price-axis-inline",
      detail: "text reference → stage object axis-price",
      info: "Use inside [$P$](kp-ref:price-axis-inline) to bind prose to the price axis."
    })
  ]);

  let host = $state<HTMLElement | undefined>();
  let runtime: KpEconomicsCodeMirrorMount | undefined;
  let enhanced = $state(false);

  onMount(() => {
    let disposed = false;
    void import("./economics-demand-shift-codemirror-runtime.ts").then(
      ({ mountKpEconomicsCodeMirror }) => {
        if (disposed || host === undefined) return;
        runtime = mountKpEconomicsCodeMirror({
          parent: host,
          value,
          completions,
          onChange
        });
        enhanced = true;
        runtime.view.focus();
      }
    );
    return () => {
      disposed = true;
      runtime?.destroy();
      runtime = undefined;
    };
  });

  $effect(() => {
    runtime?.setValue(value);
  });

  function updateFallback(event: Event): void {
    if (event.currentTarget instanceof HTMLTextAreaElement) {
      onChange(event.currentTarget.value);
    }
  }
</script>

<div
  class="kp-economics-lesson-editor"
  data-kp-economics-lesson-editor
  data-kp-economics-lesson-editor-passage={passageId}
  data-kp-economics-lesson-editor-enhanced={enhanced}
>
  <div class="kp-economics-lesson-editor__heading">
    <code>{passageId}</code>
    <span>Markdown · inline KaTeX with <code>$…$</code></span>
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
  >{validationMessage}</p>
  <div class="kp-economics-lesson-editor__actions" aria-label="Passage actions">
    <button type="button" onclick={onAddAfter}>Add after</button>
    <button type="button" onclick={onDuplicate}>Duplicate</button>
    <button type="button" onclick={onMovePrevious} disabled={!canMovePrevious}>
      Move up
    </button>
    <button type="button" onclick={onMoveNext} disabled={!canMoveNext}>
      Move down
    </button>
    <button type="button" onclick={onDelete} disabled={!canDelete}>
      Delete
    </button>
    <button
      type="button"
      data-kp-economics-lesson-editor-reset
      onclick={onReset}
    >Reset draft</button>
  </div>
</div>
