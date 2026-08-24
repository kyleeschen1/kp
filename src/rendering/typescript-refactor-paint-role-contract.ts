import {
  kpCodePaintRoleDefinitions,
  kpCodePaintRoleFamilies,
  kpCodeSourceDomOpticalProfile,
  type KpCodePaintChannel,
  type KpCodePaintRoleDefinition,
  type KpCodePaintRoleFamily,
  type KpCodePaintRoleId
} from "./code-source-dom-optical-profile.ts";
import {
  kpCodeSyntaxRoles,
  type KpCodeSyntaxRole
} from "../semantic/code-source-token-protocol.ts";

export const kpTypeScriptRefactorPaintRoleFamilies = kpCodePaintRoleFamilies;

export type KpTypeScriptRefactorPaintRoleFamily = KpCodePaintRoleFamily;
export type KpTypeScriptRefactorPaintChannel = KpCodePaintChannel;

export interface KpTypeScriptRefactorPaintRoleSlot {
  readonly id: KpCodePaintRoleId;
  readonly family: KpTypeScriptRefactorPaintRoleFamily;
  readonly channel: KpTypeScriptRefactorPaintChannel;
  readonly cssProperty: `--kp-typescript-paint-${string}`;
}

export interface KpTypeScriptRefactorPaintRoleContract {
  readonly id: "kp.typescript-refactor-paint-roles.v1";
  readonly profileId: "kp.code-source-dom-optical-profile.v1";
  readonly rendererId: "adapter.programming.typescript-free-shipping-refactor";
  readonly themeAuthority: "explicit-host";
  readonly families: readonly KpTypeScriptRefactorPaintRoleFamily[];
  readonly slots: readonly KpTypeScriptRefactorPaintRoleSlot[];
  readonly syntaxSlots: Readonly<Record<
    KpCodeSyntaxRole,
    KpTypeScriptRefactorPaintRoleSlot
  >>;
}

const slots = Object.freeze(kpCodePaintRoleDefinitions.map(toLocalSlot));
const syntaxSlots = Object.freeze(Object.fromEntries(
  kpCodeSyntaxRoles.map((syntaxRole) => [
    syntaxRole,
    requireSlot(slots, `syntax.${syntaxRole}`)
  ])
) as Record<KpCodeSyntaxRole, KpTypeScriptRefactorPaintRoleSlot>);

/**
 * The promoted profile owns language-neutral DOM optics only. TypeScript
 * retains its full syntax inventory, CSS namespace, semantic artifact, clock,
 * geometry, native endpoint, and renderer lifecycle.
 */
export const kpTypeScriptRefactorPaintRoleContract =
  createKpTypeScriptRefactorPaintRoleContract({
    id: "kp.typescript-refactor-paint-roles.v1",
    profileId: kpCodeSourceDomOpticalProfile.id,
    rendererId: "adapter.programming.typescript-free-shipping-refactor",
    themeAuthority: "explicit-host",
    families: kpTypeScriptRefactorPaintRoleFamilies,
    slots,
    syntaxSlots
  });

export function createKpTypeScriptRefactorPaintRoleContract(
  input: KpTypeScriptRefactorPaintRoleContract
): KpTypeScriptRefactorPaintRoleContract {
  if (input.profileId !== kpCodeSourceDomOpticalProfile.id) {
    throw new Error("TypeScript paint contract must use the promoted profile.");
  }
  assertExactValues(input.families, kpCodePaintRoleFamilies,
    "paint-role families");
  assertExactValues(Object.keys(input.syntaxSlots), kpCodeSyntaxRoles,
    "syntax roles");
  assertExactValues(
    input.slots.map(({ id }) => id),
    kpCodePaintRoleDefinitions.map(({ id }) => id),
    "paint roles"
  );

  const properties = new Set<string>();
  const definitions = new Map(kpCodePaintRoleDefinitions.map((definition) =>
    [definition.id, definition]));
  for (const paintSlot of input.slots) {
    const definition = definitions.get(paintSlot.id);
    if (definition === undefined || definition.family !== paintSlot.family ||
        definition.channel !== paintSlot.channel) {
      throw new Error(
        `TypeScript paint slot ${paintSlot.id} drifts from the promoted role.`
      );
    }
    if (properties.has(paintSlot.cssProperty)) {
      throw new Error(
        `TypeScript paint contract repeats property ${paintSlot.cssProperty}.`
      );
    }
    properties.add(paintSlot.cssProperty);
  }
  for (const syntaxRole of kpCodeSyntaxRoles) {
    const paintSlot = input.syntaxSlots[syntaxRole];
    if (!input.slots.includes(paintSlot) ||
        paintSlot.id !== `syntax.${syntaxRole}`) {
      throw new Error(
        `TypeScript syntax role ${syntaxRole} has no promoted paint slot.`
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
): KpTypeScriptRefactorPaintRoleSlot {
  return Object.freeze({
    ...definition,
    cssProperty:
      `--kp-typescript-paint-${definition.id.replaceAll(".", "-")}` as const
  });
}

function requireSlot(
  candidates: readonly KpTypeScriptRefactorPaintRoleSlot[],
  id: KpCodePaintRoleId
): KpTypeScriptRefactorPaintRoleSlot {
  const paintSlot = candidates.find((candidate) => candidate.id === id);
  if (paintSlot === undefined) {
    throw new Error(`TypeScript has no promoted paint slot ${id}.`);
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
    throw new Error(`TypeScript ${label} must have exact coverage.`);
  }
}
