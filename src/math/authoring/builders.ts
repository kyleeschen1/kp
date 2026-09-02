import type { MathExpression } from "../expression.ts";
import {
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedVector,
  defineKpTypedFunction,
  type KpScalarExpression,
  type KpScalarParameter,
  type KpTypedFunction,
  type KpTypedMathValue,
  type KpTypedVector
} from "../typed-semantic-math.ts";
import type { KpMathAuthoringContext } from "./context.ts";

type NonEmptyPath = readonly [string, ...string[]];
type NonEmptyExpressions = readonly [MathExpression, ...MathExpression[]];

export type KpParametersForNames<Names extends readonly string[]> = Readonly<{
  [Index in keyof Names]: Names[Index] extends string
    ? KpScalarParameter<Names[Index]>
    : never;
}>;

export type KpParameterEnvironment<Names extends readonly string[]> = Readonly<{
  [Name in Names[number]]: KpScalarParameter<Name>;
}>;

type KpScalarEntries<Expressions extends NonEmptyExpressions> =
  readonly [KpScalarExpression, ...KpScalarExpression[]] &
  Readonly<{ length: Expressions["length"] }>;

export interface KpFunctionOutputBuilder {
  readonly scalar: (expression: MathExpression) => KpScalarExpression;
  readonly vector: <const Expressions extends NonEmptyExpressions>(
    expressions: Expressions
  ) => KpTypedVector<
    Expressions["length"],
    KpScalarEntries<Expressions>
  >;
}

export function defineKpAuthoredFunction<
  const Names extends readonly [string, ...string[]],
  const Output extends KpTypedMathValue
>(
  context: KpMathAuthoringContext,
  input: {
    readonly path: NonEmptyPath;
    readonly name: string;
    readonly parameters: Names;
    readonly output: (
      parameters: KpParameterEnvironment<Names>,
      build: KpFunctionOutputBuilder
    ) => Output;
  }
): KpTypedFunction<KpParametersForNames<Names>, Output> {
  const scope = context.at(...input.path);
  const parameters = input.parameters.map((name) => createKpScalarParameter({
    id: scope.id("parameters", name),
    name,
    provenance: scope.ref("parameters", name).provenance
  })) as unknown as KpParametersForNames<Names>;
  const environment = Object.freeze(Object.fromEntries(parameters.map(
    (parameter) => [parameter.name, parameter]
  ))) as KpParameterEnvironment<Names>;
  const build = Object.freeze({
    scalar: (expression: MathExpression) => createKpScalarExpression({
      id: scope.id("output"),
      expression,
      provenance: scope.ref("output").provenance
    }),
    vector: <const Expressions extends NonEmptyExpressions>(
      expressions: Expressions
    ) => createKpTypedVector({
      id: scope.id("output"),
      entries: expressions.map((expression, index) =>
        createKpScalarExpression({
          id: scope.id("output", "entries", String(index)),
          expression,
          provenance: scope.ref("output", "entries", String(index)).provenance
        })
      ) as unknown as KpScalarEntries<Expressions>,
      provenance: scope.ref("output").provenance
    })
  }) satisfies KpFunctionOutputBuilder;
  const output = input.output(environment, build);
  const id = context.id(...input.path);
  return defineKpTypedFunction({
    id,
    name: input.name,
    parameters,
    output,
    provenance: context.ref(...input.path).provenance
  });
}
