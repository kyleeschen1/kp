import type {
  KpAnimationCatalogueSelectedHostViewModel
} from "../animation-catalogue-host-view-model.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import type {
  KpAnimationCatalogueSurfaceHostability
} from "../animation-catalogue-surface-hostability.ts";

export type KpSvelteCatalogueHostState =
  | Readonly<{
      readonly status: "loading";
      readonly animationId: string;
      readonly title: string;
    }>
  | Readonly<{
      readonly status: "selected";
      readonly view: KpAnimationCatalogueSelectedHostViewModel;
      readonly animation: KpAnimationAsset;
      readonly hostability: KpAnimationCatalogueSurfaceHostability;
    }>
  | Readonly<{
      readonly status: "not-found";
      readonly animationId: string;
    }>
  | Readonly<{
      readonly status: "error";
      readonly animationId: string;
      readonly message: string;
    }>;
