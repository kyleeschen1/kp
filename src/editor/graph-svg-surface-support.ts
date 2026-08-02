// Renderer callers keep their established import path while capability
// selection owns the mapping and remains independent of Graph SVG and KaTeX.
export {
  kpEditorGraphSvgAnimationIds,
  supportsKpEditorGraphSvgAnimation
} from "./selected-surface-capability.ts";
