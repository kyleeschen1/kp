import {
  kpCodePaintRoleFamilies,
  kpCodeSourceDomOpticalProfile,
  selectKpCodePaintRoleDefinitions,
  type KpCodePaintChannel,
  type KpCodePaintRoleDefinition,
  type KpCodePaintRoleFamily,
  type KpCodePaintRoleId
} from "./code-source-dom-optical-profile.ts";
import { kpCodeSyntaxRoles } from
  "../semantic/code-source-token-protocol.ts";
import type { KpPythonTokenKind } from
  "../semantic/python-source-tokens.ts";

export const kpPythonRefactorPaintRoleFamilies = kpCodePaintRoleFamilies;

export const kpPythonRefactorSyntaxRoles = Object.freeze(
  kpCodeSyntaxRoles.filter(
    (syntaxRole): syntaxRole is KpPythonTokenKind => syntaxRole !== "property"
  )
);

export type KpPythonRefactorPaintRoleFamily = KpCodePaintRoleFamily;
export type KpPythonRefactorPaintChannel = KpCodePaintChannel;

export interface KpPythonRefactorPaintRoleSlot {
  readonly id: KpCodePaintRoleId;
  readonly family: KpPythonRefactorPaintRoleFamily;
  readonly channel: KpPythonRefactorPaintChannel;
  readonly cssProperty: `--kp-python-paint-${string}`;
}

export interface KpPythonRefactorPaintRoleContract {
  readonly id: "kp.python-refactor-paint-roles.v1";
  readonly profileId: "kp.code-source-dom-optical-profile.v1";
  readonly rendererId: "adapter.programming.python-free-shipping-refactor";
  readonly themeAuthority: "explicit-host";
  readonly families: readonly KpPythonRefactorPaintRoleFamily[];
  readonly slots: readonly KpPythonRefactorPaintRoleSlot[];
  readonly syntaxSlots: Readonly<Record<
    KpPythonTokenKind,
    KpPythonRefactorPaintRoleSlot
  >>;
}

const supportedDefinitions = selectKpCodePaintRoleDefinitions(
  kpPythonRefactorSyntaxRoles
);
const slots = Object.freeze(supportedDefinitions.map(toLocalSlot));
const syntaxSlots = Object.freeze(Object.fromEntries(
  kpPythonRefactorSyntaxRoles.map((syntaxRole) => [
    syntaxRole,
    requireSlot(slots, `syntax.${syntaxRole}`)
  ])
) as Record<KpPythonTokenKind, KpPythonRefactorPaintRoleSlot>);

/**
 * Python consumes the approved DOM optical profile as a capability subset.
 * Its absent property token remains an explicit language fact rather than a
 * synthetic role, while all semantic and lifecycle authority stays local.
 */
export const kpPythonRefactorPaintRoleContract =
  createKpPythonRefactorPaintRoleContract({
    id: "kp.python-refactor-paint-roles.v1",
    profileId: kpCodeSourceDomOpticalProfile.id,
    rendererId: "adapter.programming.python-free-shipping-refactor",
    themeAuthority: "explicit-host",
    families: kpPythonRefactorPaintRoleFamilies,
    slots,
    syntaxSlots
  });

export function createKpPythonRefactorPaintRoleContract(
  input: KpPythonRefactorPaintRoleContract
): KpPythonRefactorPaintRoleContract {
  if (input.profileId !== kpCodeSourceDomOpticalProfile.id) {
    throw new Error("Python paint contract must use the promoted profile.");
  }
  assertExactValues(input.families, kpCodePaintRoleFamilies,
    "paint-role families");
  assertExactValues(Object.keys(input.syntaxSlots), kpPythonRefactorSyntaxRoles,
    "syntax roles");
  assertExactValues(
    input.slots.map(({ id }) => id),
    supportedDefinitions.map(({ id }) => id),
    "paint roles"
  );

  const properties = new Set<string>();
  const definitions = new Map(supportedDefinitions.map((definition) =>
    [definition.id, definition]));
  for (const paintSlot of input.slots) {
    const definition = definitions.get(paintSlot.id);
    if (definition === undefined || definition.family !== paintSlot.family ||
        definition.channel !== paintSlot.channel) {
      throw new Error(
        `Python paint slot ${paintSlot.id} drifts from the promoted role.`
      );
    }
    if (properties.has(paintSlot.cssProperty)) {
      throw new Error(
        `Python paint contract repeats property ${paintSlot.cssProperty}.`
      );
    }
    properties.add(paintSlot.cssProperty);
  }
  for (const syntaxRole of kpPythonRefactorSyntaxRoles) {
    const paintSlot = input.syntaxSlots[syntaxRole];
    if (!input.slots.includes(paintSlot) ||
        paintSlot.id !== `syntax.${syntaxRole}`) {
      throw new Error(
        `Python syntax role ${syntaxRole} has no promoted paint slot.`
      );
    }
  }

  Object.freeze(input.families);
  Object.freeze(input.slots);
  Object.freeze(input.syntaxSlots);
  return Object.freeze(input);
}

function toLocalSlot(
  definition: KpCodePaintRoleDefinition
): KpPythonRefactorPaintRoleSlot {
  return Object.freeze({
    ...definition,
    cssProperty:
      `--kp-python-paint-${definition.id.replaceAll(".", "-")}` as const
  });
}

function requireSlot(
  candidates: readonly KpPythonRefactorPaintRoleSlot[],
  id: KpCodePaintRoleId
): KpPythonRefactorPaintRoleSlot {
  const paintSlot = candidates.find((candidate) => candidate.id === id);
  if (paintSlot === undefined) {
    throw new Error(`Python has no promoted paint slot ${id}.`);
  }
  return paintSlot;
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
