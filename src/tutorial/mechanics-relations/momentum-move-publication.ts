import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";
import { type CheckedMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { momentumMoveParts, momentumMoveArrow, projectMomentumMove } from "./momentum-move.ts";
import { renderPhysicsReadout } from "./physics-readout.ts";

export function renderMomentumMove(markdown: string, models: readonly CheckedMomentumEnergy[]) {
  const [intro, ...clauses] = markdown.split(/^### /m);
  if (clauses.length !== 3 || clauses.some((clause, i) => !clause.startsWith(`${momentumMoveParts[i]}\n`)))
    throw new Error("physics.momentum-move.text: retain direction, magnitude and energy clause bindings");
  const model = models.find(m => m.source.episode === "turning");
  if (!model) throw new Error("physics.momentum-move.source: checked turning source missing");
  const { frame } = projectMomentumMove(model, 1);
  const entity = (part: string, view: string) => `data-move-entity="momentum.move.${part}.${view}"`;
  const clauseHtml = (clause: string) => {
    const [brief, more] = clause.slice(clause.indexOf("\n") + 1).split(/^#### /m);
    if (!more) return html(brief ?? "");
    const end = more.indexOf("\n");
    return `${html(brief ?? "")}<details data-move-depth><summary>${html(more.slice(0, end))}</summary>${html(more.slice(end + 1))}</details>`;
  };
  return `<div class="momentum-move" data-momentum-move>${html(intro ?? "")}
    <details><summary>Inspect this move</summary>
    <p data-move-instruction hidden>Drag the margin handle downward to follow the inference; upward to retrace it. Arrow keys work too. The text remains here to read.</p>
    <div class="momentum-move-layout">
      <div class="momentum-move-argument">
        <div class="momentum-move-gutter" data-move-gutter hidden><input data-move-seek type="range" min="0" max="1" step="0.001" value="0" aria-label="Follow the momentum inference" aria-orientation="vertical"><div data-move-pointer aria-hidden="true"></div></div>
        <div>${clauses.map((clause, i) => `<div ${i === 2 ? 'id="momentum-move-conclusion"' : ''} ${entity(momentumMoveParts[i]!, "text")}>${clauseHtml(clause)}</div>`).join("")}</div>
      </div>
      <figure aria-label="Momentum space: direction changes at constant distance from zero">
        <svg viewBox="0 0 200 200" role="img" aria-label="Momentum arrow turns along a circle of constant energy">
          <path class="momentum-move-axes" d="M10 100H190 M100 10V190"/>
          <circle ${entity("magnitude", "evidence")} cx="100" cy="100" r="65"/>
          <path class="momentum-move-history" d="M100 100V35"/>
          <path ${entity("direction", "evidence")} data-move-arrow d="${momentumMoveArrow(frame.momentum.x, frame.momentum.y)}"/>
          <circle cx="100" cy="100" r="2" fill="currentColor" stroke="none"/>
        </svg>
        <figcaption>Momentum space · fixed mass<br>Dashed: initial momentum</figcaption>
        <p ${entity("magnitude", "evidence")}>Magnitude: <span class="physics-readout">1.00 kg m/s</span></p>
        <p ${entity("energy", "evidence")}>Energy: ${renderPhysicsReadout("kineticEnergy", frame.kineticEnergy)}</p>
      </figure>
    </div>
    <button type="button" data-move-close hidden>Return to reading</button>
    </details><script type="application/json" data-move-source>${JSON.stringify(model.source)}</script>
  </div>`;
}
