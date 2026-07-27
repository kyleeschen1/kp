import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export interface KpFoldableDistributionGroupEnvelope {
  readonly id: string;
  readonly memberSelectorIds: readonly string[];
}

export interface KpFoldableDistributionAnnotatedEndpoint {
  readonly objectId: string;
  readonly label: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly groupEnvelopes: readonly KpFoldableDistributionGroupEnvelope[];
}

type Token = readonly [selectorId: string, latex: string];

/**
 * These endpoints give native KaTeX every settled glyph. Group envelopes are
 * declared separately because a term can be both a persistent group during
 * reflow and a set of individual contributors during later collection.
 */
export function createKpFoldableDistributionAnnotatedEndpoints():
  readonly KpFoldableDistributionAnnotatedEndpoint[] {
  return Object.freeze([
    endpoint({
      objectId: "expression.foldable-distribution.factored",
      label: "Three times x plus two, plus two times x minus one",
      tokens: [
        ["factored.left-factor", "3"],
        ["expression.foldable-distribution.left.factored.left-parenthesis", "("],
        ["factored.left-x", "x"],
        ["expression.foldable-distribution.left.factored.connector", "+"],
        ["factored.left-constant", "2"],
        ["expression.foldable-distribution.left.factored.right-parenthesis", ")"],
        ["factored.outer-plus", "+"],
        ["factored.right-factor", "2"],
        ["expression.foldable-distribution.right.factored.left-parenthesis", "("],
        ["factored.right-x", "x"],
        ["expression.foldable-distribution.right.factored.connector", "-"],
        ["factored.right-one", "1"],
        ["expression.foldable-distribution.right.factored.right-parenthesis", ")"]
      ],
      groups: [
        group("factored.left-group", [
          "expression.foldable-distribution.left.factored.left-parenthesis",
          "factored.left-x",
          "expression.foldable-distribution.left.factored.connector",
          "factored.left-constant",
          "expression.foldable-distribution.left.factored.right-parenthesis"
        ]),
        group("factored.right-group", [
          "expression.foldable-distribution.right.factored.left-parenthesis",
          "factored.right-x",
          "expression.foldable-distribution.right.factored.connector",
          "factored.right-one",
          "expression.foldable-distribution.right.factored.right-parenthesis"
        ])
      ]
    }),
    endpoint({
      objectId: "expression.foldable-distribution.distributed-raw",
      label:
        "Three x plus three times two, plus two x plus two times negative one",
      tokens: [
        ["distribution.left.factor-3-x", "3"],
        ["distribution.left.x", "x"],
        ["expression.foldable-distribution.left.distributed-raw.connector", "+"],
        ["distribution.left.factor-3-constant", "3"],
        [
          "expression.foldable-distribution.distributed.operator.three-times-two",
          "\\cdot"
        ],
        ["distribution.left.constant-2", "2"],
        ["distribution.outer-plus", "+"],
        ["distribution.right.factor-2-x", "2"],
        ["distribution.right.x", "x"],
        ["expression.foldable-distribution.right.distributed-raw.connector", "+"],
        ["distribution.right.factor-2-constant", "2"],
        [
          "expression.foldable-distribution.distributed.operator.two-times-negative-one",
          "\\cdot"
        ],
        ["distribution.right.negative-one", "(-1)"]
      ],
      groups: [
        group("distribution.left.term-x", [
          "distribution.left.factor-3-x",
          "distribution.left.x"
        ]),
        group("distribution.left.term-constant", [
          "distribution.left.factor-3-constant",
          "expression.foldable-distribution.distributed.operator.three-times-two",
          "distribution.left.constant-2"
        ]),
        group("distribution.right.term-x", [
          "distribution.right.factor-2-x",
          "distribution.right.x"
        ]),
        group("distribution.right.term-constant", [
          "distribution.right.factor-2-constant",
          "expression.foldable-distribution.distributed.operator.two-times-negative-one",
          "distribution.right.negative-one"
        ])
      ]
    }),
    endpoint({
      objectId: "expression.foldable-distribution.distributed",
      label: "Three x plus six, plus two x minus two",
      tokens: [
        ["distributed.term-3x", "3x"],
        ["distributed.plus-left", "+"],
        ["distributed.constant-6", "6"],
        ["distributed.outer-plus", "+"],
        ["distributed.term-2x", "2x"],
        ["distributed.minus-right", "-"],
        ["distributed.constant-2", "2"]
      ],
      groups: [
        group("distributed.negative-2", [
          "distributed.minus-right",
          "distributed.constant-2"
        ])
      ]
    }),
    endpoint({
      objectId: "expression.foldable-distribution.grouped",
      label: "Three x plus two x, grouped with six minus two",
      tokens: [
        ["grouped.coefficients.left-parenthesis", "("],
        ["grouped.coefficient-3", "3"],
        ["grouped.x-from-left", "x"],
        ["grouped.coefficients.plus", "+"],
        ["grouped.coefficient-2", "2"],
        ["grouped.x-from-right", "x"],
        ["grouped.coefficients.right-parenthesis", ")"],
        ["grouped.outer-plus", "+"],
        ["grouped.constants.left-parenthesis", "("],
        ["grouped.constant-6", "6"],
        ["grouped.constants.minus", "-"],
        ["grouped.constant-2", "2"],
        ["grouped.constants.right-parenthesis", ")"]
      ],
      groups: [
        group("grouped.term-3x", [
          "grouped.coefficient-3",
          "grouped.x-from-left"
        ]),
        group("grouped.term-2x", [
          "grouped.coefficient-2",
          "grouped.x-from-right"
        ]),
        group("grouped.negative-2", [
          "grouped.constants.minus",
          "grouped.constant-2"
        ]),
        group("grouped.coefficients", [
          "grouped.coefficients.left-parenthesis",
          "grouped.coefficient-3",
          "grouped.x-from-left",
          "grouped.coefficients.plus",
          "grouped.coefficient-2",
          "grouped.x-from-right",
          "grouped.coefficients.right-parenthesis"
        ]),
        group("grouped.constants", [
          "grouped.constants.left-parenthesis",
          "grouped.constant-6",
          "grouped.constants.minus",
          "grouped.constant-2",
          "grouped.constants.right-parenthesis"
        ])
      ]
    }),
    endpoint({
      objectId: "expression.foldable-distribution.collected",
      label: "Five x plus four",
      tokens: [
        ["collected.coefficient-5", "5"],
        ["collected.x", "x"],
        ["collected.plus", "+"],
        ["collected.constant-4", "4"]
      ],
      groups: [
        group("collected.term-5x", [
          "collected.coefficient-5",
          "collected.x"
        ])
      ]
    })
  ]);
}

