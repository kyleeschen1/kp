import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpTutorialPageScalePerformance,
  kpTutorialPageScalePerformanceBudget,
  type KpTutorialPageScalePerformanceObservation
} from "../src/tutorial/kp-tutorial-page-scale-performance.ts";
import {
  KpTutorialPageScrollCoordinator,
  type KpTutorialPageScrollBlockRegistration,
  type KpTutorialPageScrollProjection
} from "../src/tutorial/kp-tutorial-page-scroll-coordinator.ts";
import {
  createKpTutorialMotionPassagePageFixture,
  kpTutorialMotionPassageFixtureSizes,
  type KpTutorialMotionPassageFixtureCapabilityId,
  type KpTutorialMotionPassagePageFixture
} from "../src/tutorial/kp-tutorial-motion-passage-fixtures.ts";
import {
  projectKpTutorialMotionPassageLifecycle,
  projectKpTutorialMotionPassageSettlement,
  type KpTutorialPresentMotionPassage
} from "../src/tutorial/kp-tutorial-motion-passage-lifecycle.ts";
import {
  KpTutorialMotionPassageRuntimeCoordinator,
  type KpTutorialMotionPassageCapability
} from "../src/tutorial/kp-tutorial-motion-passage-runtime.ts";
import {
  KpTutorialMotionStageReservationHost
} from "../src/tutorial/kp-tutorial-motion-stage-reservation.ts";

const corridor = Object.freeze({
  startViewportRatio: 0.6,
  endViewportRatio: 0.2,
  keyframes: Object.freeze([
    Object.freeze({ travel: 0, progress: 0 }),
    Object.freeze({ travel: 1, progress: 1 })
  ])
});

for (const size of kpTutorialMotionPassageFixtureSizes) {
  test(`${size}-passage page remains inside the page-scale performance boundary`, async () => {
    const fixture = createKpTutorialMotionPassagePageFixture(size);
    const scroll = measureScrollBoundary(fixture);
    const runtime = await measureRuntimeBoundary(fixture);
    const observation: KpTutorialPageScalePerformanceObservation = {
      passageCount: size,
      ...scroll,
      ...runtime
    };

    assert.deepEqual(auditKpTutorialPageScalePerformance(observation), {
      passed: true,
      diagnostics: []
    });
  });
}

test("page-scale audit reports the exact budget that regressed", () => {
  const budget = kpTutorialPageScalePerformanceBudget;
  const observation: KpTutorialPageScalePerformanceObservation = {
    passageCount: 12,
    initialRegistrationReads: 12,
    initialLayoutReads: 12,
    scrollListenerCount: 1,
    resizeListenerCount: 1,
    maxScheduledFramesPerScrollBurst: 1,
    maxProjectedBlocks: budget.maxProjectedBlocks + 1,
    maxNearViewportBlocks: 3,
    ordinaryScrollRegistrationReads: 0,
    ordinaryScrollLayoutReads: 1,
    maxHydratedPassages: 3,
    maxActiveMotionPassages: 1,
    distinctCapabilityCount: 2,
    capabilityLoadCount: 2,
    maxCapabilityLoadsPerIdentity: 1
  };

  assert.deepEqual(auditKpTutorialPageScalePerformance(observation), {
    passed: false,
    diagnostics: [
      { metric: "maxProjectedBlocks", actual: 6, limit: 5 },
      { metric: "ordinaryScrollLayoutReads", actual: 1, limit: 0 }
    ]
  });
});

