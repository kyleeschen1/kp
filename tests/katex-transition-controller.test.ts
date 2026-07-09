import { strict as assert } from "node:assert";
import test from "node:test";

import {
  __katexTransitionControllerInternals,
  prefersReducedKatexMotion,
  summarizeKatexTransitionResult
} from "../src/rendering/katex-transition-controller.ts";
import type {
  __KatexTransitionControllerDependencies
} from "../src/rendering/katex-transition-controller.ts";
import type {
  KatexAtlasRegion,
  KatexMotionToken,
  KatexTextureAtlas,
  KatexTransitionPlan
} from "../src/rendering/katex-transition-types.ts";
import type {
  KatexTransitionPlanOptions
} from "../src/rendering/katex-token-matcher.ts";

test("prefersReducedKatexMotion reads matchMedia defensively", () => {
  assert.equal(prefersReducedKatexMotion(undefined), false);
  assert.equal(
    prefersReducedKatexMotion((query) => ({
      media: query,
      matches: true,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    })),
    true
  );
});

test("summarizeKatexTransitionResult reports plan diagnostics and fallback reason", () => {
  assert.deepEqual(
    summarizeKatexTransitionResult(
      {
        matched: [],
        sourceOnly: [{ source: token("source") }],
        targetOnly: [{ target: token("target") }],
        diagnostics: {
          sourceTokenCount: 1,
          targetTokenCount: 1,
          matchedCount: 0,
          sourceOnlyCount: 1,
          targetOnlyCount: 1,
          ambiguousGroupCount: 0
        }
      },
      "css-fallback",
      120,
      0,
      "reduced-motion"
    ),
    {
      renderer: "css-fallback",
      sourceTokenCount: 1,
      targetTokenCount: 1,
      matchedCount: 0,
      sourceOnlyCount: 1,
      targetOnlyCount: 1,
      textureCount: 0,
      durationMs: 120,
      fallbackReason: "reduced-motion"
    }
  );
});

test("transitionKatexEquations forced fallback applies and cleans fallback state", async () => {
  const source = fakeElement("source");
  const target = fakeElement("target");
  const deps = fakeDependencies({
    sourceTokens: [token("shared", "x", source)],
    targetTokens: [token("shared", "y", target)]
  });

  const result =
    await __katexTransitionControllerInternals.transitionKatexEquationsWithDependencies(
      source,
      target,
      { durationMs: 120, forceFallback: true },
      deps
    );

  assert.equal(result.renderer, "css-fallback");
  assert.equal(result.fallbackReason, "forced-fallback");
  assert.equal(result.sourceTokenCount, 1);
  assert.equal(result.targetTokenCount, 1);
  assert.equal(result.textureCount, 0);
  assert.deepEqual(source.classList.values(), []);
  assert.deepEqual(target.classList.values(), []);
  assert.deepEqual(source.style.entries(), []);
  assert.deepEqual(target.style.entries(), []);
  assert.ok(
    source.classList.history.includes("add:katex-transition-fallback-source")
  );
  assert.ok(
    source.classList.history.includes("add:katex-transition-fallback-active")
  );
  assert.ok(
    target.classList.history.includes("add:katex-transition-fallback-target")
  );
  assert.ok(
    target.classList.history.includes("add:katex-transition-fallback-active")
  );
  assert.equal(deps.timeoutDelays.at(-1), 120);
});

test("transitionKatexEquations falls back and cleans up when animation rendering throws", async () => {
  const source = fakeElement("source");
  const target = fakeElement("target");
  const overlay = fakeCanvas();
  const deps = fakeDependencies({
    sourceTokens: [token("shared", "x", source)],
    targetTokens: [token("shared", "x", target)],
    createdCanvases: [overlay],
    rendererRender() {
      throw new Error("render exploded");
    }
  });

  const result =
    await __katexTransitionControllerInternals.transitionKatexEquationsWithDependencies(
      source,
      target,
      { durationMs: 100 },
      deps
    );

  assert.equal(result.renderer, "css-fallback");
  assert.equal(result.fallbackReason, "render exploded");
  assert.equal(result.textureCount, 1);
  assert.equal(overlay.removeCount, 1);
  assert.deepEqual(source.classList.values(), []);
  assert.deepEqual(target.classList.values(), []);
  assert.deepEqual(source.style.entries(), []);
  assert.deepEqual(target.style.entries(), []);
  assert.ok(
    source.classList.history.includes("add:katex-transition-source-hidden")
  );
  assert.ok(
    target.classList.history.includes("add:katex-transition-target-hidden")
  );
  assert.ok(deps.rendererDisposed);
});

