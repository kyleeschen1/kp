import type { KpVisualThemeId } from "./semantic-visual-theme.ts";

export const kpPaletteIdentityFamilies = Object.freeze([
  "cyan", "blue", "violet", "rose", "amber", "green"
] as const);

export const kpPaletteSalienceBands = Object.freeze([
  "focus", "normal", "context", "dim", "ghost"
] as const);

export type KpPaletteIdentityFamily = typeof kpPaletteIdentityFamilies[number];
export type KpPaletteSalienceBand = typeof kpPaletteSalienceBands[number];

export interface KpVisualPaletteSources {
  readonly theme: KpVisualThemeId;
  readonly neutral: {
    readonly page: string;
    readonly surface: string;
    readonly surfaceRaised: string;
    readonly inkStrong: string;
    readonly ink: string;
    readonly inkSecondary: string;
    readonly inkContext: string;
    readonly inkDim: string;
    readonly inkGhost: string;
    readonly lineStrong: string;
    readonly line: string;
    readonly lineSubtle: string;
  };
  readonly identities: Readonly<Record<
    KpPaletteIdentityFamily,
    Readonly<Record<KpPaletteSalienceBand, string>>
  >>;
}

const darkIdentities = {
  cyan: band("#07d0d8", "#42a3a8", "#477f82", "#4c6a6b", "#344040"),
  blue: band("#7cbdff", "#6796c7", "#5e7e9f", "#546577", "#37404c"),
  violet: band("#bda7ff", "#9687c4", "#7d739d", "#646076", "#3d3c44"),
  rose: band("#f990c4", "#bc7b9a", "#987087", "#735b66", "#45383f"),
  amber: band("#fb9d59", "#bd835b", "#98705a", "#735e50", "#443b36"),
  green: band("#7acf7e", "#6fa170", "#637f64", "#576957", "#374238")
};

const lightIdentities = {
  cyan: band("#086f74", "#306b70", "#557477", "#7c9292", "#b4c1bd"),
  blue: band("#256ea8", "#4f7398", "#68788a", "#8a96a2", "#bdc3c8"),
  violet: band("#6653b6", "#736a9d", "#7e788d", "#9c98a5", "#c4c1c8"),
  rose: band("#a83770", "#9a5e79", "#856b76", "#a68f98", "#c9bec2"),
  amber: band("#9a541f", "#916748", "#826f60", "#a39285", "#c9c0b8"),
  green: band("#337c3a", "#5c7b5e", "#667869", "#89988a", "#bdc5bc")
};

export const kpVisualPaletteSources = Object.freeze({
  dark: palette({
    theme: "dark",
    neutral: {
      page: "#0d0e1c",
      surface: "#15172a",
      surfaceRaised: "#20233a",
      inkStrong: "#f4f4f8",
      ink: "#d6d7df",
      inkSecondary: "#a6a9b7",
      inkContext: "#7d8193",
      inkDim: "#5a5e70",
      inkGhost: "#393d50",
      lineStrong: "#696e83",
      line: "#42465b",
      lineSubtle: "#292d42"
    },
    identities: darkIdentities
  }),
  light: palette({
    theme: "light",
    neutral: {
      page: "#f4f1e9",
      surface: "#fffdf8",
      surfaceRaised: "#eceef5",
      inkStrong: "#151622",
      ink: "#292b3a",
      inkSecondary: "#4f5364",
      inkContext: "#707586",
      inkDim: "#9599a7",
      inkGhost: "#b9bdc8",
      lineStrong: "#74798a",
      line: "#aeb2bf",
      lineSubtle: "#d7dae3"
    },
    identities: lightIdentities
  })
});

function band(
  focus: string,
  normal: string,
  context: string,
  dim: string,
  ghost: string
): Readonly<Record<KpPaletteSalienceBand, string>> {
  return Object.freeze({ focus, normal, context, dim, ghost });
}

function palette(input: KpVisualPaletteSources): KpVisualPaletteSources {
  for (const family of kpPaletteIdentityFamilies) {
    const colors = input.identities[family];
    if (colors === undefined ||
        kpPaletteSalienceBands.some((state) => colors[state] === undefined)) {
      throw new Error(`Palette ${input.theme} is missing ${family}.`);
    }
  }
  Object.freeze(input.neutral);
  Object.freeze(input.identities);
  return Object.freeze(input);
}
