<script lang="ts">
  import {
    KP_ANIMATION_CATALOGUE_STAGE_RESERVATION
  } from "../animation-catalogue-stage-reservation.ts";
  import {
    renderKpAnimationCatalogueResults
  } from "../animation-catalogue-shell.ts";
  import type {
    KpSvelteCatalogueHostState
  } from "./svelte-catalogue-host-state.ts";

  let { state }: {
    state: KpSvelteCatalogueHostState;
  } = $props();
</script>

{#if state.status === "selected"}
  <main
    class="kp-animation-catalogue-shell"
    data-kp-svelte-catalogue-shell
    data-kp-animation-catalogue
    data-kp-animation-catalogue-state="selected"
    data-kp-animation-catalogue-selection={state.view.entry.animationId}
    data-kp-animation-catalogue-pack-id={state.view.entry.packId}
    data-kp-animation-catalogue-selected-health={state.view.health.status}
    data-kp-animation-catalogue-human-disposition={state.view.entry.humanDisposition}
    aria-labelledby="kp-animation-catalogue-title"
  >
    <h1
      id="kp-animation-catalogue-title"
      class="kp-animation-catalogue-shell__visually-hidden"
    >Animation catalogue</h1>
    <aside
      id="kp-animation-catalogue-rail"
      class="kp-animation-catalogue-shell__rail"
      data-kp-animation-catalogue-region="rail"
      aria-label="Artifact catalogue"
    >
      <div class="kp-animation-catalogue-shell__rail-results">
        <p class="kp-animation-catalogue-shell__label">Artifacts</p>
        <input
          class="kp-animation-catalogue-shell__search"
          type="search"
          value={state.view.chrome.query}
          placeholder="Search artifacts"
          aria-label="Search artifacts"
          autocomplete="off"
          data-action="filter-animation-catalogue"
        />
        {@html renderKpAnimationCatalogueResults({
          entries: state.view.entries,
          selectedAnimationId: state.view.entry.animationId,
          selectedHealth: state.view.health,
          query: state.view.chrome.query
        })}
      </div>
      <div
        class="kp-animation-catalogue-shell__review-slot"
        data-kp-animation-catalogue-review-dock
        aria-hidden="true"
      ></div>
    </aside>
    <section
      class="kp-animation-catalogue-shell__stage"
      data-kp-animation-catalogue-region="stage"
      data-kp-animation-catalogue-stage-reservation={KP_ANIMATION_CATALOGUE_STAGE_RESERVATION}
      aria-label="Selected animation stage"
    >
      <div
        class="kp-animation-catalogue-shell__narrow-nav"
        aria-label="Catalogue panels"
      >
        <button
          type="button"
          data-action="toggle-animation-catalogue-overlay"
          data-kp-animation-catalogue-overlay-target="rail"
          aria-controls="kp-animation-catalogue-rail"
          aria-expanded="false"
        >Artifacts</button>
        <button
          type="button"
          data-action="toggle-animation-catalogue-overlay"
          data-kp-animation-catalogue-overlay-target="inspector"
          aria-controls="kp-animation-catalogue-inspector"
          aria-expanded="false"
        >Info</button>
      </div>
      <div
        class="kp-animation-catalogue-shell__stage-host"
        data-kp-animation-catalogue-stage
        data-kp-animation-catalogue-stage-persistent="true"
      >
        <p class="kp-animation-catalogue-shell__stage-status" role="status">
          <strong>{state.view.entry.title}</strong> is selected.
        </p>
      </div>
    </section>
    <aside
      id="kp-animation-catalogue-inspector"
      class="kp-animation-catalogue-shell__inspector"
      data-kp-animation-catalogue-region="inspector"
      aria-label="Artifact inspector"
    >
      <section aria-labelledby="kp-svelte-catalogue-details-title">
        <h3 id="kp-svelte-catalogue-details-title">Details</h3>
        <p>{state.view.entry.summary}</p>
      </section>
    </aside>
  </main>
{:else}
  <main
    class="kp-animation-catalogue-bootstrap"
    data-kp-svelte-catalogue-shell
    data-kp-animation-catalogue
    data-kp-animation-catalogue-state={state.status}
    data-kp-animation-catalogue-selection={state.animationId}
    aria-label="Animation catalogue"
    aria-busy={state.status === "loading"}
  >
    <section
      class="kp-animation-catalogue-bootstrap__stage"
      data-kp-animation-catalogue-stage-reservation={KP_ANIMATION_CATALOGUE_STAGE_RESERVATION}
      aria-label="Selected animation stage"
    >
      {#if state.status === "loading"}
        <p role="status">Preparing {state.title}…</p>
      {:else if state.status === "not-found"}
        <p role="alert">Artifact <code>{state.animationId}</code> was not found.</p>
      {:else}
        <p role="alert">{state.message}</p>
      {/if}
    </section>
  </main>
{/if}
