import {
  defineKpSchemePedagogicalScore,
  type KpSchemePedagogicalScore,
  type KpSchemeScoreFocusTarget
} from "./scheme-factorial-pedagogical-score.ts";
import { parseKpSchemeFactorialSource } from
  "./scheme-factorial-parser.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "./scheme-factorial-trace-artifact.ts";
import type { KpSchemeTraceEvent } from "./scheme-factorial-trace.ts";

const document = parseKpSchemeFactorialSource();
const trace = readKpSchemeFactorialTraceArtifact().trace;
const events = trace.events;

const firstParameter = nth("parameter-bound", 0);
const firstSuspension = nth("call-suspended", 0);
const secondParameter = nth("parameter-bound", 1);
const thirdSuspension = nth("call-suspended", 2);
const baseBranch = events.find((event) =>
  event.kind === "branch-selected" && event.branch === "consequent")!;
const firstProduct = events.find((event) =>
  event.kind === "primitive-applied" && event.primitive === "*")!;
const completion = events.at(-1)!;

const scoreInput: KpSchemePedagogicalScore = {
  schemaVersion: "kp.scheme-pedagogical-score.v1",
  id: "scheme-factorial.score.canonical-v1",
  traceDocumentId: trace.documentId,
  beats: [
    beat(
      "definition-seed",
      "detail",
      0,
      firstParameter.index,
      "The definition becomes a callable seed, then factorial receives 3.",
      "reading",
      focus(firstParameter)
    ),
    beat(
      "first-descent",
      "detail",
      firstParameter.index,
      firstSuspension.index + 1,
      "Because 3 is not the base case, multiplication waits while factorial asks for 2.",
      "inspection",
      focus(firstSuspension)
    ),
    beat(
      "repeated-descent",
      "summary",
      firstSuspension.index + 1,
      thirdSuspension.index + 1,
      "The same unfinished shape repeats for 2 and 1; each call leaves work waiting behind it.",
      "inspection",
      focus(secondParameter, thirdSuspension)
    ),
    beat(
      "base-case",
      "detail",
      thirdSuspension.index + 1,
      firstProduct.index,
      "At 0 the predicate turns true. The descent stops with the exact value 1.",
      "reading",
      focus(baseBranch)
    ),
    beat(
      "return-cascade",
      "detail",
      firstProduct.index,
      completion.index,
      "That one value returns through the waiting products: 1, then 2, then 6.",
      "inspection",
      focus(firstProduct, ...events.filter((event) =>
        event.kind === "call-returned"))
    ),
    beat(
      "result",
      "detail",
      completion.index,
      completion.index + 1,
      "All suspended work is resolved: factorial of 3 is 6.",
      "reading",
      focus(completion)
    )
  ],
  omissions: []
};

export const kpSchemeFactorialScore = defineKpSchemePedagogicalScore(
  document,
  trace,
  scoreInput
);

function beat(
  id: string,
  kind: "detail" | "summary",
  start: number,
  end: number,
  caption: string,
  hold: "reading" | "inspection",
  emphasis: readonly KpSchemeScoreFocusTarget[]
) {
  return {
    id: `scheme-factorial.beat.${id}`,
    kind,
    eventIds: events.slice(start, end).map(({ id: eventId }) => eventId),
    caption,
    hold,
    focus: emphasis
  } as const;
}

function focus(
  ...selected: readonly KpSchemeTraceEvent[]
): readonly KpSchemeScoreFocusTarget[] {
  return selected.flatMap((event) => [
    { kind: "event" as const, id: event.id },
    ...event.sourceExpressionIds.map((id) => ({
      kind: "source-expression" as const,
      id
    }))
  ]);
}

function nth<Kind extends KpSchemeTraceEvent["kind"]>(
  kind: Kind,
  index: number
): Extract<KpSchemeTraceEvent, { readonly kind: Kind }> {
  const event = events.filter((candidate) => candidate.kind === kind)[index];
  if (event?.kind !== kind) {
    throw new Error(`Missing canonical ${kind} event ${index}.`);
  }
  return event as Extract<KpSchemeTraceEvent, { readonly kind: Kind }>;
}
