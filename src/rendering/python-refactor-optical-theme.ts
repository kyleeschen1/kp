import {
  kpCodeSourceDomOpticalProfile,
  projectKpCodeDomOpticalEndpoint
} from "./code-source-dom-optical-profile.ts";
import { kpPythonRefactorPaintRoleContract } from
  "./python-refactor-paint-role-contract.ts";

export type KpPythonRefactorOpticalProperties = Readonly<Record<
  `--kp-python-paint-${string}`,
  string
>>;

export interface KpPythonRefactorOpticalEndpoint {
  readonly id: "dark" | "light";
  readonly contractId: "kp.python-refactor-paint-roles.v1";
  readonly profileId: "kp.code-source-dom-optical-profile.v1";
  readonly properties: KpPythonRefactorOpticalProperties;
}

export const kpPythonRefactorDarkOpticalEndpoint =
  createKpPythonRefactorOpticalEndpoint({
    id: "dark",
    contractId: kpPythonRefactorPaintRoleContract.id,
    profileId: kpCodeSourceDomOpticalProfile.id,
    properties: projectKpCodeDomOpticalEndpoint({
      endpoint: kpCodeSourceDomOpticalProfile.endpoints.dark,
      slots: kpPythonRefactorPaintRoleContract.slots,
      focusShadowAlphaProperty: "--kp-python-focus-shadow-alpha"
    })
  });

export const kpPythonRefactorLightOpticalEndpoint =
  createKpPythonRefactorOpticalEndpoint({
    id: "light",
    contractId: kpPythonRefactorPaintRoleContract.id,
    profileId: kpCodeSourceDomOpticalProfile.id,
    properties: projectKpCodeDomOpticalEndpoint({
      endpoint: kpCodeSourceDomOpticalProfile.endpoints.light,
      slots: kpPythonRefactorPaintRoleContract.slots,
      focusShadowAlphaProperty: "--kp-python-focus-shadow-alpha"
    })
  });

export const kpPythonRefactorOpticalEndpoints = Object.freeze({
  dark: kpPythonRefactorDarkOpticalEndpoint,
  light: kpPythonRefactorLightOpticalEndpoint
});

export function resolveKpPythonRefactorOpticalEndpoint(
  theme: string | null | undefined
): KpPythonRefactorOpticalEndpoint {
  return theme === "light"
    ? kpPythonRefactorLightOpticalEndpoint
    : kpPythonRefactorDarkOpticalEndpoint;
}

export function createKpPythonRefactorOpticalEndpoint(
  input: KpPythonRefactorOpticalEndpoint
): KpPythonRefactorOpticalEndpoint {
  if (input.profileId !== kpCodeSourceDomOpticalProfile.id) {
    throw new Error("Python endpoint must use the promoted code profile.");
  }
  const expected = kpPythonRefactorPaintRoleContract.slots
    .map(({ cssProperty }) => cssProperty)
    .sort();
  const actual = Object.keys(input.properties).sort();
  if (actual.length !== expected.length ||
      actual.some((property, index) => property !== expected[index])) {
    throw new Error(
      "Python optical endpoint must cover every paint role exactly."
    );
  }
  for (const [property, value] of Object.entries(input.properties)) {
    if (value.trim() === "") {
      throw new Error(`Python optical endpoint ${property} is empty.`);
    }
  }
  Object.freeze(input.properties);
  return Object.freeze(input);
}

export function serializeKpPythonRefactorOpticalEndpoint(
  endpoint: KpPythonRefactorOpticalEndpoint
): string {
  return kpPythonRefactorPaintRoleContract.slots.map(({ cssProperty }) =>
    `${cssProperty}:${endpoint.properties[cssProperty]}`
  ).join(";");
}

/** Applies a resolved endpoint once; sampled frames never read computed paint. */
export function applyKpPythonRefactorOpticalEndpoint(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpPythonRefactorOpticalEndpoint;
}): void {
  input.root.dataset["kpPythonTheme"] = input.endpoint.id;
  for (const [property, value] of Object.entries(input.endpoint.properties)) {
    input.root.style.setProperty(property, value);
  }
}
