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
import type {
  KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";

declare const kpExactFractionLegacySuccessorAuthority: unique symbol;

export type KpExactFractionSymbolicLifecycle =
  | "persist"
  | "fission"
  | "fusion";

export interface KpExactFractionSymbolicIdentityTransition {
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly lifecycle: KpExactFractionSymbolicLifecycle;
}

export interface KpExactFractionSymbolicMotionSegment {
  readonly id: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly selectorTransitions:
    readonly KpExactFractionSymbolicIdentityTransition[];
  readonly structuralTransitions:
    readonly KpExactFractionSymbolicIdentityTransition[];
  readonly successorSyntheses:
    readonly KpExactOpaqueSuccessorSynthesisBinding[];
}

export type KpExactOpaqueSuccessorSynthesisBinding =
  KpSuccessorSynthesisBinding & {
    readonly motif: "successor-synthesis" | "operation-evaluation";
    readonly [kpExactFractionLegacySuccessorAuthority]: true;
  };

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
  readonly segments: readonly KpExactFractionSymbolicMotionSegment[];
}

export interface KpExactFractionQuantitySymbolicProjection {
  readonly schemaVersion: "kp.exact-fraction-quantity-symbolic-projection.v1";
  readonly traceId: string;
  readonly endpoints: readonly KpExactFractionSymbolicEndpoint[];
  readonly transientEndpoints: readonly KpExactFractionSymbolicEndpoint[];
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
  resultRule: "symbolic.result.fraction-rule",
  refinementNumeratorMultiply:
    "symbolic.refinement.numerator.multiply",
  refinementNumeratorFactor:
    "symbolic.refinement.numerator.factor",
  refinementDenominatorMultiply:
    "symbolic.refinement.denominator.multiply",
  refinementDenominatorFactor:
    "symbolic.refinement.denominator.factor"
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
  const transientEndpoints = Object.freeze([
    createRefinementFactorEndpoint(trace)
  ] as const);
  const motionInputs = createMotionInputs(
    trace,
    endpoints,
    transientEndpoints
  );
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-symbolic-projection.v1",
    traceId: trace.id,
    endpoints,
    transientEndpoints,
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

function createRefinementFactorEndpoint(
  trace: KpExactFractionQuantityTrace
): KpExactFractionSymbolicEndpoint {
  const multiplier =
    trace.proofs.commonDenominator.equivalenceMultipliers[0];
  if (
    multiplier.numerator !== multiplier.denominator ||
    multiplier.numerator <= 1n
  ) {
    throw new Error(
      "The exact-fraction exemplar requires a visible non-trivial unit multiplier."
    );
  }
  const source = trace.proofs.commonDenominator.sourceForms[0]!;
  const sixth = trace.proofs.commonDenominator.sourceForms[1]!;
  const thirdWithFactor = fraction(
    "symbolic.addend.third",
    ids.thirdNumerator,
    ids.thirdDenominator,
    ids.thirdRule,
    String(source.numerator),
    String(source.denominator),
    [
      selector(ids.thirdNumerator, String(source.numerator)),
      latex("\\,"),
      selector(ids.refinementNumeratorMultiply, "\\times"),
      latex("\\,"),
      selector(
        ids.refinementNumeratorFactor,
        String(multiplier.numerator)
      )
    ],
    [
      selector(ids.thirdDenominator, String(source.denominator)),
      latex("\\,"),
      selector(ids.refinementDenominatorMultiply, "\\times"),
      latex("\\,"),
      selector(
        ids.refinementDenominatorFactor,
        String(multiplier.denominator)
      )
    ]
  );
  const sixthFraction = fraction(
    "symbolic.addend.sixth",
    ids.sixthNumerator,
    ids.sixthDenominator,
    ids.sixthRule,
    String(sixth.numerator),
    String(sixth.denominator)
  );
  const definition = equation(
    thirdWithFactor,
    sixthFraction,
    "one third times two over two, plus one sixth"
  );
  const annotated = createKpSelectorAnnotatedLatex({
    id: "exact-fraction-quantity.refinement-unit-multiplier",
    expectedSelectorIds: definition.segments.flatMap((segment) =>
      segment.kind === "selector" ? [segment.selectorId] : []
    ),
    segments: definition.segments
  });
  return Object.freeze({
    stateId: "transient.exact-fraction.refinement-unit-multiplier",
    checkpointId: trace.states[1]!.checkpointId,
    accessibleText: definition.accessibleText,
    annotated: freezeAnnotated(annotated),
    nativeHtmlAndMathml: renderLatexToHtml(annotated.rawLatex, {
      output: "htmlAndMathml"
    }),
    groupEnvelopes: definition.groups,
    structuralAnchors: definition.anchors
  });
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
  numeratorSegments?: readonly KpSelectorAnnotatedLatexSegment[],
  denominatorSegments?: readonly KpSelectorAnnotatedLatexSegment[]
): FractionDefinition {
  const actualNumeratorSegments = numeratorSegments ??
    [selector(numeratorId, numeratorLatex)];
  const actualDenominatorSegments = denominatorSegments ??
    [selector(denominatorId, denominatorLatex)];
  const memberSelectorIds = [
    ...actualNumeratorSegments.flatMap((segment) =>
      segment.kind === "selector" ? [segment.selectorId] : []
    ),
    ...actualDenominatorSegments.flatMap((segment) =>
      segment.kind === "selector" ? [segment.selectorId] : []
    )
  ];
  return {
    segments: Object.freeze([
      latex("\\frac{"),
      ...actualNumeratorSegments,
      latex("}{"),
      ...actualDenominatorSegments,
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
  endpoints: readonly KpExactFractionSymbolicEndpoint[],
  transientEndpoints: readonly [KpExactFractionSymbolicEndpoint]
): readonly KpExactFractionSymbolicMotionInput[] {
  const [refinementFactor] = transientEndpoints;
  const established = endpoints[0]!;
  const refined = endpoints[1]!;
  const aligned = endpoints[2]!;
  const merged = endpoints[3]!;
  const recognized = endpoints[4]!;
  const inputs = [
    motionInput(trace.beats[0]!.id, [
      motionSegment(
        `${trace.beats[0]!.id}.continuity`,
        established,
        established,
        persistAll(endpointSelectorIds(established)),
        persistAll(endpointAnchorIds(established))
      )
    ]),
    motionInput(trace.beats[1]!.id, [
      motionSegment(
        `${trace.beats[1]!.id}.show-unit-multiplier`,
        established,
        refinementFactor,
        [
          fission(ids.thirdNumerator, [
            ids.thirdNumerator,
            ids.refinementNumeratorMultiply,
            ids.refinementNumeratorFactor
          ]),
          fission(ids.thirdDenominator, [
            ids.thirdDenominator,
            ids.refinementDenominatorMultiply,
            ids.refinementDenominatorFactor
          ]),
          persist(ids.add),
          persist(ids.sixthNumerator),
          persist(ids.sixthDenominator)
        ],
        persistAll(endpointAnchorIds(established)),
        [
          opaqueSuccessor({
            id: "successor.exact-fraction.refinement-numerator-split",
            operationId: "kp.core.fan-out",
            materialSourceIds: [ids.thirdNumerator],
            targetIds: [
              ids.thirdNumerator,
              ids.refinementNumeratorMultiply,
              ids.refinementNumeratorFactor
            ]
          }),
          opaqueSuccessor({
            id: "successor.exact-fraction.refinement-denominator-split",
            operationId: "kp.core.fan-out",
            materialSourceIds: [ids.thirdDenominator],
            targetIds: [
              ids.thirdDenominator,
              ids.refinementDenominatorMultiply,
              ids.refinementDenominatorFactor
            ]
          })
        ]
      ),
      motionSegment(
        `${trace.beats[1]!.id}.evaluate-unit-multiplier`,
        refinementFactor,
        refined,
        [
          fusion([
            ids.thirdNumerator,
            ids.refinementNumeratorMultiply,
            ids.refinementNumeratorFactor
          ], ids.thirdNumerator),
          fusion([
            ids.thirdDenominator,
            ids.refinementDenominatorMultiply,
            ids.refinementDenominatorFactor
          ], ids.thirdDenominator),
          persist(ids.add),
          persist(ids.sixthNumerator),
          persist(ids.sixthDenominator)
        ],
        persistAll(endpointAnchorIds(refined)),
        [
          opaqueSuccessor({
            id: "successor.exact-fraction.refinement-numerator-product",
            operationId: "kp.arithmetic.multiply",
            materialSourceIds: [
              ids.thirdNumerator,
              ids.refinementNumeratorFactor
            ],
            catalystSourceIds: [ids.refinementNumeratorMultiply],
            targetIds: [ids.thirdNumerator]
          }),
          opaqueSuccessor({
            id: "successor.exact-fraction.refinement-denominator-product",
            operationId: "kp.arithmetic.multiply",
            materialSourceIds: [
              ids.thirdDenominator,
              ids.refinementDenominatorFactor
            ],
            catalystSourceIds: [ids.refinementDenominatorMultiply],
            targetIds: [ids.thirdDenominator]
          })
        ]
      )
    ]),
    motionInput(trace.beats[2]!.id, [
      motionSegment(
        `${trace.beats[2]!.id}.group`,
        refined,
        aligned,
        [
          persist(ids.thirdNumerator),
          persist(ids.add),
          persist(ids.sixthNumerator),
          fusion(
            [ids.thirdDenominator, ids.sixthDenominator],
            ids.commonDenominator
          )
        ],
        [fusion([ids.thirdRule, ids.sixthRule], ids.commonRule)],
        [
          opaqueSuccessor({
            id: "successor.exact-fraction.align-denominators",
            operationId: "kp.core.group",
            materialSourceIds: [
              ids.thirdDenominator,
              ids.sixthDenominator
            ],
            materialPathFamily: "arc-below",
            targetIds: [ids.commonDenominator]
          }),
          // Fraction rules are structural material, not arithmetic catalysts:
          // their two-to-one lineage must remain opaque and independently
          // reversible instead of hitching a ride on denominator glyphs.
          opaqueSuccessor({
            id: "successor.exact-fraction.align-fraction-rules",
            operationId: "kp.core.group",
            materialSourceIds: [ids.thirdRule, ids.sixthRule],
            materialPathFamily: "arc-below",
            targetIds: [ids.commonRule]
          })
        ]
      )
    ]),
    motionInput(trace.beats[3]!.id, [
      motionSegment(
        `${trace.beats[3]!.id}.merge`,
        aligned,
        merged,
        [
          fusion(
            [ids.thirdNumerator, ids.add, ids.sixthNumerator],
            ids.resultNumerator
          ),
          persist(ids.commonDenominator)
        ],
        [persist(ids.commonRule)],
        [opaqueSuccessor({
          id: "successor.exact-fraction.add-numerators",
          operationId: "kp.arithmetic.add",
          materialSourceIds: [
            ids.thirdNumerator,
            ids.sixthNumerator
          ],
          catalystSourceIds: [ids.add],
          targetIds: [ids.resultNumerator]
        })]
      )
    ]),
    motionInput(trace.beats[4]!.id, [
      motionSegment(
        `${trace.beats[4]!.id}.evaluate-division`,
        merged,
        recognized,
        [
          transition(
            [ids.resultNumerator, ids.commonDenominator],
            [ids.resultNumerator, ids.resultDenominator],
            "fusion"
          )
        ],
        [persist(ids.commonRule)],
        [opaqueSuccessor({
          id: "successor.exact-fraction.evaluate-division",
          operationId: "kp.arithmetic.divide",
          motif: "operation-evaluation",
          materialSourceIds: [
            ids.resultNumerator,
            ids.commonDenominator
          ],
          // A fraction bar is the division operator, so it joins the shrinking
          // evaluation cohort and is re-expressed by the settled result.
          catalystSourceIds: [ids.commonRule],
          targetIds: [
            ids.resultNumerator,
            ids.resultDenominator,
            ids.commonRule
          ]
        })]
      )
    ])
  ];
  return Object.freeze(inputs);
}

function motionInput(
  beatId: string,
  segments: readonly KpExactFractionSymbolicMotionSegment[]
): KpExactFractionSymbolicMotionInput {
  return Object.freeze({
    beatId,
    segments: Object.freeze([...segments])
  });
}

function motionSegment(
  id: string,
  source: KpExactFractionSymbolicEndpoint,
  target: KpExactFractionSymbolicEndpoint,
  selectorTransitions:
    readonly KpExactFractionSymbolicIdentityTransition[],
  structuralTransitions:
    readonly KpExactFractionSymbolicIdentityTransition[],
  successorSyntheses:
    readonly KpExactOpaqueSuccessorSynthesisBinding[] = []
): KpExactFractionSymbolicMotionSegment {
  assertTransitionTotality(
    endpointSelectorIds(source),
    endpointSelectorIds(target),
    selectorTransitions,
    `${id} selector`
  );
  assertTransitionTotality(
    endpointAnchorIds(source),
    endpointAnchorIds(target),
    structuralTransitions,
    `${id} structure`
  );
  return Object.freeze({
    id,
    sourceStateId: source.stateId,
    targetStateId: target.stateId,
    selectorTransitions: Object.freeze([...selectorTransitions]),
    structuralTransitions: Object.freeze([...structuralTransitions]),
    successorSyntheses: Object.freeze([...successorSyntheses])
  });
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

function fission(
  sourceId: string,
  targetIds: readonly string[]
): KpExactFractionSymbolicIdentityTransition {
  return transition([sourceId], targetIds, "fission");
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

function opaqueSuccessor(input: {
  readonly id: string;
  readonly operationId: string;
  readonly motif?: "successor-synthesis" | "operation-evaluation" | undefined;
  readonly materialSourceIds: readonly string[];
  readonly materialPathFamily?: "arc-above" | "arc-below" | undefined;
  readonly catalystSourceIds?: readonly string[] | undefined;
  readonly targetIds: readonly string[];
}): KpExactOpaqueSuccessorSynthesisBinding {
  const sourceAnnotations = [
    ...input.materialSourceIds.map((selectorId, propagationRank) =>
      Object.freeze({
        id: `${input.id}.source.material.${propagationRank}`,
        semanticRole: "material-input",
        selectorIds: Object.freeze([selectorId]),
        contribution: "material-input" as const,
        propagationRank,
        ...(input.materialPathFamily === undefined
          ? {}
          : { pathFamily: input.materialPathFamily })
      })
    ),
    ...(input.catalystSourceIds ?? []).map((selectorId, index) =>
      Object.freeze({
        id: `${input.id}.source.catalyst.${index}`,
        semanticRole: "operation-catalyst",
        selectorIds: Object.freeze([selectorId]),
        contribution: "catalyst" as const,
        propagationRank: input.materialSourceIds.length + index
      })
    )
  ];
  const targetAnnotations = input.targetIds.map(
    (selectorId, propagationRank) => Object.freeze({
      id: `${input.id}.target.${propagationRank}`,
      semanticRole: "successor",
      selectorIds: Object.freeze([selectorId]),
      propagationRank
    })
  );
  return Object.freeze({
    id: input.id,
    relationRecordId: `${input.id}.relation`,
    authority: Object.freeze({
      operationId: input.operationId,
      bindingId: `${input.id}.binding`
    }),
    sourceAnnotations: Object.freeze(sourceAnnotations),
    targetAnnotations: Object.freeze(targetAnnotations),
    lineages: Object.freeze([Object.freeze({
      id: `${input.id}.lineage`,
      sourceAnnotationIds: Object.freeze(
        sourceAnnotations
          .filter(({ contribution }) => contribution === "material-input")
          .map(({ id }) => id)
      ),
      targetAnnotationIds: Object.freeze(
        targetAnnotations.map(({ id }) => id)
      )
    })]),
    motif: input.motif ?? "successor-synthesis"
  }) as KpExactOpaqueSuccessorSynthesisBinding;
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
