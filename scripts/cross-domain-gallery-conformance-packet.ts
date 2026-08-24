import { routeKpCrossDomainGalleryGeneration } from
  "./cross-domain-gallery-generation-router.ts";
import {
  kpGalleryLogarithmicSolveFrontend,
  kpGalleryLogarithmicSolveRequest
} from "./gallery-logarithmic-solve-frontend.ts";
import {
  kpGalleryTypeScriptRefactorFrontend,
  kpGalleryTypeScriptRefactorRequest
} from "./gallery-typescript-refactor-frontend.ts";
import {
  kpGalleryGraph2DQuadraticTranslationFrontend,
  kpGalleryGraph2DQuadraticTranslationRequest
} from "./gallery-graph-2d-quadratic-translation-frontend.ts";
import {
  kpGalleryGraph3DSaddleParameterFrontend,
  kpGalleryGraph3DSaddleParameterRequest
} from "./gallery-graph-3d-saddle-parameter-frontend.ts";
import {
  compileKpCrossDomainGalleryConformancePacket,
  type KpCrossDomainGalleryConformancePacket
} from "../src/architecture/cross-domain-gallery-conformance-packet.ts";

// The shared envelope accepts opaque domain input; the Graph3D frontend must
// remain the authority that rejects caller-supplied surface formulas.
const kpGalleryUnsupportedGraph3DFormulaRequest = deepFreeze({
  ...kpGalleryGraph3DSaddleParameterRequest,
  requestId: "request.graph-3d.arbitrary-formula.gallery-gap.v1",
  source: {
    ...kpGalleryGraph3DSaddleParameterRequest.source,
    input: {
      ...kpGalleryGraph3DSaddleParameterRequest.source.input,
      formula: "z=sin(xy)"
    }
  }
});

export function createKpCrossDomainGalleryConformancePacket():
KpCrossDomainGalleryConformancePacket {
  return compileKpCrossDomainGalleryConformancePacket([{
    id: "conformance.gallery.equation.logarithmic-solve",
    request: kpGalleryLogarithmicSolveRequest,
    expectedResult: routeKpCrossDomainGalleryGeneration(
      kpGalleryLogarithmicSolveRequest,
      [kpGalleryLogarithmicSolveFrontend]
    )
  }, {
    id: "conformance.gallery.code.typescript-extract-helper",
    request: kpGalleryTypeScriptRefactorRequest,
    expectedResult: routeKpCrossDomainGalleryGeneration(
      kpGalleryTypeScriptRefactorRequest,
      [kpGalleryTypeScriptRefactorFrontend]
    )
  }, {
    id: "conformance.gallery.graph-2d.quadratic-translate-right-two",
    request: kpGalleryGraph2DQuadraticTranslationRequest,
    expectedResult: routeKpCrossDomainGalleryGeneration(
      kpGalleryGraph2DQuadraticTranslationRequest,
      [kpGalleryGraph2DQuadraticTranslationFrontend]
    )
  }, {
    id: "conformance.gallery.graph-3d.saddle-denominator-four-to-eight",
    request: kpGalleryGraph3DSaddleParameterRequest,
    expectedResult: routeKpCrossDomainGalleryGeneration(
      kpGalleryGraph3DSaddleParameterRequest,
      [kpGalleryGraph3DSaddleParameterFrontend]
    )
  }, {
    id: "conformance.gallery.gap.graph-3d-arbitrary-formula",
    request: kpGalleryUnsupportedGraph3DFormulaRequest,
    expectedResult: routeKpCrossDomainGalleryGeneration(
      kpGalleryUnsupportedGraph3DFormulaRequest,
      [kpGalleryGraph3DSaddleParameterFrontend]
    )
  }]);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
