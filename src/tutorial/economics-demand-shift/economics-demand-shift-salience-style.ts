import { kpVisualPaletteSources } from
  "../../animation/semantic-visual-palette.ts";
import { kpVisualSalienceRecipes } from
  "../../animation/semantic-visual-recipe.ts";
import type { KpVisualThemeId } from
  "../../animation/semantic-visual-theme.ts";
import type {
  KpEconomicsSalienceProjection
} from "./economics-demand-shift-salience-adapter.ts";

export type KpEconomicsSalienceCssProperties = Readonly<Record<string, string>>;

export function projectKpEconomicsSalienceCssProperties(input: {
  readonly theme: KpVisualThemeId;
  readonly projection: KpEconomicsSalienceProjection;
}): KpEconomicsSalienceCssProperties {
  const properties: Record<string, string> = {};
  const palette = kpVisualPaletteSources[input.theme];
  for (const object of Object.values(input.projection.objects)) {
    const recipe = kpVisualSalienceRecipes[input.theme][object.role][
      object.salience.state.level
    ];
    const prefix = `--kp-economics-salience-${cssId(object.id)}`;
    properties[`${prefix}-color`] = resolveColor({
      source: recipe.colorSource,
      identityFamily: object.salience.state.identityFamily,
      palette
    });
    properties[`${prefix}-opacity`] = format(
      recipe.opacity * object.salience.state.presence
    );
    properties[`${prefix}-stroke-scale`] = format(recipe.strokeScale);
    properties[`${prefix}-detail`] = recipe.detail;
    properties[`${prefix}-labels`] = recipe.labels;
    properties[`${prefix}-rendered`] = recipe.rendered &&
        object.salience.state.presence > 0
      ? "1"
      : "0";
  }
  return Object.freeze(properties);
}

export function serializeKpEconomicsSalienceCssProperties(
  properties: KpEconomicsSalienceCssProperties
): string {
  return Object.entries(properties).map(([name, value]) =>
    `${name}:${value}`
  ).join(";");
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
    if (color === undefined) throw new Error(`Unknown neutral source ${input.source}.`);
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
  if (color === undefined) throw new Error(`Unknown identity source ${input.source}.`);
  return color;
}

function cssId(id: string): string {
  return id.replaceAll(".", "-");
}

function format(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
