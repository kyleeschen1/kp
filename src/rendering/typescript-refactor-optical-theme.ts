import {
  kpCodeSourceDomOpticalProfile,
  projectKpCodeDomOpticalEndpoint
} from "./code-source-dom-optical-profile.ts";
import { kpTypeScriptRefactorPaintRoleContract } from
  "./typescript-refactor-paint-role-contract.ts";

export type KpTypeScriptRefactorOpticalProperties = Readonly<Record<
  `--kp-typescript-paint-${string}`,
  string
>>;

export interface KpTypeScriptRefactorOpticalEndpoint {
  readonly id: "dark" | "light";
  readonly contractId: "kp.typescript-refactor-paint-roles.v1";
  readonly profileId: "kp.code-source-dom-optical-profile.v1";
  readonly properties: KpTypeScriptRefactorOpticalProperties;
}

export const kpTypeScriptRefactorDarkOpticalEndpoint =
  createKpTypeScriptRefactorOpticalEndpoint({
    id: "dark",
    contractId: kpTypeScriptRefactorPaintRoleContract.id,
    profileId: kpCodeSourceDomOpticalProfile.id,
    properties: projectKpCodeDomOpticalEndpoint({
      endpoint: kpCodeSourceDomOpticalProfile.endpoints.dark,
      slots: kpTypeScriptRefactorPaintRoleContract.slots,
      focusShadowAlphaProperty: "--kp-typescript-focus-shadow-alpha"
    })
  });

export const kpTypeScriptRefactorLightOpticalEndpoint =
  createKpTypeScriptRefactorOpticalEndpoint({
    id: "light",
    contractId: kpTypeScriptRefactorPaintRoleContract.id,
    profileId: kpCodeSourceDomOpticalProfile.id,
    properties: projectKpCodeDomOpticalEndpoint({
      endpoint: kpCodeSourceDomOpticalProfile.endpoints.light,
      slots: kpTypeScriptRefactorPaintRoleContract.slots,
      focusShadowAlphaProperty: "--kp-typescript-focus-shadow-alpha"
    })
  });

export const kpTypeScriptRefactorOpticalEndpoints = Object.freeze({
  dark: kpTypeScriptRefactorDarkOpticalEndpoint,
  light: kpTypeScriptRefactorLightOpticalEndpoint
});

export function resolveKpTypeScriptRefactorOpticalEndpoint(
  theme: string | null | undefined
): KpTypeScriptRefactorOpticalEndpoint {
  return theme === "light"
    ? kpTypeScriptRefactorLightOpticalEndpoint
    : kpTypeScriptRefactorDarkOpticalEndpoint;
}

export function createKpTypeScriptRefactorOpticalEndpoint(
  input: KpTypeScriptRefactorOpticalEndpoint
): KpTypeScriptRefactorOpticalEndpoint {
  if (input.profileId !== kpCodeSourceDomOpticalProfile.id) {
    throw new Error("TypeScript endpoint must use the promoted code profile.");
  }
  const expected = kpTypeScriptRefactorPaintRoleContract.slots
    .map(({ cssProperty }) => cssProperty)
    .sort();
  const actual = Object.keys(input.properties).sort();
  if (actual.length !== expected.length ||
      actual.some((property, index) => property !== expected[index])) {
    throw new Error(
      "TypeScript optical endpoint must cover every paint role exactly."
    );
  }
  for (const [property, value] of Object.entries(input.properties)) {
    if (value.trim() === "") {
      throw new Error(`TypeScript optical endpoint ${property} is empty.`);
    }
  }
  Object.freeze(input.properties);
  return Object.freeze(input);
}

export function serializeKpTypeScriptRefactorOpticalEndpoint(
  endpoint: KpTypeScriptRefactorOpticalEndpoint
): string {
  return kpTypeScriptRefactorPaintRoleContract.slots.map(({ cssProperty }) =>
    `${cssProperty}:${endpoint.properties[cssProperty]}`
  ).join(";");
}

/** Applies a resolved endpoint once; sampled frames never read computed paint. */
export function applyKpTypeScriptRefactorOpticalEndpoint(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpTypeScriptRefactorOpticalEndpoint;
}): void {
  input.root.dataset["kpTypescriptTheme"] = input.endpoint.id;
  for (const [property, value] of Object.entries(input.endpoint.properties)) {
    input.root.style.setProperty(property, value);
  }
}
