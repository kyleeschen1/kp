import {
  kpCodeSyntaxRoles
} from "../semantic/code-source-token-protocol.ts";
import type { KpPythonTokenKind } from
  "../semantic/python-source-tokens.ts";

export const kpPythonRefactorPaintRoleFamilies = [
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

export const kpPythonRefactorSyntaxRoles = Object.freeze(
  kpCodeSyntaxRoles.filter(
    (role): role is KpPythonTokenKind => role !== "property"
  )
);

export type KpPythonRefactorPaintRoleFamily =
  typeof kpPythonRefactorPaintRoleFamilies[number];

export type KpPythonRefactorPaintChannel =
  | "background"
  | "border"
  | "color"
  | "filter"
  | "outline"
  | "shadow";

export interface KpPythonRefactorPaintRoleSlot {
  readonly id: string;
  readonly family: KpPythonRefactorPaintRoleFamily;
  readonly channel: KpPythonRefactorPaintChannel;
  readonly cssProperty: `--kp-python-paint-${string}`;
}

export interface KpPythonRefactorPaintRoleContract {
  readonly id: "kp.python-refactor-paint-roles.v1";
  readonly rendererId: "adapter.programming.python-free-shipping-refactor";
  readonly themeAuthority: "explicit-host";
  readonly families: readonly KpPythonRefactorPaintRoleFamily[];
  readonly slots: readonly KpPythonRefactorPaintRoleSlot[];
  readonly syntaxSlots: Readonly<Record<
    KpPythonTokenKind,
    KpPythonRefactorPaintRoleSlot
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
  kpPythonRefactorSyntaxRoles.map((role) => [
    role,
    slot(`syntax.${role}`, "syntax", "color")
  ])
) as Record<KpPythonTokenKind, KpPythonRefactorPaintRoleSlot>);

/**
 * Python stays local through the cross-language checkpoint. Its missing
 * property role is evidence for the later shared-contract comparison, while
 * semantic identity, presence, salience, and motion remain compiler-owned.
 */
export const kpPythonRefactorPaintRoleContract =
  createKpPythonRefactorPaintRoleContract({
    id: "kp.python-refactor-paint-roles.v1",
    rendererId: "adapter.programming.python-free-shipping-refactor",
    themeAuthority: "explicit-host",
    families: kpPythonRefactorPaintRoleFamilies,
    slots: Object.freeze([...nonSyntaxSlots, ...Object.values(syntaxSlots)]),
    syntaxSlots
  });

export function createKpPythonRefactorPaintRoleContract(
  input: KpPythonRefactorPaintRoleContract
): KpPythonRefactorPaintRoleContract {
  assertExactValues(input.families, kpPythonRefactorPaintRoleFamilies,
    "paint-role families");
  assertExactValues(Object.keys(input.syntaxSlots), kpPythonRefactorSyntaxRoles,
    "syntax roles");

  const ids = new Set<string>();
  const properties = new Set<string>();
  const coveredFamilies = new Set<KpPythonRefactorPaintRoleFamily>();
  for (const paintSlot of input.slots) {
    requireText(paintSlot.id, "Paint-role slot id");
    if (ids.has(paintSlot.id)) {
      throw new Error(`Python paint contract repeats slot ${paintSlot.id}.`);
    }
    if (properties.has(paintSlot.cssProperty)) {
      throw new Error(
        `Python paint contract repeats property ${paintSlot.cssProperty}.`
      );
    }
    ids.add(paintSlot.id);
    properties.add(paintSlot.cssProperty);
    coveredFamilies.add(paintSlot.family);
  }
  assertExactValues([...coveredFamilies], kpPythonRefactorPaintRoleFamilies,
    "covered paint-role families");

  for (const role of kpPythonRefactorSyntaxRoles) {
    const paintSlot = input.syntaxSlots[role];
    if (!ids.has(paintSlot.id) || paintSlot.family !== "syntax") {
      throw new Error(`Python syntax role ${role} has no syntax paint slot.`);
    }
  }

  Object.freeze(input.families);
  Object.freeze(input.slots);
  Object.freeze(input.syntaxSlots);
  return Object.freeze(input);
}

function slot(
  id: string,
  family: KpPythonRefactorPaintRoleFamily,
  channel: KpPythonRefactorPaintChannel
): KpPythonRefactorPaintRoleSlot {
  return Object.freeze({
    id,
    family,
    channel,
    cssProperty: `--kp-python-paint-${id.replaceAll(".", "-")}` as const
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
    throw new Error(`Python ${label} must have exact coverage.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must be non-empty.`);
}
