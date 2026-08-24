import "katex/dist/katex.min.css";

import { prepareKpEditorKatexFonts } from "./katex-font-capability.ts";

export async function registerKpEditorGraphSvgSurfaceCapability(
  supportedAnimationIds: readonly string[]
): Promise<() => void> {
  await prepareKpEditorKatexFonts();
  // Keep the renderer graph behind the selected Graph SVG capability itself.
  // Without this nested boundary, production chunk coalescing made its KaTeX
  // label profile a static dependency of unrelated 3D and programming routes.
  const [client, quadraticTranslation] = await Promise.all([
    import("./graph-svg-domain-renderers.ts"),
    import("./graph-2d-quadratic-translation-surface-adapter.ts")
  ]);
  const disposeDomainAdapter = client.registerKpEditorGraphSvgDomainAdapter(
    supportedAnimationIds
  );
  try {
    const disposeQuadraticTranslation = quadraticTranslation
      .registerKpEditorGraph2DQuadraticTranslationSurfaceAdapter();
    return () => {
      disposeQuadraticTranslation();
      disposeDomainAdapter();
    };
  } catch (error: unknown) {
    // Capability loading is retryable, so partial adapter registration must
    // not survive when the exact exemplar adapter fails to register.
    disposeDomainAdapter();
    throw error;
  }
}
