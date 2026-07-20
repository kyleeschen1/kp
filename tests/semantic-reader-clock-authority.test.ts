import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderClockAuthorityState,
  reduceKpReaderClockAuthority,
  type KpReaderClockAuthorityState
} from "../src/reader/runtime/public-api.ts";

test("URL restoration is one-shot and releases cleanly to scroll", () => {
  let state = createKpReaderClockAuthorityState();
  ({ state } = decide(state, "begin", "url", 0, true));
  ({ state } = decide(state, "update", "url", 1, true));
  ({ state } = decide(state, "end", "url", 2, true));
  assert.deepEqual(state, { authority: "scroll", userEngaged: false, lastSequence: 2 });
});

test("direct user scroll and controls preempt automation permanently", () => {
  let state = createKpReaderClockAuthorityState();
  ({ state } = decide(state, "begin", "autoplay", 0, true));
  ({ state } = decide(state, "begin", "scroll", 1, true));
  assert.equal(state.userEngaged, true);
  const autoplay = reduceKpReaderClockAuthority(state, {
    kind: "begin",
    source: "autoplay",
    sequence: 2
  });
  assert.equal(autoplay.accepted, false);
  assert.equal(autoplay.reason, "user-authority-preserved");
  const controls = reduceKpReaderClockAuthority(state, {
    kind: "begin",
    source: "controls",
    sequence: 3
  });
  assert.equal(controls.accepted, true);
  assert.equal(controls.state.authority, "controls");
});

test("inactive and stale updates cannot move the active clock", () => {
  const initial = createKpReaderClockAuthorityState();
  const scroll = reduceKpReaderClockAuthority(initial, {
    kind: "begin",
    source: "scroll",
    sequence: 10
  }).state;
  const inactive = reduceKpReaderClockAuthority(scroll, {
    kind: "update",
    source: "url",
    sequence: 11
  });
  assert.equal(inactive.accepted, false);
  assert.equal(inactive.reason, "inactive-source");
  const stale = reduceKpReaderClockAuthority(scroll, {
    kind: "update",
    source: "scroll",
    sequence: 10
  });
  assert.equal(stale.accepted, false);
  assert.equal(stale.reason, "stale-sequence");
  assert.equal(stale.state, scroll);
});

test("reduction is deterministic and does not mutate prior state", () => {
  const state = createKpReaderClockAuthorityState();
  const event = { kind: "begin", source: "controls", sequence: 0 } as const;
  const first = reduceKpReaderClockAuthority(state, event);
  const second = reduceKpReaderClockAuthority(state, event);
  assert.deepEqual(first, second);
  assert.deepEqual(state, { authority: "initial", userEngaged: false, lastSequence: -1 });
});

function decide(
  state: KpReaderClockAuthorityState,
  kind: "begin" | "update" | "end",
  source: "initial" | "scroll" | "controls" | "autoplay" | "url",
  sequence: number,
  accepted: boolean
) {
  const decision = reduceKpReaderClockAuthority(state, { kind, source, sequence });
  assert.equal(decision.accepted, accepted);
  return decision;
}
