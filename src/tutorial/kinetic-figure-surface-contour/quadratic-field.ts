import { add, constant, multiply, power, variable, compileExpression, expressionToLatex } from "../../math/expression.ts";

const fieldBrand = Symbol("positive-quadratic-field");
/** One bounded field authority supplies native surface paint, sampled contours,
 * fit geometry and notation. Callers cannot independently substitute answers. */
export interface PositiveQuadraticField {
  readonly [fieldBrand]: true;
  readonly a: number;
  readonly b: number;
  readonly expression: ReturnType<typeof add>;
  readonly latex: string;
  readonly height: (x: number, y: number) => number;
  readonly contour: (level: number, sampleCount?: number) => readonly { readonly x: number; readonly y: number; readonly z: number }[];
}

export function createPositiveQuadraticField(a = 1, b = 2): PositiveQuadraticField {
  if (![a, b].every(value => Number.isFinite(value) && value >= .25 && value <= 4))
    throw new RangeError("Quadratic coefficients must be finite and between 0.25 and 4.");
  const term = (coefficient: number, name: string) => coefficient === 1
    ? power(variable(name), 2) : multiply(constant(coefficient), power(variable(name), 2));
  const expression = add(term(a, "x"), term(b, "y"));
  const evaluate = compileExpression(expression);
  return Object.freeze({ [fieldBrand]: true as const, a, b, expression, latex: expressionToLatex(expression),
    height(x: number, y: number) {
      const value = evaluate({ x, y });
      if (![x, y, value].every(Number.isFinite)) throw new RangeError("Field samples must be finite.");
      return value;
    },
    contour(level: number, sampleCount = 97) {
      if (!Number.isFinite(level) || level <= 0) throw new RangeError("A regular ellipse needs positive finite height.");
      if (!Number.isInteger(sampleCount) || sampleCount < 3) throw new RangeError("A contour needs at least three samples.");
      return Object.freeze(Array.from({ length: sampleCount }, (_, i) => {
        const angle = i / (sampleCount - 1) * Math.PI * 2;
        return Object.freeze({ x: Math.sqrt(level / a) * Math.cos(angle), y: Math.sqrt(level / b) * Math.sin(angle), z: level });
      }));
    }
  });
}
