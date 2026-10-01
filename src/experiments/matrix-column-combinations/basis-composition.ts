import { createKpCartesianSpace, type KpCoordinates } from '../../math/algebra/standard-spaces.ts';
import { createKpFiniteBasis } from '../../math/algebra/finite-basis.ts';
import { createKpLinearMap, composeKpLinearMaps } from '../../math/algebra/linear-map.ts';
import { representKpLinearMap, type KpMatrixRepresentation } from '../../math/algebra/matrix-representation.ts';
import { createKpTypedMatrixFromRepresentation } from '../../math/algebra/typed-matrix-adapter.ts';
import { matrixProduct } from '../../math/matrix-product.ts';
import { compileExpression } from '../../math/expression.ts';
import { columnExampleFromProduct } from './model.ts';

type Vector = KpCoordinates<2>;
type Representation = KpMatrixRepresentation<Vector, Vector, number, string, string, 2, 2>;
export class BasisCompositionGap extends Error {
  readonly code = 'kp.basis-composition.incompatible';
}

/** Local numerical exemplar boundary: array multiplication alone carries no
 * promise about coordinate systems. Keep map/basis authority next to its graph. */
export function composeRepresentations(id: string, outer: Representation, inner: Representation) {
  if (inner.codomainBasis !== outer.domainBasis) {
    throw new BasisCompositionGap('The intermediate bases must match. Re-express one map in the shared basis before multiplying.');
  }
  const map = composeKpLinearMaps({ id: `${id}.map`, inner: inner.map, outer: outer.map });
  const representation = representKpLinearMap({ id: `${id}.representation`, map,
    domainBasis: inner.domainBasis, codomainBasis: outer.codomainBasis });
  const left = createKpTypedMatrixFromRepresentation({ id: `${id}.outer`, representation: outer });
  const right = createKpTypedMatrixFromRepresentation({ id: `${id}.inner`, representation: inner });
  const product = matrixProduct({ id: `${id}.product`, left, right });
  for (const cell of product.cells) {
    const actual = compileExpression(cell.result.expression)({});
    const expected = representation.rows[cell.rowIndex]![cell.columnIndex]!;
    if (!Number.isFinite(actual) || !map.codomain.scalars.equality.equals(actual, expected)) {
      throw new BasisCompositionGap('The coordinate product does not match the composed map on its basis.');
    }
  }
  return Object.freeze({ inner, outer, map, representation, product });
}

export function basisComposition(mode: 'adapted' | 'standard' = 'adapted', column = 0) {
  if (mode !== 'adapted' && mode !== 'standard') throw new BasisCompositionGap('Choose the adapted or standard intermediate basis.');
  const space = createKpCartesianSpace({ id: 'composition.plane', label: 'Real plane', dimension: 2 });
  const evidence = { kind: 'tested', suiteId: 'tests/basis-composition.test.ts', equalityId: space.vectors.equality.id } as const;
  const standard = createKpFiniteBasis({ id: 'composition.E', space,
    vectors: [[1, 0], [0, 1]] as const, coordinates: v => v, fromCoordinates: v => v, coordinateIsomorphism: evidence });
  const adapted = createKpFiniteBasis({ id: 'composition.beta', space,
    vectors: [[1, 1], [0, 1]] as const,
    coordinates: v => [v[0]!, v[1]! - v[0]!] as const,
    fromCoordinates: v => [v[0]!, v[0]! + v[1]!] as const, coordinateIsomorphism: evidence });
  const T = createKpLinearMap({ id: 'composition.T', domain: space, codomain: space,
    apply: v => [2 * v[0]!, v[1]!] as const, linearity: evidence });
  const S = createKpLinearMap({ id: 'composition.S', domain: space, codomain: space,
    apply: v => [v[0]! + v[1]!, v[1]!] as const, linearity: evidence });
  const middle = mode === 'adapted' ? adapted : standard;
  const inner = representKpLinearMap({ id: `composition.T.${mode}`, map: T, domainBasis: standard, codomainBasis: middle });
  const outer = representKpLinearMap({ id: `composition.S.${mode}`, map: S, domainBasis: middle, codomainBasis: standard });
  const composition = composeRepresentations(`composition.${mode}`, outer, inner);
  const generic = columnExampleFromProduct(composition.product, column);
  const scene = Object.freeze({ ...generic, kind: 'composition', title: 'Bases must agree at the join',
    beats: Object.freeze(generic.beats.map(beat => Object.freeze({ ...beat, cue: beat.id === 'initial'
      ? `B expresses T in ${mode === 'adapted' ? 'β' : 'E'} coordinates; A expects those same coordinates.`
      : beat.id === 'placed' ? `This is the ${column === 0 ? 'first' : 'second'} standard basis vector after applying T, then S, expressed in E.` : beat.cue }))) });
  const incompatibleOuter = representKpLinearMap({ id: 'composition.S.mismatch', map: S,
    domainBasis: mode === 'adapted' ? standard : adapted, codomainBasis: standard });
  let mismatch: string;
  try { composeRepresentations('composition.rejected', incompatibleOuter, inner); throw new Error('Expected basis mismatch'); }
  catch (error) { if (!(error instanceof BasisCompositionGap)) throw error; mismatch = error.message; }
  return Object.freeze({ ...composition, scene, standard, adapted, middle, T, S, mode, mismatch, incompatibleOuter });
}
