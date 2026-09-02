import { constant } from "../expression.ts";
import {
  createKpScalarExpression,
  createKpTypedMatrixFromRows,
  type KpTypedMatrix,
  type KpTypedMatrixRepresentationRef
} from "../typed-semantic-math.ts";
import type { KpMatrixRepresentation } from "./matrix-representation.ts";

export function toKpTypedMatrixRepresentationRef<
  Domain,
  Codomain,
  DomainId extends string,
  CodomainId extends string,
  Rows extends number,
  Columns extends number
>(
  representation: KpMatrixRepresentation<
    Domain,
    Codomain,
    number,
    DomainId,
    CodomainId,
    Rows,
    Columns
  >
): KpTypedMatrixRepresentationRef {
  return Object.freeze({
    kind: "matrix-representation-ref" as const,
    id: representation.id,
    sourceMapId: representation.sourceMapId,
    domainSpaceId: representation.map.domain.space.id,
    codomainSpaceId: representation.map.codomain.space.id,
    domainBasisId: representation.domainBasis.id,
    codomainBasisId: representation.codomainBasis.id
  });
}

export function createKpTypedMatrixFromRepresentation<
  Domain,
  Codomain,
  DomainId extends string,
  CodomainId extends string,
  Rows extends number,
  Columns extends number
>(input: {
  readonly id: string;
  readonly representation: KpMatrixRepresentation<
    Domain,
    Codomain,
    number,
    DomainId,
    CodomainId,
    Rows,
    Columns
  >;
}): KpTypedMatrix<Rows, Columns> {
  const rows = input.representation.rows.map((row, rowIndex) =>
    row.map((value, columnIndex) => createKpScalarExpression({
      id: `${input.id}.entry.${rowIndex}.${columnIndex}`,
      expression: constant(value),
      provenance: {
        kind: "derived",
        sourceIds: [
          input.representation.sourceMapId,
          input.representation.domainBasis.id,
          input.representation.codomainBasis.id
        ],
        methodId: "kp.math.matrix-representation-adapter.v1"
      }
    }))
  );
  return createKpTypedMatrixFromRows({
    id: input.id,
    rows,
    provenance: {
      kind: "derived",
      sourceIds: [input.representation.id],
      methodId: "kp.math.matrix-representation-adapter.v1"
    },
    representation: toKpTypedMatrixRepresentationRef(input.representation)
  }) as KpTypedMatrix<Rows, Columns>;
}