test("transitionKatexEquations namespaces duplicate source and target atlas ids", async () => {
  const source = fakeElement("source");
  const target = fakeElement("target");
  const deps = fakeDependencies({
    sourceTokens: [token("katex-token-0", "x", source), token("katex-token-1", "1", source)],
    targetTokens: [token("katex-token-0", "x", target), token("katex-token-1", "2", target)]
  });

  const result =
    await __katexTransitionControllerInternals.transitionKatexEquationsWithDependencies(
      source,
      target,
      { durationMs: 0 },
      deps
    );

  assert.equal(result.renderer, "webgl");
  assert.deepEqual(
    deps.atlasTokenIds,
    ["source:katex-token-0", "source:katex-token-1", "target:katex-token-1"]
  );
  assert.deepEqual(deps.rendererPlan?.matched.map((match) => match.source.id), [
    "source:katex-token-0"
  ]);
  assert.deepEqual(deps.rendererPlan?.matched.map((match) => match.target.id), [
    "source:katex-token-0"
  ]);
  assert.deepEqual(deps.rendererPlan?.sourceOnly.map((entry) => entry.source.id), [
    "source:katex-token-1"
  ]);
  assert.deepEqual(deps.rendererPlan?.targetOnly.map((entry) => entry.target.id), [
    "target:katex-token-1"
  ]);
});

test("transitionKatexEquations passes correspondence overrides to the matcher", async () => {
  const source = fakeElement("source");
  const target = fakeElement("target");
  const deps = fakeDependencies({
    sourceTokens: [
      token("source.left-x", "x", source),
      token("source.right-x", "x", source)
    ],
    targetTokens: [
      token("target.left-x", "x", target),
      token("target.right-x", "x", target)
    ]
  });

  const result =
    await __katexTransitionControllerInternals.transitionKatexEquationsWithDependencies(
      source,
      target,
      {
        durationMs: 0,
        correspondenceMatches: [
          {
            sourceTokenId: "source.left-x",
            targetTokenId: "target.right-x"
          }
        ]
      },
      deps
    );

  assert.equal(result.renderer, "webgl");
  assert.deepEqual(deps.createPlanOptions, {
    correspondenceMatches: [
      {
        sourceTokenId: "source.left-x",
        targetTokenId: "target.right-x"
      }
    ]
  });
});

test("transitionKatexEquations runs beforeCleanup before removing the WebGL overlay", async () => {
  const source = fakeElement("source");
  const target = fakeElement("target");
  const overlay = fakeCanvas();
  const handoffStates: Array<{
    overlayRemoveCount: number;
    sourceClasses: string[];
    targetClasses: string[];
  }> = [];
  const deps = fakeDependencies({
    sourceTokens: [token("shared", "x", source)],
    targetTokens: [token("shared", "x", target)],
    createdCanvases: [overlay]
  });

  await __katexTransitionControllerInternals.transitionKatexEquationsWithDependencies(
    source,
    target,
    {
      durationMs: 0,
      beforeCleanup() {
        handoffStates.push({
          overlayRemoveCount: overlay.removeCount,
          sourceClasses: Array.from(source.classList.values()),
          targetClasses: Array.from(target.classList.values())
        });
      }
    },
    deps
  );

  assert.deepEqual(handoffStates, [
    {
      overlayRemoveCount: 0,
      sourceClasses: ["katex-transition-source-hidden"],
      targetClasses: ["katex-transition-target-hidden"]
    }
  ]);
  assert.equal(overlay.dataset["kpKatexTransitionOverlayState"], "handoff-fade");
  assert.ok(deps.timeoutDelays.includes(240));
  assert.equal(overlay.removeCount, 1);
});

function token(id: string, text = id, element?: Element): KatexMotionToken {
  const token: KatexMotionToken = {
    id,
    text,
    signature: "mord",
    rect: { left: 0, top: 0, width: 10, height: 12 },
    localRect: { left: 0, top: 0, width: 10, height: 12 },
    row: 0
  };

  if (element !== undefined) {
    token.element = element;
  }

  return token;
}

function fakeElement(name: string) {
  return {
    name,
    classList: fakeClassList(),
    style: fakeStyle(),
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 };
    }
  } as unknown as HTMLElement & {
    classList: ReturnType<typeof fakeClassList>;
    style: ReturnType<typeof fakeStyle>;
  };
}

