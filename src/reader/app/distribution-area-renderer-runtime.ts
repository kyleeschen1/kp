// Keep the route-owned dynamic boundary while respecting the renderer layer's
// public API; this module intentionally exposes only the distribution cohort.
export {
  createKpDistributionAreaMotionPlan,
  createKpDistributionAreaTermSchedule,
  createKpDistributionAreaWidthMotionPlan,
  createKpReaderAdapterRegistry,
  defineKpReaderScheduledRendererAdapter,
  measureKpDistributionAreaLayout,
  measureKpDistributionAreaWidthLayout
} from "../renderers/public-api.ts";
