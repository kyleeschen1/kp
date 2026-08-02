<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import {
    KP_ANIMATION_CATALOGUE_STAGE_RESERVATION
  } from "../animation-catalogue-stage-reservation.ts";
  import {
    projectKpAnimationCatalogueResultRows
  } from "../animation-catalogue-result-projection.ts";
  import {
    createKpAnimationCatalogueSelectedHostViewModel,
    reduceKpAnimationCatalogueHostView,
    replaceKpAnimationCatalogueHostHealth,
    type KpAnimationCatalogueSelectedHostViewModel
  } from "../animation-catalogue-host-view-model.ts";
  import {
    decideKpAnimationCatalogueLinkNavigation,
    resolveKpAnimationCatalogueHistoryNavigation
  } from "../animation-catalogue-navigation.ts";
  import {
    writeKpAnimationCatalogueRoute
  } from "../animation-catalogue-route.ts";
  import {
    selectKpAnimationCatalogueInspector,
    tuneKpAnimationCataloguePresentation
  } from "../animation-catalogue-inspector-host.ts";
  import {
    captureKpAnimationCatalogueFocus,
    closeKpAnimationCatalogueOverlay,
    readKpAnimationCatalogueRailScroll,
    restoreKpAnimationCatalogueFocus,
    restoreKpAnimationCatalogueRailScroll,
    toggleKpAnimationCatalogueOverlay
  } from "../animation-catalogue-interaction-host.ts";
  import {
    mountKpAnimationCataloguePlayerHost
  } from "../animation-catalogue-player-host.ts";
  import {
    renderKpEditorAnimationPlayerShell
  } from "../animation-player-shell.ts";
  import {
    KP_EDITOR_ANIMATION_FRAME_EVENT
  } from "../animation-player-controller.ts";
  import {
    applyKpAnimationCatalogueObservedHealth,
    renderKpAnimationCatalogueInspector
  } from "../animation-catalogue-shell.ts";
  import type {
    KpSvelteCatalogueHostState,
    KpSvelteCatalogueSelectionHost
  } from "./svelte-catalogue-host-state.ts";
  import {
    KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM,
    KP_SVELTE_CATALOGUE_EXEMPLAR_VALUE
  } from "./svelte-catalogue-exemplar-route.ts";

  type SelectedHostState = Extract<
    KpSvelteCatalogueHostState,
    { readonly status: "selected" }
  >;

  let { state: hostState }: {
    state: KpSvelteCatalogueHostState;
  } = $props();
  const initialSelection = untrack((): SelectedHostState | undefined =>
    hostState.status === "selected" ? hostState : undefined
  );
  let selection = $state<SelectedHostState | undefined>(initialSelection);
  let view = $state<KpAnimationCatalogueSelectedHostViewModel | undefined>(
    initialSelection?.view
  );
  let shell = $state<HTMLElement | undefined>();
  let hostOutcome = $state<string | undefined>();
  let stageState = $state<"selected" | "loading" | "error">(
    initialSelection === undefined ? "loading" : "selected"
  );
  let stageMessage = $state("");
  let selectionRevision = 0;
  let disposed = false;
  let playerHtml = $derived(selection === undefined
    ? ""
    : renderKpEditorAnimationPlayerShell({
        descriptor: selection.view.descriptor,
        player: selection.view.player,
        chrome: "catalogue"
      }));
  let inspectorHtml = $state(initialSelection === undefined
    ? ""
    : renderKpAnimationCatalogueInspector(initialSelection.view));
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

  function changeInspector(event: Event): void {
    if (view === undefined || shell === undefined ||
      !(event.target instanceof HTMLSelectElement)) return;
    if (event.target.dataset["action"] ===
      "select-animation-catalogue-inspector") {
      const inspectorView = selectKpAnimationCatalogueInspector(event.target);
      if (inspectorView !== undefined) {
        view = reduceKpAnimationCatalogueHostView(view, {
          kind: "select-inspector",
          view: inspectorView
        });
      }
      return;
    }
    if (event.target.dataset["action"] === "tune-animation-catalogue") {
      tuneKpAnimationCataloguePresentation(shell, event.target);
    }
  }

  function selectResult(event: MouseEvent): void {
    if (view === undefined || selection === undefined ||
      !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>(
      "a.kp-animation-catalogue-shell__result-link"
    );
    if (link === null) return;
    const decision = decideKpAnimationCatalogueLinkNavigation({
      projection: selection.selectionHost.projection,
      currentAnimationId: view.entry.animationId,
      currentHref: window.location.href,
      href: link.href,
      event: {
        defaultPrevented: event.defaultPrevented,
        button: event.button,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      },
      target: link.target,
      download: link.hasAttribute("download")
    });
    if (decision.action === "native") return;
    event.preventDefault();
    if (decision.action === "stay") return;
    const href = withSvelteExemplarOptIn(decision.href);
    window.history.pushState(null, "", href);
    void prepareSelection({
      entry: decision.entry,
      playhead: decision.playhead,
      search: new URL(href, window.location.href).search,
      selectionHost: selection.selectionHost
    });
  }

  function toggleOverlay(event: MouseEvent): void {
    if (view === undefined || !(event.currentTarget instanceof HTMLButtonElement)) {
      return;
    }
    const target = event.currentTarget.dataset[
      "kpAnimationCatalogueOverlayTarget"
    ];
    if (target !== "rail" && target !== "inspector") return;
    toggleKpAnimationCatalogueOverlay(event.currentTarget);
    view = reduceKpAnimationCatalogueHostView(view, {
      kind: "toggle-overlay",
      target
    });
  }

  function closeOverlay(event: KeyboardEvent): void {
    if (event.key !== "Escape" || view === undefined ||
      !closeKpAnimationCatalogueOverlay(event.target)) return;
    event.preventDefault();
    view = reduceKpAnimationCatalogueHostView(view, {
      kind: "close-overlay"
    });
  }

  function replacePlayhead(event: Event): void {
    if (!(event instanceof CustomEvent) ||
      !(event.target instanceof HTMLElement) ||
      event.target.closest("[data-kp-svelte-catalogue-shell]") !== shell ||
      typeof event.detail !== "object" || event.detail === null) return;
    const progress = (event.detail as { readonly progress?: unknown }).progress;
    if (typeof progress !== "number" || view === undefined) return;
    const search = writeKpAnimationCatalogueRoute(window.location.search, {
      artifactId: view.entry.animationId,
      playhead: progress
    });
    if (search !== window.location.search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search}${window.location.hash}`
      );
    }
  }

  function restoreHistorySelection(): void {
    if (selection === undefined) return;
    const decision = resolveKpAnimationCatalogueHistoryNavigation({
      projection: selection.selectionHost.projection,
      href: window.location.href
    });
    if (decision.action !== "select") {
      window.location.assign(window.location.href);
      return;
    }
    void prepareSelection({
      entry: decision.entry,
      playhead: decision.playhead,
      search: window.location.search,
      selectionHost: selection.selectionHost
    });
  }

  async function prepareSelection(input: {
    readonly entry: SelectedHostState["view"]["entry"];
    readonly playhead?: number | undefined;
    readonly search: string;
    readonly selectionHost: KpSvelteCatalogueSelectionHost;
  }): Promise<void> {
    const revision = ++selectionRevision;
    const focus = shell === undefined
      ? undefined
      : captureKpAnimationCatalogueFocus(shell);
    const scrollTop = shell === undefined
      ? undefined
      : readKpAnimationCatalogueRailScroll(shell);
    stageState = "loading";
    stageMessage = `Loading ${input.entry.title}…`;
    hostOutcome = undefined;
    try {
      const prepared = await input.selectionHost.prepare({
        entry: input.entry,
        search: input.search,
        playhead: input.playhead
      });
      if (disposed || revision !== selectionRevision) return;
      const inspectorView = view?.chrome.inspectorView === "explanation" &&
        prepared.readerCompanion === undefined
          ? "details"
          : view?.chrome.inspectorView ?? "details";
      const nextView = createKpAnimationCatalogueSelectedHostViewModel({
        entry: input.entry,
        health: prepared.health,
        entries: input.selectionHost.projection.entries,
        descriptor: prepared.descriptor,
        player: prepared.player,
        economicsParameters: prepared.economicsParameters,
        physicsParameters: prepared.physicsParameters,
        readerCompanion: prepared.readerCompanion,
        chrome: {
          query: view?.chrome.query ?? "",
          inspectorView,
          overlay: view?.chrome.overlay
        }
      });
      selection = {
        status: "selected",
        view: nextView,
        animation: prepared.animation,
        hostability: prepared.hostability,
        selectionHost: input.selectionHost
      };
      view = nextView;
      inspectorHtml = renderKpAnimationCatalogueInspector(nextView);
      stageState = "selected";
      await tick();
      if (shell !== undefined && revision === selectionRevision) {
        restoreKpAnimationCatalogueRailScroll(shell, scrollTop);
        restoreKpAnimationCatalogueFocus(shell, focus);
      }
    } catch (error: unknown) {
      if (disposed || revision !== selectionRevision) return;
      stageState = "error";
      stageMessage = error instanceof Error
        ? error.message
        : "The selected catalogue asset failed to load.";
    }
  }

  $effect(() => {
    if (selection === undefined || stageState !== "selected" ||
      shell === undefined) return;
    const mountedShell = shell;
    const mountedSelection = selection;
    return mountKpAnimationCataloguePlayerHost({
      shell: mountedShell,
      entry: mountedSelection.view.entry,
      hostability: mountedSelection.hostability,
      animation: mountedSelection.animation,
      onObserved(observation) {
        if (view === undefined ||
          view.entry.animationId !== observation.health.animationId) return;
        view = replaceKpAnimationCatalogueHostHealth(view, observation.health);
        applyKpAnimationCatalogueObservedHealth({
          shell: mountedShell,
          entry: view.entry,
          health: observation.health
        });
        hostOutcome = observation.outcome.status;
      }
    });
  });

  onMount(() => {
    const mountedShell = shell;
    if (mountedShell === undefined) return;
    mountedShell.addEventListener(
      KP_EDITOR_ANIMATION_FRAME_EVENT,
      replacePlayhead
    );
    mountedShell.addEventListener("keydown", closeOverlay);
    window.addEventListener("popstate", restoreHistorySelection);
    return () => {
      mountedShell.removeEventListener(
        KP_EDITOR_ANIMATION_FRAME_EVENT,
        replacePlayhead
      );
      mountedShell.removeEventListener("keydown", closeOverlay);
      window.removeEventListener("popstate", restoreHistorySelection);
    };
  });

  onDestroy(() => {
    disposed = true;
    selectionRevision += 1;
  });

  function withSvelteExemplarOptIn(href: string): string {
    const destination = new URL(href, window.location.href);
    destination.searchParams.set(
      KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM,
      KP_SVELTE_CATALOGUE_EXEMPLAR_VALUE
    );
    return `${destination.pathname}${destination.search}${destination.hash}`;
  }
</script>

{#if hostState.status === "selected" && view !== undefined}
  <main
    bind:this={shell}
    class="kp-animation-catalogue-shell"
    data-kp-svelte-catalogue-shell
    data-kp-animation-catalogue
    data-kp-animation-catalogue-state="selected"
    data-kp-animation-catalogue-selection={view.entry.animationId}
    data-kp-animation-catalogue-pack-id={view.entry.packId}
    data-kp-animation-catalogue-selected-health={view.health.status}
    data-kp-animation-catalogue-human-disposition={view.entry.humanDisposition}
    data-kp-animation-catalogue-host-outcome={hostOutcome}
    data-kp-animation-catalogue-overlay={view.chrome.overlay}
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
                onclick={selectResult}
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
          aria-expanded={view.chrome.overlay === "rail"}
          onclick={toggleOverlay}
        >Artifacts</button>
        <button
          type="button"
          data-action="toggle-animation-catalogue-overlay"
          data-kp-animation-catalogue-overlay-target="inspector"
          aria-controls="kp-animation-catalogue-inspector"
          aria-expanded={view.chrome.overlay === "inspector"}
          onclick={toggleOverlay}
        >Info</button>
      </div>
      <div
        class="kp-animation-catalogue-shell__stage-host"
        data-kp-animation-catalogue-stage
        data-kp-animation-catalogue-stage-persistent="true"
        data-kp-animation-catalogue-stage-state={stageState}
        aria-busy={stageState === "loading"}
      >
        {#if stageState === "loading"}
          <p class="kp-animation-catalogue-shell__stage-status" role="status">
            {stageMessage}
          </p>
        {:else if stageState === "error"}
          <p class="kp-animation-catalogue-shell__stage-status" role="alert">
            {stageMessage}
          </p>
        {:else}
          {@html playerHtml}
        {/if}
      </div>
    </section>
    <aside
      id="kp-animation-catalogue-inspector"
      class="kp-animation-catalogue-shell__inspector"
      data-kp-animation-catalogue-region="inspector"
      aria-label="Artifact inspector"
      onchange={changeInspector}
    >
      {@html inspectorHtml}
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
