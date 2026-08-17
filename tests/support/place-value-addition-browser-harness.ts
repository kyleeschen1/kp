import {
  createKpReaderClockSample
} from "../../src/reader/runtime/playback-clock.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "../../src/rendering/native-katex-paint-geometry.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../../src/rendering/native-katex-feature-pack-loader.ts";
import {
  createKpPlaceValueAdditionRuntimeSession,
  sampleKpPlaceValueAdditionRuntime
} from "../../src/rendering/place-value-addition-runtime.ts";
import {
  createKpPlaceValueAdditionSharedDom
} from "../../src/rendering/place-value-addition-shared-dom.ts";
import {
  compileKpPlaceValueIntegerAdditionFixture
} from "../../src/animation/place-value-addition-generated-fixture.ts";
import {
  compileKpPlaceValueColumnEvaluation,
  createKpPlaceValueColumnEvaluationDom
} from "../../src/rendering/place-value-addition-column-evaluation.ts";
import {
  kpPlaceValueStandardEvaluationMotif
} from "../../src/rendering/place-value-addition-contributor-fusion-motif.ts";
import {
  compileKpPlaceValueColumnExchange,
  createKpPlaceValueColumnExchangeDom
} from "../../src/rendering/place-value-addition-column-exchange.ts";
import {
  createKpPlaceValueWrittenColumnDomProjection
} from "../../src/rendering/place-value-addition-written-column-dom.ts";

export interface KpPlaceValueBrowserPaintMetric {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly center: { readonly x: number; readonly y: number };
  readonly opacity: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly fontWeight: string;
}

export interface KpPlaceValueBrowserMaterialOwner {
  readonly id: string;
  readonly semanticId: string;
  readonly opacity: string;
  readonly transform: string;
  readonly text: string;
}

/**
 * Browser evidence must observe the same mounted runtime and native-paint
 * geometry as the product. Keeping that machinery here prevents each fixture
 * from quietly inventing a different box, clock, or ownership definition.
 */
