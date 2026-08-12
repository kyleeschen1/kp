import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpSchemePedagogicalScore,
  validateKpSchemePedagogicalScore,
  type KpSchemePedagogicalScore
} from "../src/semantic/scheme-factorial-pedagogical-score.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const document = parseKpSchemeFactorialSource();
const trace = readKpSchemeFactorialTraceArtifact().trace;
const eventIds = trace.events.map(({ id }) => id);

test("freezes a framework-neutral score with grouping holds and emphasis", () => {
  const score = defineKpSchemePedagogicalScore(document, trace, validScore());
  assert.equal(Object.isFrozen(score), true);
  assert.equal(Object.isFrozen(score.beats), true);
  assert.equal(Object.isFrozen(score.beats[0]?.focus), true);
  assert.equal(score.beats[1]?.kind, "summary");
  assert.equal(score.beats[1]?.hold, "inspection");
  assert.doesNotThrow(() => JSON.stringify(score));
});

test("allows explicit omission without pretending the event did not occur", () => {
  const omittedEventId = eventIds[1]!;
  const score = validScore({ omittedEventId });
  assert.deepEqual(validateKpSchemePedagogicalScore(document, trace, score), []);
  assert.equal(score.omissions[0]?.eventId, omittedEventId);
  assert.equal(score.beats.flatMap(({ eventIds: ids }) => ids)
    .includes(omittedEventId), false);
});

test("rejects score order that reverses factual trace order", () => {
  const score = validScore();
  const invalid: KpSchemePedagogicalScore = {
    ...score,
    beats: [{
      ...score.beats[0]!,
      eventIds: [eventIds[1]!, eventIds[0]!]
    }, {
      ...score.beats[1]!,
      eventIds: eventIds.slice(2)
    }]
  };
  assert.ok(messages(invalid).some((message) =>
    message.includes("reverses trace causal order")));
});

test("rejects missing duplicated and unknown event authority", () => {
  const base = validScore();
  const missing: KpSchemePedagogicalScore = {
    ...base,
    beats: [base.beats[0]!, {
      ...base.beats[1]!,
      eventIds: base.beats[1]!.eventIds.slice(0, -1)
    }]
  };
  assert.ok(messages(missing).some((message) =>
    message.includes("must be selected or omitted exactly once")));

  const duplicate: KpSchemePedagogicalScore = {
    ...base,
    beats: [base.beats[0]!, {
      ...base.beats[1]!,
      eventIds: [eventIds[0]!, ...base.beats[1]!.eventIds]
    }]
  };
  assert.ok(messages(duplicate).some((message) =>
    message.includes("must be selected or omitted exactly once")));

  const unknown: KpSchemePedagogicalScore = {
    ...base,
    beats: [{
      ...base.beats[0]!,
      eventIds: ["scheme-factorial.event.missing"]
    }, base.beats[1]!]
  };
  assert.ok(messages(unknown).some((message) =>
    message.includes("unknown trace event")));
});

test("rejects ungrounded emphasis and one-event summary claims", () => {
  const base = validScore();
  const invalid: KpSchemePedagogicalScore = {
    ...base,
    beats: [{
      ...base.beats[0]!,
      kind: "summary",
      focus: [{ kind: "value", id: "scheme-factorial.value.missing" }]
    }, base.beats[1]!]
  };
  const result = messages(invalid);
  assert.ok(result.some((message) =>
    message.includes("summary beats must group at least two")));
  assert.ok(result.some((message) =>
    message.includes("unknown value")));
});

function validScore(options: {
  readonly omittedEventId?: string;
} = {}): KpSchemePedagogicalScore {
  const selected = options.omittedEventId === undefined
    ? eventIds
    : eventIds.filter((id) => id !== options.omittedEventId);
  const first = selected[0]!;
  return {
    schemaVersion: "kp.scheme-pedagogical-score.v1",
    id: "scheme-factorial.score.test",
    traceDocumentId: document.id,
    beats: [{
      id: "beat.first",
      kind: "detail",
      eventIds: [first],
      caption: "The definition becomes a callable value.",
      hold: "reading",
      focus: [{
        kind: "source-expression",
        id: trace.events[0]!.sourceExpressionIds[0]!
      }]
    }, {
      id: "beat.rest",
      kind: "summary",
      eventIds: selected.slice(1),
      caption: "The remaining evaluation retains its factual order.",
      hold: "inspection",
      focus: [{ kind: "event", id: selected.at(-1)! }]
    }],
    omissions: options.omittedEventId === undefined ? [] : [{
      eventId: options.omittedEventId,
      rationale: "mechanical",
      note: "The score omits this display beat while retaining trace truth."
    }]
  };
}

function messages(score: KpSchemePedagogicalScore): readonly string[] {
  return validateKpSchemePedagogicalScore(document, trace, score).map(
    ({ message }) => message
  );
}
