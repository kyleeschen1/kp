// These are requested author tasks, not a list of certified operations. Cases
// without a trusted binding deliberately measure the unbound frontend boundary.
export const roundTripUnboundChains = [
  ["algebra-distribute", "algebra", "2(x+3)", "2x+6", "distribution"],
  ["algebra-factor", "algebra", "x^2+2x", "x(x+2)", "factoring"],
  ["fraction-add", "algebra", "\\frac{1}{2}+\\frac{1}{3}", "\\frac{5}{6}", "common denominator"],
  ["cancel-restriction", "algebra", "\\frac{x^2}{x}", "x", "x is nonzero"],
  ["trig-identity", "trigonometry", "\\sin^2(x)+\\cos^2(x)", "1", "Pythagorean identity"],
  ["trig-solve", "trigonometry", "\\sin(x)=0", "x=n\\pi", "n is an integer"],
  ["derivative-power", "calculus-ab", "\\frac{d}{dx}x^3", "3x^2", "power rule"],
  ["derivative-chain", "calculus-ab", "\\frac{d}{dx}\\sin(x^2)", "2x\\cos(x^2)", "chain rule"],
  ["integral-power", "calculus-ab", "\\int x^2\\,dx", "\\frac{x^3}{3}+C", "constant of integration"],
  ["limit-sinc", "calculus-ab", "\\lim_{x\\to0}\\frac{\\sin(x)}{x}", "1", "radian measure"],
  ["integration-parts", "calculus-bc", "\\int x e^x\\,dx", "xe^x-e^x+C", "integration by parts"],
  ["geometric-series", "calculus-bc", "\\sum_{n=0}^{\\infty}x^n", "\\frac{1}{1-x}", "absolute value of x below one"],
  ["matrix-product", "linear-algebra", "\\begin{pmatrix}1&2\\end{pmatrix}\\begin{pmatrix}3\\\\4\\end{pmatrix}", "11", "shape-compatible dot product"],
  ["gradient", "multivariable", "\\nabla(x^2+y^2)", "(2x,2y)", "Cartesian coordinates"],
  ["bayes", "probability", "P(A\\mid B)", "\\frac{P(B\\mid A)P(A)}{P(B)}", "P(B) is positive"],
  ["expectation-linear", "probability", "E[X+Y]", "E[X]+E[Y]", "finite expectations; independence unnecessary"],
  ["standardization", "statistics", "Z", "\\frac{X-\\mu}{\\sigma}", "sigma is positive; normality is not implied"]
] as const;
