import {
  kpCodeSyntaxRoles,
  type KpCodeSyntaxRole
} from "../semantic/code-source-token-protocol.ts";

export const kpTypeScriptRefactorPaintRoleFamilies = [
  "surface",
  "chrome",
  "foreground",
  "muted",
  "border",
  "syntax",
  "focus",
  "transit",
  "withdrawal",
  "selection",
  "focus-ring"
] as const;

export type KpTypeScriptRefactorPaintRoleFamily =
  typeof kpTypeScriptRefactorPaintRoleFamilies[number];

export type KpTypeScriptRefactorPaintChannel =
  | "background"
  | "border"
  | "color"
  | "filter"
  | "outline"
  | "shadow";

export interface KpTypeScriptRefactorPaintRoleSlot {
  readonly id: string;
  readonly family: KpTypeScriptRefactorPaintRoleFamily;
  readonly channel: KpTypeScriptRefactorPaintChannel;
  readonly cssProperty: `--kp-typescript-paint-${string}`;
}

export interface KpTypeScriptRefactorPaintRoleContract {
  readonly id: "kp.typescript-refactor-paint-roles.v1";
  readonly rendererId: "adapter.programming.typescript-free-shipping-refactor";
  readonly themeAuthority: "explicit-host";
  readonly families: readonly KpTypeScriptRefactorPaintRoleFamily[];
  readonly slots: readonly KpTypeScriptRefactorPaintRoleSlot[];
  readonly syntaxSlots: Readonly<Record<
    KpCodeSyntaxRole,
    KpTypeScriptRefactorPaintRoleSlot
  >>;
}

const nonSyntaxSlots = [
  slot("surface.panel", "surface", "background"),
  slot("surface.shadow", "surface", "shadow"),
  slot("chrome.background", "chrome", "background"),
  slot("chrome.foreground", "chrome", "color"),
  slot("foreground.primary", "foreground", "color"),
  slot("foreground.narration", "foreground", "color"),
  slot("muted.annotation", "muted", "color"),
  slot("border.frame", "border", "border"),
  slot("border.divider", "border", "border"),
  slot("focus.halo", "focus", "shadow"),
  slot("focus.wash", "focus", "background"),
  slot("transit.halo", "transit", "shadow"),
  slot("withdrawal.filter", "withdrawal", "filter"),
  slot("selection.background", "selection", "background"),
  slot("selection.foreground", "selection", "color"),
  slot("focus-ring.outline", "focus-ring", "outline")
] as const;

const syntaxSlots = Object.freeze(Object.fromEntries(
  kpCodeSyntaxRoles.map((role) => [
    role,
    slot(`syntax.${role}`, "syntax", "color")
  ])
) as Record<KpCodeSyntaxRole, KpTypeScriptRefactorPaintRoleSlot>);

/**
 * This contract remains TypeScript-local until the reviewed light treatment
 * survives a structurally different Python caller. It names paint inputs only;
 * semantic identity, presence, salience, and motion continue to come from the
 * compiler-owned artifact and sampled score.
 */
export const kpTypeScriptRefactorPaintRoleContract =
  createKpTypeScriptRefactorPaintRoleContract({
    id: "kp.typescript-refactor-paint-roles.v1",
    rendererId: "adapter.programming.typescript-free-shipping-refactor",
    themeAuthority: "explicit-host",
    families: kpTypeScriptRefactorPaintRoleFamilies,
    slots: Object.freeze([...nonSyntaxSlots, ...Object.values(syntaxSlots)]),
    syntaxSlots
  });

export function createKpTypeScriptRefactorPaintRoleContract(
  input: KpTypeScriptRefactorPaintRoleContract
): KpTypeScriptRefactorPaintRoleContract {
  assertExactValues(input.families, kpTypeScriptRefactorPaintRoleFamilies,
    "paint-role families");
  assertExactValues(Object.keys(input.syntaxSlots), kpCodeSyntaxRoles,
    "syntax roles");

  const ids = new Set<string>();
  const properties = new Set<string>();
  const coveredFamilies = new Set<KpTypeScriptRefactorPaintRoleFamily>();
  for (const paintSlot of input.slots) {
    requireText(paintSlot.id, "Paint-role slot id");
    if (ids.has(paintSlot.id)) {
      throw new Error(`TypeScript paint contract repeats slot ${paintSlot.id}.`);
    }
    if (properties.has(paintSlot.cssProperty)) {
      throw new Error(
        `TypeScript paint contract repeats property ${paintSlot.cssProperty}.`
      );
    }
    ids.add(paintSlot.id);
    properties.add(paintSlot.cssProperty);
    coveredFamilies.add(paintSlot.family);
  }
  assertExactValues([...coveredFamilies], kpTypeScriptRefactorPaintRoleFamilies,
    "covered paint-role families");

  for (const role of kpCodeSyntaxRoles) {
    const paintSlot = input.syntaxSlots[role];
    if (!ids.has(paintSlot.id) || paintSlot.family !== "syntax") {
      throw new Error(`TypeScript syntax role ${role} has no syntax paint slot.`);
    }
  }

  Object.freeze(input.families);
  Object.freeze(input.slots);
  Object.freeze(input.syntaxSlots);
  return Object.freeze(input);
}

function slot(
  id: string,
  family: KpTypeScriptRefactorPaintRoleFamily,
  channel: KpTypeScriptRefactorPaintChannel
): KpTypeScriptRefactorPaintRoleSlot {
  return Object.freeze({
    id,
    family,
    channel,
    cssProperty: `--kp-typescript-paint-${id.replaceAll(".", "-")}` as const
  });
}

function assertExactValues(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (left.length !== right.length ||
      left.some((value, index) => value !== right[index])) {
    throw new Error(`TypeScript ${label} must have exact coverage.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must be non-empty.`);
}
