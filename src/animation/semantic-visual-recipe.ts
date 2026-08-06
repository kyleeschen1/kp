import {
  kpSalienceLevels,
  type KpSalienceLevel
} from "./semantic-salience-state.ts";
import {
  kpSemanticVisualRoles,
  type KpSemanticVisualRole
} from "./semantic-visual-role.ts";
import {
  kpVisualThemeContracts,
  type KpVisualThemeId
} from "./semantic-visual-theme.ts";

export type KpVisualDetailLevel = "full" | "reduced" | "minimal" | "none";
export type KpVisualLabelPolicy = "visible" | "essential-only" | "hidden";

export interface KpVisualSalienceRecipe {
  readonly role: KpSemanticVisualRole;
  readonly level: KpSalienceLevel;
  readonly colorSource: string;
  readonly opacity: number;
  readonly strokeScale: number;
  readonly detail: KpVisualDetailLevel;
  readonly labels: KpVisualLabelPolicy;
  readonly rendered: boolean;
}

export type KpVisualSalienceRecipeMatrix = Readonly<Record<
  KpSemanticVisualRole,
  Readonly<Record<KpSalienceLevel, KpVisualSalienceRecipe>>
>>;

export const kpVisualSalienceRecipes = Object.freeze({
  dark: compileKpVisualSalienceRecipes("dark"),
  light: compileKpVisualSalienceRecipes("light")
});

export function compileKpVisualSalienceRecipes(
  themeId: KpVisualThemeId
): KpVisualSalienceRecipeMatrix {
  const theme = kpVisualThemeContracts[themeId];
  return Object.freeze(Object.fromEntries(kpSemanticVisualRoles.map((role) => [
    role,
    Object.freeze(Object.fromEntries(kpSalienceLevels.map((level) => [
      level,
      Object.freeze(recipe({ role, level, themeId }))
    ])))
  ])) as Record<
    KpSemanticVisualRole,
    Record<KpSalienceLevel, KpVisualSalienceRecipe>
  >);

  function recipe(input: {
    readonly role: KpSemanticVisualRole;
    readonly level: KpSalienceLevel;
    readonly themeId: KpVisualThemeId;
  }): KpVisualSalienceRecipe {
    const rendered = input.level !== "absent";
    return {
      role: input.role,
      level: input.level,
      colorSource: colorSource(input.role, input.level),
      opacity: rendered ? opacity(input.level) : 0,
      strokeScale: rendered ? strokeScale(input.level) : 0,
      detail: detail(input.level),
      labels: labels(input.level),
      rendered
    };
  }

  function opacity(level: KpSalienceLevel): number {
    if (level === "focus" || level === "normal") return 1;
    if (level === "context") return theme.optical.contextOpacityFloor;
    if (level === "dim") return theme.optical.dimOpacityFloor;
    if (level === "ghost") return themeId === "dark" ? 0.24 : 0.34;
    return 0;
  }
}

function colorSource(
  role: KpSemanticVisualRole,
  level: KpSalienceLevel
): string {
  const band = level === "absent" ? "ghost" : level;
  if (role === "data-series") return `identity.${band}`;
  if (role === "warning") return `identity.red.${band}`;
  if (role === "focus") return `identity.cyan.${band}`;
  if (role === "page") return "neutral.page";
  if (role === "structure" || role === "relation") {
    if (level === "focus") return "neutral.lineStrong";
    if (level === "normal") return "neutral.line";
    return "neutral.lineSubtle";
  }
  if (level === "focus") return "neutral.inkStrong";
  if (level === "normal") return "neutral.ink";
  return `neutral.ink${capitalize(band)}`;
}

function strokeScale(level: KpSalienceLevel): number {
  if (level === "focus") return 1.2;
  if (level === "normal" || level === "context") return 1;
  if (level === "dim" || level === "ghost") return 0.8;
  return 0;
}

function detail(level: KpSalienceLevel): KpVisualDetailLevel {
  if (level === "focus" || level === "normal") return "full";
  if (level === "context") return "reduced";
  if (level === "dim" || level === "ghost") return "minimal";
  return "none";
}

function labels(level: KpSalienceLevel): KpVisualLabelPolicy {
  if (level === "focus" || level === "normal") return "visible";
  if (level === "context" || level === "dim") return "essential-only";
  return "hidden";
}

function capitalize(value: string): string {
  return value[0]!.toUpperCase() + value.slice(1);
}
