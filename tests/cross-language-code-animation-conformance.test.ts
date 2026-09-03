import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpPythonRefactorTokenProgram,
  sampleKpPythonRefactorTokenTheater
} from "../src/animation/python-refactor-token-theater.ts";
import { sampleKpPythonRefactorMotionFrame } from
  "../src/animation/python-refactor-motion-frame.ts";
import {
  createKpTypeScriptRefactorTokenProgram,
  sampleKpTypeScriptRefactorTokenTheater
} from "../src/animation/typescript-refactor-token-theater.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from
  "../src/animation/typescript-refactor-motion-frame.ts";
import { createKpPythonFreeShippingAnimationAsset } from
  "../src/semantic/python-free-shipping-animation-asset.ts";
import { createKpPythonRefactorSourceProjections } from
  "../src/semantic/python-refactor-source-projections.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { createKpTypeScriptRefactorSourceProjections } from
  "../src/semantic/typescript-refactor-source-projections.ts";
import { kpCodeSourceDomOpticalProfile } from
  "../src/rendering/code-source-dom-optical-profile.ts";
import { kpPythonRefactorPaintRoleContract } from
  "../src/rendering/python-refactor-paint-role-contract.ts";
import { kpTypeScriptRefactorPaintRoleContract } from
  "../src/rendering/typescript-refactor-paint-role-contract.ts";

const typescript = createKpTypeScriptFreeShippingAnimationAsset();
const python = createKpPythonFreeShippingAnimationAsset();
const typescriptProgram = createKpTypeScriptRefactorTokenProgram(typescript.semantics);
const pythonProgram = createKpPythonRefactorTokenProgram(python.semantics);
const progressPoints = Object.freeze(Array.from({ length: 101 }, (_, index) => index / 100));

test("both callers preserve complete language-owned source at every settled checkpoint", () => {
  const cases = [
    {
      projections: createKpTypeScriptRefactorSourceProjections(typescript.semantics),
      before: typescript.staticEndpoints.before,
      after: typescript.staticEndpoints.after,
      language: "TypeScript"
    },
    {
      projections: createKpPythonRefactorSourceProjections(python.semantics),
      before: python.staticEndpoints.before,
      after: python.staticEndpoints.after,
      language: "Python"
    }
  ] as const;

  for (const candidate of cases) {
    assert.equal(candidate.projections[0]?.sourceText, candidate.before, candidate.language);
    assert.equal(candidate.projections.at(-1)?.sourceText, candidate.after, candidate.language);
    candidate.projections.forEach((projection) => {
      assert.match(projection.sourceText, /\S/u);
      projection.entities.forEach((entity) => {
        assert.match(
          projection.sourceText.slice(
            entity.sourceRange.startOffset,
            entity.sourceRange.endOffset
          ),
          /\S/u
        );
      });
    });
  }
});

test("dense seek and reverse samples retain one accessible native owner", () => {
  const typeScriptFrames = progressPoints.map((progress) =>
    sampleKpTypeScriptRefactorMotionFrame({ score: typescript.score, progress })
  );
  const pythonFrames = progressPoints.map((progress) =>
    sampleKpPythonRefactorMotionFrame({ score: python.score, progress })
  );

  assert.deepEqual(
    [...progressPoints].reverse().map((progress) =>
      sampleKpTypeScriptRefactorMotionFrame({ score: typescript.score, progress })
    ).reverse(),
    typeScriptFrames
  );
  assert.deepEqual(
    [...progressPoints].reverse().map((progress) =>
      sampleKpPythonRefactorMotionFrame({ score: python.score, progress })
    ).reverse(),
    pythonFrames
  );

  for (const frames of [typeScriptFrames, pythonFrames]) {
    frames.forEach((frame) => {
      const totalOpacity = frame.projections.reduce((sum, projection) =>
        sum + projection.opacity, 0);
      // Each projection is independently rounded for stable DOM paint, so the
      // aggregate may differ by one last-place unit without creating a gap.
      assert.ok(Math.abs(totalOpacity - 1) <= 0.00011, String(totalOpacity));
      assert.ok(frame.projections.some(({ id }) => id === frame.accessibleProjectionId));
    });
  }
});

