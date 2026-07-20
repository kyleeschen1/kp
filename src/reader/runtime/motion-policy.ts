export type KpReaderMotionPreference =
  | "system"
  | "reduced"
  | "full"
  | "static";

export type KpReaderResolvedMotionMode = "full" | "essential" | "static";

export interface KpReaderMotionPolicy {
  readonly preference: KpReaderMotionPreference;
  readonly resolvedMode: KpReaderResolvedMotionMode;
  readonly systemReducedMotion: boolean;
  readonly sampling: "continuous" | "checkpoint";
  readonly causalMotion: "full" | "essential" | "none";
  readonly decorativeMotion: "full" | "none";
}

export function resolveKpReaderMotionPolicy(input: {
  readonly preference?: KpReaderMotionPreference | undefined;
  readonly systemReducedMotion: boolean;
}): KpReaderMotionPolicy {
  const preference = input.preference ?? "system";
  const resolvedMode: KpReaderResolvedMotionMode = preference === "static"
    ? "static"
    : preference === "reduced" ||
        (preference === "system" && input.systemReducedMotion)
      ? "essential"
      : "full";
  return {
    preference,
    resolvedMode,
    systemReducedMotion: input.systemReducedMotion,
    sampling: resolvedMode === "static" ? "checkpoint" : "continuous",
    causalMotion: resolvedMode === "static" ? "none" : resolvedMode,
    decorativeMotion: resolvedMode === "full" ? "full" : "none"
  };
}

export function parseKpReaderMotionPreference(
  value: string | null | undefined
): KpReaderMotionPreference | undefined {
  switch (value) {
    case "system":
    case "reduced":
    case "full":
    case "static":
      return value;
    case null:
    case undefined:
    case "":
      return undefined;
    default:
      throw new Error(`Unknown reader motion preference ${value}.`);
  }
}
