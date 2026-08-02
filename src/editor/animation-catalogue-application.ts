import "../styles.css";
import "./animation-catalogue-shell.css";

import { loadKpAnimationAsset } from "../animation/catalog-loader.ts";
import {
  economicsEquilibriumAnimationId
} from "../animation/economics-equilibrium-adapter.ts";
import {
  constantForceWorkEnergyAnimationId
} from "../animation/constant-force-work-energy-adapter.ts";
import {
  installKpAnimationHostStatus,
  markKpAnimationHostFailed,
  markKpAnimationHostLoading,
  markKpAnimationHostReady
} from "../rendering/animation-host-status.ts";
import { renderKpAnimationCatalogueBootstrap } from
  "./animation-catalogue-bootstrap.ts";
import {
  applyKpAnimationCatalogueObservedHealth,
  renderKpAnimationCatalogueInspector,
  renderKpAnimationCatalogueResults,
  renderKpAnimationCatalogueShell
} from "./animation-catalogue-shell.ts";
import {
  deriveKpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueSelectedHostViewModel
} from "./animation-catalogue-host-view-model.ts";
import {
  observeKpAnimationCatalogueHost
} from "./animation-catalogue-host-observation.ts";
import {
  deriveKpAnimationCatalogueHostOutcome
} from "./animation-catalogue-host-outcome.ts";
import {
  decideKpAnimationCatalogueLinkNavigation,
  resolveKpAnimationCatalogueHistoryNavigation
} from "./animation-catalogue-navigation.ts";
import {
  createKpAnimationCatalogueProjection,
  type KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "./animation-catalogue-route.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "./animation-catalogue-selection.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability
} from "./animation-catalogue-surface-hostability.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import {
  KP_EDITOR_ANIMATION_FRAME_EVENT,
  KP_EDITOR_ANIMATION_LOAD_EVENT,
  applyKpEditorAnimationPresentationTuning,
  disposeKpEditorAnimationPlayers,
  hydrateKpEditorAnimationPlayers,
  pauseKpEditorAnimationPlayers,
  replaceKpEditorAnimationPlaybackAsset
} from "./animation-player-controller.ts";
import {
  createKpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import {
  dispatchKpEditorAnimationSurface
} from "./animation-surface-dispatch.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./animation-player-shell.ts";
import {
  hydrateKpEditorAnimationSurfaces,
  kpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import { registerKpEditorDiagramSvgAdapter } from "./diagram-svg-adapter.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation,
  readKpEconomicsEquilibriumParameters,
  writeKpEconomicsEquilibriumParameters
} from "./economics-equilibrium-parameters.ts";
import {
  createKpConstantForceWorkEnergyParameterState,
  createParameterizedConstantForceWorkEnergyAnimation,
  readKpConstantForceWorkEnergyParameters,
  writeKpConstantForceWorkEnergyParameters
} from "./constant-force-work-energy-parameters.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities,
  type KpEditorSelectedSurfaceCapability
} from "./selected-surface-capability.ts";
import {
  loadKpAnimationCatalogueDevelopmentReview
} from "./animation-catalogue-review-capture-loader.ts";
import {
  kpVerifiedGeneratedLinearSolveAnimationId
} from "../tutorial/verified-generated-linear-solve-identity.ts";

type GeneratedLinearSolveReaderClient = typeof import(
  "./verified-generated-linear-solve-reader.ts"
);
type EquationSurfaceCapabilityClient = typeof import(
  "./equation-surface-capability.ts"
);
type GraphSvgSurfaceCapabilityClient = typeof import(
  "./graph-svg-surface-capability.ts"
);
type Graph3DSurfaceCapabilityClient = typeof import(
  "./graph-3d-surface-capability.ts"
);
type ProgrammingSurfaceCapabilityClient = typeof import(
  "./programming-surface-capability.ts"
);

export function mountKpAnimationCatalogueApplication(
  root: HTMLElement
): () => void {
  const application = new KpAnimationCatalogueApplication(root);
  application.mount();
  return () => application.dispose();
}

