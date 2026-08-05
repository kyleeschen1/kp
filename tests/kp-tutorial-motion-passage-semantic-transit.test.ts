import assert from "node:assert/strict";
import test from "node:test";

import {
  KpTutorialSemanticTransitGeometryCache,
  projectKpTutorialSemanticTransitGeometry,
  type KpTutorialSemanticTransitRect
} from "../src/tutorial/kp-tutorial-semantic-transit-geometry.ts";

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
