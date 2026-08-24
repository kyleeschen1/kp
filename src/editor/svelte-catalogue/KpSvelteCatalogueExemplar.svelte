<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import {
    KP_ANIMATION_CATALOGUE_STAGE_RESERVATION
  } from "../animation-catalogue-stage-reservation.ts";
  import {
    projectKpAnimationCatalogueResultRows
  } from "../animation-catalogue-result-projection.ts";
  import {
    findKpCrossDomainGalleryExecutableCase,
    KP_CROSS_DOMAIN_GALLERY_COLLECTION
  } from "../cross-domain-gallery-collection.ts";
  import {
    createKpAnimationCatalogueSelectedHostViewModel,
    reduceKpAnimationCatalogueHostView,
    replaceKpAnimationCatalogueHostHealth,
    replaceKpAnimationCatalogueHostParameters,
    type KpAnimationCatalogueSelectedHostViewModel
  } from "../animation-catalogue-host-view-model.ts";
  import {
    projectKpAnimationCatalogueDisplaySettings,
    updateKpAnimationCatalogueDisplaySettings
  } from "../animation-catalogue-display-settings.ts";
  import {
    readKpAnimationDevelopmentUrlState,
    writeKpAnimationDevelopmentUrlState,
    type KpAnimationDevelopmentDisplaySettings,
    type KpAnimationDevelopmentTheme,
    type KpAnimationDevelopmentUrlState
  } from "../animation-development-url-state.ts";
  import {
    applyKpAnimationCatalogueParameterInput
  } from "../animation-catalogue-parameter-host.ts";
  import {
    decideKpAnimationCatalogueLinkNavigation,
    resolveKpAnimationCatalogueHistoryNavigation
  } from "../animation-catalogue-navigation.ts";
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
    KP_EDITOR_ANIMATION_FRAME_EVENT,
    pauseKpEditorAnimationPlayers,
    resampleKpEditorAnimationPlayers
  } from "../animation-player-controller.ts";
  import {
    createKpAnimationUrlReplaceScheduler,
    readKpAnimationPlayheadHistoryState,
    writeKpAnimationPlayheadHistoryState,
    type KpAnimationUrlReplaceScheduler
  } from "../animation-playhead-url-policy.ts";
  import {
    applyKpAnimationCatalogueObservedHealth,
    renderKpAnimationCatalogueInspector
  } from "../animation-catalogue-shell.ts";
  import type {
    KpSvelteCatalogueHostState,
    KpSvelteCatalogueSelectionHost
  } from "./svelte-catalogue-host-state.ts";

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
  let playheadUrlScheduler: KpAnimationUrlReplaceScheduler | undefined;
  let manualSeekActive = false;
  const initialUrlState = readKpAnimationDevelopmentUrlState(
    window.location.href
  );
  let routePresentation = $state<{
    readonly theme: KpAnimationDevelopmentTheme;
    readonly display: KpAnimationDevelopmentDisplaySettings;
  }>({
    theme: initialUrlState.theme,
    display: initialUrlState.display
  });
  let playerHtml = $derived(selection === undefined
    ? ""
    : renderKpEditorAnimationPlayerShell({
        descriptor: selection.view.descriptor,
        player: selection.view.player,
        chrome: "catalogue"
      }));
  let inspectorHtml = $state(initialSelection === undefined
    ? ""
    : renderSelectedInspector(initialSelection.view));
  let resultRows = $derived(view === undefined
    ? []
    : projectKpAnimationCatalogueResultRows({
        entries: view.entries,
        selectedAnimationId: view.entry.animationId,
        selectedHealth: view.health,
        query: view.chrome.query
      }));
  let generatedThrough = $derived(view === undefined
    ? undefined
    : findKpCrossDomainGalleryExecutableCase(view.entry.animationId));

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
      const display = updateKpAnimationCatalogueDisplaySettings({
        current: routePresentation.display,
        select: event.target
      });
      if (display !== undefined) {
        replaceUrlPresentation({
          theme: routePresentation.theme,
          display
        });
      }
    }
  }

  function inputParameter(event: Event): void {
    if (view === undefined || !(event.target instanceof HTMLInputElement)) {
      return;
    }
    const update = applyKpAnimationCatalogueParameterInput(event.target);
    if (update !== undefined) {
      view = replaceKpAnimationCatalogueHostParameters(view, update);
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
    const current = currentUrlState();
    if (current === undefined) return;
    const href = writeKpAnimationDevelopmentUrlState({
      baseUrl: window.location.href,
      state: {
        ...current,
        view: "animation-catalogue",
        viewSource: "explicit",
        artifactId: decision.entry.animationId,
        checkpointId: undefined,
        playhead: decision.playhead
      }
    });
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
    const detail = event.detail as {
      readonly animationId?: unknown;
      readonly progress?: unknown;
    };
    if (
      typeof detail.animationId !== "string" ||
      typeof detail.progress !== "number" ||
      view === undefined
    ) return;
    const animationId = detail.animationId;
    const progress = detail.progress;
    const replace = () => {
      if (
        disposed ||
        view === undefined ||
        view.entry.animationId !== animationId
      ) return;
      const current = currentUrlState();
      if (current === undefined) return;
      const href = writeKpAnimationDevelopmentUrlState({
        baseUrl: window.location.href,
        state: {
          ...current,
          view: "animation-catalogue",
          viewSource: "explicit",
          artifactId: animationId,
          playhead: progress
        }
      });
      if (href !== window.location.href) {
        window.history.replaceState(
          writeKpAnimationPlayheadHistoryState({
            currentState: window.history.state,
            animationId,
            progress
          }),
          "",
          href
        );
      }
    };
    if (manualSeekActive) playheadUrlScheduler?.defer(replace);
    else playheadUrlScheduler?.request(replace);
  }

  function restoreHistorySelection(): void {
    if (selection === undefined) return;
    const decision = resolveKpAnimationCatalogueHistoryNavigation({
      projection: selection.selectionHost.projection,
      href: window.location.href
    });
    if (decision.action === "leave-catalogue" &&
      readKpAnimationDevelopmentUrlState(window.location.href).view ===
        "coverage") {
      return;
    }
    if (decision.action !== "select") {
      window.location.assign(window.location.href);
      return;
    }
    syncRoutePresentation(window.location.href);
    void prepareSelection({
      entry: decision.entry,
      playhead: readKpAnimationPlayheadHistoryState({
        state: window.history.state,
        animationId: decision.entry.animationId
      }) ?? decision.playhead,
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
    syncRoutePresentation(input.search);
    // Capture chrome intent at the selection boundary. Paint observations may
    // replace the current view while the selected pack is loading, but they
    // must not reset the inspector choice that initiated this transition.
    const retainedInspectorView = view?.chrome.inspectorView ?? "details";
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
      const inspectorView = retainedInspectorView === "explanation" &&
        prepared.readerCompanion === undefined
          ? "details"
          : retainedInspectorView;
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
      inspectorHtml = renderSelectedInspector(nextView);
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

  function renderSelectedInspector(
    selected: KpAnimationCatalogueSelectedHostViewModel
  ): string {
    return renderKpAnimationCatalogueInspector({
      entry: selected.entry,
      health: selected.health,
      economicsParameters: selected.economicsParameters,
      physicsParameters: selected.physicsParameters,
      readerCompanion: selected.readerCompanion,
      view: selected.chrome.inspectorView
    });
  }

  function currentUrlState(): KpAnimationDevelopmentUrlState | undefined {
    const state = readKpAnimationDevelopmentUrlState(window.location.href);
    return state.view === "animation-catalogue" ? state : undefined;
  }

  function replaceUrlPresentation(next: {
    readonly theme: KpAnimationDevelopmentTheme;
    readonly display: KpAnimationDevelopmentDisplaySettings;
  }): void {
    const current = currentUrlState();
    if (current === undefined) return;
    const href = writeKpAnimationDevelopmentUrlState({
      baseUrl: window.location.href,
      state: {
        ...current,
        view: "animation-catalogue",
        viewSource: "explicit",
        theme: next.theme,
        display: next.display
      }
    });
    routePresentation = next;
    if (href !== window.location.href) {
      window.history.replaceState(null, "", href);
    }
  }

  function syncRoutePresentation(href: string): void {
    const state = readKpAnimationDevelopmentUrlState(
      new URL(href, window.location.href)
    );
    routePresentation = {
      theme: state.theme,
      display: state.display
    };
  }

  $effect(() => {
    if (selection === undefined || shell === undefined) return;
    const mountedShell = shell;
    const mountedSelection = selection;
    return mountKpAnimationCataloguePlayerHost({
      shell: mountedShell,
      entry: mountedSelection.view.entry,
      descriptor: mountedSelection.view.descriptor,
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

  $effect(() => {
    if (shell === undefined || selection === undefined) return;
    projectKpAnimationCatalogueDisplaySettings({
      shell,
      display: routePresentation.display
    });
  });

  onMount(() => {
    const mountedShell = shell;
    if (mountedShell === undefined) return;
    const ownerDocument = mountedShell.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    playheadUrlScheduler = createKpAnimationUrlReplaceScheduler();
    const pauseForBackground = (): void => {
      pauseKpEditorAnimationPlayers(mountedShell);
    };
    const pauseWhenHidden = (): void => {
      if (ownerDocument.hidden) pauseForBackground();
    };
    const beginManualSeek = (event: Event): void => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.dataset["action"] === "seek-editor-animation"
      ) manualSeekActive = true;
    };
    const flushSettledPlayhead = (event: Event): void => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.dataset["action"] === "seek-editor-animation"
      ) {
        manualSeekActive = false;
        playheadUrlScheduler?.flush();
      }
    };
    const flushAnimationControl = (event: Event): void => {
      if (
        event.target instanceof Element &&
        event.target.closest("button[data-action]") !== null
      ) playheadUrlScheduler?.flush();
    };
    mountedShell.addEventListener(
      KP_EDITOR_ANIMATION_FRAME_EVENT,
      replacePlayhead
    );
    mountedShell.addEventListener("input", beginManualSeek, { capture: true });
    mountedShell.addEventListener("keydown", closeOverlay);
    mountedShell.addEventListener("change", flushSettledPlayhead);
    mountedShell.addEventListener("click", flushAnimationControl);
    ownerDocument.addEventListener("visibilitychange", pauseWhenHidden);
    ownerWindow?.addEventListener("pagehide", pauseForBackground);
    window.addEventListener("popstate", restoreHistorySelection);
    const syncDevelopmentTheme = async (): Promise<void> => {
      syncRoutePresentation(window.location.href);
      await tick();
      // Adapters resolve host-owned paint at render time. Re-sample only after
      // Svelte has projected the new theme so a paused frame changes endpoint.
      resampleKpEditorAnimationPlayers(mountedShell);
    };
    window.addEventListener(
      "kp-development-theme-change",
      syncDevelopmentTheme
    );
    pauseWhenHidden();
    return () => {
      mountedShell.removeEventListener(
        KP_EDITOR_ANIMATION_FRAME_EVENT,
        replacePlayhead
      );
      mountedShell.removeEventListener("input", beginManualSeek, {
        capture: true
      });
      mountedShell.removeEventListener("keydown", closeOverlay);
      mountedShell.removeEventListener("change", flushSettledPlayhead);
      mountedShell.removeEventListener("click", flushAnimationControl);
      ownerDocument.removeEventListener("visibilitychange", pauseWhenHidden);
      ownerWindow?.removeEventListener("pagehide", pauseForBackground);
      window.removeEventListener("popstate", restoreHistorySelection);
      window.removeEventListener(
        "kp-development-theme-change",
        syncDevelopmentTheme
      );
      playheadUrlScheduler?.dispose();
      playheadUrlScheduler = undefined;
    };
  });

  onDestroy(() => {
    disposed = true;
    selectionRevision += 1;
  });
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
    data-kp-economics-demand-intercept={view.economicsParameters
      ?.demandInterceptAfter}
    data-kp-physics-net-force-newtons={view.physicsParameters?.netForceNewtons}
    data-kp-animation-catalogue-host-outcome={hostOutcome}
    data-kp-animation-catalogue-overlay={view.chrome.overlay}
    data-kp-animation-catalogue-inspector-view={view.chrome.inspectorView}
    data-kp-animation-catalogue-theme={routePresentation.theme}
    data-kp-animation-catalogue-style={routePresentation.display.style}
    data-kp-animation-catalogue-focus={routePresentation.display.focus}
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
        <details
          class="kp-animation-catalogue-shell__gallery-collection"
          data-kp-cross-domain-gallery-collection={KP_CROSS_DOMAIN_GALLERY_COLLECTION.id}
          open
        >
          <summary>
            <span>{KP_CROSS_DOMAIN_GALLERY_COLLECTION.title}</span>
            <span>{KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.length} cases</span>
          </summary>
          <p>{KP_CROSS_DOMAIN_GALLERY_COLLECTION.summary}</p>
          <ol>
            {#each KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases as galleryCase (galleryCase.caseId)}
              <li
                data-kp-cross-domain-gallery-case={galleryCase.caseId}
                data-kp-cross-domain-gallery-status={galleryCase.status}
              >
                {#if galleryCase.status === "executable"}
                  <a
                    class="kp-animation-catalogue-shell__gallery-link kp-animation-catalogue-shell__result-link"
                    href={galleryCase.href}
                    aria-current={galleryCase.animationId === view.entry.animationId
                      ? "page"
                      : undefined}
                    onclick={selectResult}
                  >
                    <span>{galleryCase.title}</span>
                    <small>{galleryCase.domainLabel}</small>
                  </a>
                {:else}
                  <span class="kp-animation-catalogue-shell__gallery-gap">
                    <span>{galleryCase.title}</span>
                    <small>{galleryCase.domainLabel} · intentionally refused</small>
                  </span>
                {/if}
              </li>
            {/each}
          </ol>
        </details>
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
        {#if selection !== undefined}
          {@html playerHtml}
        {/if}
        {#if stageState === "loading"}
          <p class="kp-animation-catalogue-shell__stage-status" role="status">
            {stageMessage}
          </p>
        {:else if stageState === "error"}
          <p class="kp-animation-catalogue-shell__stage-status" role="alert">
            {stageMessage}
          </p>
        {:else if selection === undefined}
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
      oninput={inputParameter}
    >
      {#if generatedThrough !== undefined}
        <section
          class="kp-animation-catalogue-shell__generated-through"
          data-kp-cross-domain-gallery-disclosure={generatedThrough.caseId}
          data-kp-cross-domain-gallery-frontend={generatedThrough.frontendId}
          aria-labelledby="kp-cross-domain-gallery-disclosure-title"
        >
          <h3 id="kp-cross-domain-gallery-disclosure-title">Generated through</h3>
          <p>{generatedThrough.teachingIntent}</p>
          <dl>
            <div>
              <dt>Verified by</dt>
              <dd>{generatedThrough.verifiedByLabel}</dd>
            </div>
            <div>
              <dt>Capability</dt>
              <dd>{generatedThrough.capabilityLabel}</dd>
            </div>
            <div>
              <dt>Transformation</dt>
              <dd>{generatedThrough.operationLabel}</dd>
            </div>
          </dl>
          <p>{generatedThrough.explanation}</p>
          <a href={generatedThrough.href}>Open direct Catalogue link</a>
        </section>
      {/if}
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