class KpAnimationCatalogueApplication {
  readonly #root: HTMLElement;
  readonly #projection = createKpAnimationCatalogueProjection();
  readonly #descriptors = createKpEditorAnimationLibrary();
  readonly #events = new AbortController();
  #revision = 0;
  #disposed = false;
  #disposeReview: (() => void) | undefined;
  #disposeHostEvidence: (() => void) | undefined;
  #generatedReaderPromise: Promise<GeneratedLinearSolveReaderClient> | undefined;
  #equationCapabilityPromise: Promise<EquationSurfaceCapabilityClient> | undefined;
  #graphSvgCapabilityPromise: Promise<GraphSvgSurfaceCapabilityClient> | undefined;
  #graph3DCapabilityPromise: Promise<Graph3DSurfaceCapabilityClient> | undefined;
  #programmingCapabilityPromise:
    Promise<ProgrammingSurfaceCapabilityClient> | undefined;

  constructor(root: HTMLElement) {
    this.#root = root;
  }

  mount(): void {
    if (this.#root.dataset["kpAnimationCatalogueApplication"] === "mounted") {
      throw new Error("Animation catalogue application is already mounted.");
    }
    this.#root.dataset["kpAnimationCatalogueApplication"] = "mounted";
    installKpAnimationHostStatus(window, "kp.application");
    registerKpEditorDiagramSvgAdapter();
    const options = { signal: this.#events.signal };
    this.#root.addEventListener("click", this.#handleClick, options);
    this.#root.addEventListener("change", this.#handleChange, options);
    this.#root.addEventListener("input", this.#handleInput, options);
    this.#root.addEventListener("keydown", this.#handleKeydown, options);
    this.#root.addEventListener(
      KP_EDITOR_ANIMATION_LOAD_EVENT,
      this.#handlePlayerLoad,
      options
    );
    this.#root.addEventListener(
      KP_EDITOR_ANIMATION_FRAME_EVENT,
      this.#handlePlayerFrame,
      options
    );
    window.addEventListener("popstate", this.#handlePopstate, options);
    window.addEventListener("pagehide", this.#handlePagehide, options);
    document.addEventListener("visibilitychange", this.#handleVisibility, options);
    void this.#renderFromLocation();
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#events.abort();
    this.#disposeReview?.();
    this.#disposeReview = undefined;
    this.#disposeHostEvidenceObserver();
    disposeKpEditorAnimationPlayers(this.#root);
    delete this.#root.dataset["kpAnimationCatalogueApplication"];
  }

  readonly #handlePagehide = (): void => this.dispose();

  readonly #handleVisibility = (): void => {
    if (document.hidden) pauseKpEditorAnimationPlayers(this.#root);
  };

  readonly #handlePopstate = (): void => {
    const decision = resolveKpAnimationCatalogueHistoryNavigation({
      projection: this.#projection,
      href: window.location.href
    });
    const shell = this.#root.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    if (decision.action === "select" && shell !== null) {
      void this.#renderSelectionInShell({
        shell,
        entry: decision.entry,
        playhead: decision.playhead
      });
      return;
    }
    void this.#renderFromLocation();
  };

  readonly #handlePlayerLoad = (event: Event): void => {
    if (
      !(event instanceof CustomEvent) ||
      !(event.target instanceof HTMLElement) ||
      event.target.closest("[data-kp-animation-catalogue]") === null ||
      typeof event.detail !== "object" || event.detail === null
    ) return;
    const detail = event.detail as {
      readonly status?: unknown;
      readonly message?: unknown;
    };
    if (detail.status === "ready") {
      markKpAnimationHostReady(window);
    } else if (detail.status === "failed") {
      markKpAnimationHostFailed(
        window,
        typeof detail.message === "string"
          ? detail.message
          : "Animation player failed to load."
      );
    }
  };

  readonly #handlePlayerFrame = (event: Event): void => {
    if (
      !(event instanceof CustomEvent) ||
      !(event.target instanceof HTMLElement) ||
      event.target.closest("[data-kp-animation-catalogue]") === null ||
      typeof event.detail !== "object" || event.detail === null
    ) return;
    const progress = (event.detail as { readonly progress?: unknown }).progress;
    if (typeof progress !== "number") return;
    const route = readKpAnimationCatalogueRoute(window.location.search);
    const search = writeKpAnimationCatalogueRoute(window.location.search, {
      artifactId: route.artifactId,
      playhead: progress
    });
    if (search !== window.location.search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search}${window.location.hash}`
      );
    }
  };

  readonly #handleClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>(
      "a.kp-animation-catalogue-shell__result-link"
    );
    const shell = link?.closest<HTMLElement>("[data-kp-animation-catalogue]");
    const currentAnimationId =
      shell?.dataset["kpAnimationCatalogueSelection"];
    if (
      link !== null && link !== undefined && shell !== null &&
      shell !== undefined && currentAnimationId !== undefined
    ) {
      const decision = decideKpAnimationCatalogueLinkNavigation({
        projection: this.#projection,
        currentAnimationId,
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
      window.history.pushState(null, "", decision.href);
      void this.#renderSelectionInShell({
        shell,
        entry: decision.entry,
        playhead: decision.playhead
      });
      return;
    }
    const button = event.target.closest<HTMLButtonElement>(
      "button[data-action]"
    );
    if (button?.dataset["action"] === "toggle-animation-catalogue-overlay") {
      this.#toggleOverlay(button);
    }
  };

  readonly #handleChange = (event: Event): void => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    if (event.target.dataset["action"] ===
      "select-animation-catalogue-inspector") {
      this.#selectInspector(event.target);
    } else if (event.target.dataset["action"] ===
      "tune-animation-catalogue") {
      this.#tunePresentation(event.target);
    }
  };

  readonly #handleInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    switch (event.target.dataset["action"]) {
      case "filter-animation-catalogue":
        this.#filterFromInput(event.target);
        return;
      case "set-economics-demand-intercept":
        this.#updateEconomics(event.target);
        return;
      case "set-physics-net-force":
        this.#updatePhysics(event.target);
        return;
    }
  };

  readonly #handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.#closeOverlay(event.target)) {
      event.preventDefault();
    }
  };

  async #renderFromLocation(): Promise<void> {
    const revision = ++this.#revision;
    this.#disposeHostEvidenceObserver();
    disposeKpEditorAnimationPlayers(this.#root);
    const route = readKpAnimationCatalogueRoute(window.location.search);
    if (!route.active) {
      window.location.reload();
      return;
    }
    const selection = resolveKpAnimationCatalogueSelection({
      projection: this.#projection,
      artifactId: route.artifactId
    });
    if (selection.status === "not-found") {
      this.#root.innerHTML = renderKpAnimationCatalogueBootstrap({
        status: "not-found",
        animationId: selection.requestedArtifactId
      });
      markKpAnimationHostReady(window);
      return;
    }
    const { entry } = selection;
    markKpAnimationHostLoading(window, `catalogue.${entry.animationId}`);
    this.#root.innerHTML = renderKpAnimationCatalogueBootstrap({
      status: "loading",
      animationId: entry.animationId,
      title: entry.title
    });
    try {
      const prepared = await this.#prepareSelection({
        entry,
        playhead: route.playhead
      });
      if (this.#disposed || revision !== this.#revision) return;
      this.#root.innerHTML = renderKpAnimationCatalogueShell(
        createKpAnimationCatalogueSelectedHostViewModel({
          entry,
          health: prepared.health,
          entries: this.#projection.entries,
          descriptor: prepared.descriptor,
          player: prepared.player,
          economicsParameters: prepared.economicsParameters,
          physicsParameters: prepared.physicsParameters,
          readerCompanion: prepared.readerCompanion
        })
      );
      const shell = this.#root.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      if (shell === null) throw new Error("Catalogue shell did not mount.");
      this.#hydrateSelection({
        shell,
        entry,
        hostability: prepared.hostability,
        animation: prepared.animation
      });
      void this.#mountReview(revision);
    } catch (error: unknown) {
      if (this.#disposed || revision !== this.#revision) return;
      const message = error instanceof Error
        ? error.message
        : "The selected catalogue asset failed to load.";
      this.#root.innerHTML = renderKpAnimationCatalogueBootstrap({
        status: "error",
        animationId: entry.animationId,
        message
      });
      markKpAnimationHostFailed(window, message);
    }
  }

  async #renderSelectionInShell(input: {
    readonly shell: HTMLElement;
    readonly entry: KpAnimationCatalogueEntry;
    readonly playhead?: number | undefined;
  }): Promise<void> {
    const revision = ++this.#revision;
    const stage = input.shell.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage]"
    );
    const inspector = input.shell.querySelector<HTMLElement>(
      '[data-kp-animation-catalogue-region="inspector"]'
    );
    const results = input.shell.querySelector<HTMLOListElement>(
      "[data-kp-animation-catalogue-results]"
    );
    const search = input.shell.querySelector<HTMLInputElement>(
      '[data-action="filter-animation-catalogue"]'
    );
    const inspectorMode = input.shell.querySelector<HTMLSelectElement>(
      '[data-action="select-animation-catalogue-inspector"]'
    )?.value;
    const focus = captureFocus(input.shell);
    const resultsViewport = results?.closest<HTMLElement>(
      ".kp-animation-catalogue-shell__rail-results"
    );
    const scrollTop = resultsViewport?.scrollTop;
    if (stage === null || inspector === null || results === null) {
      window.location.assign(window.location.href);
      return;
    }
    markKpAnimationHostLoading(window, `catalogue.${input.entry.animationId}`);
    this.#disposeHostEvidenceObserver();
    disposeKpEditorAnimationPlayers(stage);
    setStageMessage(stage, `Loading ${input.entry.title}…`, "loading");
    try {
      const prepared = await this.#prepareSelection(input);
      if (this.#disposed || revision !== this.#revision ||
        !input.shell.isConnected) return;
      input.shell.dataset["kpAnimationCatalogueSelection"] =
        input.entry.animationId;
      input.shell.dataset["kpAnimationCatalogueSelectedHealth"] =
        prepared.health.status;
      input.shell.dataset["kpAnimationCatalogueHumanDisposition"] =
        input.entry.humanDisposition;
      if (prepared.economicsParameters === undefined) {
        delete input.shell.dataset["kpEconomicsDemandIntercept"];
      } else {
        input.shell.dataset["kpEconomicsDemandIntercept"] = String(
          prepared.economicsParameters.demandInterceptAfter
        );
      }
      if (prepared.physicsParameters === undefined) {
        delete input.shell.dataset["kpPhysicsNetForceNewtons"];
      } else {
        input.shell.dataset["kpPhysicsNetForceNewtons"] = String(
          prepared.physicsParameters.netForceNewtons
        );
      }
      delete input.shell.dataset["kpAnimationCatalogueHostOutcome"];
      stage.removeAttribute("aria-busy");
      stage.dataset["kpAnimationCatalogueStageState"] = "selected";
      stage.innerHTML = renderKpEditorAnimationPlayerShell({
        descriptor: prepared.descriptor,
        player: prepared.player,
        chrome: "catalogue"
      });
      inspector.innerHTML = renderKpAnimationCatalogueInspector({
        entry: input.entry,
        health: prepared.health,
        economicsParameters: prepared.economicsParameters,
        physicsParameters: prepared.physicsParameters,
        readerCompanion: prepared.readerCompanion
      });
      const nextInspector = inspector.querySelector<HTMLSelectElement>(
        '[data-action="select-animation-catalogue-inspector"]'
      );
      if (nextInspector !== null &&
        (inspectorMode === "details" || inspectorMode === "parameters" ||
          inspectorMode === "tuning" || inspectorMode === "explanation")) {
        nextInspector.value = inspectorMode;
        this.#selectInspector(nextInspector);
      }
      results.outerHTML = renderKpAnimationCatalogueResults({
        entries: this.#projection.entries,
        selectedAnimationId: input.entry.animationId,
        selectedHealth: prepared.health,
        query: search?.value
      });
      const nextViewport = input.shell.querySelector(
        "[data-kp-animation-catalogue-results]"
      )?.closest<HTMLElement>(".kp-animation-catalogue-shell__rail-results");
      if (nextViewport !== null && nextViewport !== undefined &&
        scrollTop !== undefined) nextViewport.scrollTop = scrollTop;
      this.#hydrateSelection({
        shell: input.shell,
        entry: input.entry,
        hostability: prepared.hostability,
        animation: prepared.animation
      });
      restoreFocus(input.shell, focus);
      void this.#mountReview(revision);
    } catch (error: unknown) {
      if (this.#disposed || revision !== this.#revision ||
        !input.shell.isConnected) return;
      const message = error instanceof Error
        ? error.message
        : "The selected catalogue asset failed to load.";
      setStageMessage(stage, message, "error");
      markKpAnimationHostFailed(window, message);
    }
  }

  async #prepareSelection(input: {
    readonly entry: KpAnimationCatalogueEntry;
    readonly playhead?: number | undefined;
  }) {
    const descriptor = this.#descriptors.find(
      ({ id }) => id === input.entry.primaryDescriptorId
    );
    if (descriptor === undefined) {
      throw new Error(
        `Catalogue entry ${input.entry.animationId} is missing descriptor ` +
        `${input.entry.primaryDescriptorId}.`
      );
    }
    // Pack data and paint code are independent until the first sampled frame;
    // starting both here removes a network round trip on direct artifact URLs.
    const [loaded] = await Promise.all([
      loadKpAnimationAsset(input.entry.animationId),
      this.#loadSelectedCapabilities({
        animationId: input.entry.animationId,
        slotKinds: dispatchKpEditorAnimationSurface(descriptor).slotKinds
      })
    ]);
    if (loaded.animation.id !== input.entry.animationId ||
      loaded.packId !== input.entry.packId) {
      throw new Error(
        `Loaded catalogue asset ${loaded.animation.id} from ${loaded.packId}; ` +
        `expected ${input.entry.animationId} from ${input.entry.packId}.`
      );
    }
    const economicsParameters = input.entry.animationId ===
        economicsEquilibriumAnimationId
      ? readKpEconomicsEquilibriumParameters(window.location.search)
      : undefined;
    const physicsParameters = input.entry.animationId ===
        constantForceWorkEnergyAnimationId
      ? readKpConstantForceWorkEnergyParameters(window.location.search)
      : undefined;
    const animation = economicsParameters !== undefined
      ? createParameterizedEconomicsEquilibriumAnimation(economicsParameters)
          .animation
      : physicsParameters !== undefined
        ? createParameterizedConstantForceWorkEnergyAnimation(physicsParameters)
            .animation
        : loaded.animation;
    const readerCompanion = input.entry.animationId ===
        kpVerifiedGeneratedLinearSolveAnimationId
      ? (await this.#loadGeneratedReader())
          .createKpVerifiedGeneratedLinearSolveReaderCompanion()
      : undefined;
    const catalog = loaded.catalog.some(({ id }) => id === animation.id)
      ? loaded.catalog.map((candidate) =>
          candidate.id === animation.id ? animation : candidate
        )
      : [...loaded.catalog, animation];
    const player = createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress: input.playhead ?? 0
    });
    const hostability = inspectKpAnimationCatalogueSurfaceHostability({
      state: player,
      registry: kpEditorAnimationSurfaceAdapterRegistry
    });
    return {
      animation,
      descriptor,
      player,
      economicsParameters,
      physicsParameters,
      readerCompanion,
      hostability,
      health: deriveKpAnimationCatalogueHealth({
        hostability,
        hostObservation: { status: "not-observed" }
      })
    } as const;
  }

  #hydrateSelection(input: {
    readonly shell: HTMLElement;
    readonly entry: KpAnimationCatalogueEntry;
    readonly hostability: ReturnType<
      typeof inspectKpAnimationCatalogueSurfaceHostability
    >;
    readonly animation: Awaited<
      ReturnType<typeof loadKpAnimationAsset>
    >["animation"];
  }): void {
    this.#disposeHostEvidenceObserver();
    hydrateKpEditorAnimationSurfaces(input.shell);
    const player = input.shell.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    const stage = input.shell.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage]"
    );
    let observer: MutationObserver | undefined;
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      player?.removeEventListener(
        KP_EDITOR_ANIMATION_FRAME_EVENT,
        publish
      );
      if (this.#disposeHostEvidence === dispose) {
        this.#disposeHostEvidence = undefined;
      }
    };
    const publish = () => {
      if (input.shell.dataset["kpAnimationCatalogueSelection"] !==
        input.entry.animationId) return;
      const hostObservation = observeKpAnimationCatalogueHost(input.shell);
      const hostOutcome = deriveKpAnimationCatalogueHostOutcome({
        entry: input.entry,
        hostability: input.hostability,
        hostObservation
      });
      if (hostOutcome === undefined) return;
      dispose();
      applyKpAnimationCatalogueObservedHealth({
        shell: input.shell,
        entry: input.entry,
        health: deriveKpAnimationCatalogueHealth({
          hostability: input.hostability,
          hostObservation
        })
      });
      input.shell.dataset["kpAnimationCatalogueHostOutcome"] =
        hostOutcome.status;
    };
    if (stage !== null) {
      observer = new MutationObserver(publish);
      observer.observe(stage, { attributes: true, childList: true, subtree: true });
    }
    player?.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, publish, {
      once: true
    });
    this.#disposeHostEvidence = dispose;
    hydrateKpEditorAnimationPlayers(input.shell, {
      animationOverrides: [input.animation]
    });
  }

  #disposeHostEvidenceObserver(): void {
    this.#disposeHostEvidence?.();
    this.#disposeHostEvidence = undefined;
  }

  async #loadSelectedCapabilities(input: {
    readonly animationId: string;
    readonly slotKinds: Parameters<
      typeof deriveKpEditorSelectedSurfaceCapabilities
    >[0]["slotKinds"];
  }): Promise<void> {
    await Promise.all(
      deriveKpEditorSelectedSurfaceCapabilities(input)
        .map((capability) => this.#loadCapability(capability))
    );
  }

  #loadCapability(
    capability: KpEditorSelectedSurfaceCapability
  ): Promise<unknown> {
    if (capability === "equation-katex") {
      return this.#equationCapabilityPromise ??= import(
        "./equation-surface-capability.ts"
      ).then((client) => {
        if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
          ({ id }) => id === "editor-animation-surface.equation.katex"
        )) client.registerKpEditorEquationSurfaceCapability();
        return client;
      });
    }
    if (capability === "graph-webgl-3d") {
      return this.#graph3DCapabilityPromise ??= import(
        "./graph-3d-surface-capability.ts"
      ).then((client) => {
        if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
          ({ id }) => id === "editor-animation-surface.graph.webgl-3d"
        )) client.registerKpEditorGraph3DSurfaceCapability();
        return client;
      });
    }
    if (capability === "programming-trace") {
      return this.#programmingCapabilityPromise ??= import(
        "./programming-surface-capability.ts"
      ).then((client) => {
        if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
          ({ id }) => id === "editor-animation-surface.programming.trace"
        )) client.registerKpEditorProgrammingSurfaceCapability();
        return client;
      });
    }
    return this.#graphSvgCapabilityPromise ??= import(
      "./graph-svg-surface-capability.ts"
    ).then((client) => {
      if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
        ({ id }) => id === "editor-animation-surface.graph.svg"
      )) client.registerKpEditorGraphSvgSurfaceCapability();
      return client;
    });
  }

  #loadGeneratedReader(): Promise<GeneratedLinearSolveReaderClient> {
    return this.#generatedReaderPromise ??= import(
      "./verified-generated-linear-solve-reader.ts"
    );
  }

  async #mountReview(revision: number): Promise<void> {
    if (loadKpAnimationCatalogueDevelopmentReview === undefined ||
      this.#disposeReview !== undefined) return;
    const client = await loadKpAnimationCatalogueDevelopmentReview();
    if (this.#disposed || revision !== this.#revision ||
      this.#disposeReview !== undefined) return;
    // The provider reads the current shell at capture time, so remounting on
    // selection would only discard the user's unsent review draft and focus.
    this.#disposeReview = client.mountKpAnimationCatalogueDevReview(window);
  }

  #filterFromInput(input: HTMLInputElement): void {
    const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
    const results = shell?.querySelector<HTMLOListElement>(
      "[data-kp-animation-catalogue-results]"
    );
    const selectedAnimationId =
      shell?.dataset["kpAnimationCatalogueSelection"];
    const selectedStatus = shell?.dataset["kpAnimationCatalogueSelectedHealth"];
    if (results === null || results === undefined ||
      selectedAnimationId === undefined ||
      (selectedStatus !== "ready" && selectedStatus !== "review" &&
        selectedStatus !== "broken")) return;
    results.outerHTML = renderKpAnimationCatalogueResults({
      entries: this.#projection.entries,
      selectedAnimationId,
      selectedHealth: {
        schemaVersion: "kp.animation-catalogue-health.v1",
        kind: "animation-catalogue-health",
        animationId: selectedAnimationId,
        status: selectedStatus,
        reasons: []
      },
      query: input.value
    });
  }

  #toggleOverlay(button: HTMLButtonElement): void {
    const shell = button.closest<HTMLElement>("[data-kp-animation-catalogue]");
    const target = button.dataset["kpAnimationCatalogueOverlayTarget"];
    if (shell === null || (target !== "rail" && target !== "inspector")) return;
    const next = shell.dataset["kpAnimationCatalogueOverlay"] === target
      ? undefined
      : target;
    if (next === undefined) delete shell.dataset["kpAnimationCatalogueOverlay"];
    else shell.dataset["kpAnimationCatalogueOverlay"] = next;
    shell.querySelectorAll<HTMLButtonElement>(
      '[data-action="toggle-animation-catalogue-overlay"]'
    ).forEach((candidate) => candidate.setAttribute(
      "aria-expanded",
      String(candidate.dataset["kpAnimationCatalogueOverlayTarget"] === next)
    ));
    if (next !== undefined) {
      const panel = shell.querySelector<HTMLElement>(
        next === "rail" ? "#kp-animation-catalogue-rail" :
          "#kp-animation-catalogue-inspector"
      );
      setTimeout(() => panel?.querySelector<HTMLElement>(
        "input, select, button, a"
      )?.focus(), 0);
    }
  }

  #closeOverlay(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    const shell = target.closest<HTMLElement>("[data-kp-animation-catalogue]");
    if (shell === null ||
      shell.dataset["kpAnimationCatalogueOverlay"] === undefined) return false;
    const openTarget = shell.dataset["kpAnimationCatalogueOverlay"];
    delete shell.dataset["kpAnimationCatalogueOverlay"];
    shell.querySelectorAll<HTMLButtonElement>(
      '[data-action="toggle-animation-catalogue-overlay"]'
    ).forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      if (button.dataset["kpAnimationCatalogueOverlayTarget"] === openTarget) {
        button.focus();
      }
    });
    return true;
  }

  #selectInspector(select: HTMLSelectElement): void {
    const view = select.closest<HTMLElement>(
      "[data-kp-animation-catalogue-inspector-view]"
    );
    if (view === null || ![
      "details", "parameters", "tuning", "explanation"
    ].includes(select.value)) return;
    view.dataset["kpAnimationCatalogueInspectorView"] = select.value;
    view.querySelectorAll<HTMLElement>(
      "[data-kp-animation-catalogue-inspector-panel]"
    ).forEach((panel) => {
      panel.hidden = panel.dataset["kpAnimationCatalogueInspectorPanel"] !==
        select.value;
    });
  }

  #tunePresentation(select: HTMLSelectElement): void {
    const kind = select.dataset["kpAnimationCatalogueTuning"];
    if (kind !== "gestalt-style" && kind !== "focus-experiment") return;
    const player = this.#root.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue] [data-kp-editor-animation-player]"
    );
    if (player !== null) {
      applyKpEditorAnimationPresentationTuning(player, kind, select.value);
    }
  }

  #updateEconomics(input: HTMLInputElement): void {
    const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
    if (shell?.dataset["kpAnimationCatalogueSelection"] !==
      economicsEquilibriumAnimationId) return;
    const player = shell.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    if (player === null) return;
    const state = createKpEconomicsEquilibriumParameterState(input.value);
    const parameterized = createParameterizedEconomicsEquilibriumAnimation(state);
    replaceKpEditorAnimationPlaybackAsset(player, parameterized.animation);
    input.value = String(state.demandInterceptAfter);
    shell.dataset["kpEconomicsDemandIntercept"] =
      String(state.demandInterceptAfter);
    input.closest("[data-kp-economics-parameters]")
      ?.querySelector<HTMLOutputElement>(
        "[data-kp-economics-demand-intercept-output]"
      )?.replaceChildren(document.createTextNode(
        String(state.demandInterceptAfter)
      ));
    const search = writeKpEconomicsEquilibriumParameters({
      search: window.location.search,
      state
    });
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
  }

  #updatePhysics(input: HTMLInputElement): void {
    const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
    if (shell?.dataset["kpAnimationCatalogueSelection"] !==
      constantForceWorkEnergyAnimationId) return;
    const player = shell.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    if (player === null) return;
    const state = createKpConstantForceWorkEnergyParameterState(input.value);
    const parameterized = createParameterizedConstantForceWorkEnergyAnimation(state);
    replaceKpEditorAnimationPlaybackAsset(player, parameterized.animation);
    input.value = String(state.netForceNewtons);
    shell.dataset["kpPhysicsNetForceNewtons"] = String(state.netForceNewtons);
    input.closest("[data-kp-physics-work-energy-parameters]")
      ?.querySelector<HTMLOutputElement>("[data-kp-physics-net-force-output]")
      ?.replaceChildren(document.createTextNode(`${state.netForceNewtons} N`));
    const search = writeKpConstantForceWorkEnergyParameters({
      search: window.location.search,
      state
    });
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
  }
}

function setStageMessage(
  stage: HTMLElement,
  message: string,
  state: "loading" | "error"
): void {
  stage.dataset["kpAnimationCatalogueStageState"] = state;
  stage.setAttribute("aria-busy", String(state === "loading"));
  const status = document.createElement("p");
  status.className = "kp-animation-catalogue-shell__stage-status";
  status.setAttribute("role", state === "error" ? "alert" : "status");
  status.textContent = message;
  stage.replaceChildren(status);
}

type FocusSnapshot = Readonly<{
  element: HTMLElement;
  target:
    | { kind: "player" }
    | { kind: "inspector-view" }
    | { kind: "tuning"; tuning: string }
    | { kind: "row"; animationId: string };
}>;

function captureFocus(shell: HTMLElement): FocusSnapshot | undefined {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement) || !shell.contains(element)) return;
  if (element.closest("[data-kp-editor-animation-player]") !== null) {
    return { element, target: { kind: "player" } };
  }
  if (element.dataset["action"] === "select-animation-catalogue-inspector") {
    return { element, target: { kind: "inspector-view" } };
  }
  const tuning = element.dataset["kpAnimationCatalogueTuning"];
  if (tuning !== undefined) {
    return { element, target: { kind: "tuning", tuning } };
  }
  const row = element.closest<HTMLElement>("[data-kp-animation-catalogue-row]");
  const animationId = row?.dataset["kpAnimationCatalogueRow"];
  return animationId === undefined
    ? undefined
    : { element, target: { kind: "row", animationId } };
}

function restoreFocus(
  shell: HTMLElement,
  snapshot: FocusSnapshot | undefined
): void {
  if (snapshot === undefined || snapshot.element.isConnected ||
    (document.activeElement !== document.body &&
      document.activeElement !== shell.closest("#app"))) return;
  const target = snapshot.target.kind === "player"
    ? shell.querySelector<HTMLElement>("[data-kp-editor-animation-player]")
    : snapshot.target.kind === "inspector-view"
      ? shell.querySelector<HTMLElement>(
          '[data-action="select-animation-catalogue-inspector"]'
        )
      : snapshot.target.kind === "tuning"
        ? shell.querySelector<HTMLElement>(
            `[data-kp-animation-catalogue-tuning="${snapshot.target.tuning}"]`
          )
        : shell.querySelector<HTMLElement>(
            `[data-kp-animation-catalogue-row="${snapshot.target.animationId}"] a`
          );
  target?.focus({ preventScroll: true });
}
