import {
  tokenizeLatex,
  type LatexCommandToken,
  type LatexToken
} from "./latex-tokenizer.ts";

export type ParsedLatexExpression =
  | ParsedLatexBinaryExpression
  | ParsedLatexCallExpression
  | ParsedLatexIdentifierExpression
  | ParsedLatexNumberExpression
  | ParsedLatexUnaryExpression;

export interface ParsedLatexBinaryExpression {
  kind: "binary";
  operator: "+" | "-" | "*" | "/" | "^";
  left: ParsedLatexExpression;
  right: ParsedLatexExpression;
}

export type ParsedLatexCallExpression =
  | ParsedLatexNamedCallExpression
  | ParsedLatexExplicitBaseLogExpression;

export interface ParsedLatexNamedCallExpression {
  kind: "call";
  name: "cos" | "ln" | "sin" | "sqrt";
  argument: ParsedLatexExpression;
}

export interface ParsedLatexExplicitBaseLogExpression {
  kind: "call";
  name: "log";
  base: ParsedLatexIdentifierExpression | ParsedLatexNumberExpression;
  argument: ParsedLatexExpression;
}

export interface ParsedLatexIdentifierExpression {
  kind: "identifier";
  name: string;
}

export interface ParsedLatexNumberExpression {
  kind: "number";
  value: number;
}

export interface ParsedLatexUnaryExpression {
  kind: "unary";
  operator: "-";
  value: ParsedLatexExpression;
}

export type LatexExpressionSelectorKind =
  | "binary"
  | "call"
  | "identifier"
  | "number"
  | "operator"
  | "unary";

export interface LatexExpressionSelectorPath {
  readonly path: string;
  readonly kind: LatexExpressionSelectorKind;
  readonly label: string;
}

export class LatexParseError extends Error {
  readonly offset: number;
  readonly expected: string;

  constructor(message: string, offset: number, expected: string) {
    super(message);
    this.name = "LatexParseError";
    this.offset = offset;
    this.expected = expected;
  }
}

export function parseLatexExpression(input: string): ParsedLatexExpression {
  const parser = new LatexParser(tokenizeLatex(input));
  const expression = parser.parseExpression();

  parser.expectEnd();

  return expression;
}

/** An explicit scalar environment licenses juxtaposition, not a global change
 * to identifier or function semantics. All grouping/precedence still belongs
 * to the same parser, and inserted tokens retain original source offsets. */
export function parseLatexScalarExpression(input: string, symbols: readonly string[]): ParsedLatexExpression {
  if (input.length > 512 || symbols.length > 12 || new Set(symbols).size !== symbols.length ||
      symbols.some(symbol => !/^[A-Za-z]$/.test(symbol)))
    throw new LatexParseError("Use bounded notation and unique single-letter scalar declarations.", 0, "scalar declarations");
  const expanded: LatexToken[] = [];
  for (const token of tokenizeLatex(input)) {
    if (token.kind === "identifier") {
      if (["sin", "cos", "tan", "log", "ln", "sqrt", "exp"].includes(token.value))
        throw new LatexParseError("Ambiguous function-like spelling; write explicit scalar products or use a function frontend.", token.offset, "unambiguous scalar notation");
      [...token.value].forEach((symbol, index) => {
        if (!symbols.includes(symbol)) throw new LatexParseError(`Undeclared scalar ${symbol}.`, token.offset + index, "declared scalar");
        expanded.push({ kind: "identifier", value: symbol, offset: token.offset + index });
      });
    } else {
      if (token.kind === "command" || token.kind === "subscript" || token.kind === "equals" ||
          (token.kind === "operator" && token.value !== "+" && token.value !== "*"))
        throw new LatexParseError("Unsupported scalar sum/product notation.", token.offset, "scalar sum or product");
      expanded.push(token);
    }
  }
  const tokens: LatexToken[] = [];
  for (const token of expanded) {
    const previous = tokens.at(-1);
    const endsAtom = previous && ["identifier", "number", "rightParen", "rightBrace"].includes(previous.kind);
    const startsAtom = ["identifier", "number", "leftParen", "leftBrace"].includes(token.kind);
    if (endsAtom && startsAtom) {
      // A closed group makes the boundary explicit: (x+y)2 is an ordered
      // product, unlike ambiguous x2 or two separately written numbers.
      if (token.kind === "number" && previous.kind !== "rightParen" && previous.kind !== "rightBrace")
        throw new LatexParseError("Use explicit multiplication before a numeric factor.", token.offset, "unambiguous scalar notation");
      tokens.push({ kind: "operator", value: "*", offset: token.offset });
    }
    tokens.push(token);
  }
  const parser = new LatexParser(tokens);
  const expression = parser.parseExpression();
  parser.expectEnd();
  return expression;
}

