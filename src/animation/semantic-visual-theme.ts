import {
  kpSemanticVisualRoles,
  type KpSemanticVisualRole
} from "./semantic-visual-role.ts";
import {
  kpSalienceIdentityFamilies,
  type KpSalienceIdentityFamily
} from "./semantic-salience-state.ts";

export type KpVisualThemeId = "dark" | "light";

export interface KpVisualThemeContract {
  readonly id: KpVisualThemeId;
  readonly roleSources: Readonly<Record<KpSemanticVisualRole, string>>;
  readonly identitySources: Readonly<Record<KpSalienceIdentityFamily, string>>;
  readonly optical: {
    readonly hairlinePx: number;
    readonly strokePx: number;
    readonly contextOpacityFloor: number;
    readonly dimOpacityFloor: number;
  };
}

export function createKpVisualThemeContract(
  input: KpVisualThemeContract
): KpVisualThemeContract {
  assertExactKeys(input.roleSources, kpSemanticVisualRoles, "role source");
  assertExactKeys(
    input.identitySources,
    kpSalienceIdentityFamilies,
    "identity source"
  );
  for (const [key, value] of Object.entries({
    ...input.roleSources,
    ...input.identitySources
  })) {
    if (value.trim() === "") throw new Error(`Theme source ${key} is empty.`);
  }
  const { hairlinePx, strokePx, contextOpacityFloor, dimOpacityFloor } =
    input.optical;
  if (hairlinePx <= 0 || strokePx < hairlinePx) {
    throw new Error("Theme strokes must preserve a positive hairline floor.");
  }
  if (contextOpacityFloor < 0 || contextOpacityFloor > 1 ||
      dimOpacityFloor < 0 || dimOpacityFloor > contextOpacityFloor) {
    throw new Error("Theme opacity floors are invalid.");
  }
  return deepFreeze({ ...input });
}

export function serializeKpVisualThemeContract(
  contract: KpVisualThemeContract
): string {
  return JSON.stringify(contract);
}

function assertExactKeys<Id extends string>(
  record: Readonly<Record<Id, string>>,
  expected: readonly Id[],
  label: string
): void {
  const actual = Object.keys(record).sort();
  const canonical = [...expected].sort();
  if (actual.length !== canonical.length ||
      actual.some((key, index) => key !== canonical[index])) {
    throw new Error(`Theme ${label} coverage must be exact.`);
  }
}

function deepFreeze<T extends KpVisualThemeContract>(input: T): T {
  Object.freeze(input.roleSources);
  Object.freeze(input.identitySources);
  Object.freeze(input.optical);
  return Object.freeze(input);
}
