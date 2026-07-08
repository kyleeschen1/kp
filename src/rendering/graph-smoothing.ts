export interface SmoothPoint2D {
  readonly x: number;
  readonly y: number;
}

export interface SmoothPathMoveCommand {
  readonly kind: "move";
  readonly point: SmoothPoint2D;
}

export interface SmoothPathCubicCommand {
  readonly kind: "cubic";
  readonly control1: SmoothPoint2D;
  readonly control2: SmoothPoint2D;
  readonly point: SmoothPoint2D;
}

export type SmoothPathCommand =
  | SmoothPathMoveCommand
  | SmoothPathCubicCommand;

export function catmullRomToBezierPathCommands(
  points: readonly SmoothPoint2D[],
  tension = 1
): readonly SmoothPathCommand[] {
  const firstPoint = points[0];

  if (firstPoint === undefined) {
    return [];
  }

  const commands: SmoothPathCommand[] = [
    {
      kind: "move",
      point: firstPoint
    }
  ];
  const controlScale = tension / 6;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    if (
      p0 === undefined ||
      p1 === undefined ||
      p2 === undefined ||
      p3 === undefined
    ) {
      continue;
    }

    commands.push({
      kind: "cubic",
      control1: {
        x: p1.x + (p2.x - p0.x) * controlScale,
        y: p1.y + (p2.y - p0.y) * controlScale
      },
      control2: {
        x: p2.x - (p3.x - p1.x) * controlScale,
        y: p2.y - (p3.y - p1.y) * controlScale
      },
      point: p2
    });
  }

  return commands;
}