function measureScrollBoundary(fixture: KpTutorialMotionPassagePageFixture) {
  const frames = new Map<number, FrameRequestCallback>();
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const observed = new Set<Element>();
  let nextFrame = 1;
  let scrollY = 0;
  let intersectionCallback: IntersectionObserverCallback | undefined;
  class FakeIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
    }
    observe(target: Element): void { observed.add(target); }
    unobserve(target: Element): void { observed.delete(target); }
    disconnect(): void { observed.clear(); }
  }
  const view = {
    innerHeight: fixture.viewportBlockSize,
    get scrollY() { return scrollY; },
    IntersectionObserver: FakeIntersectionObserver,
    requestAnimationFrame(callback: FrameRequestCallback): number {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number): void { frames.delete(id); },
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
      const bucket = listeners.get(type) ?? new Set();
      bucket.add(listener);
      listeners.set(type, bucket);
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
      listeners.get(type)?.delete(listener);
    }
  } as unknown as Window;
  const registrations = fixture.passages.map((passage) => ({
    id: `registration.${passage.id}`,
    passageId: passage.id,
    blockId: "primary",
    anchor: {
      getBoundingClientRect: () => {
        const top = passage.documentTop - scrollY;
        return {
          top,
          bottom: top + passage.reservedStageBlockSize,
          height: passage.reservedStageBlockSize
        } as DOMRect;
      }
    } as HTMLElement,
    corridor
  })) satisfies readonly KpTutorialPageScrollBlockRegistration[];
  const projections: KpTutorialPageScrollProjection[] = [];
  const coordinator = new KpTutorialPageScrollCoordinator(
    view,
    () => registrations,
    (projection) => projections.push(projection),
    { profileExecution: true, now: () => 0 }
  );

  coordinator.connect();
  intersectionCallback?.(
    [...observed].map((target) => ({
      target,
      isIntersecting: true
    } as unknown as IntersectionObserverEntry)),
    {} as IntersectionObserver
  );
  runNextFrame(frames);
  const initial = coordinator.snapshotMetrics();
  coordinator.resetMetrics();
  let maxScheduledFramesPerScrollBurst = 0;
  for (let index = 0; index < fixture.passages.length; index += 1) {
    scrollY = index * 720;
    dispatch(listeners, "scroll");
    dispatch(listeners, "scroll");
    maxScheduledFramesPerScrollBurst = Math.max(
      maxScheduledFramesPerScrollBurst,
      frames.size
    );
    runNextFrame(frames);
  }
  const ordinary = coordinator.snapshotMetrics();
  const maxProjectedBlocks = Math.max(...projections.map(
    ({ blocks }) => blocks.length
  ));
  const maxNearViewportBlocks = Math.max(...projections.map(
    ({ nearViewportRegistrationIds }) => nearViewportRegistrationIds.length
  ));
  const result = {
    initialRegistrationReads: initial.registrationReads,
    initialLayoutReads: initial.layoutReads,
    scrollListenerCount: listeners.get("scroll")?.size ?? 0,
    resizeListenerCount: listeners.get("resize")?.size ?? 0,
    maxScheduledFramesPerScrollBurst,
    maxProjectedBlocks,
    maxNearViewportBlocks,
    ordinaryScrollRegistrationReads: ordinary.registrationReads,
    ordinaryScrollLayoutReads: ordinary.layoutReads
  };
  coordinator.disconnect();
  return result;
}

