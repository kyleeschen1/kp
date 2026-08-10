import "../../styles.css";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../../animation/fraction-composition-equation-adapter.ts";
import {
  createKpEditorAnimationDescriptor
} from "../../editor/animation-descriptor.ts";
import {
  KP_EDITOR_ANIMATION_FRAME_EVENT,
  dispatchKpEditorAnimationPlaybackAction,
  disposeKpEditorAnimationPlayer,
  hydrateKpPreparedEditorAnimationPlayer
} from "../../editor/animation-player-controller.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "../../editor/animation-player-shell.ts";
import {
  hydrateKpEditorAnimationSurfaces,
  kpEditorAnimationSurfaceAdapterRegistry
} from "../../editor/animation-surface-adapter-registry.ts";
import {
  registerKpEditorEquationSurfaceCapability
} from "../../editor/equation-surface-capability.ts";
import type {
  KpArticleStageManifest
} from "../../article/kp-article-stage-manifest.ts";
import {
  createKpFractionCompositionArticleRuntimeCheckpoints,
  createKpFractionCompositionArticleRuntimeRanges,
  type KpFractionCompositionArticleRuntimeCheckpoint,
  type KpFractionCompositionArticleRuntimeRange
} from "./fraction-composition-runtime-ranges.ts";
import {
  resolveKpFractionCompositionArticleSemanticReference
} from "./fraction-composition-semantic-navigation.ts";

export interface KpFractionCompositionArticleRuntimeSession {
  readonly player: HTMLElement;
  readonly ranges: readonly KpFractionCompositionArticleRuntimeRange[];
  readonly checkpoints:
    readonly KpFractionCompositionArticleRuntimeCheckpoint[];
  readonly seekRange: (path: string, progress: number) => void;
  readonly seekCheckpoint: (path: string) => void;
  readonly setSemanticFocus: (addresses: readonly string[]) => void;
  readonly dispose: () => void;
}

