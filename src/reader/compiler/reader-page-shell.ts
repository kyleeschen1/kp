export interface KpReaderPageShellInput {
  readonly title: string;
  readonly description: string;
  readonly stylesheetHref: string;
  readonly bodyAttributes: readonly KpReaderHtmlAttribute[];
  readonly modeLink: KpReaderShellLink;
  readonly shareLink: KpReaderShellLink & { readonly dataAttribute: string };
  readonly tocHtml: string;
  readonly articleHtml: string;
  readonly afterMainHtml?: readonly string[] | undefined;
  readonly hydration: {
    readonly dataAttribute: string;
    readonly json: string;
  };
  readonly entryScriptSrc: string;
}

export interface KpReaderHtmlAttribute {
  readonly name: string;
  readonly value: string;
}

export interface KpReaderShellLink {
  readonly href: string;
  readonly label: string;
}

/** Owns document chrome only; renderer stages remain compiler-specific content. */
export function compileKpReaderPageShell(input: KpReaderPageShellInput): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${kpReaderHtmlAttribute(input.title)}</title>`,
    `<meta name="description" content="${kpReaderHtmlAttribute(input.description)}">`,
    `<link rel="stylesheet" href="${kpReaderHtmlAttribute(input.stylesheetHref)}">`,
    "</head>",
    `<body${compileAttributes(input.bodyAttributes)}>`,
    '<header class="kp-reader-masthead">',
    '<a class="kp-reader-wordmark" href="/">Kinetic Press</a>',
    '<span class="kp-reader-tagline">See concepts move</span>',
    `<a class="kp-reader-mode" href="${kpReaderHtmlAttribute(input.modeLink.href)}">${kpReaderHtmlAttribute(input.modeLink.label)}</a>`,
    `<a class="kp-reader-share" href="${kpReaderHtmlAttribute(input.shareLink.href)}" ${attributeName(input.shareLink.dataAttribute)}>${kpReaderHtmlAttribute(input.shareLink.label)}</a>`,
    "</header>",
    '<main class="kp-reader-layout">',
    input.tocHtml,
    input.articleHtml,
    "</main>",
    ...(input.afterMainHtml ?? []),
    `<script type="application/json" ${attributeName(input.hydration.dataAttribute)}>${input.hydration.json}</script>`,
    `<script type="module" src="${kpReaderHtmlAttribute(input.entryScriptSrc)}"></script>`,
    "</body>",
    "</html>"
  ].join("\n");
}

export function kpReaderHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function compileAttributes(attributes: readonly KpReaderHtmlAttribute[]): string {
  return attributes.map(({ name, value }) =>
    ` ${attributeName(name)}="${kpReaderHtmlAttribute(value)}"`
  ).join("");
}

function attributeName(name: string): string {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`Invalid reader HTML attribute name ${name}.`);
  }
  return name;
}
