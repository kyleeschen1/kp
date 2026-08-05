import assert from "node:assert/strict";
import test from "node:test";

import {
  kpTutorialTwelvePassagePageFixture
} from "../src/tutorial/kp-tutorial-motion-passage-fixtures.ts";
import {
  projectKpTutorialMotionPassageLifecycle,
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

test("twelve passages reuse two chunks while retaining independent paused sessions", async () => {
  const hosts = new Map(kpTutorialTwelvePassagePageFixture.passages.map(
    ({ id }) => [id, createHost()] as const
  ));
  const loadCounts = new Map<CapabilityId, number>();
  const sessions = new Map<PassageId, SessionRecord>();
  const coordinator = new KpTutorialMotionPassageRuntimeCoordinator({
    registrations: kpTutorialTwelvePassagePageFixture.passages.map((passage) => ({
      passageId: passage.id,
      capabilityId: passage.capabilityId,
      host: hosts.get(passage.id)!.host
    })),
    loadCapability: async (capabilityId) => {
      loadCounts.set(capabilityId, (loadCounts.get(capabilityId) ?? 0) + 1);
      return capability(capabilityId, sessions);
    }
  });
  const initial = projectKpTutorialMotionPassageLifecycle({
    passages: kpTutorialTwelvePassagePageFixture.passages,
    focusedPassageId: kpTutorialTwelvePassagePageFixture.focusedPassageId,
    reducedMotion: false,
    policy: kpTutorialTwelvePassagePageFixture.policy
  });

  await coordinator.apply(initial);
  await coordinator.apply(initial);
  assert.deepEqual([...loadCounts.entries()].sort(), [
    ["economics.equilibrium-graph", 1],
    ["physics.work-energy-graph", 1]
  ]);
  assert.equal(sessions.size, 3);
  assert.equal([...sessions.values()].filter(({ active }) => active).length, 1);
  assert.equal(sessions.get(initial.activeMotionPassageId!)?.active, true);
  assert.ok([...sessions.values()].every(({ pauses }) => pauses >= 1));

  const shiftedPassages = shiftWindow(
    kpTutorialTwelvePassagePageFixture.passages,
    6
  );
  const shifted = projectKpTutorialMotionPassageLifecycle({
    passages: shiftedPassages,
    focusedPassageId: shiftedPassages[6]!.id,
    reducedMotion: false,
    policy: kpTutorialTwelvePassagePageFixture.policy
  });
  await coordinator.apply(shifted);
  assert.deepEqual([...loadCounts.values()].sort(), [1, 1]);
  assert.equal([...sessions.values()].filter(({ active }) => active).length, 1);
  assert.equal(sessions.get(shifted.activeMotionPassageId!)?.active, true);
  assert.equal(sessions.get(initial.activeMotionPassageId!)?.active, false);
  const retiredId = kpTutorialTwelvePassagePageFixture.passages[4]!.id;
  assert.equal(sessions.get(retiredId)?.disposals, 1);
  assert.equal(hosts.get(retiredId)?.host.snapshot(), "dehydrated");
});

test("a stale capability load cannot remount a newly distant passage", async () => {
  const fixturePassage = kpTutorialTwelvePassagePageFixture.passages[0]!;
  const host = createHost();
  let resolveCapability: ((value: KpTutorialMotionPassageCapability<
    CapabilityId,
    PassageId
  >) => void) | undefined;
  let mounts = 0;
  const pendingCapability = new Promise<KpTutorialMotionPassageCapability<
    CapabilityId,
    PassageId
  >>((resolve) => { resolveCapability = resolve; });
  const coordinator = new KpTutorialMotionPassageRuntimeCoordinator({
    registrations: [{
      passageId: fixturePassage.id,
      capabilityId: fixturePassage.capabilityId,
      host: host.host
    }],
    loadCapability: () => pendingCapability
  });
  const visible = projectKpTutorialMotionPassageLifecycle({
    passages: [{ ...fixturePassage, proximity: "visible" }],
    focusedPassageId: fixturePassage.id,
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  });
  const pending = coordinator.apply(visible);
  const distant = projectKpTutorialMotionPassageLifecycle({
    passages: [{ ...fixturePassage, proximity: "distant" }],
    reducedMotion: false,
    policy: { maxHydratedPassages: 1 }
  });
  await coordinator.apply(distant);
  resolveCapability?.({
    id: fixturePassage.capabilityId,
    mount: () => {
      mounts += 1;
      return sessionRecord();
    }
  });
  await pending;
  assert.equal(mounts, 0);
  assert.equal(host.host.snapshot(), "dehydrated");
});

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
  pauses: number;
  resumes: number;
  disposals: number;
  progress: number[];
  applySemanticProgress(progress: number): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}

function sessionRecord(): SessionRecord {
  return {
    active: false,
    pauses: 0,
    resumes: 0,
    disposals: 0,
    progress: [],
    applySemanticProgress(progress) { this.progress.push(progress); },
    pause() { this.active = false; this.pauses += 1; },
    resume() { this.active = true; this.resumes += 1; },
    dispose() { this.active = false; this.disposals += 1; }
  };
}

function shiftWindow(
  passages: readonly KpTutorialPresentMotionPassage<PassageId, CapabilityId>[],
  focusedIndex: number
): readonly KpTutorialPresentMotionPassage<PassageId, CapabilityId>[] {
  return passages.map((passage, index) => ({
    ...passage,
    proximity: index === focusedIndex
      ? "visible" as const
      : Math.abs(index - focusedIndex) === 1
        ? "near" as const
        : "distant" as const,
    semanticProgress: index < focusedIndex ? 1 : index === focusedIndex ? 0.5 : 0
  }));
}

function createHost() {
  const root = fakeElement();
  const staticSurface = fakeElement();
  const liveSurface = fakeElement();
  return {
    host: new KpTutorialMotionStageReservationHost({
      root,
      staticSurface,
      liveSurface,
      reservedBlockSize: 480
    })
  };
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
