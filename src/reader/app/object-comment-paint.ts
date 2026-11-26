import type { ObjectCommentPose } from './object-comment-arrival.ts';

const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

/** Geometry is measured once by the existing native-anchor adapter. This
 * candidate only paints that geometry; it never samples or clones math ink. */
export function prepareObjectCommentPaint(input: {
  overlay: HTMLElement; svg: SVGSVGElement; label: HTMLElement; bracket: SVGPathElement;
  left: number; right: number; edge: number; tip: number;
  x: number; y: number; width: number; height: number;
}) {
  const { overlay, svg, label, bracket, left, right, edge, tip, x, y, width, height } = input;
  const center = (left + right) / 2;
  const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const cue = document.createElement('span'); cue.className = 'kp-object-comment-cue';
  cue.style.left = `${center}px`; cue.style.top = `${edge - 10}px`;
  overlay.append(cue); svg.append(stem);
  label.style.transformOrigin = '50% 100%';
  bracket.setAttribute('d', `M ${left} ${tip} V ${edge} H ${right} V ${tip}`);
  bracket.setAttribute('pathLength', '1'); bracket.style.strokeDasharray = '1';
  return (pose: ObjectCommentPose) => {
    const arrival = ease(pose.emergence), departure = ease(pose.withdrawal);
    const scale = .68 + .32 * arrival;
    const dx = (center - x - width / 2) * (1 - arrival);
    const dy = (edge - 8 - y - height) * (1 - arrival);
    label.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    label.style.opacity = String(ease((pose.emergence - .12) / .5));
    bracket.style.strokeDashoffset = String(1 - ease(pose.emergence * 4));
    bracket.style.opacity = String(1 - departure);
    const targetX = x + width / 2 + dx, targetY = y + height + dy + 5;
    stem.setAttribute('d', `M ${center} ${edge} L ${targetX} ${edge + (targetY - edge) * (1 - departure)}`);
    stem.style.opacity = String(arrival * (1 - departure));
    cue.style.opacity = String(.24 * (1 - ease(pose.emergence / .6)));
    cue.style.transform = `translate(-50%, -50%) scale(${1 + arrival})`;
    overlay.dataset['commentEmergence'] = String(pose.emergence);
    overlay.dataset['commentWithdrawal'] = String(pose.withdrawal);
  };
}