export async function createKpPlaceValueAdditionBrowserHarness(input: {
  readonly document: Document;
  readonly viewportWidth: number;
}) {
  const session = createKpPlaceValueAdditionRuntimeSession();
  let previousProgress = 0;
  let sequence = 0;
  const sample = (progress: number, previous: number) =>
    sampleKpPlaceValueAdditionRuntime({
      session,
      clock: createKpReaderClockSample({
        source: "controls",
        progress,
        previousProgress: previous,
        sequence: ++sequence
      }),
      viewportWidth: input.viewportWidth,
      selectedView: "written"
    });
  const dom = createKpPlaceValueAdditionSharedDom({
    document: input.document,
    session,
    initialFrame: sample(0, 0)
  });
  const app = input.document.querySelector<HTMLElement>("#app");
  if (app !== null) app.style.display = "none";
  Object.assign(input.document.body.style, {
    margin: "0",
    minHeight: "100vh",
    display: "grid",
    placeItems: "center"
  });
  input.document.body.append(dom.root);
  const initialView = input.document.defaultView;
  if (initialView === null) {
    throw new Error("Browser harness requires a live window.");
  }
  await primeKpPlaceValueNativeScenes({
    document: input.document,
    view: initialView,
    root: dom.root
  });
  dom.prepareNativeScenes();
  await dom.prepareNativeScenesWhenReady();
  const view = input.document.defaultView;
  if (view === null) throw new Error("Browser harness requires a live window.");

  const apply = (progress: number, previous = previousProgress): void => {
    dom.apply(sample(progress, previous));
    previousProgress = progress;
  };
  const persistentCell = (semanticEntityId: string): HTMLElement => {
    const escaped = view.CSS.escape(semanticEntityId);
    const cell = (dom.writtenRoot as HTMLElement).querySelector<HTMLElement>(
      `[data-kp-semantic-entity-id="${escaped}"]`
    );
    if (cell === null) {
      throw new Error(`Missing persistent cell ${semanticEntityId}.`);
    }
    return cell;
  };
  const operationScene = (
    positionId: string,
    operation: "evaluation" | "exchange"
  ): HTMLElement => {
    const escaped = view.CSS.escape(positionId);
    const operationSelector = operation === "evaluation"
      ? "[data-kp-operation-evaluation-program-id]"
      : "[data-kp-identity-fission-program-id]";
    const scene = input.document.querySelector<HTMLElement>(
      `[data-kp-place-value-position-id="${escaped}"]${operationSelector}`
    );
    if (scene === null) {
      throw new Error(`Missing ${operation} scene for ${positionId}.`);
    }
    return scene;
  };
  const isVisible = (element: HTMLElement): boolean => {
    const style = view.getComputedStyle(element);
    return style.visibility !== "hidden" &&
      style.display !== "none" &&
      Number(style.opacity) > 0;
  };
  const materialOwnerElements = (
    stage: HTMLElement
  ): readonly HTMLElement[] => [
    ...stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )
  ];
  const materialOwners = (
    stage: HTMLElement
  ): readonly KpPlaceValueBrowserMaterialOwner[] => Object.freeze(
    materialOwnerElements(stage).map((owner) => {
    const style = view.getComputedStyle(owner);
    return Object.freeze({
      id: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
      semanticId:
        owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "",
      opacity: style.opacity,
      transform: style.transform,
      text: owner.textContent?.trim() ?? ""
    });
    }).sort((left, right) => left.id.localeCompare(right.id))
  );
  const materialOwner = (
    stage: HTMLElement,
    semanticEntityId: string
  ): HTMLElement => {
    const escaped = view.CSS.escape(semanticEntityId);
    const owner = stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-semantic-entity-id="${escaped}"]`
    );
    if (owner === null) {
      throw new Error(`Missing material owner ${semanticEntityId}.`);
    }
    return owner;
  };
  const paintMetric = (
    element: HTMLElement
  ): KpPlaceValueBrowserPaintMetric => {
    const rect = measureKpNativeKatexSubtreePaintRect(dom.root, element) ??
      element.getBoundingClientRect();
    const paint = [element, ...element.querySelectorAll<HTMLElement>("*")]
      .filter((candidate) =>
        candidate.closest(".katex-mathml") === null &&
        [...candidate.childNodes].some((node) =>
          node.nodeType === view.Node.TEXT_NODE &&
          (node.textContent?.trim().length ?? 0) > 0
        )
      ).at(-1) ?? element;
    const style = view.getComputedStyle(paint);
    return Object.freeze({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      center: Object.freeze({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }),
      opacity: view.getComputedStyle(element).opacity,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight
    });
  };
  const unionPaintMetric = (
    elements: readonly HTMLElement[]
  ): KpPlaceValueBrowserPaintMetric => {
    if (elements.length === 0) {
      throw new Error("Cannot measure an empty native-paint union.");
    }
    const metrics = elements.map(paintMetric);
    const left = Math.min(...metrics.map((metric) => metric.left));
    const top = Math.min(...metrics.map((metric) => metric.top));
    const right = Math.max(...metrics.map(
      (metric) => metric.left + metric.width
    ));
    const bottom = Math.max(...metrics.map(
      (metric) => metric.top + metric.height
    ));
    const referenceStyle = metrics[0]!;
    return Object.freeze({
      left,
      top,
      width: right - left,
      height: bottom - top,
      center: Object.freeze({ x: (left + right) / 2, y: (top + bottom) / 2 }),
      opacity: referenceStyle.opacity,
      fontFamily: referenceStyle.fontFamily,
      fontSize: referenceStyle.fontSize,
      fontWeight: referenceStyle.fontWeight
    });
  };
  const overlap = (
    left: KpPlaceValueBrowserPaintMetric,
    right: KpPlaceValueBrowserPaintMetric
  ) => Object.freeze({
    width: Math.max(0, Math.min(
      left.left + left.width,
      right.left + right.width
    ) - Math.max(left.left, right.left)),
    height: Math.max(0, Math.min(
      left.top + left.height,
      right.top + right.height
    ) - Math.max(left.top, right.top))
  });
  const endpointState = (semanticEntityIds: readonly string[]) =>
    semanticEntityIds.map((semanticEntityId) => {
      const element = persistentCell(semanticEntityId);
      return Object.freeze({
        id: semanticEntityId,
        visibility: view.getComputedStyle(element).visibility,
        opacity: view.getComputedStyle(element).opacity,
        ownership: element.dataset["kpNativeEndpointOwnership"] ?? ""
      });
    });
  const settleLayout = async (): Promise<void> => new Promise((resolve) =>
    view.requestAnimationFrame(() => view.requestAnimationFrame(() => resolve()))
  );
  const auditContributorFusionRoute = (input: {
    readonly positionId: string;
    readonly globalStart: number;
    readonly globalEnd: number;
  }) => {
    const evaluation = session.columnEvaluations.find(
      ({ positionId }) => positionId === input.positionId
    );
    if (evaluation === undefined) {
      throw new Error(`Missing evaluation ${input.positionId}.`);
    }
    const stage = operationScene(input.positionId, "evaluation");
    const contributors = () => evaluation.writtenOwnership.contributionProxies
      .map(({ bindingAnnotationId }) => materialOwner(
        stage,
        bindingAnnotationId
      ));
    const targetDigits = () => evaluation.targetSelectorIds.map((id) => {
      const escaped = view.CSS.escape(id);
      const target = stage.querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"] ' +
        `[data-kp-place-value-motion-target-id="${escaped}"]`
      );
      if (target === null) throw new Error(`Missing fusion target ${id}.`);
      return target;
    });
    const midpoint = (
      points: readonly { readonly x: number; readonly y: number }[]
    ) => ({
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length
    });
    const snapshot = () => {
      const owners = contributors();
      const source = midpoint(owners.map((owner) =>
        paintMetric(owner).center
      ));
      const target = unionPaintMetric(targetDigits()).center;
      return Object.freeze({
        offsets: Object.freeze(owners.map((owner) => Number(
          owner.dataset["kpPlaceValueContributorArcOffsetPx"]
        ))),
        lateralOffsets: Object.freeze(owners.map((owner) => Number(
          owner.dataset["kpPlaceValueContributorArcLateralOffsetPx"]
        ))),
        opacities: Object.freeze(owners.map((owner) =>
          view.getComputedStyle(owner).opacity
        )),
        sourceOpacities: Object.freeze(
          evaluation.writtenOwnership.contributionProxies.map(
            ({ sourceCellId }) => view.getComputedStyle(
              persistentCell(sourceCellId)
            ).opacity
          )
        ),
        fallbackClearances: Object.freeze(owners.map((owner) =>
          owner.dataset["kpPlaceValueDocumentaryClearance"] ?? null
        )),
        distanceToTarget: Math.hypot(
          source.x - target.x,
          source.y - target.y
        )
      });
    };
    const localToGlobal = (local: number) =>
      input.globalStart + local * (input.globalEnd - input.globalStart);
    const samples = [];
    let previous = 0;
    for (let index = 0; index < 100; index += 1) {
      const local = index / 100;
      const progress = localToGlobal(local);
      apply(progress, previous);
      samples.push(Object.freeze({ local, ...snapshot() }));
      previous = progress;
    }
    const directLocal = 0.7;
    apply(localToGlobal(0.99), previous);
    apply(localToGlobal(directLocal), localToGlobal(0.99));
    const rewind = snapshot();
    apply(localToGlobal(directLocal), localToGlobal(directLocal));
    const sameFrame = snapshot();
    return Object.freeze({
      motif: stage.dataset["kpPlaceValueEvaluationVisualMotif"] ?? "",
      samples: Object.freeze(samples),
      rewind,
      sameFrame
    });
  };

  return Object.freeze({
    session,
    dom,
    apply,
    persistentCell,
    operationScene,
    isVisible,
    materialOwnerElements,
    materialOwners,
    materialOwner,
    paintMetric,
    unionPaintMetric,
    overlap,
    endpointState,
    settleLayout,
    auditContributorFusionRoute,
    dispose: dom.dispose
  });
}

/**
 * Mounts a generated fixture through the same written-grid, evaluation,
 * exchange, compositor, and native-paint observers as the canonical runtime.
 * It deliberately supplies no fixture-specific renderer or geometry branch.
 */
export async function createKpGeneratedPlaceValueAdditionBrowserHarness(input: {
  readonly document: Document;
  readonly viewportWidth: number;
  readonly id: string;
  readonly addends: readonly [string, string];
}) {
  const fixture = compileKpPlaceValueIntegerAdditionFixture({
    id: input.id,
    addends: input.addends
  });
  const written = createKpPlaceValueWrittenColumnDomProjection({
    document: input.document,
    projection: fixture.projection,
    endpoint: "initial"
  });
  const evaluations = fixture.positionPrograms.map((program) => ({
    program,
    scene: createKpPlaceValueColumnEvaluationDom({
      document: input.document,
      projection: fixture.projection,
      evaluation: compileKpPlaceValueColumnEvaluation(
        fixture.presentation,
        program
      ),
      // Generated fixtures remain on the standard route until a separate
      // promotion certificate explicitly opts them into the visual motif.
      visualMotif: kpPlaceValueStandardEvaluationMotif
    })
  }));
  const exchanges = fixture.positionPrograms.flatMap((program) =>
    program.exchange === undefined
      ? []
      : [{
          program,
          scene: createKpPlaceValueColumnExchangeDom({
            document: input.document,
            projection: fixture.projection,
            exchange: compileKpPlaceValueColumnExchange(
              fixture.presentation,
              program
            )
          })
        }]
  );
  const scenes = [
    ...evaluations.map(({ scene }) => scene),
    ...exchanges.map(({ scene }) => scene)
  ];
  const root = input.document.createElement("section");
  root.dataset["kpGeneratedPlaceValueFixture"] = fixture.id;
  root.style.cssText =
    `display:grid;position:relative;place-items:center;inline-size:${Math.max(
      320,
      input.viewportWidth - 32
    )}px;min-block-size:360px;overflow:visible`;
  root.append(written.root, ...scenes.map(({ root: sceneRoot }) => {
    sceneRoot.style.cssText +=
      ";display:none;position:absolute;inset:0;pointer-events:none";
    return sceneRoot;
  }));
  const app = input.document.querySelector<HTMLElement>("#app");
  if (app !== null) app.style.display = "none";
  Object.assign(input.document.body.style, {
    margin: "0",
    minHeight: "100vh",
    display: "grid",
    placeItems: "center"
  });
  input.document.body.append(root);
  const initialView = input.document.defaultView;
  if (initialView === null) {
    throw new Error("Generated browser harness requires a live window.");
  }
  await primeKpPlaceValueNativeScenes({
    document: input.document,
    view: initialView,
    root
  });
  await kpNativeKatexFeaturePackLoader.load();
  await Promise.all([
    input.document.fonts.load("40px KaTeX_Main"),
    input.document.fonts.load("40px KaTeX_Math")
  ]);
  await input.document.fonts.ready;
  const view = input.document.defaultView;
  if (view === null) {
    throw new Error("Generated browser harness requires a live window.");
  }
  await new Promise<void>((resolve) => view.requestAnimationFrame(() =>
    view.requestAnimationFrame(() => resolve())
  ));
  for (const scene of scenes) {
    const display = scene.root.style.display;
    try {
      scene.root.style.display = "grid";
      void scene.root.offsetWidth;
      scene.prepare();
    } finally {
      scene.root.style.display = display;
    }
  }
  const persistentCell = (semanticEntityId: string): HTMLElement => {
    const element = written.cellElements.get(semanticEntityId);
    if (element === undefined) {
      throw new Error(`Missing generated persistent cell ${semanticEntityId}.`);
    }
    return element;
  };
  const operationScene = (
    positionId: string,
    operation: "evaluation" | "exchange"
  ): HTMLElement => {
    const entry = operation === "evaluation"
      ? evaluations.find(({ program }) => program.position.id === positionId)
      : exchanges.find(({ program }) => program.position.id === positionId);
    if (entry === undefined) {
      throw new Error(`Missing generated ${operation} scene ${positionId}.`);
    }
    return entry.scene.root;
  };
  const applyOperation = (input: {
    readonly positionId: string;
    readonly operation: "evaluation" | "exchange";
    readonly progress: number;
    readonly direction: "forward" | "rewind";
  }): void => {
    for (const scene of scenes) scene.root.style.display = "none";
    const entry = input.operation === "evaluation"
      ? evaluations.find(({ program }) =>
          program.position.id === input.positionId
        )
      : exchanges.find(({ program }) =>
          program.position.id === input.positionId
        );
    if (entry === undefined) {
      throw new Error(
        `Missing generated ${input.operation} operation ${input.positionId}.`
      );
    }
    entry.scene.root.style.display = "grid";
    void entry.scene.root.offsetWidth;
    entry.scene.apply(input.progress, input.direction);
  };
  const materialOwners = (stage: HTMLElement) => Object.freeze([
    ...stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )
  ].map((owner) => {
    const style = view.getComputedStyle(owner);
    return Object.freeze({
      id: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
      semanticId:
        owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "",
      opacity: style.opacity,
      transform: style.transform,
      text: owner.textContent?.trim() ?? ""
    });
  }).sort((left, right) => left.id.localeCompare(right.id)));
  const paintMetric = (element: HTMLElement) => {
    const rect = measureKpNativeKatexSubtreePaintRect(root, element) ??
      element.getBoundingClientRect();
    return Object.freeze({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      center: Object.freeze({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    });
  };
  const settleLayout = async (): Promise<void> => new Promise((resolve) =>
    view.requestAnimationFrame(() => view.requestAnimationFrame(() => resolve()))
  );
  return Object.freeze({
    fixture,
    root,
    written,
    persistentCell,
    operationScene,
    applyOperation,
    materialOwners,
    paintMetric,
    settleLayout,
    settleResult() {
      written.setEndpoint("settled");
      for (const cell of fixture.projection.cells) {
        if (cell.role === "carry-digit") {
          persistentCell(cell.semanticEntityId).dataset["kpVisibility"] =
            "hidden";
        }
      }
    },
    dispose() {
      for (const scene of scenes) scene.dispose();
      root.remove();
    }
  });
}

async function primeKpPlaceValueNativeScenes(input: {
  readonly document: Document;
  readonly view: Window;
  readonly root: HTMLElement;
}): Promise<void> {
  const scenes = [
    ...input.root.querySelectorAll<HTMLElement>(
      "[data-kp-place-value-native-scene]"
    )
  ];
  const previous = scenes.map((scene) => ({
    scene,
    display: scene.style.display,
    visibility: scene.style.visibility,
    position: scene.style.position,
    inset: scene.style.inset,
    pointerEvents: scene.style.pointerEvents
  }));
  try {
    for (const { scene } of previous) {
      scene.style.display = "grid";
      scene.style.visibility = "hidden";
      scene.style.position = "absolute";
      scene.style.inset = "0";
      scene.style.pointerEvents = "none";
    }
    // Hidden motion endpoints otherwise do not request their KaTeX fonts on a
    // cold browser. Warm every endpoint before `fonts.ready`, then give grid
    // and ResizeObserver invalidations two frames to settle before measurement.
    void input.root.offsetWidth;
    await Promise.all([
      input.document.fonts.load("40px KaTeX_Main"),
      input.document.fonts.load("40px KaTeX_Math")
    ]);
    await input.document.fonts.ready;
    await new Promise<void>((resolve) => input.view.requestAnimationFrame(() =>
      input.view.requestAnimationFrame(() => resolve())
    ));
  } finally {
    for (const state of previous) {
      state.scene.style.display = state.display;
      state.scene.style.visibility = state.visibility;
      state.scene.style.position = state.position;
      state.scene.style.inset = state.inset;
      state.scene.style.pointerEvents = state.pointerEvents;
    }
  }
}
