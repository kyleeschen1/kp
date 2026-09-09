export type LatexToken =
  | LatexCommandToken
  | LatexEndToken
  | LatexIdentifierToken
  | LatexNumberToken
  | LatexOperatorToken
  | LatexPunctuationToken;

export interface LatexCommandToken {
  kind: "command";
  value: string;
  offset: number;
}

export interface LatexEndToken {
  kind: "end";
  value: "";
  offset: number;
}

export interface LatexIdentifierToken {
  kind: "identifier";
  value: string;
  offset: number;
}

export interface LatexNumberToken {
  kind: "number";
  value: string;
  offset: number;
}

export interface LatexOperatorToken {
  kind: "operator";
  value: "+" | "-" | "*" | "/" | "^";
  offset: number;
}

export interface LatexPunctuationToken {
  kind:
    | "equals"
    | "leftBrace"
    | "leftParen"
    | "rightBrace"
    | "rightParen"
    | "subscript";
  value: "=" | "{" | "(" | "}" | ")" | "_";
  offset: number;
}

export function tokenizeLatex(input: string): readonly LatexToken[] {
  const tokens: LatexToken[] = [];
  let offset = 0;

  while (offset < input.length) {
    const character = input[offset];

    if (character === undefined) {
      break;
    }

    if (/\s/.test(character)) {
      offset += 1;
      continue;
    }

    if (isIdentifierStart(character)) {
      const token = readWhile(input, offset, isIdentifierPart);
      tokens.push({
        kind: "identifier",
        value: token.value,
        offset
      });
      offset = token.nextOffset;
      continue;
    }

    if (isDigit(character) || character === ".") {
      const token = readNumber(input, offset);
      tokens.push({
        kind: "number",
        value: token.value,
        offset
      });
      offset = token.nextOffset;
      continue;
    }

    if (character === "\\") {
      const command = readCommand(input, offset);
      // Explicit scalar multiplication is notation, not a function call. Keep
      // the authored offset so diagnostics still point into original LaTeX.
      tokens.push(command.value === "cdot" ? {
        kind: "operator", value: "*", offset
      } : {
        kind: "command",
        value: command.value,
        offset
      });
      offset = command.nextOffset;
      continue;
    }

    if (isOperator(character)) {
      tokens.push({
        kind: "operator",
        value: character,
        offset
      });
      offset += 1;
      continue;
    }

    if (character === "=") {
      tokens.push({ kind: "equals", value: character, offset });
      offset += 1;
      continue;
    }

    if (character === "_") {
      tokens.push({ kind: "subscript", value: character, offset });
      offset += 1;
      continue;
    }

    if (character === "{") {
      tokens.push({ kind: "leftBrace", value: character, offset });
      offset += 1;
      continue;
    }

    if (character === "}") {
      tokens.push({ kind: "rightBrace", value: character, offset });
      offset += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({ kind: "leftParen", value: character, offset });
      offset += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({ kind: "rightParen", value: character, offset });
      offset += 1;
      continue;
    }

    throw new Error(`Unexpected character "${character}" at offset ${offset}.`);
  }

  tokens.push({ kind: "end", value: "", offset: input.length });

  return tokens;
}

function readNumber(
  input: string,
  offset: number
): { value: string; nextOffset: number } {
  let nextOffset = offset;
  let hasDecimalPoint = false;

  while (nextOffset < input.length) {
    const character = input[nextOffset];

    if (character === ".") {
      if (hasDecimalPoint) {
        break;
      }

      hasDecimalPoint = true;
      nextOffset += 1;
      continue;
    }

    if (character === undefined || !isDigit(character)) {
      break;
    }

    nextOffset += 1;
  }

  const value = input.slice(offset, nextOffset);

  if (value === ".") {
    throw new Error(`Unexpected character "." at offset ${offset}.`);
  }

  return { value, nextOffset };
}

function readCommand(
  input: string,
  offset: number
): { value: string; nextOffset: number } {
  const commandOffset = offset + 1;
  const token = readWhile(input, commandOffset, isIdentifierPart);

  if (token.value.length === 0) {
    throw new Error(`Expected LaTeX command name at offset ${offset}.`);
  }

  return token;
}

function readWhile(
  input: string,
  offset: number,
  predicate: (character: string) => boolean
): { value: string; nextOffset: number } {
  let nextOffset = offset;

  while (nextOffset < input.length) {
    const character = input[nextOffset];

    if (character === undefined || !predicate(character)) {
      break;
    }

    nextOffset += 1;
  }

  return {
    value: input.slice(offset, nextOffset),
    nextOffset
  };
}

function isIdentifierStart(character: string): boolean {
  return /[A-Za-z]/.test(character);
}

function isIdentifierPart(character: string): boolean {
  return /[A-Za-z]/.test(character);
}

function isDigit(character: string): boolean {
  return /\d/.test(character);
}

function isOperator(
  character: string
): character is LatexOperatorToken["value"] {
  return (
    character === "+" ||
    character === "-" ||
    character === "*" ||
    character === "/" ||
    character === "^"
  );
}
