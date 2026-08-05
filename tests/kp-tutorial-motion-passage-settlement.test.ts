import assert from "node:assert/strict";
import test from "node:test";

import {
  kpTutorialTwelvePassagePageFixture
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

type PassageId = string;
type CapabilityId = "economics.equilibrium-graph" | "physics.work-energy-graph";

test("settlement is exact at every passage in both traversal directions", () => {
  const passages = kpTutorialTwelvePassagePageFixture.passages;
  for (const indices of [
    passages.map((_, index) => index),
    passages.map((_, index) => passages.length - index - 1)
  ]) {
    for (const activeIndex of indices) {
      for (const localProgress of [0, 0.375, 1]) {
        const settled = projectKpTutorialMotionPassageSettlement({
          passages,
          activePassageId: passages[activeIndex]!.id,
          localProgress
        });
        assert.deepEqual(
          settled.map(({ semanticProgress }) => semanticProgress),
          passages.map((_, index) =>
            index < activeIndex ? 1 : index === activeIndex ? localProgress : 0
          )
        );
      }
    }
  }
  assert.throws(() => projectKpTutorialMotionPassageSettlement({
    passages,
    activePassageId: passages[0]!.id,
    localProgress: 1.01
  }), /within \[0, 1\]/);
});

test("twelve-stage traversal keeps one accessible surface and one motion owner", async () => {
  const stages = new Map(kpTutorialTwelvePassagePageFixture.passages.map(
    ({ id }) => [id, createStage()] as const
  ));
  const sessions = new Map<PassageId, SessionRecord>();
  const loads = new Map<CapabilityId, number>();
  const runtime = new KpTutorialMotionPassageRuntimeCoordinator({
    registrations: kpTutorialTwelvePassagePageFixture.passages.map((passage) => ({
      passageId: passage.id,
      capabilityId: passage.capabilityId,
      host: stages.get(passage.id)!.host
    })),
    loadCapability: async (capabilityId) => {
      loads.set(capabilityId, (loads.get(capabilityId) ?? 0) + 1);
      return capability(capabilityId, sessions);
    }
  });
  const forward = kpTutorialTwelvePassagePageFixture.passages.map(
    (_, index) => index
  );
  const reverse = [...forward].reverse();
  for (const activeIndex of [...forward, ...reverse]) {
    const plan = lifecycleAt(activeIndex, false);
    await runtime.apply(plan);
    assert.equal(
      [...sessions.values()].filter(({ active }) => active).length,
      1
    );
    assert.equal(sessions.get(plan.activeMotionPassageId!)?.active, true);
    for (const projection of plan.passages) {
      const stage = stages.get(projection.id)!;
      const staticAccessible = !stage.staticSurface.hidden() &&
        stage.staticSurface.ariaHidden() === "false";
      const liveAccessible = !stage.liveSurface.hidden() &&
        stage.liveSurface.ariaHidden() === "false";
      assert.notEqual(staticAccessible, liveAccessible);
      assert.equal(liveAccessible, projection.runtime === "hydrated");
      if (projection.runtime === "hydrated") {
        assert.equal(
          sessions.get(projection.id)?.progress.at(-1),
          projection.semanticProgress
        );
      }
    }
  }
  assert.deepEqual([...loads.entries()].sort(), [
    ["economics.equilibrium-graph", 1],
    ["physics.work-energy-graph", 1]
  ]);

  const reduced = lifecycleAt(5, true);
  await runtime.apply(reduced);
  assert.equal(reduced.activeMotionPassageId, undefined);
  assert.equal([...sessions.values()].some(({ active }) => active), false);
  assert.equal(reduced.passages.filter(({ runtime }) => runtime === "hydrated").length, 3);
});

function lifecycleAt(activeIndex: number, reducedMotion: boolean) {
  const base = kpTutorialTwelvePassagePageFixture.passages;
  const settled = projectKpTutorialMotionPassageSettlement({
    passages: base,
    activePassageId: base[activeIndex]!.id,
    localProgress: 0.375
  });
  const observed = settled.map((passage, index) => ({
    ...passage,
    proximity: index === activeIndex
      ? "visible" as const
      : Math.abs(index - activeIndex) === 1
        ? "near" as const
        : "distant" as const
  })) satisfies readonly KpTutorialPresentMotionPassage<PassageId, CapabilityId>[];
  return projectKpTutorialMotionPassageLifecycle({
    passages: observed,
    focusedPassageId: observed[activeIndex]!.id,
    reducedMotion,
    policy: kpTutorialTwelvePassagePageFixture.policy
  });
}

function capability(
  id: CapabilityId,
  sessions: Map<PassageId, SessionRecord>
): KpTutorialMotionPassageCapability<CapabilityId, PassageId> {
  return {
    id,
    mount: ({ passageId }) => {
      const session = sessionRecord();
      sessions.set(passageId, session);
      return session;
    }
  };
}

interface SessionRecord {
  active: boolean;
  progress: number[];
  applySemanticProgress(progress: number): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}

function sessionRecord(): SessionRecord {
  return {
    active: false,
    progress: [],
    applySemanticProgress(progress) { this.progress.push(progress); },
    pause() { this.active = false; },
    resume() { this.active = true; },
    dispose() { this.active = false; }
  };
}

function createStage() {
  const root = fakeElement();
  const staticSurface = fakeElement();
  const liveSurface = fakeElement();
  return {
    host: new KpTutorialMotionStageReservationHost({
      root: root.element,
      staticSurface: staticSurface.element,
      liveSurface: liveSurface.element,
      reservedBlockSize: 480
    }),
    staticSurface,
    liveSurface
  };
}

function fakeElement() {
  let hidden = false;
  const attributes = new Map<string, string>();
  const style = new Map<string, string>();
  const element = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty: (property: string, value: string) => { style.set(property, value); },
      removeProperty: (property: string) => {
        const previous = style.get(property) ?? "";
        style.delete(property);
        return previous;
      }
    },
    classList: { add: () => undefined, remove: () => undefined },
    get hidden() { return hidden; },
    set hidden(value: boolean) { hidden = value; },
    setAttribute: (attribute: string, value: string) => {
      attributes.set(attribute, value);
    },
    replaceChildren: () => undefined
  } as unknown as HTMLElement;
  return {
    element,
    hidden: () => hidden,
    ariaHidden: () => attributes.get("aria-hidden")
  };
}
