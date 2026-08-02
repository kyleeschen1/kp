import type {
  KpProgrammingAdditionRuntimeFrame,
  KpProgrammingAdditionSourceFocusFrame
} from "../animation/programming-addition-runtime-frame.ts";

export function renderKpProgrammingAdditionTraceHtml(
  frame: KpProgrammingAdditionRuntimeFrame
): string {
  return `
    <section class="editor-programming-trace" data-kp-editor-programming-trace="${escapeHtml(frame.traceId)}" data-kp-editor-programming-step="${escapeHtml(frame.stepId)}" data-kp-editor-programming-mode="${frame.control.mode}" data-kp-editor-programming-semantic-progress="${frame.semanticProgress}" aria-label="${escapeHtml(frame.accessibleDescription)}">
      <header class="editor-programming-trace__file">
        <span>${escapeHtml(frame.sourceFile.path ?? frame.sourceFile.label)}</span>
        <span>${escapeHtml(frame.sourceFile.language)}</span>
      </header>
      <div class="editor-programming-trace__body">
        <div class="editor-programming-trace__source" aria-label="Source code">
          <ol>${frame.sourceFile.lines.map((line, index) =>
            renderSourceLine(line, index + 1, frame.activeSourceRanges)
          ).join("")}</ol>
        </div>
        <aside class="editor-programming-trace__state" aria-label="Execution state">
          <div class="editor-programming-trace__current">
            <span>Step ${frame.stepIndex + 1} of 4</span>
            <h3>${escapeHtml(stepLabel(frame.stepKind))}</h3>
            <p>${escapeHtml(frame.summary)}</p>
          </div>
          ${renderStateGroup(
            "Stack",
            "stack",
            frame.stack.map(({ functionName }) => `${functionName}()`)
          )}
          ${renderStateGroup(
            "Locals",
            "locals",
            frame.locals.map(({ name, value }) => `${name} = ${value}`)
          )}
          ${renderStateGroup("Output", "output", frame.output)}
        </aside>
      </div>
      <p class="editor-animation-player__visually-hidden" data-kp-editor-programming-accessible-state aria-live="polite">${escapeHtml(frame.accessibleDescription)}</p>
    </section>
  `;
}

function renderSourceLine(
  line: string,
  lineNumber: number,
  activeRanges: readonly KpProgrammingAdditionSourceFocusFrame[]
): string {
  const range = activeRanges.find(({ start }) => start[0] === lineNumber);
  const content = range === undefined
    ? escapeHtml(line.length === 0 ? " " : line)
    : emphasizeExactRange(line, range);

  return `<li data-kp-editor-programming-source-line="${lineNumber}" data-kp-editor-programming-source-active="${range !== undefined}"><code>${content}</code></li>`;
}

function emphasizeExactRange(
  line: string,
  range: KpProgrammingAdditionSourceFocusFrame
): string {
  const start = Math.max(0, range.start[1] - 1);
  const exact = line.slice(start, start + range.exactText.length);
  if (exact !== range.exactText) {
    throw new Error(
      `Source range ${range.selectorId} no longer matches its exact text.`
    );
  }
  const before = line.slice(0, start);
  const after = line.slice(start + range.exactText.length);
  return `${escapeHtml(before)}<mark data-kp-editor-programming-source-focus="${escapeHtml(range.selectorId)}">${escapeHtml(exact)}</mark>${escapeHtml(after)}`;
}

function renderStateGroup(
  label: string,
  channel: "stack" | "locals" | "output",
  values: readonly string[]
): string {
  return `
    <div class="editor-programming-trace__state-group" data-kp-editor-programming-channel="${channel}">
      <h3>${label}</h3>
      ${values.length === 0
        ? `<p class="editor-programming-trace__empty">—</p>`
        : `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`}
    </div>
  `;
}

function stepLabel(kind: KpProgrammingAdditionRuntimeFrame["stepKind"]): string {
  switch (kind) {
    case "call": return "Call add";
    case "evaluate": return "Evaluate return";
    case "return": return "Return value";
    case "output": return "Show output";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
