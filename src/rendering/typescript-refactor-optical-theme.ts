import { kpTypeScriptRefactorPaintRoleContract } from
  "./typescript-refactor-paint-role-contract.ts";

export type KpTypeScriptRefactorOpticalProperties = Readonly<Record<
  `--kp-typescript-paint-${string}`,
  string
>>;

export interface KpTypeScriptRefactorOpticalEndpoint {
  readonly id: "dark" | "light";
  readonly contractId: "kp.typescript-refactor-paint-roles.v1";
  readonly properties: KpTypeScriptRefactorOpticalProperties;
}

export const kpTypeScriptRefactorDarkOpticalEndpoint =
  createKpTypeScriptRefactorOpticalEndpoint({
    id: "dark",
    contractId: kpTypeScriptRefactorPaintRoleContract.id,
    properties: {
      "--kp-typescript-paint-surface-panel": "#0d0e1c",
      "--kp-typescript-paint-surface-shadow":
        "0 1rem 3rem rgb(0 0 0 / 18%)",
      "--kp-typescript-paint-chrome-background": "transparent",
      "--kp-typescript-paint-chrome-foreground": "#a5adbd",
      "--kp-typescript-paint-foreground-primary": "#ede8d0",
      "--kp-typescript-paint-foreground-narration": "#e8ebf2",
      "--kp-typescript-paint-muted-annotation": "#a5adbd",
      "--kp-typescript-paint-border-frame": "rgb(224 230 244 / 14%)",
      "--kp-typescript-paint-border-divider": "rgb(224 230 244 / 12%)",
      "--kp-typescript-paint-focus-halo":
        "0 0 0.55rem rgb(207 229 255 / var(--kp-typescript-focus-shadow-alpha, 0))",
      "--kp-typescript-paint-focus-wash": "rgb(92 173 255 / 10%)",
      "--kp-typescript-paint-transit-halo": "0 0 0.55rem currentcolor",
      "--kp-typescript-paint-withdrawal-filter":
        "saturate(0.72) brightness(0.88)",
      "--kp-typescript-paint-selection-background": "rgb(92 173 255 / 26%)",
      "--kp-typescript-paint-selection-foreground": "#ede8d0",
      "--kp-typescript-paint-focus-ring-outline": "2px solid #82b0ec",
      "--kp-typescript-paint-syntax-keyword": "#9099d9",
      "--kp-typescript-paint-syntax-identifier": "#ede8d0",
      "--kp-typescript-paint-syntax-function": "#338fff",
      "--kp-typescript-paint-syntax-property": "#76afbf",
      "--kp-typescript-paint-syntax-type": "#c0965b",
      "--kp-typescript-paint-syntax-boolean": "#319aaa",
      "--kp-typescript-paint-syntax-number": "#ede8d0",
      "--kp-typescript-paint-syntax-string": "#82b0ec",
      "--kp-typescript-paint-syntax-comment": "#db7b5f",
      "--kp-typescript-paint-syntax-operator": "#989898",
      "--kp-typescript-paint-syntax-punctuation": "#989898"
    }
  });

export const kpTypeScriptRefactorLightOpticalEndpoint =
  createKpTypeScriptRefactorOpticalEndpoint({
    id: "light",
    contractId: kpTypeScriptRefactorPaintRoleContract.id,
    properties: {
      "--kp-typescript-paint-surface-panel": "#fbfaf7",
      "--kp-typescript-paint-surface-shadow":
        "0 1rem 3rem rgb(37 45 56 / 12%)",
      "--kp-typescript-paint-chrome-background": "#f1f0ec",
      "--kp-typescript-paint-chrome-foreground": "#555e69",
      "--kp-typescript-paint-foreground-primary": "#26313a",
      "--kp-typescript-paint-foreground-narration": "#26313a",
      "--kp-typescript-paint-muted-annotation": "#66717d",
      "--kp-typescript-paint-border-frame": "#ccd0d6",
      "--kp-typescript-paint-border-divider": "#d9dce1",
      "--kp-typescript-paint-focus-halo":
        "0 0 0.06rem rgb(0 88 156 / calc(0.12 + var(--kp-typescript-focus-shadow-alpha, 0)))",
      "--kp-typescript-paint-focus-wash": "rgb(0 95 173 / 10%)",
      "--kp-typescript-paint-transit-halo":
        "0 0 0.045rem rgb(0 73 132 / 55%)",
      "--kp-typescript-paint-withdrawal-filter":
        "grayscale(0.32) opacity(0.72)",
      "--kp-typescript-paint-selection-background": "rgb(0 95 173 / 22%)",
      "--kp-typescript-paint-selection-foreground": "#17232d",
      "--kp-typescript-paint-focus-ring-outline": "2px solid #006bb6",
      "--kp-typescript-paint-syntax-keyword": "#6554b2",
      "--kp-typescript-paint-syntax-identifier": "#26313a",
      "--kp-typescript-paint-syntax-function": "#005ea8",
      "--kp-typescript-paint-syntax-property": "#146b78",
      "--kp-typescript-paint-syntax-type": "#85540d",
      "--kp-typescript-paint-syntax-boolean": "#126d75",
      "--kp-typescript-paint-syntax-number": "#26313a",
      "--kp-typescript-paint-syntax-string": "#2d5f9e",
      "--kp-typescript-paint-syntax-comment": "#a33e2d",
      "--kp-typescript-paint-syntax-operator": "#5d6670",
      "--kp-typescript-paint-syntax-punctuation": "#5d6670"
    }
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
  const expected = kpTypeScriptRefactorPaintRoleContract.slots
    .map(({ cssProperty }) => cssProperty)
    .sort();
  const actual = Object.keys(input.properties).sort();
  if (actual.length !== expected.length ||
      actual.some((property, index) => property !== expected[index])) {
    throw new Error("TypeScript optical endpoint must cover every paint role exactly.");
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
