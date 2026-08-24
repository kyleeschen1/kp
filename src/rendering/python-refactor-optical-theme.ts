import { kpPythonRefactorPaintRoleContract } from
  "./python-refactor-paint-role-contract.ts";

export type KpPythonRefactorOpticalProperties = Readonly<Record<
  `--kp-python-paint-${string}`,
  string
>>;

export interface KpPythonRefactorOpticalEndpoint {
  readonly id: "dark" | "light";
  readonly contractId: "kp.python-refactor-paint-roles.v1";
  readonly properties: KpPythonRefactorOpticalProperties;
}

export const kpPythonRefactorDarkOpticalEndpoint =
  createKpPythonRefactorOpticalEndpoint({
    id: "dark",
    contractId: kpPythonRefactorPaintRoleContract.id,
    properties: {
      "--kp-python-paint-surface-panel": "#0d0e1c",
      "--kp-python-paint-surface-shadow": "0 1rem 3rem rgb(0 0 0 / 18%)",
      "--kp-python-paint-chrome-background": "transparent",
      "--kp-python-paint-chrome-foreground": "#a5adbd",
      "--kp-python-paint-foreground-primary": "#ede8d0",
      "--kp-python-paint-foreground-narration": "#e8ebf2",
      "--kp-python-paint-muted-annotation": "#a5adbd",
      "--kp-python-paint-border-frame": "rgb(224 230 244 / 14%)",
      "--kp-python-paint-border-divider": "rgb(224 230 244 / 12%)",
      "--kp-python-paint-focus-halo":
        "0 0 0.55rem rgb(207 229 255 / var(--kp-python-focus-shadow-alpha, 0))",
      "--kp-python-paint-focus-wash": "rgb(92 173 255 / 10%)",
      "--kp-python-paint-transit-halo": "0 0 0.55rem currentcolor",
      "--kp-python-paint-withdrawal-filter":
        "saturate(0.72) brightness(0.88)",
      "--kp-python-paint-selection-background": "rgb(92 173 255 / 26%)",
      "--kp-python-paint-selection-foreground": "#ede8d0",
      "--kp-python-paint-focus-ring-outline": "2px solid #82b0ec",
      "--kp-python-paint-syntax-keyword": "#9099d9",
      "--kp-python-paint-syntax-identifier": "#ede8d0",
      "--kp-python-paint-syntax-function": "#338fff",
      "--kp-python-paint-syntax-type": "#c0965b",
      "--kp-python-paint-syntax-boolean": "#319aaa",
      "--kp-python-paint-syntax-number": "#ede8d0",
      "--kp-python-paint-syntax-string": "#82b0ec",
      "--kp-python-paint-syntax-comment": "#db7b5f",
      "--kp-python-paint-syntax-operator": "#989898",
      "--kp-python-paint-syntax-punctuation": "#989898"
    }
  });

export const kpPythonRefactorLightOpticalEndpoint =
  createKpPythonRefactorOpticalEndpoint({
    id: "light",
    contractId: kpPythonRefactorPaintRoleContract.id,
    properties: {
      "--kp-python-paint-surface-panel": "#fbfaf7",
      "--kp-python-paint-surface-shadow":
        "0 1rem 3rem rgb(37 45 56 / 12%)",
      "--kp-python-paint-chrome-background": "#f1f0ec",
      "--kp-python-paint-chrome-foreground": "#555e69",
      "--kp-python-paint-foreground-primary": "#26313a",
      "--kp-python-paint-foreground-narration": "#26313a",
      "--kp-python-paint-muted-annotation": "#66717d",
      "--kp-python-paint-border-frame": "#ccd0d6",
      "--kp-python-paint-border-divider": "#d9dce1",
      "--kp-python-paint-focus-halo":
        "0 0 0.06rem rgb(0 88 156 / calc(0.12 + var(--kp-python-focus-shadow-alpha, 0)))",
      "--kp-python-paint-focus-wash": "rgb(0 95 173 / 10%)",
      "--kp-python-paint-transit-halo":
        "0 0 0.045rem rgb(0 73 132 / 55%)",
      "--kp-python-paint-withdrawal-filter":
        "grayscale(0.32) opacity(0.72)",
      "--kp-python-paint-selection-background": "rgb(0 95 173 / 22%)",
      "--kp-python-paint-selection-foreground": "#17232d",
      "--kp-python-paint-focus-ring-outline": "2px solid #006bb6",
      "--kp-python-paint-syntax-keyword": "#6554b2",
      "--kp-python-paint-syntax-identifier": "#26313a",
      "--kp-python-paint-syntax-function": "#005ea8",
      "--kp-python-paint-syntax-type": "#85540d",
      "--kp-python-paint-syntax-boolean": "#126d75",
      "--kp-python-paint-syntax-number": "#26313a",
      "--kp-python-paint-syntax-string": "#2d5f9e",
      "--kp-python-paint-syntax-comment": "#a33e2d",
      "--kp-python-paint-syntax-operator": "#5d6670",
      "--kp-python-paint-syntax-punctuation": "#5d6670"
    }
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
  const expected = kpPythonRefactorPaintRoleContract.slots
    .map(({ cssProperty }) => cssProperty)
    .sort();
  const actual = Object.keys(input.properties).sort();
  if (actual.length !== expected.length ||
      actual.some((property, index) => property !== expected[index])) {
    throw new Error("Python optical endpoint must cover every paint role exactly.");
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