export function collectLatexExpressionSelectorPaths(
  input: string,
  rootPath = "expression"
): readonly LatexExpressionSelectorPath[] {
  const paths: LatexExpressionSelectorPath[] = [];

  collectExpressionSelectorPaths(parseLatexExpression(input), rootPath, paths);

  return paths;
}

class LatexParser {
  private offset = 0;
  private readonly tokens: readonly LatexToken[];

  constructor(tokens: readonly LatexToken[]) {
    this.tokens = tokens;
  }

  parseExpression(minimumPrecedence = 0): ParsedLatexExpression {
    let left = this.parseUnaryExpression();

    while (true) {
      const token = this.peek();

      if (token.kind !== "operator" || !isBinaryOperator(token.value)) {
        break;
      }

      const precedence = binaryPrecedence(token.value);

      if (precedence < minimumPrecedence) {
        break;
      }

      this.advance();

      const right = this.parseExpression(
        token.value === "^" ? precedence : precedence + 1
      );
      left = {
        kind: "binary",
        operator: token.value,
        left,
        right
      };
    }

    return left;
  }

  expectEnd(): void {
    const token = this.peek();

    if (token.kind !== "end") {
      throw new LatexParseError(
        `Expected end of expression.`,
        token.offset,
        "end"
      );
    }
  }

  private parseUnaryExpression(): ParsedLatexExpression {
    const token = this.peek();

    if (token.kind === "operator" && token.value === "-") {
      this.advance();

      return {
        kind: "unary",
        operator: "-",
        value: this.parseUnaryExpression()
      };
    }

    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): ParsedLatexExpression {
    const token = this.peek();

    switch (token.kind) {
      case "number":
        this.advance();
        return {
          kind: "number",
          value: Number(token.value)
        };
      case "identifier":
        this.advance();
        if (token.value === "log" && this.peek().kind === "subscript") {
          return this.parseExplicitBaseLogExpression();
        }
        return {
          kind: "identifier",
          name: token.value
        };
      case "leftBrace":
        return this.parseDelimitedExpression("leftBrace", "rightBrace");
      case "leftParen":
        return this.parseDelimitedExpression("leftParen", "rightParen");
      case "command":
        return this.parseCommandExpression(token);
      case "end":
      case "equals":
      case "operator":
      case "rightBrace":
      case "rightParen":
      case "subscript":
        throw new LatexParseError(
          "Expected expression.",
          token.offset,
          "expression"
        );
    }
  }

  private parseCommandExpression(
    token: LatexCommandToken
  ): ParsedLatexExpression {
    this.advance();

    if (token.value === "frac") {
      return {
        kind: "binary",
        operator: "/",
        left: this.parseRequiredBracedExpression(),
        right: this.parseRequiredBracedExpression()
      };
    }

    if (token.value === "log") {
      if (this.peek().kind !== "subscript") {
        throw new LatexParseError(
          "Expected an explicit base for \\log.",
          this.peek().offset,
          "explicit logarithm base"
        );
      }
      return this.parseExplicitBaseLogExpression();
    }

    if (
      token.value === "sin" ||
      token.value === "cos" ||
      token.value === "ln" ||
      token.value === "sqrt"
    ) {
      return {
        kind: "call",
        name: token.value,
        argument: this.parseCommandArgument(token.value)
      };
    }

    throw new LatexParseError(
      `Unsupported LaTeX command \\${token.value}.`,
      token.offset,
      "supported command"
    );
  }

  private parseCommandArgument(commandName: string): ParsedLatexExpression {
    const token = this.peek();

    if (token.kind === "leftBrace") {
      return this.parseDelimitedExpression("leftBrace", "rightBrace");
    }

    if (token.kind === "leftParen") {
      return this.parseDelimitedExpression("leftParen", "rightParen");
    }

    if (
      token.kind === "end" ||
      token.kind === "equals" ||
      token.kind === "operator" ||
      token.kind === "rightBrace" ||
      token.kind === "rightParen" ||
      token.kind === "subscript"
    ) {
      throw new LatexParseError(
        `Expected argument for \\${commandName}.`,
        token.offset,
        "argument"
      );
    }

    return this.parseUnaryExpression();
  }

  private parseExplicitBaseLogExpression(): ParsedLatexExplicitBaseLogExpression {
    const subscript = this.peek();
    if (subscript.kind !== "subscript") {
      throw new LatexParseError(
        "Expected an explicit logarithm base.",
        subscript.offset,
        "_"
      );
    }
    this.advance();
    return {
      kind: "call",
      name: "log",
      base: this.parseExplicitLogBase(),
      argument: this.parseCommandArgument("log")
    };
  }

