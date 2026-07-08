import { createKatexTransitionPlan } from "./katex-token-matcher.ts";
import { snapshotKatexTokens } from "./katex-token-snapshot.ts";
import { createKatexTextureAtlas } from "./katex-texture-atlas.ts";
import type {
  KatexMotionToken,
  KatexTextureAtlas,
  KatexTokenRect,
  KatexTransitionPlan,
  KatexTransitionRendererKind,
  KatexTransitionResult
} from "./katex-transition-types.ts";

export interface KatexTransitionOptions {
  durationMs?: number | undefined;
  easing?: ((progress: number) => number) | undefined;
  forceFallback?: boolean | undefined;
}

type MatchMediaLike = typeof window.matchMedia;

const DEFAULT_DURATION_MS = 550;

export async function transitionKatexEquations(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options: KatexTransitionOptions = {}
): Promise<KatexTransitionResult> {
  const startedAt = performance.now();
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const bounds = combinedBounds(sourceEl, targetEl);
  const sourceSnapshot = snapshotKatexTokens(sourceEl, { overlayRect: bounds });
  const targetSnapshot = snapshotKatexTokens(targetEl, { overlayRect: bounds });
  const plan = createKatexTransitionPlan(sourceSnapshot.tokens, targetSnapshot.tokens);

  if (
    options.forceFallback === true ||
    prefersReducedKatexMotion(
      typeof window.matchMedia === "function" ? window.matchMedia.bind(window) : undefined
    )
  ) {
    await runCssFallback(sourceEl, targetEl, durationMs);

    return summarizeKatexTransitionResult(
      plan,
      "css-fallback",
      performance.now() - startedAt,
      0,
      options.forceFallback === true ? "forced-fallback" : "reduced-motion"
    );
  }

  let atlas: KatexTextureAtlas | undefined;
  let overlay: HTMLCanvasElement | undefined;
  let renderer: { render(progress: number): void; dispose(): void } | undefined;

  try {
    const namespaced = namespacePlanForAtlas(plan);

    atlas = await createKatexTextureAtlas(namespaced.atlasTokens);
    overlay = createOverlayCanvas(bounds, atlas.pixelRatio);

    const { createKatexWebGLRenderer } = await import(
      "./katex-webgl-transition.ts"
    );

    renderer = createKatexWebGLRenderer(overlay, namespaced.plan, atlas);

    document.body.append(overlay);
    sourceEl.classList.add("katex-transition-source-hidden");
    targetEl.classList.add("katex-transition-target-hidden");
    await animate(durationMs, options.easing ?? easeInOut, (progress) => {
      renderer?.render(progress);
    });

    targetEl.classList.remove("katex-transition-target-hidden");

    return summarizeKatexTransitionResult(
      plan,
      "webgl",
      performance.now() - startedAt,
      atlas.pages.length
    );
  } catch (error: unknown) {
    sourceEl.classList.remove("katex-transition-source-hidden");
    targetEl.classList.remove("katex-transition-target-hidden");
    await runCssFallback(sourceEl, targetEl, durationMs);

    return summarizeKatexTransitionResult(
      plan,
      "css-fallback",
      performance.now() - startedAt,
      atlas?.pages.length ?? 0,
      error instanceof Error ? error.message : "webgl-transition-failed"
    );
  } finally {
    renderer?.dispose();
    overlay?.remove();
    sourceEl.classList.remove("katex-transition-source-hidden");
    targetEl.classList.remove("katex-transition-target-hidden");
  }
}

