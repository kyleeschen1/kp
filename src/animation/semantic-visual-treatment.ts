import type {
  KpSemanticSalienceState
} from "./semantic-salience-state.ts";
import { kpVisualPaletteSources } from "./semantic-visual-palette.ts";
import { kpVisualSalienceRecipes } from "./semantic-visual-recipe.ts";
import type { KpSemanticVisualRole } from "./semantic-visual-role.ts";
import type { KpVisualThemeId } from "./semantic-visual-theme.ts";

export interface KpResolvedSemanticVisualTreatment {
  readonly color: string;
  readonly opacity: number;
  readonly strokeScale: number;
  readonly detail: "full" | "reduced" | "minimal" | "none";
  readonly labels: "visible" | "essential-only" | "hidden";
  readonly rendered: boolean;
}

/** Resolves semantic state to renderer-neutral paint intent, never DOM or CSS. */
export function resolveKpSemanticVisualTreatment(input: {
  readonly theme: KpVisualThemeId;
  readonly role: KpSemanticVisualRole;
  readonly state: KpSemanticSalienceState;
}): KpResolvedSemanticVisualTreatment {
  const palette = kpVisualPaletteSources[input.theme];
  const recipe = kpVisualSalienceRecipes[input.theme][input.role][
    input.state.level
  ];
  return Object.freeze({
    color: resolveColor({
      source: recipe.colorSource,
      identityFamily: input.state.identityFamily,
      palette
    }),
    opacity: recipe.opacity * input.state.presence,
    strokeScale: recipe.strokeScale,
    detail: recipe.detail,
    labels: recipe.labels,
    rendered: recipe.rendered && input.state.presence > 0
  });
}

function resolveColor(input: {
  readonly source: string;
  readonly identityFamily: string;
  readonly palette: typeof kpVisualPaletteSources.dark;
}): string {
  const parts = input.source.split(".");
  if (parts[0] === "neutral") {
    const key = parts[1] as keyof typeof input.palette.neutral;
    const color = input.palette.neutral[key];
    if (color === undefined) {
      throw new Error(`Unknown neutral source ${input.source}.`);
    }
    return color;
  }
  const explicitFamily = parts.length === 3 ? parts[1] : input.identityFamily;
  const band = parts.at(-1);
  if (explicitFamily === "neutral") {
    throw new Error(`Identity source ${input.source} requires a color family.`);
  }
  const family = input.palette.identities[
    explicitFamily as keyof typeof input.palette.identities
  ];
  const color = family?.[band as keyof typeof family];
  if (color === undefined) {
    throw new Error(`Unknown identity source ${input.source}.`);
  }
  return color;
}
