export interface VisionSource {
  readonly label: string;
  readonly href: `docs/project/${string}.md`;
}

export interface VisionOutcome {
  readonly id: string;
  readonly title: string;
  readonly finish: string;
  readonly excludes: string;
  readonly source: VisionSource;
}

export interface VisionArea {
  readonly id: string;
  readonly title: string;
  readonly destination: string;
  readonly established: string;
  readonly evidence: VisionSource;
  readonly horizon: "next" | "later";
  readonly outcome: VisionOutcome;
}

export interface VisionChange {
  readonly id: string;
  readonly on: string;
  readonly before: string;
  readonly after: string;
  readonly reason: string;
  readonly source: VisionSource;
}

export interface ProjectVision {
  readonly reviewedOn: string;
  readonly northStar: string;
  readonly productProof: string;
  readonly productSource: VisionSource;
  readonly areas: readonly VisionArea[];
  readonly completed: readonly {
    readonly title: string;
    readonly scope: string;
    readonly source: VisionSource;
  }[];
  readonly changes: readonly VisionChange[];
}

/** This is strategic evidence, not a second copy of Theseus execution state. */
export function validateProjectVision(vision: ProjectVision): readonly string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const identity = (id: string) => {
    if (!/^[a-z][a-z0-9-]*$/.test(id) || ids.has(id)) issues.push(`Invalid or duplicate id: ${id}`);
    ids.add(id);
  };
  const text = (label: string, value: string) => {
    if (!value.trim()) issues.push(`Missing ${label}`);
  };
  const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const source = (value: VisionSource) => {
    text("source label", value.label);
    if (!/^docs\/project\/[a-zA-Z0-9/_-]+\.md$/.test(value.href)) issues.push(`Invalid source: ${value.href}`);
  };
  if (!date(vision.reviewedOn)) issues.push("Invalid review date");
  text("north star", vision.northStar);
  text("product proof", vision.productProof);
  source(vision.productSource);
  if (vision.areas.filter(area => area.horizon === "next").length !== 1) {
    issues.push("Choose exactly one recommended next outcome; other areas remain horizons");
  }
  for (const area of vision.areas) {
    identity(area.id);
    identity(area.outcome.id);
    for (const [label, value] of Object.entries({ title: area.title, destination: area.destination,
      established: area.established, outcome: area.outcome.title,
      finish: area.outcome.finish, exclusions: area.outcome.excludes })) text(label, value);
    source(area.evidence);
    source(area.outcome.source);
  }
  for (const closed of vision.completed) {
    text("closed outcome", closed.title);
    text("completion scope", closed.scope);
    source(closed.source);
  }
  if (vision.changes.length === 0) issues.push("Retain the direction history");
  let previousDate = "";
  for (const change of vision.changes) {
    identity(change.id);
    if (!date(change.on) || change.on > vision.reviewedOn || change.on < previousDate) {
      issues.push(`Invalid change chronology: ${change.id}`);
    }
    previousDate = change.on;
    text("previous direction", change.before);
    text("new direction", change.after);
    text("change reason", change.reason);
    source(change.source);
  }
  return issues;
}

export function visionNeedsReview(reviewedOn: string, now: Date): boolean {
  const elapsed = now.getTime() - Date.parse(`${reviewedOn}T00:00:00Z`);
  return !Number.isFinite(elapsed) || elapsed < 0 || elapsed >= 7 * 86_400_000;
}
