import type { KpChoreographyEnvelopePhaseId } from "./choreography-plan.ts";
import {
  createKpClosedDispatchRegistry,
  requireKpClosedDispatchEntry
} from "../domain-ir/equation-extension-registry.ts";

export interface KpLogExponentFocusSequence {
  readonly orient: readonly string[];
  readonly orientSecondary: readonly string[];
  readonly act: readonly string[];
  readonly actSecondary: readonly string[];
  readonly settle: readonly string[];
  readonly settleSecondary: readonly string[];
}

export interface KpLogExponentOperationPresentation {
  readonly id: string;
  readonly sequenceWeight: number;
  readonly phaseWeights: Readonly<
    Partial<Record<KpChoreographyEnvelopePhaseId, number>>
  >;
  readonly focus: KpLogExponentFocusSequence;
}

export const kpLogExponentOperationPresentationRegistry =
  createKpClosedDispatchRegistry<string, KpLogExponentOperationPresentation>(
    "log-exponent presentation",
    [
      presentation({
        id: "operation.log-exponent.apply-log-both-sides",
        sequenceWeight: 0.28,
        phaseWeights: { orient: 0.14, reflow: 0.16, act: 0.3, settle: 0.28, release: 0.12 },
        focus: {
          orient: ["source.left", "source.right"],
          orientSecondary: ["source.equality"],
          act: ["logged.left.log", "logged.right.log"],
          actSecondary: ["logged.left.power", "logged.right"],
          settle: ["logged.left.log", "logged.right.log"],
          settleSecondary: ["logged.equality"]
        }
      }),
      presentation({
        id: "operation.log-exponent.extract-exponent",
        sequenceWeight: 0.42,
        phaseWeights: { orient: 0.12, reflow: 0.18, act: 0.42, settle: 0.2, release: 0.08 },
        focus: {
          orient: ["logged.exponent"],
          orientSecondary: ["logged.left.log"],
          act: ["logged.exponent", "extracted.coefficient"],
          actSecondary: ["logged.left.log", "extracted.left"],
          settle: ["extracted.coefficient", "extracted.left.log"],
          settleSecondary: ["extracted.left"]
        }
      }),
      presentation({
        id: "operation.log-exponent.divide-by-log-base",
        sequenceWeight: 0.3,
        phaseWeights: { orient: 0.12, reflow: 0.18, act: 0.34, settle: 0.26, release: 0.1 },
        focus: {
          orient: ["extracted.left.log"],
          orientSecondary: ["extracted.coefficient", "extracted.right.log"],
          act: ["extracted.left.log", "solved.denominator.log"],
          actSecondary: ["extracted.coefficient", "solved.left", "solved.right"],
          settle: ["solved.left", "solved.right"],
          settleSecondary: ["solved.equality"]
        }
      })
    ]
  );

export function requireKpLogExponentOperationPresentation(
  operationId: string
): KpLogExponentOperationPresentation {
  return requireKpClosedDispatchEntry(
    kpLogExponentOperationPresentationRegistry,
    operationId
  );
}

function presentation(
  input: KpLogExponentOperationPresentation
): KpLogExponentOperationPresentation {
  return Object.freeze({
    ...input,
    phaseWeights: Object.freeze({ ...input.phaseWeights }),
    focus: Object.freeze({
      orient: Object.freeze([...input.focus.orient]),
      orientSecondary: Object.freeze([...input.focus.orientSecondary]),
      act: Object.freeze([...input.focus.act]),
      actSecondary: Object.freeze([...input.focus.actSecondary]),
      settle: Object.freeze([...input.focus.settle]),
      settleSecondary: Object.freeze([...input.focus.settleSecondary])
    })
  });
}
