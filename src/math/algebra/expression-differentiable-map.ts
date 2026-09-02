import { compileExpression } from "../expression.ts";
import {
  deriveKpJacobian,
  evaluateKpTypedMatrix,
  type KpScalarParameter,
  type KpScalarValue,
  type KpTypedFunction,
  type KpTypedVector
} from "../typed-semantic-math.ts";
import type { KpVectorSpace } from "./algebraic-structures.ts";
import {
  createKpDifferentiableMap,
  type KpDifferentiableMap
} from "./differentiable-map.ts";
import { createKpLinearMap } from "./linear-map.ts";
import type { KpCoordinates } from "./standard-spaces.ts";

export function adaptKpTypedVectorFunctionToDifferentiableMap<
  const Parameters extends readonly KpScalarParameter[],
  const Size extends number,
  const Entries extends readonly KpScalarValue[],
  const DomainId extends string,
  const CodomainId extends string
>(input: {
  readonly id: string;
  readonly source: KpTypedFunction<
    Parameters,
    KpTypedVector<Size, Entries>
  >;
  readonly domain: KpVectorSpace<
    KpCoordinates<Parameters["length"]>,
    number,
    DomainId
  >;
  readonly codomain: KpVectorSpace<KpCoordinates<Size>, number, CodomainId>;
}): KpDifferentiableMap<
  KpCoordinates<Parameters["length"]>,
  KpCoordinates<Size>,
  number,
  DomainId,
  CodomainId
> {
  if (input.domain.space.dimension !== input.source.parameters.length) {
    throw new Error(
      `Expression adapter ${input.id} domain requires ` +
      `${input.source.parameters.length} dimensions; received ` +
      `${input.domain.space.dimension}.`
    );
  }
  if (input.codomain.space.dimension !== input.source.output.size) {
    throw new Error(
      `Expression adapter ${input.id} codomain requires ` +
      `${input.source.output.size} dimensions; received ` +
      `${input.codomain.space.dimension}.`
    );
  }

  const outputCompilers = input.source.output.entries.map((entry) =>
    compileExpression(entry.expression)
  );
  const jacobian = deriveKpJacobian({
    id: `${input.id}.jacobian`,
    source: input.source
  });

  return createKpDifferentiableMap({
    id: input.id,
    domain: input.domain,
    codomain: input.codomain,
    evaluate: (at) => {
      const scope = scopeAt(input.source.parameters, at, input.id);
      return Object.freeze(outputCompilers.map((compile) => compile(scope))) as
        KpCoordinates<Size>;
    },
    derivativeAt: (at) => {
      const scope = scopeAt(input.source.parameters, at, input.id);
      const rows = evaluateKpTypedMatrix(jacobian.matrix, scope);
      return createKpLinearMap({
        id: `${input.id}.derivative-at.${encodeCoordinates(at)}`,
        domain: input.domain,
        codomain: input.codomain,
        apply: (tangent) => {
          scopeAt(input.source.parameters, tangent, `${input.id}.derivative`);
          return Object.freeze(rows.map((row) => row.reduce(
            (sum, entry, column) => input.codomain.scalars.add(
              sum,
              input.codomain.scalars.multiply(entry, tangent[column]!)
            ),
            input.codomain.scalars.zero
          ))) as KpCoordinates<Size>;
        },
        linearity: {
          kind: "proved",
          authorityId: "kp.math.expression-jacobian-linear-map.v1"
        },
        sourceMapIds: [input.source.id, jacobian.id]
      });
    },
    sourceFunctionIds: [input.source.id]
  });
}

function scopeAt<Parameters extends readonly KpScalarParameter[]>(
  parameters: Parameters,
  at: KpCoordinates<Parameters["length"]>,
  adapterId: string
): Readonly<Record<string, number>> {
  if (at.length !== parameters.length) {
    throw new Error(
      `Expression adapter ${adapterId} requires ${parameters.length} coordinates.`
    );
  }
  const entries = parameters.map((parameter, index) => {
    const value = at[index]!;
    if (!Number.isFinite(value)) {
      throw new Error(
        `Expression adapter ${adapterId} coordinate ${index} must be finite.`
      );
    }
    return [parameter.name, value] as const;
  });
  return Object.freeze(Object.fromEntries(entries));
}

function encodeCoordinates(coordinates: readonly number[]): string {
  return coordinates.map((value) => Object.is(value, -0) ? "-0" : String(value))
    .join(",");
}
