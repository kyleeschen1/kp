// Keep the ordinary equation reader independent from specialized route
// renderers; the comprehensive public API remains available to lazy variants.
export { createKpReaderAdapterRegistry } from "./adapter-registry.ts";
export { defineKpReaderScheduledRendererAdapter } from "./scheduled-adapter.ts";
export {
  projectKpReaderEquationRenderPlan,
  type KpReaderEquationRenderPlan
} from "./equation-render-plan.ts";
export {
  compileKpReaderEquationMaterialPlan,
  type KpReaderEquationMaterialOwnerPlan,
  type KpReaderEquationMaterialPlan
} from "./equation-material-plan.ts";
export {
  loadKpReaderEquationSceneCompositorAdapter
} from "./equation-scene-compositor-loader.ts";
export { projectKpCertifiedTransferMaterialPlan } from "./certified-transfer-material-projection.ts";
export {
  measureKpReaderAppliedEquationStageLayoutSnapshot,
  measureKpReaderEquationLayoutSnapshot,
  type KpReaderEquationLayoutSnapshot
} from "./equation-layout-snapshot.ts";
export {
  planKpReaderEquationPerceptualAlignment,
  type KpReaderEquationPerceptualAlignmentPlan
} from "./equation-perceptual-alignment.ts";
export {
  createKpReaderEquationMaterialLayer,
  type KpReaderEquationMaterialOwnerFrame
} from "./equation-material-layer.ts";
export { projectKpReaderEquationIdentityWitness } from "./equation-identity-witness.ts";
export {
  sampleKpReaderEquationSymbolMotion,
  type KpReaderEquationSymbolMotionFrame
} from "./equation-symbol-motion.ts";
export {
  applyKpReaderEquationResponsiveFit,
  planKpReaderCertifiedEquationStageResponsiveFit,
  planKpReaderCertifiedEquationStageSequenceResponsiveFit,
  planKpReaderEquationSequenceResponsiveFit,
  type KpReaderEquationResponsiveFitPlan
} from "./equation-responsive-fit.ts";
