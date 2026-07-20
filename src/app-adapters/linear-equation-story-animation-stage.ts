import {
  symbolicFirstLinearEquationPresentation
} from "./linear-equation-exemplar-presentation.ts";

export interface KpLinearEquationStoryAnimationStage {
  readonly animationId: "animation.linear-solve.solve-x";
  readonly player: HTMLElement;
  setProgress(progress: number): void;
  getProgress(): number;
  dispose(): void;
}

export async function createLinearEquationStoryAnimationStage(
  root: HTMLElement
): Promise<KpLinearEquationStoryAnimationStage> {
  const [libraryModule, shellModule, controllerModule, registryModule, equationModule] =
    await Promise.all([
      import("../editor/animation-library.ts"),
      import("../editor/animation-player-shell.ts"),
      import("../editor/animation-player-controller.ts"),
      import("../editor/animation-surface-adapter-registry.ts"),
      import("../editor/equation-surface-adapter.ts")
    ]);
  const animationId = symbolicFirstLinearEquationPresentation.canonicalAnimation.runtimeId;
  const descriptor = libraryModule.createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === animationId
  );
  if (descriptor === undefined) {
    throw new Error(`The symbolic story cannot find its canonical animation ${animationId}.`);
  }

  const mount = document.createElement("div");
  mount.dataset["kpSymbolicStoryAnimationMount"] = "true";
  mount.innerHTML = shellModule.renderKpEditorAnimationPlayerShell({ descriptor });
  const player = requiredElement(
    mount,
    "[data-kp-editor-animation-player]",
    "canonical animation player"
  );
  player.dataset["kpSymbolicStoryPlayer"] = "true";
  player.tabIndex = -1;
  [...player.children].forEach((element) => {
    if (element instanceof HTMLElement &&
      element.dataset["kpEditorAnimationStage"] === undefined) element.hidden = true;
  });

  root.dataset["kpSymbolicStoryStage"] = "true";
  root.replaceChildren(mount);

  // The local registry keeps this concept-room adapter independent from the
  // editor application's mutable singleton registration lifecycle.
  const registry = registryModule.createKpEditorAnimationSurfaceAdapterRegistry([
    equationModule.kpEditorEquationSurfaceAdapter
  ]);
  registryModule.hydrateKpEditorAnimationSurfaces(root, registry);
  controllerModule.hydrateKpEditorAnimationPlayers(root);
  await waitForHydration(player);

  let disposed = false;
  return {
    animationId,
    player,
    setProgress(progress) {
      if (disposed) throw new Error("Symbolic story animation stage is disposed.");
      controllerModule.dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: clamp01(progress)
      });
    },
    getProgress() {
      return Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controllerModule.disposeKpEditorAnimationPlayers(root);
      root.replaceChildren();
      delete root.dataset["kpSymbolicStoryStage"];
    }
  };
}

function requiredElement(
  root: ParentNode,
  selector: string,
  label: string
): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`Symbolic story stage is missing its ${label}.`);
  return element;
}

function waitForHydration(player: HTMLElement): Promise<void> {
  if (player.dataset["kpEditorAnimationHydrated"] === "true") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const check = () => {
      // A newer shell render may replace this host while its lazy asset is loading.
      // Treat detachment as cancellation so stale work cannot reject globally.
      if (!player.isConnected) {
        resolve();
        return;
      }
      if (player.dataset["kpEditorAnimationLoadError"] === "true") {
        reject(new Error("The canonical symbolic story animation failed to load."));
        return;
      }
      if (player.dataset["kpEditorAnimationHydrated"] === "true") {
        resolve();
        return;
      }
      if (performance.now() - startedAt >= 5_000) {
        reject(new Error("Timed out while hydrating the symbolic story animation."));
        return;
      }
      window.requestAnimationFrame(check);
    };
    window.requestAnimationFrame(check);
  });
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
