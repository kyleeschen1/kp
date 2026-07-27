export interface KpFoldableDistributionGroupEnvelope {
  readonly id: string;
  readonly memberSelectorIds: readonly string[];
}

export interface KpFoldableDistributionEndpointSpec {
  readonly objectId: string;
  readonly label: string;
  readonly tokens: readonly KpFoldableDistributionEndpointToken[];
  readonly groupEnvelopes: readonly KpFoldableDistributionGroupEnvelope[];
}

export type KpFoldableDistributionEndpointToken =
  readonly [selectorId: string, latex: string];

/**
 * These endpoints give native KaTeX every settled glyph. Group envelopes are
 * declared separately because a term can be both a persistent group during
 * reflow and a set of individual contributors during later collection.
 */
export function createKpFoldableDistributionEndpointSpecs():
  readonly KpFoldableDistributionEndpointSpec[] {
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
        ["factored.right-negative-one", "1"],
        ["expression.foldable-distribution.right.factored.right-parenthesis", ")"]
      ],
      groups: [
        group("layout.foldable-distribution.factored", [
          "factored.left-factor",
          "expression.foldable-distribution.left.factored.left-parenthesis",
          "factored.left-x",
          "expression.foldable-distribution.left.factored.connector",
          "factored.left-constant",
          "expression.foldable-distribution.left.factored.right-parenthesis",
          "factored.outer-plus",
          "factored.right-factor",
          "expression.foldable-distribution.right.factored.left-parenthesis",
          "factored.right-x",
          "expression.foldable-distribution.right.factored.connector",
          "factored.right-negative-one",
          "expression.foldable-distribution.right.factored.right-parenthesis"
        ]),
        group("layout.foldable-distribution.factored.left-branch", [
          "factored.left-factor",
          "expression.foldable-distribution.left.factored.left-parenthesis",
          "factored.left-x",
          "expression.foldable-distribution.left.factored.connector",
          "factored.left-constant",
          "expression.foldable-distribution.left.factored.right-parenthesis"
        ]),
        group("layout.foldable-distribution.factored.right-branch", [
          "factored.right-factor",
          "expression.foldable-distribution.right.factored.left-parenthesis",
          "factored.right-x",
          "expression.foldable-distribution.right.factored.connector",
          "factored.right-negative-one",
          "expression.foldable-distribution.right.factored.right-parenthesis"
        ]),
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
          "factored.right-negative-one",
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
        group("layout.foldable-distribution.raw", [
          "distribution.left.factor-3-x",
          "distribution.left.x",
          "expression.foldable-distribution.left.distributed-raw.connector",
          "distribution.left.factor-3-constant",
          "expression.foldable-distribution.distributed.operator.three-times-two",
          "distribution.left.constant-2",
          "distribution.outer-plus",
          "distribution.right.factor-2-x",
          "distribution.right.x",
          "expression.foldable-distribution.right.distributed-raw.connector",
          "distribution.right.factor-2-constant",
          "expression.foldable-distribution.distributed.operator.two-times-negative-one",
          "distribution.right.negative-one"
        ]),
        group("layout.foldable-distribution.raw.left-branch", [
          "distribution.left.factor-3-x",
          "distribution.left.x",
          "expression.foldable-distribution.left.distributed-raw.connector",
          "distribution.left.factor-3-constant",
          "expression.foldable-distribution.distributed.operator.three-times-two",
          "distribution.left.constant-2"
        ]),
        group("layout.foldable-distribution.raw.right-branch", [
          "distribution.right.factor-2-x",
          "distribution.right.x",
          "expression.foldable-distribution.right.distributed-raw.connector",
          "distribution.right.factor-2-constant",
          "expression.foldable-distribution.distributed.operator.two-times-negative-one",
          "distribution.right.negative-one"
        ]),
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
        ["distributed.negative-2", "2"]
      ],
      groups: [
        group("layout.foldable-distribution.distributed", [
          "distributed.term-3x",
          "distributed.plus-left",
          "distributed.constant-6",
          "distributed.outer-plus",
          "distributed.term-2x",
          "distributed.minus-right",
          "distributed.negative-2"
        ]),
        group("layout.foldable-distribution.distributed.left-branch", [
          "distributed.term-3x",
          "distributed.plus-left",
          "distributed.constant-6"
        ]),
        group("layout.foldable-distribution.distributed.right-branch", [
          "distributed.term-2x",
          "distributed.minus-right",
          "distributed.negative-2"
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
        ["grouped.negative-2", "2"],
        ["grouped.constants.right-parenthesis", ")"]
      ],
      groups: [
        group("layout.foldable-distribution.grouped", [
          "grouped.coefficients.left-parenthesis",
          "grouped.coefficient-3",
          "grouped.x-from-left",
          "grouped.coefficients.plus",
          "grouped.coefficient-2",
          "grouped.x-from-right",
          "grouped.coefficients.right-parenthesis",
          "grouped.outer-plus",
          "grouped.constants.left-parenthesis",
          "grouped.constant-6",
          "grouped.constants.minus",
          "grouped.negative-2",
          "grouped.constants.right-parenthesis"
        ]),
        group("layout.foldable-distribution.grouped.coefficient-row", [
          "grouped.coefficients.left-parenthesis",
          "grouped.coefficient-3",
          "grouped.x-from-left",
          "grouped.coefficients.plus",
          "grouped.coefficient-2",
          "grouped.x-from-right",
          "grouped.coefficients.right-parenthesis"
        ]),
        group("layout.foldable-distribution.grouped.constant-row", [
          "grouped.constants.left-parenthesis",
          "grouped.constant-6",
          "grouped.constants.minus",
          "grouped.negative-2",
          "grouped.constants.right-parenthesis"
        ]),
        group("grouped.term-3x", [
          "grouped.coefficient-3",
          "grouped.x-from-left"
        ]),
        group("grouped.term-2x", [
          "grouped.coefficient-2",
          "grouped.x-from-right"
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
          "grouped.negative-2",
          "grouped.constants.right-parenthesis"
        ])
      ]
    }),
    endpoint({
      objectId: "expression.foldable-distribution.coefficient-factored",
      label: "Three plus two, times x, plus six minus two",
      tokens: [
        ["coefficient-factored.coefficients.left-parenthesis", "("],
        ["coefficient-factored.coefficient-3", "3"],
        ["coefficient-factored.coefficients.plus", "+"],
        ["coefficient-factored.coefficient-2", "2"],
        ["coefficient-factored.coefficients.right-parenthesis", ")"],
        ["coefficient-factored.x", "x"],
        ["coefficient-factored.outer-plus", "+"],
        ["coefficient-factored.constants.left-parenthesis", "("],
        ["coefficient-factored.constant-6", "6"],
        ["coefficient-factored.constants.minus", "-"],
        ["coefficient-factored.negative-2", "2"],
        ["coefficient-factored.constants.right-parenthesis", ")"]
      ],
      groups: [
        group("layout.foldable-distribution.coefficient-factored", [
          "coefficient-factored.coefficients.left-parenthesis",
          "coefficient-factored.coefficient-3",
          "coefficient-factored.coefficients.plus",
          "coefficient-factored.coefficient-2",
          "coefficient-factored.coefficients.right-parenthesis",
          "coefficient-factored.x",
          "coefficient-factored.outer-plus",
          "coefficient-factored.constants.left-parenthesis",
          "coefficient-factored.constant-6",
          "coefficient-factored.constants.minus",
          "coefficient-factored.negative-2",
          "coefficient-factored.constants.right-parenthesis"
        ]),
        group("coefficient-factored.variable-term", [
          "coefficient-factored.coefficients.left-parenthesis",
          "coefficient-factored.coefficient-3",
          "coefficient-factored.coefficients.plus",
          "coefficient-factored.coefficient-2",
          "coefficient-factored.coefficients.right-parenthesis",
          "coefficient-factored.x"
        ]),
        group("coefficient-factored.constants", [
          "coefficient-factored.constants.left-parenthesis",
          "coefficient-factored.constant-6",
          "coefficient-factored.constants.minus",
          "coefficient-factored.negative-2",
          "coefficient-factored.constants.right-parenthesis"
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
        group("layout.foldable-distribution.collected.result", [
          "collected.coefficient-5",
          "collected.x",
          "collected.plus",
          "collected.constant-4"
        ]),
        group("collected.term-5x", [
          "collected.coefficient-5",
          "collected.x"
        ])
      ]
    })
  ]);
}

function endpoint(input: {
  readonly objectId: string;
  readonly label: string;
  readonly tokens: readonly KpFoldableDistributionEndpointToken[];
  readonly groups: readonly KpFoldableDistributionGroupEnvelope[];
}): KpFoldableDistributionEndpointSpec {
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
    tokens: Object.freeze(input.tokens.map(
      ([selectorId, latex]) =>
        Object.freeze([selectorId, latex]) as KpFoldableDistributionEndpointToken
    )),
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
