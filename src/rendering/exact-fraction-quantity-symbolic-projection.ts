import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionForm,
  type KpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";
import {
  renderLatexToHtml
} from "./katex-adapter.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";
import type {
  KpStructuredEquationGroupEnvelope,
  KpStructuredEquationStructuralAnchor
} from "./structured-equation-selector-annotated-latex.ts";

export type KpExactFractionSymbolicLifecycle =
  | "persist"
  | "fission"
  | "fusion";

export interface KpExactFractionSymbolicIdentityTransition {
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly lifecycle: KpExactFractionSymbolicLifecycle;
}

export interface KpExactFractionSymbolicEndpoint {
  readonly stateId: string;
  readonly checkpointId: string;
  readonly accessibleText: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly groupEnvelopes: readonly KpStructuredEquationGroupEnvelope[];
  readonly structuralAnchors: readonly KpStructuredEquationStructuralAnchor[];
}

export interface KpExactFractionSymbolicMotionInput {
  readonly beatId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly selectorTransitions:
    readonly KpExactFractionSymbolicIdentityTransition[];
  readonly structuralTransitions:
    readonly KpExactFractionSymbolicIdentityTransition[];
}

export interface KpExactFractionQuantitySymbolicProjection {
  readonly schemaVersion: "kp.exact-fraction-quantity-symbolic-projection.v1";
  readonly traceId: string;
  readonly endpoints: readonly KpExactFractionSymbolicEndpoint[];
  readonly motionInputs: readonly KpExactFractionSymbolicMotionInput[];
}

interface EndpointDefinition {
  readonly segments: readonly KpSelectorAnnotatedLatexSegment[];
  readonly groups: readonly KpStructuredEquationGroupEnvelope[];
  readonly anchors: readonly KpStructuredEquationStructuralAnchor[];
  readonly accessibleText: string;
}

const ids = Object.freeze({
  thirdNumerator: "symbolic.addend.third.numerator",
  thirdDenominator: "symbolic.addend.third.denominator",
  thirdRule: "symbolic.addend.third.fraction-rule",
  sixthNumerator: "symbolic.addend.sixth.numerator",
  sixthDenominator: "symbolic.addend.sixth.denominator",
  sixthRule: "symbolic.addend.sixth.fraction-rule",
  add: "symbolic.operation.add",
  commonDenominator: "symbolic.sum.denominator",
  commonRule: "symbolic.sum.fraction-rule",
  resultNumerator: "symbolic.result.numerator",
  resultDenominator: "symbolic.result.denominator",
  resultRule: "symbolic.result.fraction-rule"
});

export function createKpExactFractionQuantitySymbolicProjection(
  trace: KpExactFractionQuantityTrace =
    createKpExactFractionQuantityTrace()
): KpExactFractionQuantitySymbolicProjection {
  const definitions = endpointDefinitions(trace);
  if (definitions.length !== trace.states.length) {
    throw new Error(
      "Exact fraction symbolic projection must compile every verified state."
    );
  }
  const endpoints = Object.freeze(trace.states.map((state, index) => {
    const definition = definitions[index]!;
    const selectorIds = definition.segments.flatMap((segment) =>
      segment.kind === "selector" ? [segment.selectorId] : []
    );
    const annotated = createKpSelectorAnnotatedLatex({
      id: `exact-fraction-quantity.${state.id}`,
      expectedSelectorIds: selectorIds,
      segments: definition.segments
    });
    return Object.freeze({
      stateId: state.id,
      checkpointId: state.checkpointId,
      accessibleText: definition.accessibleText,
      annotated: freezeAnnotated(annotated),
      // Static accessibility is rendered from the same validated native LaTeX.
      // Motion annotations remain a hydration concern and never replace MathML.
      nativeHtmlAndMathml: renderLatexToHtml(annotated.rawLatex, {
        output: "htmlAndMathml"
      }),
      groupEnvelopes: definition.groups,
      structuralAnchors: definition.anchors
    });
  }));
  const motionInputs = createMotionInputs(trace, endpoints);
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-symbolic-projection.v1",
    traceId: trace.id,
    endpoints,
    motionInputs
  });
}

