// Compatibility for existing reference consumers; both hosts use one sampler.
export { prepareColumnGeometry, sampleColumnGeometry,
  type ColumnPoint, type ColumnGeometryTerm, type PreparedColumnGeometry, type ColumnGeometrySample
} from '../experiments/matrix-column-combinations/column-geometry.ts';
