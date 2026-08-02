import "../styles.css";
import "./animation-catalogue-shell.css";

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
  createKpAnimationCatalogueSelectedHostViewModel
} from "./animation-catalogue-host-view-model.ts";
import {
  selectKpAnimationCatalogueInspector,
  tuneKpAnimationCataloguePresentation
} from "./animation-catalogue-inspector-host.ts";
import {
  captureKpAnimationCatalogueFocus,
  closeKpAnimationCatalogueOverlay,
  readKpAnimationCatalogueRailScroll,
  restoreKpAnimationCatalogueFocus,
  restoreKpAnimationCatalogueRailScroll,
  toggleKpAnimationCatalogueOverlay
} from "./animation-catalogue-interaction-host.ts";
import {
  mountKpAnimationCataloguePlayerHost
} from "./animation-catalogue-player-host.ts";
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
  createKpAnimationCatalogueSelectionPreparationService,
  type KpAnimationCataloguePreparedSelection
} from "./animation-catalogue-selection-preparation.ts";
import {
  createKpAnimationCatalogueReviewHost
} from "./animation-catalogue-review-host.ts";
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import {
  KP_EDITOR_ANIMATION_FRAME_EVENT,
  KP_EDITOR_ANIMATION_LOAD_EVENT,
  disposeKpEditorAnimationPlayers,
  pauseKpEditorAnimationPlayers,
  replaceKpEditorAnimationPlaybackAsset
} from "./animation-player-controller.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./animation-player-shell.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation,
  writeKpEconomicsEquilibriumParameters
} from "./economics-equilibrium-parameters.ts";
import {
  createKpConstantForceWorkEnergyParameterState,
  createParameterizedConstantForceWorkEnergyAnimation,
  writeKpConstantForceWorkEnergyParameters
} from "./constant-force-work-energy-parameters.ts";

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
  readonly #selectionPreparation =
    createKpAnimationCatalogueSelectionPreparationService({
      descriptors: this.#descriptors
    });
  readonly #events = new AbortController();
  readonly #reviewHost = createKpAnimationCatalogueReviewHost();
  #revision = 0;
  #disposed = false;
  #disposeHostEvidence: (() => void) | undefined;

  constructor(root: HTMLElement) {
    this.#root = root;
  }

  mount(): void {
    if (this.#root.dataset["kpAnimationCatalogueApplication"] === "mounted") {
      throw new Error("Animation catalogue application is already mounted.");
    }
    this.#root.dataset["kpAnimationCatalogueApplication"] = "mounted";
    installKpAnimationHostStatus(window, "kp.application");
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
    this.#reviewHost.dispose();
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
      const prepared = await this.#selectionPreparation.prepare({
        entry,
        search: window.location.search,
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
      void this.#mountReview();
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
    const focus = captureKpAnimationCatalogueFocus(input.shell);
    const scrollTop = readKpAnimationCatalogueRailScroll(input.shell);
    if (stage === null || inspector === null || results === null) {
      window.location.assign(window.location.href);
      return;
    }
    markKpAnimationHostLoading(window, `catalogue.${input.entry.animationId}`);
    this.#disposeHostEvidenceObserver();
    disposeKpEditorAnimationPlayers(stage);
    setStageMessage(stage, `Loading ${input.entry.title}…`, "loading");
    try {
      const prepared = await this.#selectionPreparation.prepare({
        ...input,
        search: window.location.search
      });
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
      restoreKpAnimationCatalogueRailScroll(input.shell, scrollTop);
      this.#hydrateSelection({
        shell: input.shell,
        entry: input.entry,
        hostability: prepared.hostability,
        animation: prepared.animation
      });
      restoreKpAnimationCatalogueFocus(input.shell, focus);
      void this.#mountReview();
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

  #hydrateSelection(input: {
    readonly shell: HTMLElement;
    readonly entry: KpAnimationCatalogueEntry;
    readonly hostability:
      KpAnimationCataloguePreparedSelection["hostability"];
    readonly animation: KpAnimationCataloguePreparedSelection["animation"];
  }): void {
    this.#disposeHostEvidenceObserver();
    const dispose = mountKpAnimationCataloguePlayerHost({
      ...input,
      onObserved({ health, outcome }) {
        applyKpAnimationCatalogueObservedHealth({
          shell: input.shell,
          entry: input.entry,
          health
        });
        input.shell.dataset["kpAnimationCatalogueHostOutcome"] =
          outcome.status;
      }
    });
    this.#disposeHostEvidence = dispose;
  }

  #disposeHostEvidenceObserver(): void {
    this.#disposeHostEvidence?.();
    this.#disposeHostEvidence = undefined;
  }

  async #mountReview(): Promise<void> {
    await this.#reviewHost.mount();
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
    toggleKpAnimationCatalogueOverlay(button);
  }

  #closeOverlay(target: EventTarget | null): boolean {
    return closeKpAnimationCatalogueOverlay(target);
  }

  #selectInspector(select: HTMLSelectElement): void {
    selectKpAnimationCatalogueInspector(select);
  }

  #tunePresentation(select: HTMLSelectElement): void {
    tuneKpAnimationCataloguePresentation(this.#root, select);
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
