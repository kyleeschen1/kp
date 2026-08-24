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
  compileKpCrossDomainGalleryConformancePacket,
  type KpCrossDomainGalleryConformancePacket
} from "../src/architecture/cross-domain-gallery-conformance-packet.ts";

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
  }]);
}
