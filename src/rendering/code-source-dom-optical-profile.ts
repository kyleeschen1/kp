import {
  kpCodeSyntaxRoles,
  type KpCodeSyntaxRole
} from "../semantic/code-source-token-protocol.ts";

export const kpCodePaintRoleFamilies = [
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

export type KpCodePaintRoleFamily = typeof kpCodePaintRoleFamilies[number];

export type KpCodePaintChannel =
  | "background"
  | "border"
  | "color"
  | "filter"
  | "outline"
  | "shadow";

export type KpCodeNonSyntaxPaintRoleId =
  | "surface.panel"
  | "surface.shadow"
  | "chrome.background"
  | "chrome.foreground"
  | "foreground.primary"
  | "foreground.narration"
  | "muted.annotation"
  | "border.frame"
  | "border.divider"
  | "focus.halo"
  | "focus.wash"
  | "transit.halo"
  | "withdrawal.filter"
  | "selection.background"
  | "selection.foreground"
  | "focus-ring.outline";

export type KpCodePaintRoleId =
  | KpCodeNonSyntaxPaintRoleId
  | `syntax.${KpCodeSyntaxRole}`;

export interface KpCodePaintRoleDefinition {
  readonly id: KpCodePaintRoleId;
  readonly family: KpCodePaintRoleFamily;
  readonly channel: KpCodePaintChannel;
}

export type KpCodeOpticalTheme = "dark" | "light";

export interface KpCodeDomOpticalEndpoint {
  readonly id: KpCodeOpticalTheme;
  readonly values: Readonly<Record<KpCodePaintRoleId, string>>;
}

export interface KpCodeSourceDomOpticalProfile {
  readonly id: "kp.code-source-dom-optical-profile.v1";
  readonly rendererKind: "dom-source";
  readonly themeAuthority: "explicit-host";
  readonly roleDefinitions: readonly KpCodePaintRoleDefinition[];
  readonly endpoints: Readonly<Record<
    KpCodeOpticalTheme,
    KpCodeDomOpticalEndpoint
  >>;
}

export const kpCodeFocusShadowAlphaPlaceholder =
  "--kp-code-focus-shadow-alpha" as const;

const nonSyntaxRoleDefinitions = Object.freeze([
  role("surface.panel", "surface", "background"),
  role("surface.shadow", "surface", "shadow"),
  role("chrome.background", "chrome", "background"),
  role("chrome.foreground", "chrome", "color"),
  role("foreground.primary", "foreground", "color"),
  role("foreground.narration", "foreground", "color"),
  role("muted.annotation", "muted", "color"),
  role("border.frame", "border", "border"),
  role("border.divider", "border", "border"),
  role("focus.halo", "focus", "shadow"),
  role("focus.wash", "focus", "background"),
  role("transit.halo", "transit", "shadow"),
  role("withdrawal.filter", "withdrawal", "filter"),
  role("selection.background", "selection", "background"),
  role("selection.foreground", "selection", "color"),
  role("focus-ring.outline", "focus-ring", "outline")
]);

const syntaxRoleDefinitions = Object.freeze(kpCodeSyntaxRoles.map((syntaxRole) =>
  role(`syntax.${syntaxRole}`, "syntax", "color")
));

export const kpCodePaintRoleDefinitions = Object.freeze([
  ...nonSyntaxRoleDefinitions,
  ...syntaxRoleDefinitions
]);

const dark = endpoint("dark", {
  "surface.panel": "#0d0e1c",
  "surface.shadow": "0 1rem 3rem rgb(0 0 0 / 18%)",
  "chrome.background": "transparent",
  "chrome.foreground": "#a5adbd",
  "foreground.primary": "#ede8d0",
  "foreground.narration": "#e8ebf2",
  "muted.annotation": "#a5adbd",
  "border.frame": "rgb(224 230 244 / 14%)",
  "border.divider": "rgb(224 230 244 / 12%)",
  "focus.halo":
    `0 0 0.55rem rgb(207 229 255 / var(${kpCodeFocusShadowAlphaPlaceholder}, 0))`,
  "focus.wash": "rgb(92 173 255 / 10%)",
  "transit.halo": "0 0 0.55rem currentcolor",
  "withdrawal.filter": "saturate(0.72) brightness(0.88)",
  "selection.background": "rgb(92 173 255 / 26%)",
  "selection.foreground": "#ede8d0",
  "focus-ring.outline": "2px solid #82b0ec",
  "syntax.keyword": "#9099d9",
  "syntax.identifier": "#ede8d0",
  "syntax.function": "#338fff",
  "syntax.property": "#76afbf",
  "syntax.type": "#c0965b",
  "syntax.boolean": "#319aaa",
  "syntax.number": "#ede8d0",
  "syntax.string": "#82b0ec",
  "syntax.comment": "#db7b5f",
  "syntax.operator": "#989898",
  "syntax.punctuation": "#989898"
});

const light = endpoint("light", {
  "surface.panel": "#fbfaf7",
  "surface.shadow": "0 1rem 3rem rgb(37 45 56 / 12%)",
  "chrome.background": "#f1f0ec",
  "chrome.foreground": "#555e69",
  "foreground.primary": "#26313a",
  "foreground.narration": "#26313a",
  "muted.annotation": "#66717d",
  "border.frame": "#ccd0d6",
  "border.divider": "#d9dce1",
  "focus.halo":
    `0 0 0.06rem rgb(0 88 156 / calc(0.12 + var(${kpCodeFocusShadowAlphaPlaceholder}, 0)))`,
  "focus.wash": "rgb(0 95 173 / 10%)",
  "transit.halo": "0 0 0.045rem rgb(0 73 132 / 55%)",
  "withdrawal.filter": "grayscale(0.32) opacity(0.72)",
  "selection.background": "rgb(0 95 173 / 22%)",
  "selection.foreground": "#17232d",
  "focus-ring.outline": "2px solid #006bb6",
  "syntax.keyword": "#6554b2",
  "syntax.identifier": "#26313a",
  "syntax.function": "#005ea8",
  "syntax.property": "#146b78",
  "syntax.type": "#85540d",
  "syntax.boolean": "#126d75",
  "syntax.number": "#26313a",
  "syntax.string": "#2d5f9e",
  "syntax.comment": "#a33e2d",
  "syntax.operator": "#5d6670",
  "syntax.punctuation": "#5d6670"
});

/**
 * Human review promoted one language-neutral DOM paint profile. Language
 * frontends still decide which syntax roles exist, and adapters retain their
 * own CSS namespaces, semantic clocks, geometry, and native-source ownership.
 */
export const kpCodeSourceDomOpticalProfile =
  createKpCodeSourceDomOpticalProfile({
    id: "kp.code-source-dom-optical-profile.v1",
    rendererKind: "dom-source",
    themeAuthority: "explicit-host",
    roleDefinitions: kpCodePaintRoleDefinitions,
    endpoints: Object.freeze({ dark, light })
  });

export function createKpCodeSourceDomOpticalProfile(
  input: KpCodeSourceDomOpticalProfile
): KpCodeSourceDomOpticalProfile {
  assertExactValues(
    input.roleDefinitions.map(({ id }) => id),
    kpCodePaintRoleDefinitions.map(({ id }) => id),
    "paint roles"
  );
  assertExactValues(
    [...new Set(input.roleDefinitions.map(({ family }) => family))],
    kpCodePaintRoleFamilies,
    "paint-role families"
  );
  for (const theme of ["dark", "light"] as const) {
    if (input.endpoints[theme].id !== theme) {
      throw new Error(`Code optical endpoint ${theme} has crossed identity.`);
    }
    assertExactValues(
      Object.keys(input.endpoints[theme].values),
      kpCodePaintRoleDefinitions.map(({ id }) => id),
      `${theme} endpoint roles`
    );
    for (const [id, value] of Object.entries(input.endpoints[theme].values)) {
      if (value.trim() === "") {
        throw new Error(`Code optical endpoint ${theme} role ${id} is empty.`);
      }
    }
  }
  Object.freeze(input.roleDefinitions);
  Object.freeze(input.endpoints);
  return Object.freeze(input);
}

export function selectKpCodePaintRoleDefinitions(
  syntaxRoles: readonly KpCodeSyntaxRole[]
): readonly KpCodePaintRoleDefinition[] {
  assertUniqueSubset(syntaxRoles, kpCodeSyntaxRoles, "syntax roles");
  const enabled = new Set<KpCodeSyntaxRole>(syntaxRoles);
  return Object.freeze(kpCodePaintRoleDefinitions.filter(({ id }) =>
    !id.startsWith("syntax.") ||
    enabled.has(id.slice("syntax.".length) as KpCodeSyntaxRole)
  ));
}

export function projectKpCodeDomOpticalEndpoint<TProperty extends string>(
  input: {
    readonly endpoint: KpCodeDomOpticalEndpoint;
    readonly slots: readonly {
      readonly id: KpCodePaintRoleId;
      readonly cssProperty: TProperty;
    }[];
    readonly focusShadowAlphaProperty: `--${string}`;
  }
): Readonly<Record<TProperty, string>> {
  const definitions = new Set(kpCodePaintRoleDefinitions.map(({ id }) => id));
  const ids = new Set<KpCodePaintRoleId>();
  const properties = new Set<TProperty>();
  const projected: [TProperty, string][] = [];
  for (const slot of input.slots) {
    if (!definitions.has(slot.id) || ids.has(slot.id)) {
      throw new Error(`Code optical projection has invalid role ${slot.id}.`);
    }
    if (properties.has(slot.cssProperty)) {
      throw new Error(
        `Code optical projection repeats property ${slot.cssProperty}.`
      );
    }
    ids.add(slot.id);
    properties.add(slot.cssProperty);
    projected.push([
      slot.cssProperty,
      input.endpoint.values[slot.id].replaceAll(
        kpCodeFocusShadowAlphaPlaceholder,
        input.focusShadowAlphaProperty
      )
    ]);
  }
  return Object.freeze(Object.fromEntries(projected)) as Readonly<
    Record<TProperty, string>
  >;
}

function role(
  id: KpCodePaintRoleId,
  family: KpCodePaintRoleFamily,
  channel: KpCodePaintChannel
): KpCodePaintRoleDefinition {
  return Object.freeze({ id, family, channel });
}

function endpoint(
  id: KpCodeOpticalTheme,
  values: Record<KpCodePaintRoleId, string>
): KpCodeDomOpticalEndpoint {
  Object.freeze(values);
  return Object.freeze({ id, values });
}

function assertUniqueSubset(
  actual: readonly string[],
  expected: readonly string[],
  label: string
): void {
  if (new Set(actual).size !== actual.length ||
      actual.some((value) => !expected.includes(value))) {
    throw new Error(`Code ${label} must be a unique supported subset.`);
  }
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
    throw new Error(`Code ${label} must have exact coverage.`);
  }
}
