<script lang="ts">
  import { untrack } from "svelte";

  import {
    KP_ANIMATION_CATALOGUE_STAGE_RESERVATION
  } from "../animation-catalogue-stage-reservation.ts";
  import {
    projectKpAnimationCatalogueResultRows
  } from "../animation-catalogue-result-projection.ts";
  import {
    reduceKpAnimationCatalogueHostView,
    type KpAnimationCatalogueSelectedHostViewModel
  } from "../animation-catalogue-host-view-model.ts";
  import type {
    KpSvelteCatalogueHostState
  } from "./svelte-catalogue-host-state.ts";

  let { state: hostState }: {
    state: KpSvelteCatalogueHostState;
  } = $props();
  let view = $state<KpAnimationCatalogueSelectedHostViewModel | undefined>(
    untrack(() => hostState.status === "selected" ? hostState.view : undefined)
  );
  let resultRows = $derived(view === undefined
    ? []
    : projectKpAnimationCatalogueResultRows({
        entries: view.entries,
        selectedAnimationId: view.entry.animationId,
        selectedHealth: view.health,
        query: view.chrome.query
      }));

  function filterResults(event: Event): void {
    if (view === undefined || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }
    view = reduceKpAnimationCatalogueHostView(view, {
      kind: "filter",
      query: event.currentTarget.value
    });
  }
</script>

{#if hostState.status === "selected" && view !== undefined}
  <main
    class="kp-animation-catalogue-shell"
    data-kp-svelte-catalogue-shell
    data-kp-animation-catalogue
    data-kp-animation-catalogue-state="selected"
    data-kp-animation-catalogue-selection={view.entry.animationId}
    data-kp-animation-catalogue-pack-id={view.entry.packId}
    data-kp-animation-catalogue-selected-health={view.health.status}
    data-kp-animation-catalogue-human-disposition={view.entry.humanDisposition}
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
          value={view.chrome.query}
          oninput={filterResults}
          placeholder="Search artifacts"
          aria-label="Search artifacts"
          autocomplete="off"
          data-action="filter-animation-catalogue"
        />
        <ol
          class="kp-animation-catalogue-shell__result-list"
          data-kp-animation-catalogue-results
          data-kp-animation-catalogue-result-count={resultRows.length}
        >
          {#each resultRows as result (result.entry.animationId)}
            <li
              class="kp-animation-catalogue-shell__result"
              data-kp-animation-catalogue-row={result.entry.animationId}
              data-kp-animation-catalogue-row-selected={result.selected
                ? "true"
                : undefined}
            >
              <a
                class="kp-animation-catalogue-shell__result-link"
                href={result.href}
                aria-current={result.selected ? "page" : undefined}
              >
                <span class="kp-animation-catalogue-shell__result-title">
                  {result.entry.title}
                </span>
                <span class="kp-animation-catalogue-shell__result-meta">
                  <span>{result.domainLabel}</span>
                  <span
                    class="kp-animation-catalogue-shell__health"
                    data-kp-animation-catalogue-health={result.healthStatus}
                    data-kp-animation-catalogue-health-evidence={result.healthEvidence}
                  >{result.healthLabel}</span>
                </span>
              </a>
            </li>
          {/each}
        </ol>
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
          <strong>{view.entry.title}</strong> is selected.
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
        <p>{view.entry.summary}</p>
      </section>
    </aside>
  </main>
{:else if hostState.status !== "selected"}
  <main
    class="kp-animation-catalogue-bootstrap"
    data-kp-svelte-catalogue-shell
    data-kp-animation-catalogue
    data-kp-animation-catalogue-state={hostState.status}
    data-kp-animation-catalogue-selection={hostState.animationId}
    aria-label="Animation catalogue"
    aria-busy={hostState.status === "loading"}
  >
    <section
      class="kp-animation-catalogue-bootstrap__stage"
      data-kp-animation-catalogue-stage-reservation={KP_ANIMATION_CATALOGUE_STAGE_RESERVATION}
      aria-label="Selected animation stage"
    >
      {#if hostState.status === "loading"}
        <p role="status">Preparing {hostState.title}…</p>
      {:else if hostState.status === "not-found"}
        <p role="alert">Artifact <code>{hostState.animationId}</code> was not found.</p>
      {:else}
        <p role="alert">{hostState.message}</p>
      {/if}
    </section>
  </main>
{/if}
