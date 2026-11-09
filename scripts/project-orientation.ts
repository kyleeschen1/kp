import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { projectVision } from "../src/project-dashboard/vision-data.ts";
import { validateProjectVision, type ProjectVision } from "../src/project-dashboard/vision-model.ts";
import { describeVisionExecution, readVisionExecution } from "../src/project-dashboard/vision-execution.ts";

export const orientationPaths = {
  roadmap: "docs/project/roadmap.md",
  strategy: "docs/project/strategy.md"
} as const;
export type OrientationDocuments = Record<"roadmap" | "strategy" | "thread", string>;

export function activeOrientationThread(roadmap: string): string {
  const rows = roadmap.split("\n").filter(line => line.startsWith("Active Thread: "));
  const path = rows[0]?.slice("Active Thread: ".length).replaceAll("`", "").trim();
  if (rows.length !== 1 || !path || !/^threads\/[a-z0-9][a-z0-9/-]*\.md$/.test(path)) {
    throw new Error("Roadmap must select one repository-local active thread");
  }
  return `docs/project/${path}`;
}

/** Bound the default retrieval path and compare identities, not duplicate prose.
 * Semantic accuracy still requires source review at each pivot or handoff. */
export function checkOrientationDocuments(vision: ProjectVision, docs: OrientationDocuments): readonly string[] {
  const issues = [...validateProjectVision(vision)];
  const field = (document: string, label: string, expected: string) => {
    const rows = document.split("\n").filter(line => line.startsWith(`${label}: `));
    if (rows.length !== 1 || rows[0]?.slice(label.length + 2).replaceAll("`", "").trim() !== expected) {
      issues.push(`Orientation drift: ${label} must identify ${expected}`);
    }
  };
  field(docs.roadmap, "Direction", vision.directionId);
  field(docs.strategy, "Direction", vision.directionId);
  try { activeOrientationThread(docs.roadmap); }
  catch (error) { issues.push(error instanceof Error ? error.message : String(error)); }
  field(docs.roadmap, "Current Commitment", vision.commitment.id);
  field(docs.roadmap, "Execution Contract", vision.commitment.contractId);
  const next = vision.areas.find(area => area.horizon === "next");
  if (next) field(docs.roadmap, "Next Product Milestone", next.outcome.id);
  if (next) field(docs.roadmap, "Milestone Authority", next.outcome.authority);
  const limits = { roadmap: 650, strategy: 900, thread: 450 };
  for (const key of Object.keys(limits) as (keyof OrientationDocuments)[]) {
    const words = countWords(docs[key]);
    if (words > limits[key]) issues.push(`${key} exceeds its ${limits[key]}-word startup budget (${words}); move history out of the entrypoint.`);
  }
  return issues;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function inspectProjectOrientation(root = process.cwd(), vision = projectVision) {
  const roadmap = readFileSync(resolve(root, orientationPaths.roadmap), "utf8");
  const paths = { ...orientationPaths, thread: activeOrientationThread(roadmap) };
  const docs: OrientationDocuments = {
    roadmap,
    strategy: readFileSync(resolve(root, orientationPaths.strategy), "utf8"),
    thread: readFileSync(resolve(root, paths.thread), "utf8")
  };
  const issues = [...checkOrientationDocuments(vision, docs)];
  const sources = [vision.productSource, vision.commitment.source,
    ...vision.areas.flatMap(area => [area.evidence, area.outcome.source]),
    ...vision.completed.map(item => item.source), ...vision.changes.map(item => item.source)];
  for (const source of sources) {
    if (!existsSync(resolve(root, source.href))) issues.push(`Missing vision source: ${source.href}`);
  }
  for (const key of Object.keys(paths) as (keyof OrientationDocuments)[]) {
    // Check the small entrypoints only. Historical corpus repair is not required
    // merely to preserve an exact snapshot of its previous state.
    for (const match of docs[key].matchAll(/\]\(([^)]+\.md)(?:#[^)]*)?\)/g)) {
      const target = match[1];
      if (target && !target.includes("://") && !existsSync(resolve(root, dirname(paths[key]), target))) {
        issues.push(`Broken entrypoint link in ${paths[key]}: ${target}`);
      }
    }
  }
  const path = `docs/theseus/nodes/run-contracts/${vision.commitment.contractId}.json`;
  let execution;
  try {
    const raw: unknown = JSON.parse(readFileSync(resolve(root, path), "utf8"));
    execution = readVisionExecution(raw, vision.commitment.contractId);
    if (!hasApprovalReference(raw, vision.commitment.source.href)) {
      issues.push("Selected execution record must reference the approved delivery source");
    }
  } catch (error) {
    issues.push(`Execution unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  return { issues, execution, documents: Object.entries(docs).map(([key, text]) => ({
    path: paths[key as keyof OrientationDocuments], words: countWords(text)
  })) };
}

function hasApprovalReference(value: unknown, path: string): boolean {
  if (typeof value !== "object" || value === null || !("sourceRefs" in value) || !Array.isArray(value.sourceRefs)) return false;
  return value.sourceRefs.some((ref: unknown) => typeof ref === "object" && ref !== null && "path" in ref && ref.path === path);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    if (process.argv.slice(2).some(arg => arg !== "--check")) throw new Error("Use project:orientation with optional --check");
    const report = inspectProjectOrientation();
    if (report.issues.length) throw new Error(report.issues.join("\n"));
    if (process.argv.includes("--check")) {
      process.stdout.write(`Orientation sources agree · ${report.documents.map(doc => `${doc.words} words: ${doc.path}`).join(" · ")}\n`);
    } else {
      const next = projectVision.areas.find(area => area.horizon === "next");
      process.stdout.write([
        `DIRECTION · ${projectVision.northStar}`,
        projectVision.productProof,
        `APPROVED SCOPE · ${projectVision.commitment.title}`,
        `Finish: ${projectVision.commitment.finish}`,
        `EXECUTION · ${report.execution ? describeVisionExecution(report.execution) : "Unavailable"}`,
        `Read now from ${projectVision.commitment.contractId}; no global task election or health claim.`,
        `PROPOSED NEXT · ${next?.outcome.title}`,
        `UNCERTAINTY · ${projectVision.uncertainty}`,
        `NEXT JUDGMENT · ${projectVision.nextJudgment}`,
        "Read docs/project/roadmap.md and its active thread; strategy.md supplies rationale.",
        "Dashboard: /?view=dashboard#project-vision",
        "Task ownership: Theseus / parallel agent. This command is read-only."
      ].join("\n\n") + "\n");
    }
  } catch (error) {
    process.stderr.write(`Orientation check failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
