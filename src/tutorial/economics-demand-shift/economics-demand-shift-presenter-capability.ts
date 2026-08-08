import type {
  KpEconomicsDemandShiftPresentationLayout
} from "./economics-demand-shift-layout.ts";

export interface KpEconomicsDemandShiftPresenterCapability {
  readonly id: string;
  readonly layout: KpEconomicsDemandShiftPresentationLayout;
}

/** Loads only the selected presentation stylesheet before its DOM can mount. */
export async function loadKpEconomicsDemandShiftPresenterCapability(
  layout: KpEconomicsDemandShiftPresentationLayout
): Promise<KpEconomicsDemandShiftPresenterCapability> {
  switch (layout) {
    case "inline-sticky": {
      const module = await import(
        "./presenters/inline-sticky-presenter-capability.ts"
      );
      return module.kpEconomicsInlineStickyPresenterCapability;
    }
    case "animation-station": {
      const module = await import(
        "./presenters/animation-station-presenter-capability.ts"
      );
      return module.kpEconomicsAnimationStationPresenterCapability;
    }
    case "two-column-scroll": {
      const module = await import(
        "./presenters/two-column-scroll-presenter-capability.ts"
      );
      return module.kpEconomicsTwoColumnScrollPresenterCapability;
    }
    case "split": {
      const module = await import(
        "./presenters/split-presenter-capability.ts"
      );
      return module.kpEconomicsSplitPresenterCapability;
    }
  }
}
