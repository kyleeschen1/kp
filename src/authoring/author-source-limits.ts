export const authorSourceByteLimit = 100_000;
export const authorSourceNestingLimit = 64;

/** Transport guard only: domain owners still parse and validate their schemas.
 * Scan before recursive owner traversal, including for direct dispatch callers.
 * Brackets inside escaped JSON strings are content, not structural depth. */
export function inspectAuthorSourceLimits(json: string) {
  const repair = (code: string, expected: string) => ({ status: "repair-gap" as const,
    diagnostic: { code, path: "$", expected } });
  if (typeof json !== "string") return repair("author.source-type", "Provide source text, not a serialized check or runtime object.");
  if (json.length > authorSourceByteLimit || new TextEncoder().encode(json).length > authorSourceByteLimit)
    return repair("author.source-size", "Keep the source within 100,000 UTF-8 bytes.");
  let depth = 0, quoted = false, escaped = false;
  for (const character of json) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === "{" || character === "[") {
      if (++depth > authorSourceNestingLimit) return repair("author.source-depth", "Keep source structure within 64 nested objects or arrays.");
    } else if (character === "}" || character === "]") depth = Math.max(0, depth - 1);
  }
  return undefined;
}