function endpointDefinitions(
  trace: KpExactFractionQuantityTrace
): readonly EndpointDefinition[] {
  const stages = [
    "same-unit-established",
    "third-refined",
    "common-denominator-aligned",
    "sixths-merged",
    "half-recognized"
  ] as const;
  if (
    trace.states.length !== stages.length ||
    trace.states.some((state, index) =>
      state.semanticStage !== stages[index] ||
      state.checkpointId !== manifest.checkpoints[index]?.id
    )
  ) {
    throw new Error(
      "Exact fraction symbolic projection requires the certified state chain."
    );
  }
  const established = trace.states[0]!;
  const refined = trace.states[1]!;
  const alignedState = trace.states[2]!;
  const mergedState = trace.states[3]!;
  const recognizedState = trace.states[4]!;
  const [establishedThird, establishedSixth] = requireTwoForms(established);
  const [refinedThird, refinedSixth] = requireTwoForms(refined);
  const [alignedThird, alignedSixth] = requireTwoForms(alignedState);
  if (alignedThird.denominator !== alignedSixth.denominator) {
    throw new Error(
      "Aligned symbolic addends require one verified common denominator."
    );
  }
  const mergedForm = requireOneForm(mergedState);
  const recognizedForm = requireOneForm(recognizedState);
  const third = fraction(
    "symbolic.addend.third",
    ids.thirdNumerator,
    ids.thirdDenominator,
    ids.thirdRule,
    String(establishedThird.numerator),
    String(establishedThird.denominator)
  );
  const refinedThirdFraction = fraction(
    "symbolic.addend.third",
    ids.thirdNumerator,
    ids.thirdDenominator,
    ids.thirdRule,
    String(refinedThird.numerator),
    String(refinedThird.denominator)
  );
  const sixth = fraction(
    "symbolic.addend.sixth",
    ids.sixthNumerator,
    ids.sixthDenominator,
    ids.sixthRule,
    String(establishedSixth.numerator),
    String(establishedSixth.denominator)
  );
  if (
    establishedSixth.numerator !== refinedSixth.numerator ||
    establishedSixth.denominator !== refinedSixth.denominator
  ) {
    throw new Error(
      "The persistent sixth addend must retain its verified symbolic form."
    );
  }
  const aligned = fraction(
    "symbolic.sum",
    ids.resultNumerator,
    ids.commonDenominator,
    ids.commonRule,
    `${alignedThird.numerator}\\;+\\;${alignedSixth.numerator}`,
    String(alignedThird.denominator),
    [
      selector(ids.thirdNumerator, String(alignedThird.numerator)),
      latex("\\;"),
      selector(ids.add, "+"),
      latex("\\;"),
      selector(ids.sixthNumerator, String(alignedSixth.numerator))
    ]
  );
  const merged = fraction(
    "symbolic.result",
    ids.resultNumerator,
    ids.commonDenominator,
    ids.commonRule,
    String(mergedForm.numerator),
    String(mergedForm.denominator)
  );
  const recognized = fraction(
    "symbolic.result",
    ids.resultNumerator,
    ids.resultDenominator,
    ids.commonRule,
    String(recognizedForm.numerator),
    String(recognizedForm.denominator)
  );

  return Object.freeze([
    equation(third, sixth, "one third plus one sixth"),
    equation(refinedThirdFraction, sixth, "two sixths plus one sixth"),
    {
      segments: aligned.segments,
      groups: aligned.groups,
      anchors: aligned.anchors,
      accessibleText: "the quantity two plus one, divided by six"
    },
    {
      segments: merged.segments,
      groups: merged.groups,
      anchors: merged.anchors,
      accessibleText: "three sixths"
    },
    {
      segments: recognized.segments,
      groups: recognized.groups,
      anchors: recognized.anchors,
      accessibleText: "one half"
    }
  ]);
}

