import type {
  KpFocusExperimentMode
} from "./elevated-focus-experiment.ts";
import type {
  KpLogProductMaterialDepthMode
} from "./log-product-material-depth-pose.ts";

export interface KpLogProductMaterialPresentationMode {
  readonly depthMode: KpLogProductMaterialDepthMode;
  readonly typography: "display" | "demonstration" | "inline";
  readonly active: boolean;
}

const modes: Readonly<
  Record<KpFocusExperimentMode, KpLogProductMaterialPresentationMode>
> = Object.freeze({
  flat: Object.freeze({
    depthMode: "flat",
    typography: "display",
    active: false
  }),
  elevated: Object.freeze({
    depthMode: "material",
    typography: "demonstration",
    active: true
  }),
  "no-depth": Object.freeze({
    depthMode: "no-depth",
    typography: "display",
    active: false
  })
});

export function projectKpLogProductMaterialPresentationMode(
  focusMode: string | undefined
): KpLogProductMaterialPresentationMode {
  if (focusMode === "elevated" || focusMode === "no-depth") {
    return modes[focusMode];
  }
  return modes.flat;
}
