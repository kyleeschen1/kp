import {
  conceptRoomThemeCss,
  conceptRoomReviewThemeCss
} from "./concept-room-theme-adapters.ts";
import { linearEquationExemplarTheme } from "./concept-room-theme.ts";

const routeSelector = '[data-kp-concept-id="mathematics.linear-equations.solve-with-balance"]';

export function linearEquationExemplarCss(): string {
  return `${conceptRoomThemeCss(linearEquationExemplarTheme)}
${routeSelector}{box-sizing:border-box;width:min(1168px,calc(100% - 32px));margin:clamp(24px,5vh,56px) auto;background:var(--kp-concept-paper);color:var(--kp-concept-ink);border:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-ink) 18%,transparent);border-radius:var(--kp-concept-surface-radius);padding:clamp(18px,2vw,28px);font-family:var(--kp-concept-font-body);line-height:1.5;overflow:visible}
${routeSelector} [data-kp-concept-room-header]{margin:0 0 var(--kp-concept-space-section)}
${routeSelector} [data-kp-concept-room-product-tag]{margin:0;color:var(--kp-concept-accent);font-size:.72rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
${routeSelector} [data-kp-concept-room-title]{margin:.18rem 0 0;font-family:var(--kp-concept-font-display);font-size:clamp(1.8rem,3.5vw,2.75rem);font-weight:600;line-height:1.06;letter-spacing:-.025em}
${routeSelector} [data-kp-symbolic-story]{display:grid;grid-template-columns:minmax(18rem,.82fr) minmax(28rem,1.18fr);gap:clamp(28px,5vw,72px);align-items:start;margin-top:clamp(20px,4vh,44px)}
${routeSelector} [data-kp-symbolic-story-explanation]{min-width:0}
${routeSelector} [data-kp-symbolic-story-explanation]>h2{margin:0;font-family:var(--kp-concept-font-display);font-size:clamp(1.45rem,2.6vw,2rem);line-height:1.1}
${routeSelector} [data-kp-symbolic-story-summary]{max-width:34rem;margin:.6rem 0 0;color:var(--kp-concept-muted-ink);font-size:.98rem}
${routeSelector} [data-kp-symbolic-story-beats]{display:grid;margin-top:var(--kp-concept-space-section)}
${routeSelector} [data-kp-symbolic-story-beat]{display:grid;align-content:center;min-height:clamp(260px,48vh,430px);padding:clamp(20px,7vh,64px) 0;border-left:2px solid color-mix(in srgb,var(--kp-concept-line) 18%,transparent);padding-left:clamp(16px,2vw,24px);scroll-margin-block:28vh}
${routeSelector} [data-kp-symbolic-story-beat] h3{margin:0 0 .55rem;font-family:var(--kp-concept-font-display);font-size:clamp(1.08rem,1.8vw,1.3rem);line-height:1.2}
${routeSelector} [data-kp-symbolic-story-beat] p{max-width:32rem;margin:0;color:var(--kp-concept-muted-ink);font-size:clamp(.96rem,1.3vw,1.05rem);line-height:1.65}
${routeSelector} [data-kp-symbolic-story-beat][data-kp-symbolic-story-active=true]{border-left-color:var(--kp-concept-accent)}
${routeSelector} [data-kp-symbolic-story-semantic-ref]{color:var(--kp-concept-ink);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--kp-concept-relation) 34%,transparent);text-decoration-thickness:1px;text-underline-offset:.22em}
${routeSelector} [data-kp-symbolic-story-visual]{position:sticky;top:clamp(20px,8vh,72px);display:grid;place-items:center;min-width:0;min-height:clamp(360px,62vh,560px);border:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-line) 24%,transparent);border-radius:calc(var(--kp-concept-surface-radius) - .15rem);background:var(--kp-concept-surface);overflow:clip}
${routeSelector} [data-kp-symbolic-story-animation-host],${routeSelector} [data-kp-symbolic-story-animation-mount],${routeSelector} [data-kp-symbolic-story-player],${routeSelector} [data-kp-editor-animation-stage],${routeSelector} [data-kp-editor-animation-surface-slot=equation]{display:grid;width:100%;min-width:0;min-height:inherit;place-items:stretch}
${routeSelector} [data-kp-symbolic-story-player]{border:0;background:transparent}
${routeSelector} [data-kp-symbolic-story-player] .editor-animation-player__stage{display:grid;min-height:inherit;place-items:stretch;padding:clamp(20px,3vw,40px);background:transparent}
${routeSelector} [data-kp-symbolic-story-player] .editor-animation-player__surface{display:grid;min-width:0;min-height:100%;place-items:center;color:var(--kp-concept-ink);background:transparent}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage{position:relative;display:grid;width:100%;min-height:clamp(280px,48vh,430px);place-items:stretch}
${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] .editor-equation-stage{transform:translateX(-4%) scale(.78);transition:transform var(--kp-concept-motion-reflow) cubic-bezier(.22,.72,.24,1)}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__content{display:contents}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__transition{position:relative;display:grid;grid-template-rows:1fr;min-width:0;min-height:inherit;margin:0}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__layer{display:grid;grid-area:1/1;min-width:0;place-items:center;padding:1rem;transform-origin:center;will-change:opacity,transform}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__object{box-sizing:border-box;width:max-content;max-width:100%;overflow:visible;padding:.3rem;font-size:clamp(2.15rem,4vw,3.65rem)!important}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__object .katex-display{margin:0}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage [data-kp-motion-id]{position:relative;display:inline-block;will-change:opacity,transform}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__material-layer{position:absolute;z-index:3;inset:0;overflow:visible;pointer-events:none;font-size:clamp(2.15rem,4vw,3.65rem)}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__material-owner{position:absolute;display:grid;place-items:center;transform-origin:center;will-change:opacity,transform}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__material-visual{display:inline-block}
${routeSelector} [data-kp-symbolic-story-active-beat=subtract-both-sides] [data-kp-symbolic-story-semantic-ref]{border-radius:.22em;background:color-mix(in srgb,var(--kp-concept-accent) 10%,transparent);color:var(--kp-concept-ink);font-weight:650;text-decoration-color:var(--kp-concept-accent)}
${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.lhs.plus3"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *),${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.lhs.minus3"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *),${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.rhs.minus"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *),${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.rhs.3"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *){color:var(--kp-concept-accent)!important;transition:color var(--kp-concept-motion-focus) ease}
${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] :is([data-kp-equation-material-owner-id="linear-solve.lhs.plus3"],[data-kp-equation-material-owner-id="linear-solve.lhs.minus3"],[data-kp-equation-material-owner-id="linear-solve.rhs.minus"],[data-kp-equation-material-owner-id="linear-solve.rhs.3"]){box-shadow:inset 0 -2px color-mix(in srgb,var(--kp-concept-accent) 78%,transparent)}
${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.lhs.x"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *),${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.rhs.7"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *){color:var(--kp-concept-relation)!important;transition:color var(--kp-concept-motion-focus) ease}
${routeSelector} [data-kp-symbolic-story-active-beat="subtract-both-sides"] [data-kp-symbolic-story-player] [data-kp-equation-material-owner-id="linear-solve.equals"] :is(.editor-equation-stage__material-visual,.editor-equation-stage__material-visual *){color:var(--kp-concept-ink)!important}
${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__caption,${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__sequence,${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__epistemic-branch-cue{display:none}
${routeSelector} [data-kp-concept-secondary-surface]{margin-top:clamp(64px,12vh,128px);padding-top:var(--kp-concept-space-section);border-top:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-line) 24%,transparent)}
${routeSelector} [data-kp-concept-secondary-surface]>h2{margin:0;font-family:var(--kp-concept-font-display);font-size:clamp(1.25rem,2.2vw,1.7rem)}
${routeSelector} [data-kp-concept-secondary-surface]>p{max-width:42rem;margin:.4rem 0 var(--kp-concept-space-section);color:var(--kp-concept-muted-ink)}
${routeSelector} [data-kp-concept-room-stage]{display:grid;grid-template-columns:minmax(0,2fr) minmax(16rem,1fr);gap:clamp(16px,2vw,28px);align-items:start}
${routeSelector}[data-kp-concept-mode=review] [data-kp-concept-room-stage]{grid-template-columns:minmax(0,1fr)}
${routeSelector} [data-kp-concept-visual-field]{position:sticky;top:clamp(16px,4vh,36px);display:grid;grid-template-rows:1fr auto auto;align-items:center;min-width:0;min-height:430px;background:var(--kp-concept-surface);border-radius:calc(var(--kp-concept-surface-radius) - .25rem);padding:clamp(18px,3vw,36px);overflow:clip}
${routeSelector}[data-kp-concept-mode=review] [data-kp-concept-visual-field]{position:relative;top:auto;grid-template-rows:auto auto;align-items:start;min-height:0;overflow:visible}
${routeSelector}[data-kp-concept-mode=review] [data-kp-concept-semantic-definition]{display:none}
${routeSelector} [data-kp-concept-review-mode]{max-width:46rem;margin-inline:auto}
${routeSelector} [data-kp-concept-review-mode] h2{margin:0 0 var(--kp-concept-space-compact);font-family:var(--kp-concept-font-display);font-size:clamp(1.35rem,2.5vw,1.8rem)}
${routeSelector} [data-kp-concept-review-mode] > p{margin:0;color:var(--kp-concept-muted-ink)}
${routeSelector} [data-kp-concept-review-mode] ol{display:grid;gap:var(--kp-concept-space-section);margin:var(--kp-concept-space-section) 0 0;padding-left:1.3rem}
${routeSelector} [data-kp-concept-review-mode] h3{margin:0 0 var(--kp-concept-space-compact);font-family:var(--kp-concept-font-display);font-size:1.08rem}
${routeSelector} [data-kp-concept-review-mode] li p{margin:0;color:var(--kp-concept-muted-ink)}
${routeSelector} [data-kp-concept-viewport]{min-width:0;align-self:center}
${routeSelector} [data-kp-linear-equation-coordinated-stage]{display:grid;grid-template-rows:auto auto;gap:clamp(2px,1vh,10px);align-items:center;min-width:0}
${routeSelector} [data-kp-coordinated-projection]{min-width:0}
${routeSelector} [data-kp-coordinated-projection=symbolic]{display:grid;place-items:center;min-height:8rem}
${routeSelector} [data-kp-coordinated-projection=balance]{display:grid;place-items:center;width:min(100%,38rem);margin-inline:auto}
${routeSelector} [data-kp-symbolic-motion-stage]{position:relative;display:grid;place-items:center;width:100%;min-height:10rem}
${routeSelector} [data-kp-symbolic-stage-layer]{grid-area:1/1;min-width:0}
${routeSelector} [data-kp-symbolic-stage-layer=native]{opacity:0;pointer-events:none}
${routeSelector} [data-kp-symbolic-stage-layer=measurement]{position:absolute;inset:0;display:grid;place-items:center;visibility:hidden;pointer-events:none}
${routeSelector} [data-kp-symbolic-stage-layer=source-measure],${routeSelector} [data-kp-symbolic-stage-layer=expanded-measure],${routeSelector} [data-kp-symbolic-stage-layer=target-measure],${routeSelector} [data-kp-symbolic-stage-layer=source],${routeSelector} [data-kp-symbolic-stage-layer=expanded],${routeSelector} [data-kp-symbolic-stage-layer=target]{grid-area:1/1}
${routeSelector} [data-kp-symbolic-stage-layer=overlay]{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
${routeSelector} [data-kp-symbolic-stage-layer=overlay] [data-kp-symbolic-token]{display:inline-block;transform-origin:center;will-change:transform,opacity}
${routeSelector} [data-kp-symbolic-cancellation-mark]{position:absolute;border-top:.07em solid var(--kp-concept-accent);transform:rotate(-20deg);transform-origin:center;pointer-events:none}
${routeSelector} [data-kp-symbolic-cancellation-mark=coefficient]{left:0;width:38%;top:31%}
${routeSelector} [data-kp-symbolic-cancellation-mark=divisor]{left:34%;width:32%;top:78%}
${routeSelector} [data-kp-symbolic-motion-role=coefficient-divisor-cancellation]{position:relative}
${routeSelector} [data-kp-concept-viewport] [data-kp-symbolic-equation]{display:flex;align-items:center;justify-content:center;gap:.15em;font-size:clamp(2rem,5vw,4.25rem);min-height:10rem}
${routeSelector} [data-kp-concept-viewport] [data-kp-balance-scene]{display:block;width:100%;height:auto;max-height:430px;overflow:visible;color:var(--kp-concept-ink)}
${routeSelector} [data-kp-balance-scene] [data-kp-balance-math-label=variable] .katex{font-size:1.35em}
${routeSelector} [data-kp-balance-scene] [data-kp-balance-math-label=unit] .katex{font-size:.78em}
${routeSelector} [data-kp-balance-scene] [data-kp-balance-math-label=operation] .katex{font-size:1.02em}
${routeSelector} [data-kp-balance-scene] [data-kp-balance-math-label=result] .katex{font-size:1.25em}
${routeSelector} [data-kp-balance-scene] .kp-role-focus-primary [data-kp-balance-object-shape],${routeSelector} [data-kp-balance-scene] .kp-role-focus-primary[data-kp-balance-partition-group] [data-kp-balance-group-guide]{stroke:var(--kp-concept-focus);stroke-width:3}
${routeSelector} [data-kp-balance-scene].kp-role-focus-primary [data-kp-balance-beam]{stroke:var(--kp-concept-focus)}
${routeSelector} [data-kp-concept-semantic-definition]{min-height:1.4em;margin:var(--kp-concept-space-compact) 0 0;color:var(--kp-concept-muted-ink);font-size:.8rem;line-height:1.35}
${routeSelector} [data-kp-concept-semantic-definition-active=true]{color:var(--kp-concept-ink)}
${routeSelector} [data-kp-correspondence-target]:not(a){cursor:pointer}
${routeSelector} a[data-kp-correspondence-target].kp-role-focus-primary,${routeSelector} [data-kp-symbolic-token][data-kp-correspondence-target].kp-role-focus-primary{border-radius:.2em;background:color-mix(in srgb,var(--kp-concept-focus) 12%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--kp-concept-focus) 38%,transparent)}
${routeSelector} [data-kp-balance-scene] [data-kp-correspondence-target].kp-role-focus-primary{filter:drop-shadow(0 0 2px color-mix(in srgb,var(--kp-concept-focus) 52%,transparent))}
${routeSelector} [data-kp-concept-copy-rail]{align-content:start;display:grid;gap:var(--kp-concept-space-section);min-width:0;overflow:visible;border-left:2px solid color-mix(in srgb,var(--kp-concept-accent) 48%,transparent);padding:var(--kp-concept-space-control) 0 var(--kp-concept-space-control) var(--kp-concept-space-section)}
${routeSelector} [data-kp-concept-explanation] h2{margin:0 0 var(--kp-concept-space-compact);font-family:var(--kp-concept-font-display);font-size:clamp(1.15rem,2vw,1.45rem);line-height:1.25}
${routeSelector} [data-kp-concept-explanation] p{margin:0;color:var(--kp-concept-muted-ink)}
${routeSelector} button[data-kp-concept-share-action]{appearance:none;margin-top:var(--kp-concept-space-compact);padding:0;border:0;background:transparent;color:var(--kp-concept-relation);font:600 .72rem/1.4 var(--kp-concept-font-control);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--kp-concept-relation) 42%,transparent);text-underline-offset:.18em;cursor:pointer}
${routeSelector} [data-kp-concept-controls] button[data-kp-concept-share-action]{margin:0;white-space:nowrap}
${routeSelector} [data-kp-concept-checkpoint-sections]{display:grid;gap:var(--kp-concept-space-section)}
${routeSelector} [data-kp-concept-explanation]{min-height:clamp(240px,42vh,390px);padding:clamp(12px,8vh,72px) 0 var(--kp-concept-space-section) var(--kp-concept-space-control);border-left:2px solid transparent;scroll-margin-block:20vh}
${routeSelector} [data-kp-concept-explanation][aria-current=step]{border-left-color:var(--kp-concept-accent)}
${routeSelector} [data-kp-concept-explanation]:not([aria-current=step]) h2{font-size:1.02rem}
${routeSelector} [data-kp-concept-checkpoints] ol{display:grid;gap:.35rem;margin:0;padding-left:1.25rem}
${routeSelector} a{color:var(--kp-concept-relation);text-decoration-color:color-mix(in srgb,var(--kp-concept-relation) 42%,transparent);text-underline-offset:.18em}
${routeSelector} a[aria-current]{color:var(--kp-concept-ink);font-weight:700;text-decoration-color:var(--kp-concept-accent)}
${routeSelector} [data-kp-concept-controls]{display:flex;align-items:center;justify-content:space-between;gap:var(--kp-concept-space-control);flex-wrap:wrap;margin-top:var(--kp-concept-space-section);padding-top:var(--kp-concept-space-control);border-top:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-line) 28%,transparent)}
${routeSelector} [data-kp-concept-controls] nav{display:flex;align-items:center;gap:var(--kp-concept-space-control);flex-wrap:wrap}
${routeSelector} [data-kp-concept-mode-controls]{margin-left:auto}
${routeSelector} [data-kp-concept-share-status]{min-height:1.25em;margin:var(--kp-concept-space-compact) 0 0;color:var(--kp-concept-muted-ink);font-size:.75rem;text-align:right}
${routeSelector} [data-kp-concept-narration]{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
${routeSelector} [data-kp-concept-verification]{margin-top:var(--kp-concept-space-compact);color:var(--kp-concept-muted-ink);font-size:.75rem}
${routeSelector} [data-kp-concept-verification] summary{width:max-content;margin-left:auto;color:var(--kp-concept-relation);cursor:pointer}
${routeSelector} [data-kp-concept-verification] ul{display:grid;gap:.25rem;max-width:42rem;margin:.5rem 0 0 auto;padding-left:1.1rem}
${routeSelector} [data-kp-concept-playback-controls]{display:flex;align-items:center;gap:var(--kp-concept-space-compact);flex:1 1 24rem;min-width:0}
${routeSelector} [data-kp-concept-playback-controls] button{appearance:none;border:var(--kp-concept-line-width) solid color-mix(in srgb,var(--kp-concept-line) 48%,transparent);border-radius:var(--kp-concept-control-radius);background:transparent;color:var(--kp-concept-ink);padding:.45rem .7rem;font:var(--kp-concept-control-weight) .82rem/1 var(--kp-concept-font-control);cursor:pointer}
${routeSelector} [data-kp-concept-playback-controls] button[data-kp-concept-playback-action=play-pause]{background:var(--kp-concept-ink);color:var(--kp-concept-surface);border-color:var(--kp-concept-ink)}
${routeSelector} [data-kp-concept-playback-controls] input[type=range]{width:clamp(7rem,10vw,8rem);min-width:7rem;accent-color:var(--kp-concept-accent)}
${routeSelector} :focus-visible{outline:var(--kp-concept-focus-width) solid var(--kp-concept-focus);outline-offset:var(--kp-concept-focus-offset)}
${routeSelector} .kp-role-focus-primary{color:var(--kp-concept-focus)}
@media(forced-colors:active){${routeSelector}{--kp-concept-focus:Highlight;--kp-concept-line:CanvasText;border-color:CanvasText;forced-color-adjust:auto}${routeSelector} [data-kp-concept-visual-field],${routeSelector} [data-kp-concept-copy-rail],${routeSelector} [data-kp-concept-controls]{border-color:CanvasText}${routeSelector} .kp-role-focus-primary{outline:2px solid Highlight;outline-offset:2px}${routeSelector} [data-kp-balance-scene] [data-kp-correspondence-target].kp-role-focus-primary{filter:none;stroke:Highlight}}
@media(max-width:860px){${routeSelector}{width:min(100% - 20px,42rem);margin:10px auto;padding:16px}${routeSelector} [data-kp-symbolic-story]{grid-template-columns:1fr;gap:var(--kp-concept-space-section)}${routeSelector} [data-kp-symbolic-story-beat]{min-height:0;padding:var(--kp-concept-space-section) 0 var(--kp-concept-space-section) var(--kp-concept-space-control)}${routeSelector} [data-kp-symbolic-story-visual]{position:relative;top:auto;min-height:320px}${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage{min-height:260px}${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__object,${routeSelector} [data-kp-symbolic-story-player] .editor-equation-stage__material-layer{font-size:clamp(1.8rem,10vw,3rem)!important}${routeSelector} [data-kp-concept-room-stage]{grid-template-columns:1fr}${routeSelector} [data-kp-concept-visual-field]{position:relative;top:auto;min-height:340px}${routeSelector} [data-kp-concept-copy-rail]{border-left:0;border-top:2px solid color-mix(in srgb,var(--kp-concept-accent) 48%,transparent);padding:var(--kp-concept-space-section) 0 0}${routeSelector} [data-kp-concept-explanation]{min-height:0;padding:var(--kp-concept-space-section) 0 var(--kp-concept-space-section) var(--kp-concept-space-control);scroll-margin-block:10vh}}
@media(max-width:480px){${routeSelector}{width:calc(100% - 12px);margin:6px auto;padding:12px;border-radius:calc(var(--kp-concept-surface-radius) - .25rem)}${routeSelector} [data-kp-concept-room-title]{font-size:clamp(1.65rem,9vw,2.15rem)}${routeSelector} [data-kp-concept-visual-field]{min-height:300px;padding:16px}${routeSelector} [data-kp-coordinated-projection=symbolic]{min-height:6.5rem}${routeSelector} [data-kp-symbolic-motion-stage]{min-height:7rem}${routeSelector} [data-kp-concept-viewport] [data-kp-symbolic-equation]{font-size:clamp(1.8rem,12vw,3rem);min-height:7rem}${routeSelector} [data-kp-balance-math-label=variable] .katex{font-size:1.7em}${routeSelector} [data-kp-balance-math-label=unit] .katex{font-size:1em}${routeSelector} [data-kp-balance-math-label=operation] .katex{font-size:1.45em}${routeSelector} [data-kp-balance-math-label=result] .katex{font-size:1.7em}${routeSelector} [data-kp-balance-math-label=share] .katex{font-size:1.15em}${routeSelector} [data-kp-concept-controls]{align-items:stretch}${routeSelector} [data-kp-concept-playback-controls]{flex-basis:100%;flex-wrap:wrap}${routeSelector} [data-kp-concept-playback-controls] input[type=range]{flex:1;max-width:none}${routeSelector} [data-kp-concept-controls] nav{font-size:.9rem}}
@media print{${routeSelector}{width:100%;margin:0;padding:0;background:#fff;color:#000;border:0;border-radius:0}${routeSelector} [data-kp-concept-room-stage]{display:block}${routeSelector} [data-kp-concept-visual-field]{position:static;min-height:0;background:#fff;padding:1rem 0;overflow:visible}${routeSelector} [data-kp-concept-controls],${routeSelector} [data-kp-concept-share-status],${routeSelector} [data-kp-concept-verification]{display:none}${routeSelector} [data-kp-concept-copy-rail]{border:0;padding:0}${routeSelector} [data-kp-concept-checkpoints]{display:none}${routeSelector} [data-kp-concept-explanation]{min-height:0;padding:1rem 0;border:0;break-inside:avoid}${routeSelector} a{color:#000;text-decoration-color:currentColor}}
${conceptRoomReviewThemeCss(linearEquationExemplarTheme)}`;
}
