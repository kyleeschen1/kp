import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  createKpSchemeFactorialInitialState,
  stepKpSchemeFactorialEvaluator,
  type KpSchemeEvaluatorTransition
} from "../src/semantic/scheme-factorial-evaluator.ts";
import {
  KP_SCHEME_FACTORIAL_DOCUMENT_ID,
  parseKpSchemeFactorialSource
} from "../src/semantic/scheme-factorial-parser.ts";
import {
  defineKpSchemeFactorialTraceArtifact,
  type KpSchemeFactorialTraceArtifact
} from "../src/semantic/scheme-factorial-trace-artifact-model.ts";
import { KP_SCHEME_FACTORIAL_SOURCE } from
  "../src/semantic/scheme-factorial-source-model.ts";
import {
  defineKpSchemeTrace,
  kpSchemeTraceSnapshotId
} from "../src/semantic/scheme-factorial-trace.ts";

export const KP_SCHEME_FACTORIAL_MAX_TRANSITIONS = 128;

const outputUrl = new URL(
  "../src/semantic/scheme-factorial-trace.generated.json",
  import.meta.url
);

export function compileKpSchemeFactorialTraceArtifact():
  KpSchemeFactorialTraceArtifact {
  const document = parseKpSchemeFactorialSource(KP_SCHEME_FACTORIAL_SOURCE);
  let state = createKpSchemeFactorialInitialState(document);
  const transitions: KpSchemeEvaluatorTransition[] = [];
  for (let index = 0; index < KP_SCHEME_FACTORIAL_MAX_TRANSITIONS; index += 1) {
    const transition = stepKpSchemeFactorialEvaluator({
      document,
      state,
      eventIndex: index,
      causedByEventIds: index === 0
        ? []
        : [`scheme-factorial.event.${String(index - 1).padStart(3, "0")}`]
    });
    transitions.push(transition);
    state = transition.after;
    if (state.control.kind === "complete") {
      const states = [transitions[0]!.before,
        ...transitions.map(({ after }) => after)];
      return defineKpSchemeFactorialTraceArtifact({
        schemaVersion: "kp.scheme-factorial-trace-artifact.v1",
        source: {
          documentId: KP_SCHEME_FACTORIAL_DOCUMENT_ID,
          text: KP_SCHEME_FACTORIAL_SOURCE
        },
        compiler: {
          id: "kp.scheme-factorial-evaluator",
          version: "1",
          maxTransitions: KP_SCHEME_FACTORIAL_MAX_TRANSITIONS
        },
        trace: defineKpSchemeTrace(document, {
          schemaVersion: "kp.scheme-trace.v1",
          documentId: document.id,
          initialSnapshotId: kpSchemeTraceSnapshotId(0),
          finalSnapshotId: kpSchemeTraceSnapshotId(states.length - 1),
          snapshots: states.map((snapshotState, snapshotIndex) => ({
            id: kpSchemeTraceSnapshotId(snapshotIndex),
            index: snapshotIndex,
            state: snapshotState
          })),
          events: transitions.map(({ event }) => event)
        })
      });
    }
  }
  throw new Error(
    `Scheme factorial evaluation exceeded ${KP_SCHEME_FACTORIAL_MAX_TRANSITIONS} transitions.`
  );
}

export function serializeKpSchemeFactorialTraceArtifact(
  artifact: KpSchemeFactorialTraceArtifact
): string {
  return `${JSON.stringify(artifact)}\n`;
}

export function generateKpSchemeFactorialTraceArtifact(checkOnly: boolean): void {
  const compiled = serializeKpSchemeFactorialTraceArtifact(
    compileKpSchemeFactorialTraceArtifact()
  );
  if (checkOnly) {
    if (readFileSync(outputUrl, "utf8") !== compiled) {
      throw new Error(
        "Scheme factorial trace is stale. Run npm run generate:scheme-factorial-trace."
      );
    }
    return;
  }
  writeFileSync(outputUrl, compiled);
}

if (process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateKpSchemeFactorialTraceArtifact(process.argv.includes("--check"));
}