export function prefersReducedKatexMotion(
  matchMedia: MatchMediaLike | undefined
): boolean {
  try {
    return matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

export function summarizeKatexTransitionResult(
  plan: KatexTransitionPlan,
  renderer: KatexTransitionRendererKind,
  durationMs: number,
  textureCount: number,
  fallbackReason?: string
): KatexTransitionResult {
  return {
    renderer,
    sourceTokenCount: plan.diagnostics.sourceTokenCount,
    targetTokenCount: plan.diagnostics.targetTokenCount,
    matchedCount: plan.diagnostics.matchedCount,
    sourceOnlyCount: plan.diagnostics.sourceOnlyCount,
    targetOnlyCount: plan.diagnostics.targetOnlyCount,
    textureCount,
    durationMs,
    fallbackReason
  };
}

function namespacePlanForAtlas(plan: KatexTransitionPlan): {
  atlasTokens: readonly KatexMotionToken[];
  plan: KatexTransitionPlan;
} {
  const sourceTokensById = new Map<string, KatexMotionToken>();
  const targetOnlyTokensById = new Map<string, KatexMotionToken>();

  for (const match of plan.matched) {
    sourceTokensById.set(match.source.id, namespaceToken(match.source, "source"));
  }

  for (const entry of plan.sourceOnly) {
    sourceTokensById.set(entry.source.id, namespaceToken(entry.source, "source"));
  }

  for (const entry of plan.targetOnly) {
    targetOnlyTokensById.set(entry.target.id, namespaceToken(entry.target, "target"));
  }

  return {
    atlasTokens: [...sourceTokensById.values(), ...targetOnlyTokensById.values()],
    plan: {
      matched: plan.matched.map((match) => ({
        source: getNamespacedToken(sourceTokensById, match.source.id),
        target: {
          ...match.target,
          id: `source:${match.source.id}`
        }
      })),
      sourceOnly: plan.sourceOnly.map((entry) => ({
        source: getNamespacedToken(sourceTokensById, entry.source.id)
      })),
      targetOnly: plan.targetOnly.map((entry) => ({
        target: getNamespacedToken(targetOnlyTokensById, entry.target.id)
      })),
      diagnostics: plan.diagnostics
    }
  };
}

function namespaceToken(
  token: KatexMotionToken,
  namespace: "source" | "target"
): KatexMotionToken {
  return {
    ...token,
    id: `${namespace}:${token.id}`
  };
}

function getNamespacedToken(
  tokens: ReadonlyMap<string, KatexMotionToken>,
  id: string
): KatexMotionToken {
  const token = tokens.get(id);

  if (token === undefined) {
    throw new Error(`Missing namespaced KaTeX token ${id}.`);
  }

  return token;
}

function combinedBounds(sourceEl: HTMLElement, targetEl: HTMLElement): KatexTokenRect {
  const source = sourceEl.getBoundingClientRect();
  const target = targetEl.getBoundingClientRect();
  const left = Math.min(source.left, target.left);
  const top = Math.min(source.top, target.top);
  const right = Math.max(source.right, target.right);
  const bottom = Math.max(source.bottom, target.bottom);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

function createOverlayCanvas(
  bounds: KatexTokenRect,
  pixelRatio: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.className = "katex-transition-overlay";
  canvas.width = Math.max(1, Math.ceil(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(bounds.height * pixelRatio));
  canvas.style.left = `${bounds.left + window.scrollX}px`;
  canvas.style.top = `${bounds.top + window.scrollY}px`;
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;

  return canvas;
}

function animate(
  durationMs: number,
  easing: (progress: number) => number,
  render: (progress: number) => void
): Promise<void> {
  if (durationMs <= 0) {
    render(easing(1));
    return Promise.resolve();
  }

  const startedAt = performance.now();

  return new Promise((resolve) => {
    function tick(now: number): void {
      const progress = Math.min((now - startedAt) / durationMs, 1);

      render(easing(progress));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

function easeInOut(progress: number): number {
  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

async function runCssFallback(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  durationMs: number
): Promise<void> {
  sourceEl.classList.add("katex-transition-fallback-source");
  targetEl.classList.add("katex-transition-fallback-target");

  await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, durationMs)));

  sourceEl.classList.remove("katex-transition-fallback-source");
  targetEl.classList.remove("katex-transition-fallback-target");
}
