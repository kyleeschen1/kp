<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    root?: HTMLElement | undefined;
    rootClass: string;
    layoutClass: string;
    proseClass: string;
    proseLabel: string;
    stageClass: string;
    stageLabel: string;
    stageAttributes?: Readonly<Record<string, string | number | boolean | undefined>> | undefined;
    attributes?: Readonly<Record<string, string | number | boolean | undefined>> | undefined;
    style?: string | undefined;
    tocClass?: string | undefined;
    tocLabel?: string | undefined;
    before?: Snippet | undefined;
    toc?: Snippet | undefined;
    prose: Snippet;
    stage: Snippet;
    after?: Snippet | undefined;
  }

  let {
    root = $bindable(),
    rootClass,
    layoutClass,
    proseClass,
    proseLabel,
    stageClass,
    stageLabel,
    stageAttributes = {},
    attributes = {},
    style,
    tocClass,
    tocLabel = "Lesson navigation",
    before,
    toc,
    prose,
    stage,
    after
  }: Props = $props();
</script>

<main
  bind:this={root}
  class={`kp-tutorial-shell ${rootClass}`}
  data-kp-tutorial-shell
  data-kp-tutorial-shell-toc={toc === undefined ? "prose" : "rail"}
  {style}
  {...attributes}
>
  {#if before !== undefined}{@render before()}{/if}
  <div class={`kp-tutorial-shell__layout${toc === undefined
    ? " kp-tutorial-shell__layout--prose-toc"
    : ""} ${layoutClass}`}>
    {#if toc !== undefined}
      <aside class={`kp-tutorial-shell__toc ${tocClass ?? ""}`} aria-label={tocLabel}>
        {@render toc()}
      </aside>
    {/if}
    <article class={`kp-tutorial-shell__prose ${proseClass}`} aria-label={proseLabel}>
      {@render prose()}
    </article>
    <aside
      class={`kp-tutorial-shell__stage ${stageClass}`}
      aria-label={stageLabel}
      {...stageAttributes}
    >
      {@render stage()}
    </aside>
  </div>
  {#if after !== undefined}{@render after()}{/if}
</main>