async function measureRuntimeBoundary(fixture: KpTutorialMotionPassagePageFixture) {
  const hosts = new Map(fixture.passages.map(({ id }) => [id, createHost()] as const));
  const loadCounts = new Map<KpTutorialMotionPassageFixtureCapabilityId, number>();
  const sessions = new Map<string, SessionRecord>();
  const coordinator = new KpTutorialMotionPassageRuntimeCoordinator({
    registrations: fixture.passages.map((passage) => ({
      passageId: passage.id,
      capabilityId: passage.capabilityId,
      host: hosts.get(passage.id)!
    })),
    loadCapability: async (capabilityId) => {
      loadCounts.set(capabilityId, (loadCounts.get(capabilityId) ?? 0) + 1);
      return capability(capabilityId, sessions);
    }
  });
  let maxHydratedPassages = 0;
  let maxActiveMotionPassages = 0;
  for (let index = 0; index < fixture.passages.length; index += 1) {
    const focused = fixture.passages[index]!;
    const passages = projectKpTutorialMotionPassageSettlement({
      passages: withFocusedProximity(fixture.passages, index),
      activePassageId: focused.id,
      localProgress: 0.5
    });
    const plan = projectKpTutorialMotionPassageLifecycle({
      passages,
      focusedPassageId: focused.id,
      reducedMotion: false,
      policy: fixture.policy
    });
    await coordinator.apply(plan);
    maxHydratedPassages = Math.max(
      maxHydratedPassages,
      [...hosts.values()].filter((host) => host.snapshot() === "hydrated").length
    );
    maxActiveMotionPassages = Math.max(
      maxActiveMotionPassages,
      [...sessions.values()].filter(({ active }) => active).length
    );
  }
  const result = {
    maxHydratedPassages,
    maxActiveMotionPassages,
    distinctCapabilityCount: new Set(
      fixture.passages.map(({ capabilityId }) => capabilityId)
    ).size,
    capabilityLoadCount: [...loadCounts.values()].reduce(
      (total, count) => total + count,
      0
    ),
    maxCapabilityLoadsPerIdentity: Math.max(...loadCounts.values())
  };
  coordinator.dispose();
  return result;
}

function withFocusedProximity(
  passages: readonly KpTutorialPresentMotionPassage<
    string,
    KpTutorialMotionPassageFixtureCapabilityId
  >[],
  focusedIndex: number
) {
  return passages.map((passage, index) => ({
    ...passage,
    proximity: index === focusedIndex
      ? "visible" as const
      : Math.abs(index - focusedIndex) === 1
        ? "near" as const
        : "distant" as const
  }));
}

interface SessionRecord {
  active: boolean;
  applySemanticProgress(progress: number): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}

function capability(
  id: KpTutorialMotionPassageFixtureCapabilityId,
  sessions: Map<string, SessionRecord>
): KpTutorialMotionPassageCapability<
  KpTutorialMotionPassageFixtureCapabilityId,
  string
> {
  return {
    id,
    mount: ({ passageId }) => {
      const session = sessionRecord();
      sessions.set(passageId, session);
      return session;
    }
  };
}

function sessionRecord(): SessionRecord {
  return {
    active: false,
    applySemanticProgress: () => undefined,
    pause() { this.active = false; },
    resume() { this.active = true; },
    dispose() { this.active = false; }
  };
}

function createHost(): KpTutorialMotionStageReservationHost {
  return new KpTutorialMotionStageReservationHost({
    root: fakeElement(),
    staticSurface: fakeElement(),
    liveSurface: fakeElement(),
    reservedBlockSize: 480
  });
}

function fakeElement(): HTMLElement {
  const style = new Map<string, string>();
  const classes = new Set<string>();
  let hidden = false;
  return {
    dataset: {} as Record<string, string>,
    style: {
      setProperty: (property: string, value: string) => { style.set(property, value); },
      removeProperty: (property: string) => {
        const previous = style.get(property) ?? "";
        style.delete(property);
        return previous;
      }
    },
    classList: {
      add: (value: string) => { classes.add(value); },
      remove: (value: string) => { classes.delete(value); }
    },
    get hidden() { return hidden; },
    set hidden(value: boolean) { hidden = value; },
    setAttribute: () => undefined,
    replaceChildren: () => undefined
  } as unknown as HTMLElement;
}

function dispatch(
  listeners: ReadonlyMap<string, Set<EventListenerOrEventListenerObject>>,
  type: string
): void {
  for (const listener of listeners.get(type) ?? []) {
    if (typeof listener === "function") listener(new Event(type));
    else listener.handleEvent(new Event(type));
  }
}

function runNextFrame(frames: Map<number, FrameRequestCallback>): void {
  const next = frames.entries().next().value;
  assert.ok(next);
  frames.delete(next[0]);
  next[1](0);
}
