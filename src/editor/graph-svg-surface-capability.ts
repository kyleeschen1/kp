import "katex/dist/katex.min.css";

import { prepareKpEditorKatexFonts } from "./katex-font-capability.ts";

export async function registerKpEditorGraphSvgSurfaceCapability(
  supportedAnimationIds: readonly string[]
): Promise<() => void> {
  await prepareKpEditorKatexFonts();
  // Keep the renderer graph behind the selected Graph SVG capability itself.
  // Without this nested boundary, production chunk coalescing made its KaTeX
  // label profile a static dependency of unrelated 3D and programming routes.
  const client = await import("./graph-svg-domain-renderers.ts");
  return client.registerKpEditorGraphSvgDomainAdapter(
    supportedAnimationIds
  );
}