test("token theaters are deterministic, inactive at endpoints, and absent in reduced motion", () => {
  const typeScriptSamples = progressPoints.map((progress) =>
    sampleKpTypeScriptRefactorTokenTheater({
      program: typescriptProgram,
      plan: typescript.motionPlan,
      score: typescript.score,
      progress
    })
  );
  const pythonSamples = progressPoints.map((progress) =>
    sampleKpPythonRefactorTokenTheater({
      program: pythonProgram,
      plan: python.motionPlan,
      score: python.score,
      progress
    })
  );

  assert.equal(typeScriptSamples[0]?.active, false);
  assert.equal(typeScriptSamples.at(-1)?.active, false);
  assert.equal(pythonSamples[0]?.active, false);
  assert.equal(pythonSamples.at(-1)?.active, false);
  assert.ok(typeScriptSamples.some(({ active }) => active));
  assert.ok(pythonSamples.some(({ active }) => active));

  progressPoints.forEach((progress) => {
    assert.deepEqual(sampleKpTypeScriptRefactorTokenTheater({
      program: typescriptProgram,
      plan: typescript.motionPlan,
      score: typescript.score,
      progress,
      reducedMotion: true
    }).tokens, []);
    assert.deepEqual(sampleKpPythonRefactorTokenTheater({
      program: pythonProgram,
      plan: python.motionPlan,
      score: python.score,
      progress,
      reducedMotion: true
    }).tokens, []);
  });
});

test("the approved callers share optical theme tokens without sharing language syntax", async () => {
  assert.equal(
    kpPythonRefactorPaintRoleContract.profileId,
    kpCodeSourceDomOpticalProfile.id
  );
  assert.equal(
    kpTypeScriptRefactorPaintRoleContract.profileId,
    kpCodeSourceDomOpticalProfile.id
  );
  assert.deepEqual(
    Object.fromEntries([
      "foreground.primary",
      "syntax.keyword",
      "syntax.function",
      "syntax.number",
      "syntax.string",
      "focus.wash"
    ].map((role) => [
      role,
      kpCodeSourceDomOpticalProfile.endpoints.dark.values[
        role as keyof typeof kpCodeSourceDomOpticalProfile.endpoints.dark.values
      ]
    ])),
    {
      "foreground.primary": "#ede8d0",
      "syntax.keyword": "#9099d9",
      "syntax.function": "#338fff",
      "syntax.number": "#ede8d0",
      "syntax.string": "#82b0ec",
      "focus.wash": "rgb(92 173 255 / 10%)"
    }
  );

  const [pythonCss, typeScriptCss] = await Promise.all([
    readFile(
      new URL("../src/editor/programming-surface.css", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/rendering/typescript-refactor.css", import.meta.url),
      "utf8"
    )
  ]);
  for (const [css, language] of [
    [pythonCss, "python"],
    [typeScriptCss, "typescript"]
  ] as const) {
    for (const [alias, role] of [
      ["foreground", "foreground-primary"],
      ["keyword", "syntax-keyword"],
      ["function", "syntax-function"],
      ["string", "syntax-string"],
      ["highlight-background", "focus-wash"]
    ] as const) {
      assert.match(
        css,
        new RegExp(`--kp-code-${alias}: var\\(--kp-${language}-paint-${role}\\)`)
      );
    }
  }
  const css = `${pythonCss}\n${typeScriptCss}`;
  assert.match(css, /data-kp-typescript-syntax-kind/u);
  assert.match(css, /data-kp-python-syntax-kind/u);

  const schemeCss = await readFile(
    new URL("../src/rendering/scheme-factorial-first-expansion-html.ts", import.meta.url),
    "utf8"
  );
  assert.match(
    schemeCss,
    /--kp-scheme-code-number: var\(--kp-code-number, var\(--kp-scheme-ink\)\)/u
  );
});
