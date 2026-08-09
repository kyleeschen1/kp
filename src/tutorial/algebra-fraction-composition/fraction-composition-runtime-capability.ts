import "../../styles.css";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../../animation/fraction-composition-equation-adapter.ts";
import {
  createKpEditorAnimationDescriptor
} from "../../editor/animation-descriptor.ts";
import {
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
  createKpFractionCompositionArticleRuntimeRanges,
  type KpFractionCompositionArticleRuntimeRange
} from "./fraction-composition-runtime-ranges.ts";

export interface KpFractionCompositionArticleRuntimeSession {
  readonly player: HTMLElement;
  readonly ranges: readonly KpFractionCompositionArticleRuntimeRange[];
  readonly seekRange: (path: string, progress: number) => void;
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
  input.host.dataset["kpAlgebraRuntimeRangeCount"] = String(ranges.length);
  let disposed = false;

  return Object.freeze({
    player,
    ranges,
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
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeKpEditorAnimationPlayer(player);
      runtimeRoot.remove();
      fallback?.removeAttribute("hidden");
      delete input.host.dataset["kpAlgebraRuntimeAnimation"];
      delete input.host.dataset["kpAlgebraRuntimeRangeCount"];
      delete input.host.dataset["kpAlgebraRuntimeRange"];
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
