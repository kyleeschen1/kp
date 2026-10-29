import { projectVision } from "./vision-data.ts";
import { validateProjectVision, visionNeedsReview,
  type ProjectVision, type VisionArea, type VisionSource } from "./vision-model.ts";

export function renderProjectVision(vision: ProjectVision = projectVision, now = new Date()): string {
  const issues = validateProjectVision(vision);
  if (issues.length) throw new Error(`Invalid project vision: ${issues.join("; ")}`);
  const next = vision.areas.find(area => area.horizon === "next");
  if (!next) throw new Error("Missing next outcome");
  const stale = visionNeedsReview(vision.reviewedOn, now);
  return `<section class="project-vision" id="project-vision" aria-labelledby="project-vision-title" data-kp-project-vision>
    <header class="project-vision__heading">
      <div><p class="project-vision__eyebrow">A direction we can keep</p><h2 id="project-vision-title">Vision &amp; finish lines</h2></div>
      <a href="#project-discovery">Explore the existing catalogue ↓</a>
    </header>
    <div class="project-vision__north">
      <h3>${escape(vision.northStar)}</h3>
      <p><strong>First product proof.</strong> ${escape(vision.productProof)} ${link(vision.productSource)}</p>
      <p class="project-vision__freshness" data-kp-vision-freshness="${stale ? "review-due" : "reviewed"}">Reviewed ${escape(vision.reviewedOn)}${stale ? " · Review due" : ""}. Source-linked planning snapshot; execution stays in Theseus.</p>
    </div>
    <section class="project-vision__next" aria-labelledby="project-vision-next-title">
      <div><span class="project-vision__badge">Recommended next · proposed</span><h3 id="project-vision-next-title">${escape(next.outcome.title)}</h3>
        <p><strong>Finish line.</strong> ${escape(next.outcome.finish)}</p></div>
      <a href="#${escape(next.id)}">See scope &amp; evidence →</a>
      <p class="project-vision__note">This recommendation is not an active run. Starting it requires selecting the bounded outcome; the rest remain horizons.</p>
    </section>
    <div class="project-vision__section-heading"><h3>The longer view</h3><p>Six areas of one project. One next recommendation.</p></div>
    <div class="project-vision__areas">${vision.areas.map(renderArea).join("")}</div>
    <section class="project-vision__closed" aria-labelledby="project-vision-closed-title">
      <h3 id="project-vision-closed-title">Finished, at their actual scope</h3>
      <div>${vision.completed.map(item => `<article><h4>${escape(item.title)}</h4><p>${escape(item.scope)}</p>${link(item.source)}</article>`).join("")}</div>
    </section>
    <div class="project-vision__records">
      <details><summary>How we keep commitments</summary>
        <ol><li>Choose one finite delivery outcome. Keep new ideas outside that commitment until selected.</li>
          <li>Attach a finish line, exclusions and evidence before work starts.</li>
          <li>If direction changes, record the old commitment and whether it was completed, paused, replaced or dropped.</li>
          <li>Preserve accepted milestones. Bigger ambitions get successor milestones.</li>
          <li>Review this map at a milestone handoff or pivot, and weekly during active work.</li></ol>
        <p>Repository edits maintain this view. Browser editing and automatic upkeep are not enabled. ${link({label: "Operating rules", href: "docs/project/2026-10-29-project-vision-ui.md"})}</p>
      </details>
      <details><summary>What changed, and why <span>(${vision.changes.length})</span></summary>
        <ol class="project-vision__history">${[...vision.changes].reverse().map(change => `<li id="${escape(change.id)}"><time>${escape(change.on)}</time>
          <p><strong>Before.</strong> ${escape(change.before)}</p><p><strong>Now.</strong> ${escape(change.after)}</p>
          <p><strong>Reason.</strong> ${escape(change.reason)} ${link(change.source)}</p></li>`).join("")}</ol>
      </details>
    </div>
    <aside class="project-vision__legacy" id="project-discovery"><strong>Existing catalogue &amp; historical planning</strong>
      <p>The discovery tools below are preserved. Their manually maintained work statuses are not the current commitment queue; consult the roadmap and linked execution records.</p>
      ${link({label: "Current roadmap", href: "docs/project/roadmap.md"})}
    </aside>
  </section>`;
}

function renderArea(area: VisionArea): string {
  return `<article class="project-vision__area" id="${escape(area.id)}" data-kp-vision-area="${escape(area.id)}">
    <div class="project-vision__area-title"><h3>${escape(area.title)}</h3><span>${area.horizon === "next" ? "Next proposal" : "Horizon"}</span></div>
    <p>${escape(area.destination)}</p>
    <details><summary>${escape(area.outcome.title)}</summary><div class="project-vision__area-detail">
      <h4>What exists</h4><p>${escape(area.established)} ${link(area.evidence)}</p>
      <h4>Finish line</h4><p>${escape(area.outcome.finish)}</p>
      <h4>Outside this milestone</h4><p>${escape(area.outcome.excludes)}</p>
      ${link(area.outcome.source)}</div>
    </details>
  </article>`;
}

function link(source: VisionSource): string {
  return `<a href="/${escape(source.href)}">${escape(source.label)}</a>`;
}

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
