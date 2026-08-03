import {
  defineKpLispSemanticModel,
  type KpLispSemanticModel
} from "./lisp-semantic-model.ts";

export const KP_LISP_LAMBDA_APPLICATION_SOURCE =
  "((lambda (x) (+ x 1)) 4)" as const;

export interface KpLispDerivedOccurrence {
  readonly id: string;
  readonly lexeme: string;
  readonly originExpressionIds: readonly string[];
}

export interface KpLispDerivedExpression {
  readonly id: string;
  readonly text: string;
  readonly occurrenceIds: readonly string[];
}

export interface KpLispLambdaEvaluation {
  readonly fixtureId: "fixture.lisp.lambda-application";
  readonly sourceExpressionId: "expr.application";
  readonly bindingId: "binding.x";
  readonly environmentId: "environment.application";
  readonly destinationId: "destination.body.x";
  readonly reconstructed: KpLispDerivedExpression;
  readonly occurrences: readonly KpLispDerivedOccurrence[];
  readonly result: {
    readonly id: "value.result.five";
    readonly kind: "integer-value";
    readonly exactInteger: 5;
    readonly derivedFromExpressionIds: readonly [
      "occurrence.argument.four",
      "occurrence.body.one"
    ];
  };
}

export interface KpLispLambdaApplicationFixture {
  readonly id: "fixture.lisp.lambda-application";
  readonly semantic: KpLispSemanticModel;
  readonly evaluation: KpLispLambdaEvaluation;
}

export function createKpLispLambdaApplicationFixture(): KpLispLambdaApplicationFixture {
  const semantic = defineKpLispSemanticModel({
    id: "model.lisp.lambda-application",
    sourceText: KP_LISP_LAMBDA_APPLICATION_SOURCE,
    root: {
      kind: "list",
      id: "expr.application",
      source: { start: 0, end: 24 },
      children: [
        {
          kind: "list",
          id: "expr.lambda",
          source: { start: 1, end: 21 },
          children: [
            atom("occurrence.lambda", "symbol", "lambda", 2, 8),
            {
              kind: "list",
              id: "expr.parameters",
              source: { start: 9, end: 12 },
              children: [atom("occurrence.x.binder", "symbol", "x", 10, 11)]
            },
            {
              kind: "list",
              id: "expr.body",
              source: { start: 13, end: 20 },
              children: [
                atom("occurrence.plus", "symbol", "+", 14, 15),
                atom("occurrence.x.reference", "symbol", "x", 16, 17),
                atom("occurrence.body.one", "integer", "1", 18, 19)
              ]
            }
          ]
        },
        atom("occurrence.argument.four", "integer", "4", 22, 23)
      ]
    },
    bindings: [{
      id: "binding.x",
      name: "x",
      binderOccurrenceId: "occurrence.x.binder",
      referenceOccurrenceIds: ["occurrence.x.reference"],
      scopeExpressionId: "expr.body"
    }],
    environments: [{
      id: "environment.application",
      entries: [{
        bindingId: "binding.x",
        valueExpressionId: "occurrence.argument.four"
      }]
    }],
    destinations: [{
      kind: "substitution",
      id: "destination.body.x",
      parentExpressionId: "expr.body",
      childIndex: 1,
      referenceOccurrenceId: "occurrence.x.reference",
      accepts: "s-expression"
    }],
    values: [
      {
        kind: "integer-value",
        id: "value.argument.four",
        exactInteger: 4,
        sourceExpressionId: "occurrence.argument.four"
      },
      {
        kind: "integer-value",
        id: "value.body.one",
        exactInteger: 1,
        sourceExpressionId: "occurrence.body.one"
      }
    ]
  });

  return Object.freeze({
    id: "fixture.lisp.lambda-application",
    semantic,
    evaluation: evaluateKpLispLambdaApplication(semantic)
  });
}

/**
 * This intentionally evaluates one certified fixture shape. It proves that
 * motion consumes evaluator truth without quietly growing an arbitrary Lisp VM.
 */
export function evaluateKpLispLambdaApplication(
  semantic: KpLispSemanticModel
): KpLispLambdaEvaluation {
  const argument = semantic.values.find(({ id }) => id === "value.argument.four");
  const increment = semantic.values.find(({ id }) => id === "value.body.one");
  const binding = semantic.bindings.find(({ id }) => id === "binding.x");
  const environment = semantic.environments.find(({ id }) => id === "environment.application");
  const destination = semantic.destinations.find(({ id }) => id === "destination.body.x");
  if (semantic.root.id !== "expr.application" || argument?.exactInteger !== 4 ||
      increment?.exactInteger !== 1 || binding === undefined ||
      environment?.entries[0]?.bindingId !== binding.id ||
      environment.entries[0]?.valueExpressionId !== argument.sourceExpressionId ||
      destination?.referenceOccurrenceId !== "occurrence.x.reference") {
    throw new Error("Unsupported Lisp input: expected the certified lambda-application fixture.");
  }

  const occurrences = Object.freeze([
    derivedOccurrence("derived.plus", "+", ["occurrence.plus"]),
    derivedOccurrence("derived.argument.four", "4", [
      "occurrence.argument.four",
      "occurrence.x.reference"
    ]),
    derivedOccurrence("derived.body.one", "1", ["occurrence.body.one"])
  ]);
  return Object.freeze({
    fixtureId: "fixture.lisp.lambda-application",
    sourceExpressionId: "expr.application",
    bindingId: "binding.x",
    environmentId: "environment.application",
    destinationId: "destination.body.x",
    reconstructed: Object.freeze({
      id: "expr.reconstructed-body",
      text: "(+ 4 1)",
      occurrenceIds: Object.freeze(occurrences.map(({ id }) => id))
    }),
    occurrences,
    result: Object.freeze({
      id: "value.result.five",
      kind: "integer-value",
      exactInteger: (argument.exactInteger + increment.exactInteger) as 5,
      derivedFromExpressionIds: Object.freeze([
        argument.sourceExpressionId,
        increment.sourceExpressionId
      ]) as readonly ["occurrence.argument.four", "occurrence.body.one"]
    })
  });
}

function atom(
  id: string,
  atomKind: "symbol" | "integer",
  lexeme: string,
  start: number,
  end: number
) {
  return Object.freeze({
    kind: "atom" as const,
    id,
    atomKind,
    lexeme,
    source: Object.freeze({ start, end })
  });
}

function derivedOccurrence(
  id: string,
  lexeme: string,
  originExpressionIds: readonly string[]
): KpLispDerivedOccurrence {
  return Object.freeze({
    id,
    lexeme,
    originExpressionIds: Object.freeze([...originExpressionIds])
  });
}
