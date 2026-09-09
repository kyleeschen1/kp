/** Editorial strings are data, not Markdown, directives or TeX. Dollar signs
 * cross Article's literal-code boundary; all other punctuation is encoded. */
export const encodeKpArticleLiteralProse = (text: string) => text.split(/(\$+)/).map(part => part.startsWith("$") ? `\`${part}\``
  : Array.from(part, char => `&#${char.codePointAt(0)};`).join("")).join("");