export async function mountKpFractionCompositionArticleRuntime(input: {
  readonly host: HTMLElement;
  readonly manifest: KpArticleStageManifest;
}): Promise<KpFractionCompositionArticleRuntimeSession> {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  if (input.manifest.release.animationId !== animation.id) {
    throw new Error("Article stage manifest resolved the wrong animation asset.");
  }
  const timeline = animation.timeline;
  if (timeline === undefined) {
    throw new Error("Fraction composition article animation requires one clock.");
  }
  if (!kpEditorAnimationSurfaceAdapterRegistry.list().some(
    ({ id }) => id === "editor-animation-surface.equation.katex"
  )) registerKpEditorEquationSurfaceCapability();

  const descriptor = createKpEditorAnimationDescriptor({
    id: "article-runtime.fraction-composition",
    animationId: animation.id,
    title: animation.title,
    summary: input.manifest.accessibility.semanticSummary,
    renderTargetKinds: ["equation"],
    controlKinds: ["playback", "scrubber"],
    durationMs: timeline.durationMs,
    beatCount: timeline.beatCount,
    tags: ["article", "algebra", "fraction-composition"]
  });
  const runtimeRoot = input.host.ownerDocument.createElement("div");
  runtimeRoot.dataset["kpAlgebraRuntimeStage"] = "loading";
  runtimeRoot.innerHTML = renderKpEditorAnimationPlayerShell({
    descriptor,
    chrome: "catalogue"
  });
  input.host.prepend(runtimeRoot);
  const player = requireElement<HTMLElement>(
    runtimeRoot,
    "[data-kp-editor-animation-player]"
  );

  try {
    hydrateKpEditorAnimationSurfaces(runtimeRoot);
    await hydrateKpPreparedEditorAnimationPlayer({
      player,
      animation,
      descriptor
    });
  } catch (error: unknown) {
    runtimeRoot.remove();
    throw error;
  }

  const fallback = input.host.querySelector<SVGElement>(
    "[data-kp-algebra-stage-fallback]"
  );
  if (fallback !== null) fallback.setAttribute("hidden", "");
  runtimeRoot.dataset["kpAlgebraRuntimeStage"] = "ready";
  input.host.dataset["kpAlgebraRuntimeAnimation"] = animation.id;
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  const checkpoints = createKpFractionCompositionArticleRuntimeCheckpoints();
  input.host.dataset["kpAlgebraRuntimeRangeCount"] = String(ranges.length);
  input.host.dataset["kpAlgebraRuntimeCheckpointCount"] = String(
    checkpoints.length
  );
  let semanticFocusTargetIds: readonly string[] = [];
  let activeCheckpointPath = "";
  let directSeekCount = 0;
  let disposed = false;

  const syncSemanticFocus = (): void => {
    for (const element of player.querySelectorAll<HTMLElement>(
      "[data-kp-article-semantic-salience]"
    )) element.removeAttribute("data-kp-article-semantic-salience");
    for (const targetId of semanticFocusTargetIds) {
      for (const element of player.querySelectorAll<HTMLElement>(
        `[data-kp-reader-selector-id="${CSS.escape(targetId)}"],` +
        `[data-kp-editor-equation-object-id="${CSS.escape(targetId)}"],` +
        `[data-kp-motion-id$=".${CSS.escape(targetId)}"]`
      )) element.dataset["kpArticleSemanticSalience"] = "focus";
    }
    input.host.dataset["kpAlgebraSemanticFocusTargetCount"] = String(
      player.querySelectorAll("[data-kp-article-semantic-salience=\"focus\"]")
        .length
    );
  };
  const syncCheckpoint = (): void => {
    const progress = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
    const checkpoint = [...checkpoints].reverse().find(
      (candidate) => progress + Number.EPSILON >= candidate.progress
    ) ?? checkpoints[0]!;
    if (checkpoint.path === activeCheckpointPath) return;
    activeCheckpointPath = checkpoint.path;
    input.host.dataset["kpAlgebraRuntimeCheckpoint"] = checkpoint.path;
    input.host.dispatchEvent(new CustomEvent("kp-algebra-article-checkpoint-change", {
      bubbles: true,
      detail: Object.freeze({ path: checkpoint.path })
    }));
  };
  const onFrame = (): void => {
    // Equation frames may replace endpoint subtrees; reapply article focus
    // after the renderer owns the new nodes, without adding a second clock.
    syncSemanticFocus();
    syncCheckpoint();
  };
  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, onFrame);
  syncCheckpoint();

  return Object.freeze({
    player,
    ranges,
    checkpoints,
    seekRange(path: string, progress: number) {
      const range = ranges.find((candidate) => candidate.path === path);
      if (range === undefined) throw new Error(`Unknown article motion ${path}.`);
      const bounded = Math.max(0, Math.min(1, progress));
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: range.start + (range.end - range.start) * bounded
      });
      input.host.dataset["kpAlgebraRuntimeRange"] = path;
    },
    seekCheckpoint(path: string) {
      const checkpoint = checkpoints.find((candidate) => candidate.path === path);
      if (checkpoint === undefined) {
        throw new Error(`Unknown article checkpoint ${path}.`);
      }
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "seek",
        progress: checkpoint.progress
      });
      directSeekCount += 1;
      input.host.dataset["kpAlgebraDirectSeekCount"] = String(directSeekCount);
    },
    setSemanticFocus(addresses: readonly string[]) {
      semanticFocusTargetIds = Object.freeze([...new Set(addresses.flatMap(
        (address) => {
          const reference =
            resolveKpFractionCompositionArticleSemanticReference(address);
          if (reference === undefined) {
            throw new Error(`Unknown article semantic reference ${address}.`);
          }
          return reference.paintTargetIds;
        }
      ))]);
      input.host.dataset["kpAlgebraSemanticFocus"] = addresses.join(" ");
      syncSemanticFocus();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, onFrame);
      disposeKpEditorAnimationPlayer(player);
      runtimeRoot.remove();
      fallback?.removeAttribute("hidden");
      delete input.host.dataset["kpAlgebraRuntimeAnimation"];
      delete input.host.dataset["kpAlgebraRuntimeRangeCount"];
      delete input.host.dataset["kpAlgebraRuntimeRange"];
      delete input.host.dataset["kpAlgebraRuntimeCheckpointCount"];
      delete input.host.dataset["kpAlgebraRuntimeCheckpoint"];
      delete input.host.dataset["kpAlgebraSemanticFocus"];
      delete input.host.dataset["kpAlgebraSemanticFocusTargetCount"];
      delete input.host.dataset["kpAlgebraDirectSeekCount"];
    }
  });
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing runtime element ${selector}.`);
  return element;
}
