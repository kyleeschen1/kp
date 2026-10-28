/** Prepare only the known flat fractional-reader markup, before first paint.
 * This is not an arbitrary HTML parser: fail closed if its compiler shape
 * changes (e.g. nested attention lists), rather than hydrating half a layout.
 */
export function compileFractionalCaptionShell(html: string, beatCount: number): string {
  const article = html.indexOf('<article class="kp-lesson"');
  const introStart = html.indexOf('>', article) + 1;
  const storyStart = html.indexOf('<section ', introStart);
  if (article < 0 || introStart <= article || storyStart < introStart) {
    throw new Error('Fractional caption shell requires its compiled article and story.');
  }
  const intro = html.slice(introStart, storyStart);
  let result = html.slice(0, introStart)
    + '<div class="kp-caption-intro-slot"><div class="kp-rising-intro kp-rising-passage" data-kp-caption-active="true"><div class="kp-caption-copy">'
    + intro + '</div></div></div>' + html.slice(storyStart);
  let wrapped = 0;
  result = result.replace(/(<li\b[^>]*data-kp-beat="([^"]+)"[^>]*>)(<div class="kp-beat-copy">[\s\S]*?<\/div>)(<\/li>)/g,
    (_match, opening: string, id: string, copy: string, closing: string) => {
      wrapped += 1;
      return `${opening}<div class="kp-rising-passage" id="caption.${id}" data-kp-rising-beat="${id}" hidden="until-found"><div class="kp-caption-copy">${copy}</div></div>${closing}`;
    });
  if (wrapped !== beatCount || wrapped === 0 || result.includes('data-kp-attention-phase=')) {
    throw new Error('Fractional caption shell requires the complete flat beat sequence.');
  }
  return result.replace('<body', '<body data-kp-reader-layout="rising-passages" data-kp-caption-mode="captions"')
    .replace('</head>', `<noscript><style data-kp-static-document>${staticDocumentStyles}</style></noscript></head>`)
    .replace('</main>', '</main><div class="kp-caption-frame"></div>');
}

// Keep this inline inside noscript: bundlers extract linked stylesheets into
// unconditional CSS, which would apply the static fallback with JS enabled.
const staticDocumentStyles = `
body[data-kp-reader-layout] .kp-rising-passage {
  position: static !important; transform: none !important; display: block !important;
  content-visibility: visible !important; opacity: 1 !important;
  width: 100% !important; height: auto !important; overflow: visible !important; padding: 0 !important;
}
body[data-kp-reader-layout] .kp-caption-copy { transform: none; max-height: none; }
body[data-kp-reader-layout] .kp-caption-frame { display: none; }
body[data-kp-reader-layout] .kp-reader-layout > .kp-lesson-toc { display: block; position: static; }
body[data-kp-reader-layout] .kp-caption-intro-slot,
html body[data-kp-reader-layout] .kp-animation-beats > li { min-height: 0; padding-block: 1rem; }
body[data-kp-reader-layout] .kp-lesson { padding: 2rem 0; }
html body[data-kp-reader-layout] .kp-animation-static { position: static; transform: none; width: 100%; height: auto; }
`;
