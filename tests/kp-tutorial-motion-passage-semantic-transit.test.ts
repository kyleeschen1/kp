import assert from "node:assert/strict";
import test from "node:test";

import {
  KpTutorialSemanticTransitGeometryCache,
  projectKpTutorialSemanticTransitGeometry,
  projectKpTutorialSemanticTransitPresentation,
  projectKpTutorialSemanticTransitTransform,
  type KpTutorialSemanticTransitRect
} from "../src/tutorial/kp-tutorial-semantic-transit-geometry.ts";
import {
  compileKpTutorialSemanticTransitAuthoring,
  defineKpTutorialSemanticTransit,
  defineKpTutorialStageObject,
  defineKpTutorialTextReference
} from "../src/tutorial/kp-tutorial-semantic-transit-authoring.ts";

test("semantic transit transform is exact, native-scale, and reversible", () => {
  const projection = {
    sourceViewport: stageRect(700, 300),
    destinationViewport: stageRect(200, 100),
    stageViewport: stageRect(100, 40),
    viewport: { width: 1280, height: 800 }
  };
  const forward = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
    projectKpTutorialSemanticTransitTransform({ projection, progress })
  );
  assert.deepEqual(forward.map(({ progress, x, y, visible }) => ({
    progress,
    x,
    y,
    visible
  })), [
    { progress: 0, x: 700, y: 300, visible: false },
    { progress: 0.25, x: 575, y: 250, visible: true },
    { progress: 0.5, x: 450, y: 200, visible: true },
    { progress: 0.75, x: 325, y: 150, visible: true },
    { progress: 1, x: 200, y: 100, visible: false }
  ]);
  assert.deepEqual(
    [...forward].reverse(),
    [1, 0.75, 0.5, 0.25, 0].map((progress) =>
      projectKpTutorialSemanticTransitTransform({ projection, progress })
    )
  );
});

test("semantic transit presentation fails back to static native endpoints", () => {
  assert.equal(projectKpTutorialSemanticTransitPresentation({
    desktopLayout: true,
    reducedMotion: false
  }), "animated");
  assert.equal(projectKpTutorialSemanticTransitPresentation({
    desktopLayout: false,
    reducedMotion: false
  }), "phone-static");
  assert.equal(projectKpTutorialSemanticTransitPresentation({
    desktopLayout: true,
    reducedMotion: true
  }), "reduced-motion-static");
  assert.equal(projectKpTutorialSemanticTransitPresentation({
    desktopLayout: false,
    reducedMotion: true
  }), "phone-static");
});

test("semantic transit identity is authored independently of text and DOM position", () => {
  const reference = defineKpTutorialTextReference({
    id: "price-axis-inline",
    passageId: "graph-at-rest"
  });
  const object = defineKpTutorialStageObject({
    id: "axis-price",
    stageId: "demand-shift-graph"
  });
  const transit = defineKpTutorialSemanticTransit({
    id: "price-axis-correspondence",
    sourceReferenceId: reference.id,
    destinationObjectId: object.id
  });
  assert.deepEqual(compileKpTutorialSemanticTransitAuthoring({
    textReferences: [reference],
    stageObjects: [object],
    transits: [transit],
    passageIds: ["graph-at-rest"],
    stageIds: ["demand-shift-graph"]
  }), {
    schemaVersion: "kp.tutorial.semantic-transit-authoring.v1",
    textReferences: [reference],
    stageObjects: [object],
    transits: [transit]
  });
  assert.deepEqual(Object.keys(transit), [
    "schemaVersion",
    "id",
    "sourceReferenceId",
    "destinationObjectId"
  ]);
});

test("semantic transit authoring fails closed on missing or positional endpoints", () => {
  const reference = defineKpTutorialTextReference({
    id: "price-axis-inline",
    passageId: "graph-at-rest"
  });
  const object = defineKpTutorialStageObject({
    id: "axis-price",
    stageId: "demand-shift-graph"
  });
  assert.throws(() => compileKpTutorialSemanticTransitAuthoring({
    textReferences: [reference],
    stageObjects: [object],
    transits: [defineKpTutorialSemanticTransit({
      id: "missing-source",
      sourceReferenceId: "unknown-reference",
      destinationObjectId: object.id
    })],
    passageIds: ["graph-at-rest"],
    stageIds: ["demand-shift-graph"]
  }), /unknown text reference/);
  assert.throws(() => defineKpTutorialSemanticTransit({
    id: "position:3",
    sourceReferenceId: reference.id,
    destinationObjectId: object.id
  }), /semantic slug/);
});