function requireTwoForms(
  state: KpExactFractionQuantityTrace["states"][number]
): readonly [KpExactFractionForm, KpExactFractionForm] {
  if (state.symbolicForms.length !== 2) {
    throw new Error(`${state.id} must expose exactly two verified addends.`);
  }
  return [state.symbolicForms[0]!, state.symbolicForms[1]!];
}

function requireOneForm(
  state: KpExactFractionQuantityTrace["states"][number]
): KpExactFractionForm {
  if (state.symbolicForms.length !== 1) {
    throw new Error(`${state.id} must expose exactly one verified result.`);
  }
  return state.symbolicForms[0]!;
}

function equation(
  left: FractionDefinition,
  right: FractionDefinition,
  accessibleText: string
): EndpointDefinition {
  return {
    segments: Object.freeze([
      ...left.segments,
      latex("\\;"),
      selector(ids.add, "+"),
      latex("\\;"),
      ...right.segments
    ]),
    groups: Object.freeze([...left.groups, ...right.groups]),
    anchors: Object.freeze([...left.anchors, ...right.anchors]),
    accessibleText
  };
}

interface FractionDefinition {
  readonly segments: readonly KpSelectorAnnotatedLatexSegment[];
  readonly groups: readonly KpStructuredEquationGroupEnvelope[];
  readonly anchors: readonly KpStructuredEquationStructuralAnchor[];
}

function fraction(
  groupId: string,
  numeratorId: string,
  denominatorId: string,
  ruleId: string,
  numeratorLatex: string,
  denominatorLatex: string,
  numeratorSegments?: readonly KpSelectorAnnotatedLatexSegment[]
): FractionDefinition {
  const actualNumeratorSegments = numeratorSegments ??
    [selector(numeratorId, numeratorLatex)];
  const memberSelectorIds = [
    ...actualNumeratorSegments.flatMap((segment) =>
      segment.kind === "selector" ? [segment.selectorId] : []
    ),
    denominatorId
  ];
  return {
    segments: Object.freeze([
      latex("\\frac{"),
      ...actualNumeratorSegments,
      latex("}{"),
      selector(denominatorId, denominatorLatex),
      latex("}")
    ]),
    groups: Object.freeze([Object.freeze({
      id: groupId,
      memberSelectorIds: Object.freeze(memberSelectorIds),
      structuralAnchorIds: Object.freeze([ruleId])
    })]),
    anchors: Object.freeze([Object.freeze({
      id: ruleId,
      kind: "fraction-rule" as const,
      ownerNodeId: groupId
    })])
  };
}

function createMotionInputs(
  trace: KpExactFractionQuantityTrace,
  endpoints: readonly KpExactFractionSymbolicEndpoint[]
): readonly KpExactFractionSymbolicMotionInput[] {
  const transitions = [
    {
      selectors: persistAll(endpointSelectorIds(endpoints[0]!)),
      structures: persistAll(endpointAnchorIds(endpoints[0]!))
    },
    {
      selectors: persistAll(endpointSelectorIds(endpoints[1]!)),
      structures: persistAll(endpointAnchorIds(endpoints[1]!))
    },
    {
      selectors: [
        persist(ids.thirdNumerator),
        persist(ids.add),
        persist(ids.sixthNumerator),
        fusion([ids.thirdDenominator, ids.sixthDenominator], ids.commonDenominator)
      ],
      structures: [
        fusion([ids.thirdRule, ids.sixthRule], ids.commonRule)
      ]
    },
    {
      selectors: [
        fusion(
          [ids.thirdNumerator, ids.add, ids.sixthNumerator],
          ids.resultNumerator
        ),
        persist(ids.commonDenominator)
      ],
      structures: [persist(ids.commonRule)]
    },
    {
      selectors: [
        persist(ids.resultNumerator),
        transition([ids.commonDenominator], [ids.resultDenominator], "persist")
      ],
      structures: [persist(ids.commonRule)]
    }
  ] as const;

  return Object.freeze(trace.beats.map((beat, index) => {
    const target = endpoints[index]!;
    const source = endpoints[Math.max(0, index - 1)]!;
    const mapping = transitions[index]!;
    assertTransitionTotality(
      endpointSelectorIds(source),
      endpointSelectorIds(target),
      mapping.selectors,
      `${beat.id} selector`
    );
    assertTransitionTotality(
      endpointAnchorIds(source),
      endpointAnchorIds(target),
      mapping.structures,
      `${beat.id} structure`
    );
    return Object.freeze({
      beatId: beat.id,
      sourceStateId: source.stateId,
      targetStateId: target.stateId,
      selectorTransitions: Object.freeze(mapping.selectors),
      structuralTransitions: Object.freeze(mapping.structures)
    });
  }));
}

