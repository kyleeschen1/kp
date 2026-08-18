/**
 * A bounded, intentional foreground crossing between two named paint tracks.
 * This lives outside the path planner so type-only renderer contracts do not
 * pull planning algorithms into their TypeScript inference closure.
 */
export interface KpEquationIntentionalForegroundOcclusion {
  readonly id: string;
  readonly role: "occluder" | "occluded";
  readonly counterpartTrackId: string;
  readonly progressWindow: {
    readonly start: number;
    readonly end: number;
  };
}
