import {
  exactRationalSchema,
  generateLinearProblemRequestSchema,
  type InferProtocolSchema
} from "../../protocols/public-api.ts";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Expect<Value extends true> = Value;

export type RationalDtoIsInferredFromSchema = Expect<Equal<
  InferProtocolSchema<typeof exactRationalSchema>,
  { readonly numerator: string; readonly denominator: string }
>>;

export type GenerationVersionStaysLiteral = Expect<Equal<
  InferProtocolSchema<typeof generateLinearProblemRequestSchema>["schemaVersion"],
  "linear-problem.generate.request.v1"
>>;

