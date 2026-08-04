export type KpEconomicsDemandShiftTheme = "light" | "dark";

export const kpEconomicsDemandShiftDefaultTheme:
  KpEconomicsDemandShiftTheme = "dark";

export const kpEconomicsDemandShiftThemeIds: Readonly<
  Record<KpEconomicsDemandShiftTheme, string>
> = {
  light: "theme.kp.lesson.economics-paper-v1",
  dark: "theme.kp.lesson.economics-midnight-v1"
};

export function readKpEconomicsDemandShiftTheme(
  search: string
): KpEconomicsDemandShiftTheme {
  const value = new URLSearchParams(search).get("theme");
  return value === "light" || value === "dark"
    ? value
    : kpEconomicsDemandShiftDefaultTheme;
}

export function writeKpEconomicsDemandShiftTheme(input: {
  readonly search: string;
  readonly theme: KpEconomicsDemandShiftTheme;
}): string {
  const parameters = new URLSearchParams(input.search);
  if (input.theme === kpEconomicsDemandShiftDefaultTheme) {
    parameters.delete("theme");
  } else {
    parameters.set("theme", input.theme);
  }
  const serialized = parameters.toString();
  return serialized === "" ? "" : `?${serialized}`;
}
