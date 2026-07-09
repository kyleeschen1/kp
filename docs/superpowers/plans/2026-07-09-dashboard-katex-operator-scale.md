# Dashboard KaTeX Operator Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dashboard slider that controls the rendered size of KaTeX binary operators such as plus, minus, and times.

**Architecture:** The dashboard renderer will expose a `Visual Tuning` panel with a live KaTeX sample and a 50-150 percent range input. `src/main.ts` will keep the current runtime value, pass it into dashboard rendering, and write `--kp-katex-operator-scale` to the document root. CSS will apply that variable to `.katex .mbin`.

**Tech Stack:** TypeScript, KaTeX render-to-string, Vite DOM event delegation, Playwright browser tests, Node unit tests.

---

### Task 1: Dashboard Markup And Unit Coverage

**Files:**
- Modify: `tests/project-dashboard.test.ts`
- Modify: `src/project-dashboard/render.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that `renderProjectDashboard(projectDashboardData, { katexOperatorScalePercent: 85 })` renders:

```ts
assert.match(html, /data-kp-visual-tuning/);
assert.match(html, /Visual Tuning/);
assert.match(html, /data-action="set-katex-operator-scale"/);
assert.match(html, /min="50"/);
assert.match(html, /max="150"/);
assert.match(html, /step="1"/);
assert.match(html, /value="85"/);
assert.match(html, /data-role="katex-operator-scale-output">85%/);
assert.match(html, /data-kp-katex-operator-sample/);
assert.match(html, /class="katex/);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```sh
node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts
```

Expected: FAIL because the visual tuning panel is not rendered yet.

- [ ] **Step 3: Implement minimal renderer support**

Add `katexOperatorScalePercent?: number` to `ProjectDashboardRenderOptions`, render a `Visual Tuning` section, and use `renderLatexToHtml("x + 3 - 3 = 7 - 3")` for the live sample.

- [ ] **Step 4: Verify the focused test passes**

Run:

```sh
node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts
```

Expected: PASS.

### Task 2: Runtime Wiring And Browser Coverage

**Files:**
- Modify: `tests/project-dashboard.browser.spec.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing browser assertions**

In the dashboard browser round-trip test, set the slider to `92`, expect the root custom property to become `0.92em`, then return to the editor and expect the setting to remain applied.

- [ ] **Step 2: Run browser test and verify it fails**

Run:

```sh
npm run test:browser:dashboard
```

Expected: FAIL because the slider event is not wired yet.

- [ ] **Step 3: Implement runtime setting and CSS**

Add a runtime `katexOperatorScalePercent` variable in `src/main.ts`, pass it to `renderProjectDashboard`, handle `data-action="set-katex-operator-scale"` input events, update the dashboard output, and set `document.documentElement.style.setProperty("--kp-katex-operator-scale", "<scale>em")`. Add CSS defaults and `.katex .mbin` styling.

- [ ] **Step 4: Verify browser and full focused checks**

Run:

```sh
npm run test:browser:dashboard
node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts tests/editor.test.ts
npm run typecheck
```

Expected: PASS.
