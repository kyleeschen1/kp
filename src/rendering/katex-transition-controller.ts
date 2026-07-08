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
type KatexSnapshotTokens = typeof snapshotKatexTokens;
type CreateKatexTransitionPlan = typeof createKatexTransitionPlan;
type CreateKatexTextureAtlas = typeof createKatexTextureAtlas;

interface KatexWebGLRendererModule {
  createKatexWebGLRenderer(
    canvas: HTMLCanvasElement,
    plan: KatexTransitionPlan,
    atlas: KatexTextureAtlas
  ): { render(progress: number): void; dispose(): void };
}

export interface __KatexTransitionControllerDependencies {
  snapshotKatexTokens: KatexSnapshotTokens;
  createKatexTransitionPlan: CreateKatexTransitionPlan;
  createKatexTextureAtlas: CreateKatexTextureAtlas;
  importKatexWebGLRenderer: () => Promise<KatexWebGLRendererModule>;
  document: Document;
  matchMedia: MatchMediaLike | undefined;
  now: () => number;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  setTimeout: (callback: () => void, delay: number) => number;
  scrollX: number;
  scrollY: number;
}

const DEFAULT_DURATION_MS = 550;
const FALLBACK_DURATION_PROPERTY = "--katex-transition-duration";

export async function transitionKatexEquations(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options: KatexTransitionOptions = {}
): Promise<KatexTransitionResult> {
  return transitionKatexEquationsWithDependencies(
    sourceEl,
    targetEl,
    options,
    createDefaultDependencies()
  );
}

async function transitionKatexEquationsWithDependencies(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options: KatexTransitionOptions,
  dependencies: __KatexTransitionControllerDependencies
): Promise<KatexTransitionResult> {
  const startedAt = dependencies.now();
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const bounds = combinedBounds(sourceEl, targetEl);
  const sourceSnapshot = dependencies.snapshotKatexTokens(sourceEl, {
    overlayRect: bounds
  });
  const targetSnapshot = dependencies.snapshotKatexTokens(targetEl, {
    overlayRect: bounds
  });
  const plan = dependencies.createKatexTransitionPlan(
    sourceSnapshot.tokens,
    targetSnapshot.tokens
  );

  if (
    options.forceFallback === true ||
    prefersReducedKatexMotion(dependencies.matchMedia)
  ) {
    await runCssFallback(sourceEl, targetEl, durationMs, dependencies);

    return summarizeKatexTransitionResult(
      plan,
      "css-fallback",
      dependencies.now() - startedAt,
      0,
      options.forceFallback === true ? "forced-fallback" : "reduced-motion"
    );
  }

  let atlas: KatexTextureAtlas | undefined;
  let overlay: HTMLCanvasElement | undefined;
  let renderer: { render(progress: number): void; dispose(): void } | undefined;

  try {
    const namespaced = namespacePlanForAtlas(plan);

    atlas = await dependencies.createKatexTextureAtlas(namespaced.atlasTokens);
    overlay = createOverlayCanvas(bounds, atlas.pixelRatio, dependencies);

    const { createKatexWebGLRenderer } =
      await dependencies.importKatexWebGLRenderer();

    renderer = createKatexWebGLRenderer(overlay, namespaced.plan, atlas);

    dependencies.document.body.append(overlay);
    sourceEl.classList.add("katex-transition-source-hidden");
    targetEl.classList.add("katex-transition-target-hidden");
    await animate(
      durationMs,
      options.easing ?? easeInOut,
      (progress) => {
        renderer?.render(progress);
      },
      dependencies
    );

    targetEl.classList.remove("katex-transition-target-hidden");

    return summarizeKatexTransitionResult(
      plan,
      "webgl",
      dependencies.now() - startedAt,
      atlas.pages.length
    );
  } catch (error: unknown) {
    sourceEl.classList.remove("katex-transition-source-hidden");
    targetEl.classList.remove("katex-transition-target-hidden");
    await runCssFallback(sourceEl, targetEl, durationMs, dependencies);

    return summarizeKatexTransitionResult(
      plan,
      "css-fallback",
      dependencies.now() - startedAt,
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

const defaultDependencies: __KatexTransitionControllerDependencies =
  createDefaultDependencies();

function createDefaultDependencies(): __KatexTransitionControllerDependencies {
  return {
    snapshotKatexTokens,
    createKatexTransitionPlan,
    createKatexTextureAtlas,
    importKatexWebGLRenderer: () => import("./katex-webgl-transition.ts"),
    document: globalThis.document as Document,
    matchMedia:
      typeof globalThis.matchMedia === "function"
        ? globalThis.matchMedia.bind(globalThis)
        : undefined,
    now: () => globalThis.performance.now(),
    requestAnimationFrame: (callback) => globalThis.requestAnimationFrame(callback),
    setTimeout: (callback, delay) =>
      globalThis.setTimeout(callback, delay) as unknown as number,
    scrollX: globalThis.scrollX ?? 0,
    scrollY: globalThis.scrollY ?? 0
  };
}

export const __katexTransitionControllerInternals = {
  defaultDependencies,
  transitionKatexEquationsWithDependencies
};

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
  pixelRatio: number,
  dependencies: __KatexTransitionControllerDependencies
): HTMLCanvasElement {
  const canvas = dependencies.document.createElement("canvas");

  canvas.className = "katex-transition-overlay";
  canvas.width = Math.max(1, Math.ceil(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(bounds.height * pixelRatio));
  canvas.style.left = `${bounds.left + dependencies.scrollX}px`;
  canvas.style.top = `${bounds.top + dependencies.scrollY}px`;
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;

  return canvas;
}

function animate(
  durationMs: number,
  easing: (progress: number) => number,
  render: (progress: number) => void,
  dependencies: __KatexTransitionControllerDependencies
): Promise<void> {
  if (durationMs <= 0) {
    render(easing(1));
    return Promise.resolve();
  }

  const startedAt = dependencies.now();

  return new Promise((resolve, reject) => {
    function tick(now: number): void {
      try {
        const progress = Math.min((now - startedAt) / durationMs, 1);

        render(easing(progress));

        if (progress < 1) {
          dependencies.requestAnimationFrame(tick);
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    }

    dependencies.requestAnimationFrame(tick);
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
  durationMs: number,
  dependencies: __KatexTransitionControllerDependencies
): Promise<void> {
  const duration = Math.max(0, durationMs);

  sourceEl.style.setProperty(FALLBACK_DURATION_PROPERTY, `${duration}ms`);
  targetEl.style.setProperty(FALLBACK_DURATION_PROPERTY, `${duration}ms`);
  sourceEl.classList.add("katex-transition-fallback-source");
  targetEl.classList.add("katex-transition-fallback-target");

  try {
    await new Promise<void>((resolve, reject) => {
      dependencies.requestAnimationFrame(() => {
        try {
          sourceEl.classList.add("katex-transition-fallback-active");
          targetEl.classList.add("katex-transition-fallback-active");
          dependencies.setTimeout(resolve, duration);
        } catch (error) {
          reject(error);
        }
      });
    });
  } finally {
    sourceEl.classList.remove(
      "katex-transition-fallback-source",
      "katex-transition-fallback-active"
    );
    targetEl.classList.remove(
      "katex-transition-fallback-target",
      "katex-transition-fallback-active"
    );
    sourceEl.style.removeProperty(FALLBACK_DURATION_PROPERTY);
    targetEl.style.removeProperty(FALLBACK_DURATION_PROPERTY);
  }
}
