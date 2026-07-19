import {
  conceptRoomThemeCss,
  conceptRoomReviewThemeCss
} from "./concept-room-theme-adapters.ts";
import { linearEquationExemplarTheme } from "./concept-room-theme.ts";

const routeSelector = '[data-kp-concept-id="mathematics.linear-equations.solve-with-balance"]';

export function linearEquationExemplarCss(): string {
  return `${conceptRoomThemeCss(linearEquationExemplarTheme)}
${routeSelector}{width:min(1168px,calc(100% - 32px));margin:clamp(24px,5vh,56px) auto;background:var(--kp-concept-paper);color:var(--kp-concept-ink);border:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-ink) 18%,transparent);border-radius:var(--kp-concept-surface-radius);padding:clamp(18px,2vw,28px);font-family:var(--kp-concept-font-body);line-height:1.5;overflow:visible}
${routeSelector} [data-kp-concept-room-header]{margin:0 0 var(--kp-concept-space-section)}
${routeSelector} [data-kp-concept-room-product-tag]{margin:0;color:var(--kp-concept-accent);font-size:.72rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
${routeSelector} [data-kp-concept-room-title]{margin:.18rem 0 0;font-family:var(--kp-concept-font-display);font-size:clamp(1.8rem,3.5vw,2.75rem);font-weight:600;line-height:1.06;letter-spacing:-.025em}
${routeSelector} [data-kp-concept-room-stage]{display:grid;grid-template-columns:minmax(0,2fr) minmax(16rem,1fr);gap:clamp(16px,2vw,28px);align-items:start}
${routeSelector} [data-kp-concept-visual-field]{position:sticky;top:clamp(16px,4vh,36px);display:grid;grid-template-rows:1fr auto;align-items:center;min-width:0;min-height:430px;background:var(--kp-concept-surface);border-radius:calc(var(--kp-concept-surface-radius) - .25rem);padding:clamp(18px,3vw,36px);overflow:clip}
${routeSelector} [data-kp-concept-viewport]{min-width:0;align-self:center}
${routeSelector} [data-kp-concept-viewport] [data-kp-symbolic-equation]{display:flex;align-items:center;justify-content:center;gap:.15em;font-size:clamp(2rem,5vw,4.25rem);min-height:10rem}
${routeSelector} [data-kp-concept-viewport] [data-kp-balance-scene]{display:block;width:100%;height:auto;max-height:430px}
${routeSelector} [data-kp-concept-copy-rail]{align-content:start;display:grid;gap:var(--kp-concept-space-section);min-width:0;overflow:visible;border-left:2px solid color-mix(in srgb,var(--kp-concept-accent) 48%,transparent);padding:var(--kp-concept-space-control) 0 var(--kp-concept-space-control) var(--kp-concept-space-section)}
${routeSelector} [data-kp-concept-explanation] h2{margin:0 0 var(--kp-concept-space-compact);font-family:var(--kp-concept-font-display);font-size:clamp(1.15rem,2vw,1.45rem);line-height:1.25}
${routeSelector} [data-kp-concept-explanation] p{margin:0;color:var(--kp-concept-muted-ink)}
${routeSelector} [data-kp-concept-checkpoint-sections]{display:grid;gap:var(--kp-concept-space-section)}
${routeSelector} [data-kp-concept-explanation]{min-height:clamp(240px,42vh,390px);padding:clamp(12px,8vh,72px) 0 var(--kp-concept-space-section) var(--kp-concept-space-control);border-left:2px solid transparent;scroll-margin-block:20vh}
${routeSelector} [data-kp-concept-explanation][aria-current=step]{border-left-color:var(--kp-concept-accent)}
${routeSelector} [data-kp-concept-explanation]:not([aria-current=step]) h2{font-size:1.02rem}
${routeSelector} [data-kp-concept-checkpoints] ol{display:grid;gap:.35rem;margin:0;padding-left:1.25rem}
${routeSelector} a{color:var(--kp-concept-relation);text-decoration-color:color-mix(in srgb,var(--kp-concept-relation) 42%,transparent);text-underline-offset:.18em}
${routeSelector} a[aria-current]{color:var(--kp-concept-ink);font-weight:700;text-decoration-color:var(--kp-concept-accent)}
${routeSelector} [data-kp-concept-controls]{display:flex;align-items:center;justify-content:space-between;gap:var(--kp-concept-space-control);flex-wrap:wrap;margin-top:var(--kp-concept-space-section);padding-top:var(--kp-concept-space-control);border-top:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-line) 28%,transparent)}
${routeSelector} [data-kp-concept-controls] nav{display:flex;align-items:center;gap:var(--kp-concept-space-control);flex-wrap:wrap}
${routeSelector} [data-kp-concept-playback-controls]{display:flex;align-items:center;gap:var(--kp-concept-space-compact);flex:1 1 24rem;min-width:0}
${routeSelector} [data-kp-concept-playback-controls] button{appearance:none;border:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-line) 48%,transparent);border-radius:var(--kp-concept-control-radius);background:transparent;color:var(--kp-concept-ink);padding:.45rem .7rem;font:var(--kp-concept-control-weight) .82rem/1 var(--kp-concept-font-control);cursor:pointer}
${routeSelector} [data-kp-concept-playback-controls] button[data-kp-concept-playback-action=play-pause]{background:var(--kp-concept-ink);color:var(--kp-concept-surface);border-color:var(--kp-concept-ink)}
${routeSelector} [data-kp-concept-playback-controls] input[type=range]{width:clamp(7rem,10vw,8rem);min-width:7rem;accent-color:var(--kp-concept-accent)}
${routeSelector} :focus-visible{outline:var(--kp-concept-focus-width) solid var(--kp-concept-focus);outline-offset:var(--kp-concept-focus-offset)}
${routeSelector} .kp-role-focus-primary{color:var(--kp-concept-focus)}
@media(max-width:760px){${routeSelector}{width:min(100% - 20px,42rem);margin:10px auto;padding:16px}${routeSelector} [data-kp-concept-room-stage]{grid-template-columns:1fr}${routeSelector} [data-kp-concept-visual-field]{min-height:320px}${routeSelector} [data-kp-concept-copy-rail]{border-left:0;border-top:2px solid color-mix(in srgb,var(--kp-concept-accent) 48%,transparent);padding:var(--kp-concept-space-section) 0 0}}
${conceptRoomReviewThemeCss(linearEquationExemplarTheme)}`;
}