export function createKpFoldableDistributionSelectorAnnotatedLatex(
  objectId: string
): KpSelectorAnnotatedLatex | undefined {
  return createKpFoldableDistributionAnnotatedEndpoints()
    .find((endpoint) => endpoint.objectId === objectId)
    ?.annotated;
}

function endpoint(input: {
  readonly objectId: string;
  readonly label: string;
  readonly tokens: readonly Token[];
  readonly groups: readonly KpFoldableDistributionGroupEnvelope[];
}): KpFoldableDistributionAnnotatedEndpoint {
  const segments: KpSelectorAnnotatedLatexSegment[] = [];
  input.tokens.forEach(([selectorId, latex], index) => {
    if (index > 0) segments.push({ kind: "latex", latex: " " });
    segments.push({ kind: "selector", selectorId, latex });
  });
  const annotated = createKpSelectorAnnotatedLatex({
    id: `foldable-distribution.${input.objectId}`,
    expectedSelectorIds: input.tokens.map(([selectorId]) => selectorId),
    segments
  });
  const selectorIds = new Set(input.tokens.map(([selectorId]) => selectorId));
  const groupIds = new Set<string>();
  for (const envelope of input.groups) {
    if (groupIds.has(envelope.id)) {
      throw new Error(`${input.objectId} repeats group ${envelope.id}.`);
    }
    groupIds.add(envelope.id);
    if (envelope.memberSelectorIds.length === 0) {
      throw new Error(`${input.objectId} group ${envelope.id} is empty.`);
    }
    const unknown = envelope.memberSelectorIds.find(
      (selectorId) => !selectorIds.has(selectorId)
    );
    if (unknown !== undefined) {
      throw new Error(
        `${input.objectId} group ${envelope.id} names unknown selector ${unknown}.`
      );
    }
  }
  return Object.freeze({
    objectId: input.objectId,
    label: input.label,
    annotated: Object.freeze({
      ...annotated,
      annotations: Object.freeze(
        annotated.annotations.map((annotation) => Object.freeze(annotation))
      )
    }),
    groupEnvelopes: Object.freeze(input.groups.map((envelope) =>
      Object.freeze({
        id: envelope.id,
        memberSelectorIds: Object.freeze([...envelope.memberSelectorIds])
      })
    ))
  });
}

function group(
  id: string,
  memberSelectorIds: readonly string[]
): KpFoldableDistributionGroupEnvelope {
  return { id, memberSelectorIds };
}