  private parseExplicitLogBase():
  ParsedLatexExplicitBaseLogExpression["base"] {
    const token = this.peek();
    if (token.kind !== "leftBrace") return this.parseExplicitLogBaseAtom();
    this.advance();
    const base = this.parseExplicitLogBaseAtom();
    const close = this.peek();
    if (close.kind !== "rightBrace") {
      throw new LatexParseError(
        "Expected } after the explicit logarithm base.",
        close.offset,
        "}"
      );
    }
    this.advance();
    return base;
  }

  private parseExplicitLogBaseAtom():
  ParsedLatexExplicitBaseLogExpression["base"] {
    const token = this.peek();
    if (token.kind === "identifier") {
      this.advance();
      return { kind: "identifier", name: token.value };
    }
    if (token.kind === "number") {
      this.advance();
      return { kind: "number", value: Number(token.value) };
    }
    throw new LatexParseError(
      "Expected one symbolic or numeric logarithm base.",
      token.offset,
      "symbolic or numeric logarithm base"
    );
  }

  private parseRequiredBracedExpression(): ParsedLatexExpression {
    const openToken = this.peek();

    if (openToken.kind !== "leftBrace") {
      throw new LatexParseError(
        "Expected braced expression.",
        openToken.offset,
        "{"
      );
    }

    return this.parseDelimitedExpression("leftBrace", "rightBrace");
  }

  private parseDelimitedExpression(
    openKind: "leftBrace" | "leftParen",
    closeKind: "rightBrace" | "rightParen"
  ): ParsedLatexExpression {
    const openToken = this.peek();

    if (openToken.kind !== openKind) {
      throw new LatexParseError(
        `Expected ${openKind === "leftBrace" ? "{" : "("}.`,
        openToken.offset,
        openKind === "leftBrace" ? "{" : "("
      );
    }

    this.advance();

    if (this.peek().kind === closeKind || this.peek().kind === "end") {
      throw new LatexParseError(
        "Expected expression.",
        openToken.offset,
        "expression"
      );
    }

    const expression = this.parseExpression();
    const closeToken = this.peek();

    if (closeToken.kind !== closeKind) {
      throw new LatexParseError(
        `Expected ${closeKind === "rightBrace" ? "}" : ")"}.`,
        closeToken.offset,
        closeKind === "rightBrace" ? "}" : ")"
      );
    }

    this.advance();

    return expression;
  }

  private peek(): LatexToken {
    const token = this.tokens[this.offset];

    if (token === undefined) {
      throw new LatexParseError("Expected token.", 0, "token");
    }

    return token;
  }

  private advance(): void {
    this.offset += 1;
  }
}

function binaryPrecedence(operator: ParsedLatexBinaryExpression["operator"]): number {
  switch (operator) {
    case "+":
    case "-":
      return 1;
    case "*":
    case "/":
      return 2;
    case "^":
      return 4;
  }
}

function isBinaryOperator(
  operator: string
): operator is ParsedLatexBinaryExpression["operator"] {
  return (
    operator === "+" ||
    operator === "-" ||
    operator === "*" ||
    operator === "/" ||
    operator === "^"
  );
}

function collectExpressionSelectorPaths(
  expression: ParsedLatexExpression,
  path: string,
  paths: LatexExpressionSelectorPath[]
): void {
  switch (expression.kind) {
    case "binary":
      paths.push({ path, kind: "binary", label: expression.operator });
      collectExpressionSelectorPaths(expression.left, `${path}.left`, paths);
      paths.push({
        path: `${path}.operator`,
        kind: "operator",
        label: expression.operator
      });
      collectExpressionSelectorPaths(expression.right, `${path}.right`, paths);
      return;
    case "call":
      paths.push({ path, kind: "call", label: expression.name });
      if (expression.name === "log") {
        collectExpressionSelectorPaths(
          expression.base,
          `${path}.base`,
          paths
        );
      }
      collectExpressionSelectorPaths(
        expression.argument,
        `${path}.argument`,
        paths
      );
      return;
    case "identifier":
      paths.push({ path, kind: "identifier", label: expression.name });
      return;
    case "number":
      paths.push({ path, kind: "number", label: String(expression.value) });
      return;
    case "unary":
      paths.push({ path, kind: "unary", label: expression.operator });
      paths.push({
        path: `${path}.operator`,
        kind: "operator",
        label: expression.operator
      });
      collectExpressionSelectorPaths(expression.value, `${path}.value`, paths);
      return;
  }
}
