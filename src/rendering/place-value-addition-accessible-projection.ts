import {
  renderLatexToHtml
} from "./katex-adapter.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  createKpPlaceValueAdditionTrace,
  isKpPlaceValueAdditionTrace,
  type KpPlaceValueAdditionBeat,
  type KpPlaceValueAdditionTrace
} from "../semantic/place-value-addition-trace.ts";

export interface KpPlaceValueAdditionAccessibleStep {
  readonly index: number;
  readonly checkpointId: `checkpoint.place-value.${number}`;
  readonly beatId: KpPlaceValueAdditionBeat["id"];
  readonly stateId:
    KpPlaceValueAdditionTrace["states"][number]["id"];
  readonly operation: KpPlaceValueAdditionBeat["operation"];
  readonly progressPermille: number;
  readonly label: string;
  readonly description: string;
  readonly accessibleMath: string;
  readonly rawLatex: string;
  readonly nativeHtmlAndMathml: string;
  readonly focusEntityIds: readonly string[];
  readonly annotationIds: readonly string[];
  readonly transcriptRefIds: readonly string[];
}

export interface KpPlaceValueAdditionAccessibleProjection {
  readonly schemaVersion:
    "kp.place-value-addition-accessible-projection.v1";
  readonly traceId: KpPlaceValueAdditionTrace["id"];
  readonly expression: KpPlaceValueAdditionTrace["expression"];
  readonly introduction: string;
  readonly steps: readonly KpPlaceValueAdditionAccessibleStep[];
  readonly finalStatement: string;
  readonly foldInvariant: true;
  readonly viewInvariant: true;
  readonly motionInvariant: true;
}

const stepMath = Object.freeze([
  Object.freeze({
    latex: "278+156",
    accessible:
      "Two hundred seventy-eight plus one hundred fifty-six."
  }),
  Object.freeze({
    latex: "8+6=14",
    accessible: "Eight plus six equals fourteen."
  }),
  Object.freeze({
    latex: "14\\text{ ones}=1\\text{ ten}+4\\text{ ones}",
    accessible:
      "Fourteen ones exchange for one ten and four remaining ones."
  }),
  Object.freeze({
    latex: "1+7+5=13",
    accessible:
      "One carried ten plus seven tens plus five tens equals thirteen tens."
  }),
  Object.freeze({
    latex: "13\\text{ tens}=1\\text{ hundred}+3\\text{ tens}",
    accessible:
      "Thirteen tens exchange for one hundred and three remaining tens."
  }),
  Object.freeze({
    latex: "1+2+1=4",
    accessible:
      "One carried hundred plus two hundreds plus one hundred equals four hundreds."
  }),
  Object.freeze({
    latex: "278+156=434",
    accessible:
      "Two hundred seventy-eight plus one hundred fifty-six equals four hundred thirty-four."
  })
] as const);

/**
 * Accessibility is compiled from the same trace as motion, rather than read
 * back from visible glyphs. That makes every causal beat available when a
 * view is hidden, an evaluation group is folded, or motion is unavailable.
 */
export function createKpPlaceValueAdditionAccessibleProjection(input: {
  readonly trace?: KpPlaceValueAdditionTrace | undefined;
} = {}): KpPlaceValueAdditionAccessibleProjection {
  const trace = input.trace ?? createKpPlaceValueAdditionTrace();
  if (
    !isKpPlaceValueAdditionTrace(trace) ||
    trace.states.length !== reference.beats.length ||
    trace.beats.length !== reference.beats.length ||
    stepMath.length !== reference.beats.length
  ) {
    throw new Error(
      "Place-value accessibility must cover every sealed trace beat."
    );
  }
  const steps = Object.freeze(trace.beats.map(
    (beat, index): KpPlaceValueAdditionAccessibleStep => {
      const state = trace.states[index]!;
      const storyboard = reference.beats[index]!;
      const math = stepMath[index]!;
      if (beat.id !== storyboard.id || beat.toStateId !== state.id) {
        throw new Error(
          `Place-value accessible step ${index} detached from its trace.`
        );
      }
      const focusEntityIds = Object.freeze([
        ...new Set([...beat.contributorIds, ...beat.outputIds])
      ]);
      return Object.freeze({
        index,
        checkpointId: `checkpoint.place-value.${index}`,
        beatId: beat.id,
        stateId: state.id,
        operation: beat.operation,
        progressPermille: storyboard.endPermille,
        label: stepLabel(index),
        description:
          `${storyboard.primaryAction} ${storyboard.secondaryAction}`,
        accessibleMath: math.accessible,
        rawLatex: math.latex,
        nativeHtmlAndMathml: renderLatexToHtml(math.latex, {
          displayMode: false,
          output: "htmlAndMathml"
        }),
        focusEntityIds,
        annotationIds: Object.freeze([...beat.proofIds]),
        transcriptRefIds: Object.freeze(focusEntityIds.map(
          (entityId) => `transcript.entity.${entityId}`
        ))
      });
    }
  ));
  if (
    new Set(steps.map(({ checkpointId }) => checkpointId)).size !==
      steps.length ||
    new Set(steps.map(({ beatId }) => beatId)).size !== steps.length
  ) {
    throw new Error(
      "Place-value accessibility repeats a checkpoint or operation."
    );
  }
  return Object.freeze({
    schemaVersion:
      "kp.place-value-addition-accessible-projection.v1" as const,
    traceId: trace.id,
    expression: trace.expression,
    introduction:
      "Add 278 and 156 by evaluating and exchanging one place-value column at a time, from ones through hundreds.",
    steps,
    finalStatement:
      "The written algorithm and base-ten blocks preserve the same exact total: 434.",
    foldInvariant: true,
    viewInvariant: true,
    motionInvariant: true
  });
}

function stepLabel(index: number): string {
  switch (index) {
    case 0:
      return "Set up the addition";
    case 1:
      return "Add the ones";
    case 2:
      return "Exchange ten ones";
    case 3:
      return "Add the tens";
    case 4:
      return "Exchange ten tens";
    case 5:
      return "Add the hundreds";
    case 6:
      return "Settle 434";
    default:
      throw new Error(`Unknown place-value accessible step ${index}.`);
  }
}