function fakeCanvas(): HTMLCanvasElement & {
  dataset: DOMStringMap;
  style: ReturnType<typeof fakeStyle>;
  removeCount: number;
} {
  const canvas = {
    className: "",
    dataset: {} as DOMStringMap,
    width: 0,
    height: 0,
    style: fakeStyle(),
    removeCount: 0,
    remove() {
      canvas.removeCount += 1;
    }
  } as unknown as HTMLCanvasElement & {
    dataset: DOMStringMap;
    style: ReturnType<typeof fakeStyle>;
    removeCount: number;
  };

  return canvas;
}

function fakeClassList() {
  const classes = new Set<string>();
  const history: string[] = [];

  return {
    history,
    add(...names: string[]) {
      for (const name of names) {
        classes.add(name);
        history.push(`add:${name}`);
      }
    },
    remove(...names: string[]) {
      for (const name of names) {
        classes.delete(name);
        history.push(`remove:${name}`);
      }
    },
    values() {
      return [...classes].sort();
    }
  };
}

function fakeStyle() {
  const properties = new Map<string, string>();

  return {
    set left(value: string) {
      properties.set("left", value);
    },
    set top(value: string) {
      properties.set("top", value);
    },
    set width(value: string) {
      properties.set("width", value);
    },
    set height(value: string) {
      properties.set("height", value);
    },
    setProperty(name: string, value: string) {
      properties.set(name, value);
    },
    removeProperty(name: string) {
      properties.delete(name);
      return "";
    },
    entries() {
      return [...properties.entries()].sort();
    }
  };
}

function fakeDependencies(options: {
  sourceTokens: KatexMotionToken[];
  targetTokens: KatexMotionToken[];
  createdCanvases?: Array<ReturnType<typeof fakeCanvas>>;
  rendererRender?: (progress: number) => void;
}): __KatexTransitionControllerDependencies & {
  timeoutDelays: number[];
  atlasTokenIds: string[];
  readonly rendererDisposed: boolean;
  readonly rendererPlan: KatexTransitionPlan | undefined;
  readonly createPlanOptions: KatexTransitionPlanOptions | undefined;
} {
  let now = 0;
  const timeoutDelays: number[] = [];
  const atlasTokenIds: string[] = [];
  let rendererDisposed = false;
  let rendererPlan: KatexTransitionPlan | undefined;
  let createPlanOptions: KatexTransitionPlanOptions | undefined;

  const deps = {
    timeoutDelays,
    atlasTokenIds,
    get rendererDisposed() {
      return rendererDisposed;
    },
    get rendererPlan() {
      return rendererPlan;
    },
    get createPlanOptions() {
      return createPlanOptions;
    },
    snapshotKatexTokens(root: Element) {
      return {
        tokens: root === options.sourceTokens[0]?.element
          ? options.sourceTokens
          : options.targetTokens,
        bounds: { left: 0, top: 0, width: 100, height: 20 }
      };
    },
    createKatexTransitionPlan(
      sourceTokens: readonly KatexMotionToken[],
      targetTokens: readonly KatexMotionToken[],
      options: KatexTransitionPlanOptions | undefined
    ) {
      createPlanOptions = options;

      return __katexTransitionControllerInternals.defaultDependencies
        .createKatexTransitionPlan(sourceTokens, targetTokens, options);
    },
    async createKatexTextureAtlas(
      tokens: readonly KatexMotionToken[]
    ): Promise<KatexTextureAtlas> {
      atlasTokenIds.push(...tokens.map((entry) => entry.id));

      return {
        width: 64,
        height: 64,
        pixelRatio: 1,
        pages: [fakeCanvas()],
        regions: new Map(
          tokens.map((entry) => [entry.id, atlasRegion(entry.id)])
        )
      };
    },
    async importKatexWebGLRenderer() {
      return {
        createKatexWebGLRenderer(
          _canvas: HTMLCanvasElement,
          plan: KatexTransitionPlan
        ) {
          rendererPlan = plan;

          return {
            render: options.rendererRender ?? (() => {}),
            dispose() {
              rendererDisposed = true;
            }
          };
        }
      };
    },
    document: ({
      body: {
        append() {}
      },
      createElement() {
        return options.createdCanvases?.shift() ?? fakeCanvas();
      }
    } as unknown as Document),
    matchMedia: undefined,
    now() {
      now += 10;
      return now;
    },
    requestAnimationFrame(callback: FrameRequestCallback) {
      callback(now + 1000);
      return 1;
    },
    setTimeout(callback: () => void, delay: number) {
      timeoutDelays.push(delay);
      callback();
      return 1;
    },
    scrollX: 0,
    scrollY: 0
  };

  return deps;
}

function atlasRegion(tokenId: string): KatexAtlasRegion {
  return {
    tokenId,
    page: 0,
    x: 0,
    y: 0,
    width: 10,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 1,
    v1: 1
  };
}
