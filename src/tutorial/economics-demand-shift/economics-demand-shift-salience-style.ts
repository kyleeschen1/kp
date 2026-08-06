import {
  resolveKpSemanticVisualTreatment,
  type KpVisualThemeId
} from "../../animation/semantic-visual-salience.ts";
import type {
  KpEconomicsSalienceProjection
} from "./economics-demand-shift-salience-adapter.ts";

export type KpEconomicsSalienceCssProperties = Readonly<Record<string, string>>;

export function projectKpEconomicsSalienceCssProperties(input: {
  readonly theme: KpVisualThemeId;
  readonly projection: KpEconomicsSalienceProjection;
}): KpEconomicsSalienceCssProperties {
  const properties: Record<string, string> = {};
  for (const object of Object.values(input.projection.objects)) {
    const treatment = resolveKpSemanticVisualTreatment({
      theme: input.theme,
      role: object.role,
      state: object.salience.state
    });
    const prefix = `--kp-economics-salience-${cssId(object.id)}`;
    properties[`${prefix}-color`] = focusedEconomicsColor({
      theme: input.theme,
      identityFamily: object.salience.state.identityFamily,
      level: object.salience.state.level,
      fallback: treatment.color
    });
    properties[`${prefix}-opacity`] = format(treatment.opacity);
    properties[`${prefix}-stroke-scale`] = format(treatment.strokeScale);
    properties[`${prefix}-detail`] = treatment.detail;
    properties[`${prefix}-labels`] = treatment.labels;
    properties[`${prefix}-rendered`] = treatment.rendered ? "1" : "0";
  }
  return Object.freeze(properties);
}

function focusedEconomicsColor(input: {
  readonly theme: KpVisualThemeId;
  readonly identityFamily: string;
  readonly level: string;
  readonly fallback: string;
}): string {
  if (input.level !== "focus") return input.fallback;
  if (input.identityFamily === "red") {
    return input.theme === "dark" ? "#ff8a84" : "#c93630";
  }
  if (input.identityFamily === "blue") {
    return input.theme === "dark" ? "#90caff" : "#146ead";
  }
  return input.fallback;
}

export function serializeKpEconomicsSalienceCssProperties(
  properties: KpEconomicsSalienceCssProperties
): string {
  return Object.entries(properties).map(([name, value]) =>
    `${name}:${value}`
  ).join(";");
}

function cssId(id: string): string {
  return id.replaceAll(".", "-");
}

function format(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