test("semantic transit caches document and stage-local geometry", () => {
  let scrollY = 100;
  let invalidations = 0;
  let resizeCallback: ResizeObserverCallback | undefined;
  const fonts = new EventTarget();
  class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
    observe(): void {}
    disconnect(): void {}
  }
  const events = new EventTarget();
  const view = {
    innerWidth: 1280,
    innerHeight: 800,
    scrollX: 0,
    get scrollY() { return scrollY; },
    document: { fonts },
    ResizeObserver: FakeResizeObserver,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events)
  } as unknown as Window;
  const source = elementRect({ left: 720, top: 200, width: 18, height: 24 });
  const stage = elementRect({ left: 120, top: 100, width: 480, height: 480 });
  const destination = elementRect({ left: 140, top: 250, width: 18, height: 24 });
  const cache = new KpTutorialSemanticTransitGeometryCache(
    view,
    () => ({ source, destination, stage }),
    { onInvalidated: () => { invalidations += 1; } }
  );

  cache.connect();
  const geometry = cache.geometry();
  assert.equal(cache.measurementReads(), 3);
  assert.deepEqual(pickRect(geometry.sourceDocument), {
    left: 720,
    top: 300,
    width: 18,
    height: 24
  });
  assert.deepEqual(pickRect(geometry.destinationStageLocal), {
    left: 20,
    top: 150,
    width: 18,
    height: 24
  });
  assert.equal(cache.geometry(), geometry);
  assert.equal(cache.measurementReads(), 3);

  const initialProjection = projectKpTutorialSemanticTransitGeometry({
    geometry,
    scrollX: 0,
    scrollY,
    stageViewport: stageRect(120, 100)
  });
  assert.deepEqual(pickRect(initialProjection.sourceViewport), {
    left: 720,
    top: 200,
    width: 18,
    height: 24
  });
  assert.deepEqual(pickRect(initialProjection.destinationViewport), {
    left: 140,
    top: 250,
    width: 18,
    height: 24
  });

  scrollY = 150;
  const scrolledProjection = projectKpTutorialSemanticTransitGeometry({
    geometry,
    scrollX: 0,
    scrollY,
    stageViewport: stageRect(120, 100)
  });
  assert.equal(scrolledProjection.sourceViewport.top, 150);
  assert.equal(scrolledProjection.destinationViewport.top, 250);
  assert.equal(cache.measurementReads(), 3);

  events.dispatchEvent(new Event("resize"));
  events.dispatchEvent(new Event("resize"));
  assert.equal(invalidations, 1);
  assert.equal(cache.geometry().revision, 2);
  assert.equal(cache.measurementReads(), 6);
  fonts.dispatchEvent(new Event("loadingdone"));
  assert.equal(invalidations, 2);
  assert.equal(cache.geometry().revision, 3);
  assert.equal(cache.measurementReads(), 9);
  resizeCallback?.([], {} as ResizeObserver);
  assert.equal(invalidations, 3);
  assert.equal(cache.geometry().revision, 4);
  assert.equal(cache.measurementReads(), 12);
  cache.disconnect();
});

test("semantic transit geometry rejects invalid viewport and rect authority", () => {
  assert.throws(() => projectKpTutorialSemanticTransitGeometry({
    geometry: {
      revision: 1,
      sourceDocument: stageRect(0, 0),
      destinationDocument: stageRect(0, 0),
      destinationStageLocal: stageRect(0, 0),
      stageDocument: stageRect(0, 0),
      viewport: { width: 100, height: 100 }
    },
    scrollX: Number.NaN,
    scrollY: 0
  }), /scroll x must be finite/);
});

function elementRect(rect: Pick<KpTutorialSemanticTransitRect,
  "left" | "top" | "width" | "height"
>): HTMLElement {
  return {
    getBoundingClientRect: () => rect
  } as unknown as HTMLElement;
}

function stageRect(left: number, top: number): KpTutorialSemanticTransitRect {
  return {
    left,
    top,
    width: 480,
    height: 480,
    right: left + 480,
    bottom: top + 480,
    centerX: left + 240,
    centerY: top + 240
  };
}

function pickRect(rect: KpTutorialSemanticTransitRect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}
