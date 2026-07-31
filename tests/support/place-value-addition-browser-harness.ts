import {
  createKpReaderClockSample
} from "../../src/reader/runtime/playback-clock.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "../../src/rendering/native-katex-paint-geometry.ts";
import {
  createKpPlaceValueAdditionRuntimeSession,
  sampleKpPlaceValueAdditionRuntime
} from "../../src/rendering/place-value-addition-runtime.ts";
import {
  createKpPlaceValueAdditionSharedDom
} from "../../src/rendering/place-value-addition-shared-dom.ts";

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
  input.document.body.append(dom.root);
  Object.assign(input.document.body.style, {
    margin: "0",
    minHeight: "100vh",
    display: "grid",
    placeItems: "center"
  });
  await input.document.fonts.ready;
  dom.prepareNativeScenes();
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
    dispose: dom.dispose
  });
}
