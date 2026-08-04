import type {
  KpLispExpressionBead,
  KpLispExpressionBeadFace
} from "../animation/lisp-s-expression-beads.ts";

export const kpLispExpressionBeadCss = `
.kp-lisp-expression-bead {
  --kp-lisp-bead-ink: var(--kp-lesson-theme-math-ink, #343a40);
  --kp-lisp-bead-accent: var(--kp-lesson-theme-accent, #2f6f9f);
  --kp-lisp-bead-surface: var(--kp-lesson-theme-surface, #f4f0e6);
  align-items: center;
  background: color-mix(in srgb, var(--kp-lisp-bead-surface) 90%, var(--kp-lisp-bead-accent));
  border: 1px solid color-mix(in srgb, var(--kp-lisp-bead-accent) 50%, transparent);
  border-radius: 999px;
  color: var(--kp-lisp-bead-ink);
  display: inline-grid;
  font: 600 1rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  gap: .34rem;
  justify-items: center;
  min-block-size: 2.4rem;
  min-inline-size: 2.4rem;
  padding: .42rem .68rem;
}
.kp-lisp-expression-bead code { color: inherit; font: inherit; white-space: pre; }
.kp-lisp-expression-bead__face,
.kp-lisp-expression-bead__miniature,
.kp-lisp-expression-bead__particles { align-items: center; display: flex; gap: .24rem; }
.kp-lisp-expression-bead__miniature { font-size: .63em; opacity: .86; }
.kp-lisp-expression-bead__particles { border-top: 1px solid color-mix(in srgb, var(--kp-lisp-bead-accent) 30%, transparent); padding-top: .28rem; }
.kp-lisp-expression-bead__particle {
  align-items: center;
  background: var(--kp-lisp-bead-surface);
  border: 1px solid color-mix(in srgb, var(--kp-lisp-bead-ink) 20%, transparent);
  border-radius: 999px;
  display: inline-flex;
  font-size: .48em;
  justify-content: center;
  min-block-size: 1.1rem;
  min-inline-size: 1.1rem;
  padding: .12rem .22rem;
}
`;

export function renderKpLispExpressionBeadHtml(input: {
  readonly bead: KpLispExpressionBead;
  readonly detailed: boolean;
}): string {
  const { bead } = input;
  const face = renderFace(bead.face);
  const particles = input.detailed
    ? `<span class="kp-lisp-expression-bead__particles" data-kp-lisp-bead-particles>${bead.particles.map((particle) =>
      `<span class="kp-lisp-expression-bead__particle" data-kp-lisp-bead-particle="${escapeAttribute(particle.childExpressionId)}" data-kp-lisp-bead-aggregates-subtree="${particle.aggregatesSubtree}"><code>${escapeHtml(particle.nativeCode)}</code></span>`
    ).join("")}</span>`
    : "";
  return `<span class="kp-lisp-expression-bead" data-kp-lisp-expression-bead="${escapeAttribute(bead.expressionId)}" data-kp-lisp-bead-role="${bead.role}" data-kp-lisp-bead-detail="${input.detailed ? "visible" : "hidden"}" aria-hidden="true"><span class="kp-lisp-expression-bead__face">${face}</span>${particles}</span>`;
}

function renderFace(face: KpLispExpressionBeadFace): string {
  if (face.kind === "literal-head") {
    return `<code data-kp-lisp-bead-literal-head="${escapeAttribute(face.materialId)}">${escapeHtml(face.nativeCode)}</code>`;
  }
  return `<span class="kp-lisp-expression-bead__miniature" data-kp-lisp-bead-miniature="${face.kind}">${face.parts.map((part) =>
    `<code data-kp-lisp-bead-miniature-part="${escapeAttribute(part.expressionId)}">${escapeHtml(part.nativeCode)}</code>`
  ).join("")}</span>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
