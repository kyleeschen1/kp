import {
  type KpCoordinateTuple,
  type KpFiniteBasis
} from "./finite-basis.ts";
import type { KpLinearMap } from "./linear-map.ts";
import { sameKpSemanticSpace } from "./semantic-space.ts";

export type KpScalarMatrix<
  Scalar,
  Rows extends number,
  Columns extends number
> = readonly KpCoordinateTuple<Scalar, Columns>[] &
  Readonly<{ length: Rows }>;

export interface KpMatrixRepresentation<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string = string,
  CodomainId extends string = string,
  Rows extends number = number,
  Columns extends number = number
> {
  readonly kind: "matrix-representation";
  readonly id: string;
  readonly sourceMapId: string;
  readonly map: KpLinearMap<Domain, Codomain, Scalar, DomainId, CodomainId>;
  readonly domainBasis: KpFiniteBasis<Domain, Scalar, DomainId, Columns>;
  readonly codomainBasis: KpFiniteBasis<Codomain, Scalar, CodomainId, Rows>;
  readonly rows: KpScalarMatrix<Scalar, Rows, Columns>;
  readonly rowCount: Rows;
  readonly columnCount: Columns;
}

export function representKpLinearMap<
  Domain,
  Codomain,
  Scalar,
  const DomainId extends string,
  const CodomainId extends string,
  const Columns extends number,
  const Rows extends number
>(input: {
  readonly id: string;
  readonly map: KpLinearMap<Domain, Codomain, Scalar, DomainId, CodomainId>;
  readonly domainBasis: KpFiniteBasis<
    NoInfer<Domain>,
    NoInfer<Scalar>,
    NoInfer<DomainId>,
    Columns
  >;
  readonly codomainBasis: KpFiniteBasis<
    NoInfer<Codomain>,
    NoInfer<Scalar>,
    NoInfer<CodomainId>,
    Rows
  >;
}): KpMatrixRepresentation<
  Domain,
  Codomain,
  Scalar,
  DomainId,
  CodomainId,
  Rows,
  Columns
> {
  requireText(input.id, "Matrix representation id");
  if (!sameKpSemanticSpace(
    input.map.domain.space,
    input.domainBasis.space.space
  )) {
    throw new Error(
      `Matrix representation ${input.id} domain basis must belong to ` +
      `${input.map.domain.space.id}.`
    );
  }
  if (!sameKpSemanticSpace(
    input.map.codomain.space,
    input.codomainBasis.space.space
  )) {
    throw new Error(
      `Matrix representation ${input.id} codomain basis must belong to ` +
      `${input.map.codomain.space.id}.`
    );
  }

  const columns = input.domainBasis.vectors.map((basisVector) =>
    input.codomainBasis.coordinates(input.map.apply(basisVector))
  );
  const rows = Object.freeze(Array.from(
    { length: input.codomainBasis.size },
    (_, row) => Object.freeze(columns.map((column) => column[row]!)) as
      unknown as KpCoordinateTuple<Scalar, Columns>
  )) as unknown as KpScalarMatrix<Scalar, Rows, Columns>;

  return Object.freeze({
    kind: "matrix-representation" as const,
    id: input.id,
    sourceMapId: input.map.id,
    map: input.map,
    domainBasis: input.domainBasis,
    codomainBasis: input.codomainBasis,
    rows,
    rowCount: input.codomainBasis.size,
    columnCount: input.domainBasis.size
  });
}

export function applyKpMatrixRepresentation<
  Domain,
  Codomain,
  Scalar,
  DomainId extends string,
  CodomainId extends string,
  Rows extends number,
  Columns extends number
>(
  representation: KpMatrixRepresentation<
    Domain,
    Codomain,
    Scalar,
    DomainId,
    CodomainId,
    Rows,
    Columns
  >,
  value: Domain
): Codomain {
  const scalars = representation.map.domain.scalars;
  const coordinates = representation.domainBasis.coordinates(value);
  const output = Object.freeze(representation.rows.map((row) =>
    row.reduce(
      (sum, entry, column) => scalars.add(
        sum,
        scalars.multiply(entry, coordinates[column]!)
      ),
      scalars.zero
    )
  )) as unknown as KpCoordinateTuple<Scalar, Rows>;
  return representation.codomainBasis.fromCoordinates(output);
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
