import { documentTheaterStaticStyles } from "./document-theater-projection.ts";
import { measureDocumentTheaterLayout } from "../app/document-theater-layout.ts";
import { documentPassageCadence } from "../app/document-theater-scroll.ts";
import { prepareDocumentTheaterStaticState } from "../app/document-theater-static-state.ts";

export interface KpReaderPageShellInput {
  readonly projection?: "document-theater";
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
    ...(input.projection ? [`<noscript><style data-kp-static-document>${documentTheaterStaticStyles}</style></noscript>`] : []),
    ...(input.projection ? ['<script>document.documentElement.dataset.kpDocumentPreparing="";document.documentElement.dataset.kpDocumentEnhancing="";</script>'] : []),
    "</head>",
    `<body${compileAttributes(input.bodyAttributes)}>`,
    '<header class="kp-reader-masthead">',
    '<a class="kp-reader-wordmark" href="/">Kinetic Press</a>',
    ...(input.projection ? ['<details class="kp-rising-navigation"><summary>Options</summary><div class="kp-reader-options">'] : []),
    '<span class="kp-reader-tagline">See concepts move</span>',
    `<a class="kp-reader-mode" href="${kpReaderHtmlAttribute(input.modeLink.href)}">${kpReaderHtmlAttribute(input.modeLink.label)}</a>`,
    `<a class="kp-reader-share" href="${kpReaderHtmlAttribute(input.shareLink.href)}" ${attributeName(input.shareLink.dataAttribute)}>${kpReaderHtmlAttribute(input.shareLink.label)}</a>`,
    ...(input.projection ? ['<div data-kp-reader-options-reading></div><div data-kp-reader-options-development></div></div></details>'] : []),
    "</header>",
    '<main class="kp-reader-layout">',
    input.tocHtml,
    input.articleHtml,
    "</main>",
    // This bounded, synchronous layout pass has no module/network dependencies.
    // Serializing the self-contained functions keeps the runtime and first paint
    // on the same geometry contract. Do not interpolate authored text as code.
    ...(input.projection ? [`<script data-kp-document-layout>try{performance.mark('kp-document-layout-start');(${measureDocumentTheaterLayout.toString()})(document,82,(${documentPassageCadence.toString()})(innerHeight-document.querySelector('.kp-reader-masthead').getBoundingClientRect().height));(${prepareDocumentTheaterStaticState.toString()})(document);performance.measure('kp-document-layout','kp-document-layout-start');}finally{delete document.documentElement.dataset.kpDocumentPreparing;}</script>`] : []),
    ...(input.afterMainHtml ?? []),
    `<script type="application/json" ${attributeName(input.hydration.dataAttribute)}>${input.hydration.json}</script>`,
    `<script type="module" src="${kpReaderHtmlAttribute(input.entryScriptSrc)}"${input.projection ? ' onerror="document.body.dataset.kpAnimationHostStatus=\'failed\';document.body.dataset.kpCaptionMode=\'document\'"' : ''}></script>`,
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
