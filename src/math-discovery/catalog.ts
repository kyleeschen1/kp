export type DiscoverableMathKind = 'matrix-vector' | 'quadratic' | 'derivative' | 'tangent' | 'vector-pair';
export interface MathCapabilityMetadata {
  readonly id: string;
  readonly family: 'matrix-vector' | 'quadratic' | 'vector-pair';
  readonly operation: 'view' | 'derive' | 'explain';
  readonly accepts: readonly DiscoverableMathKind[];
  readonly requirements: readonly string[];
  readonly example: string;
}

/** Discovery adds examples and facets to existing command IDs. Mathematical
 * applicability and execution still belong to each registered command owner. */
const entries = [
  { id: 'projection.explain', family: 'vector-pair', operation: 'explain', accepts: ['vector-pair'],
    requirements: ['A selected integer R2 vector pair', 'Complete coordinate inputs'],
    example: 'Inspect the dot product, signed parallel projection and perpendicular remainder.' },
  { id: 'projection.linked', family: 'vector-pair', operation: 'view', accepts: ['vector-pair'],
    requirements: ['A selected integer R2 vector pair', 'Complete coordinate inputs'],
    example: 'Add another input view sharing the same saved vector pair.' },
  { id: 'matrix.graph', family: 'matrix-vector', operation: 'view', accepts: ['matrix-vector'],
    requirements: ['A selected 2×2 matrix-vector object', 'Complete numeric inputs'],
    example: 'See the input vector and its image under the matrix.' },
  { id: 'matrix.explain', family: 'matrix-vector', operation: 'explain', accepts: ['matrix-vector'],
    requirements: ['A selected 2×2 matrix-vector object', 'Complete numeric inputs'],
    example: 'Follow each weighted column into the result vector.' },
  { id: 'math.graph', family: 'quadratic', operation: 'view', accepts: ['quadratic', 'derivative', 'tangent'],
    requirements: ['A selected quadratic, derivative or tangent', 'Complete numeric inputs'],
    example: 'Add another graph of the same object with its own viewport. For a quadratic, compare expanded, vertex and real factored forms alongside its curve.' },
  { id: 'math.derivative', family: 'quadratic', operation: 'derive', accepts: ['quadratic'],
    requirements: ['A selected source quadratic', 'Complete coefficient inputs'],
    example: 'Create a derivative that remains dependent on the quadratic.' },
  { id: 'math.tangent', family: 'quadratic', operation: 'derive', accepts: ['quadratic'],
    requirements: ['A selected source quadratic', 'Complete coefficient inputs'],
    example: 'Create a tangent at x = 1, then adjust its contact point.' }
] as const satisfies readonly MathCapabilityMetadata[];
export const mathCapabilityCatalog: readonly MathCapabilityMetadata[] = Object.freeze(entries.map(entry => Object.freeze({ ...entry,
  accepts: Object.freeze(entry.accepts),
  requirements: Object.freeze(entry.requirements)
})));