function assertTransitionTotality(
  sourceIds: readonly string[],
  targetIds: readonly string[],
  transitions: readonly KpExactFractionSymbolicIdentityTransition[],
  label: string
): void {
  const mappedSources = transitions.flatMap(({ sourceIds: values }) => values);
  const mappedTargets = transitions.flatMap(({ targetIds: values }) => values);
  assertSameSetOnce(mappedSources, sourceIds, `${label} sources`);
  assertSameSetOnce(mappedTargets, targetIds, `${label} targets`);
}

function assertSameSetOnce(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): void {
  if (
    new Set(actual).size !== actual.length ||
    actual.length !== expected.length ||
    actual.some((id) => !expected.includes(id))
  ) {
    throw new Error(`${label} must cover each native identity exactly once.`);
  }
}

function endpointSelectorIds(
  endpoint: KpExactFractionSymbolicEndpoint
): readonly string[] {
  return endpoint.annotated.annotations.map(({ selectorId }) => selectorId);
}

function endpointAnchorIds(
  endpoint: KpExactFractionSymbolicEndpoint
): readonly string[] {
  return endpoint.structuralAnchors.map(({ id }) => id);
}

function persistAll(
  identityIds: readonly string[]
): readonly KpExactFractionSymbolicIdentityTransition[] {
  return identityIds.map(persist);
}

function persist(id: string): KpExactFractionSymbolicIdentityTransition {
  return transition([id], [id], "persist");
}

function fusion(
  sourceIds: readonly string[],
  targetId: string
): KpExactFractionSymbolicIdentityTransition {
  return transition(sourceIds, [targetId], "fusion");
}

function transition(
  sourceIds: readonly string[],
  targetIds: readonly string[],
  lifecycle: KpExactFractionSymbolicLifecycle
): KpExactFractionSymbolicIdentityTransition {
  return Object.freeze({
    sourceIds: Object.freeze([...sourceIds]),
    targetIds: Object.freeze([...targetIds]),
    lifecycle
  });
}

function selector(
  selectorId: string,
  value: string
): KpSelectorAnnotatedLatexSegment {
  return Object.freeze({ kind: "selector", selectorId, latex: value });
}

function latex(value: string): KpSelectorAnnotatedLatexSegment {
  return Object.freeze({ kind: "latex", latex: value });
}

function freezeAnnotated(
  annotated: KpSelectorAnnotatedLatex
): KpSelectorAnnotatedLatex {
  return Object.freeze({
    ...annotated,
    annotations: Object.freeze(
      annotated.annotations.map((entry) => Object.freeze(entry))
    )
  });
}

export const kpExactFractionQuantitySymbolicSelectionIds = Object.freeze({
  addendOneThird: manifest.selections.oneThird.id,
  addendOneSixth: manifest.selections.oneSixth.id,
  resultOneHalf: manifest.selections.resultHalf.id
});
