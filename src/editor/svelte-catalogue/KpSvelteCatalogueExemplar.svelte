<script lang="ts">
  import type {
    KpAnimationCatalogueSelectedHostViewModel
  } from "../animation-catalogue-host-view-model.ts";

  let { view }: {
    view: KpAnimationCatalogueSelectedHostViewModel;
  } = $props();
</script>

<section
  class="kp-svelte-catalogue-exemplar"
  data-kp-svelte-catalogue-exemplar
  data-kp-animation-catalogue-selection={view.entry.animationId}
  aria-labelledby="kp-svelte-catalogue-exemplar-title"
>
  <div>
    <p class="kp-svelte-catalogue-exemplar__eyebrow">Svelte host proof</p>
    <h3 id="kp-svelte-catalogue-exemplar-title">{view.entry.title}</h3>
    <p>{view.entry.summary}</p>
  </div>
</section>

<style>
  .kp-svelte-catalogue-exemplar {
    display: grid;
    width: 100%;
    min-height: 100svh;
    place-items: center;
    padding: 1rem;
    color: #25231f;
    background: #fffefa;
  }

  .kp-svelte-catalogue-exemplar > div {
    max-width: 34rem;
  }

  .kp-svelte-catalogue-exemplar h3,
  .kp-svelte-catalogue-exemplar p {
    margin: 0;
  }

  .kp-svelte-catalogue-exemplar h3 {
    margin-top: 0.35rem;
    font-size: 1rem;
  }

  .kp-svelte-catalogue-exemplar h3 + p {
    margin-top: 0.55rem;
    color: #746f66;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .kp-svelte-catalogue-exemplar__eyebrow {
    color: #746f66;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
</style>
