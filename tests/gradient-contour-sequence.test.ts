import assert from "node:assert/strict";
import test from "node:test";
import { gradientContourBeats, gradientContourBrief, gradientContourCheckpoints, gradientBeatIndex, sampleGradientContour } from "../src/tutorial/gradient-contour/gradient-contour-sequence.ts";
import { createGradientContourModel, gradientDirectionComponents, gradientLocalHeight, gradientUnitDirection } from "../src/tutorial/gradient-contour/gradient-contour-model.ts";
import { createKpSurfaceContourStageAuthority, projectKpSurfaceContourPoint } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";

const last = gradientContourBeats.length - 1;
const at = (slug: Parameters<typeof gradientBeatIndex>[0]) => sampleGradientContour(gradientBeatIndex(slug) / last);

test("explanation-led semantic stops and pure sampling preserve reverse and interrupted evidence", () => {
  assert.equal(gradientContourBeats.length, 19);
  for (const [index, progress] of gradientContourCheckpoints.entries()) {
    const expected = sampleGradientContour(progress);
    assert.ok(Math.abs(expected.position - index) < 1e-12); assert.equal(expected.fraction, `${index + 1} / ${gradientContourBeats.length}`);
    sampleGradientContour(.91); sampleGradientContour(.08);
    assert.deepEqual(sampleGradientContour(progress), expected);
  }
  assert.throws(() => sampleGradientContour(NaN), /finite/);
  assert.equal(sampleGradientContour(-1).position, 0); assert.equal(sampleGradientContour(2).position, last);
});

test("curve travel stays level; decomposition preserves equal unit directions", () => {
  for (let index = 0; index <= 100; index++) {
    const state = sampleGradientContour(index / 100);
    assert.ok(Math.abs(state.height - 1.5) < 1e-12);
    assert.ok(Math.abs(Math.hypot(state.direction.x, state.direction.y) - 1) < 1e-12);
    assert.ok(Math.abs(state.slope) <= Math.sqrt(8) + 1e-12);
    assert.equal(state.stage.level, 1.5);
  }
  assert.equal(at("level").slope, 0);
  assert.ok(Math.abs(at("components").slope - 2) < 1e-12);
  assert.ok(Math.abs(sampleGradientContour(1).slope - Math.sqrt(8)) < 1e-12);
  assert.notDeepEqual(sampleGradientContour((gradientBeatIndex("contour") + .5) / last).point, at("contour").point);
});

test("local ramp has zero along-contour rise and the same differential as the surface", () => {
  const model = createGradientContourModel(), p = model.source.point;
  for (let i = 0; i < 50; i++) {
    const angle = i * Math.PI / 25, direction = gradientUnitDirection(Math.cos(angle), Math.sin(angle));
    const c = gradientDirectionComponents(model, direction); assert.equal(c.kind, "regular");
    if (c.kind !== "regular") throw new Error("regular primary");
    assert.ok(Math.abs(c.acrossVector.x + c.alongVector.x - direction.x) < 1e-12);
    assert.ok(Math.abs(c.acrossVector.y + c.alongVector.y - direction.y) < 1e-12);
    assert.ok(Math.abs(c.across ** 2 + c.along ** 2 - 1) < 1e-12);
    assert.ok(Math.abs(c.acrossRise + c.alongRise - c.totalRise) < 1e-12);
    const across = { x: p.x + c.acrossVector.x, y: p.y + c.acrossVector.y };
    const end = { x: p.x + direction.x, y: p.y + direction.y };
    assert.ok(Math.abs(gradientLocalHeight(model, across) - gradientLocalHeight(model, end)) < 1e-12);
    const h = .001, actual = model.height({ x: p.x + h * direction.x, y: p.y + h * direction.y });
    const local = gradientLocalHeight(model, { x: p.x + h * direction.x, y: p.y + h * direction.y });
    assert.ok(Math.abs(actual - local) <= 2.01 * h * h);
  }
  const stationary = createGradientContourModel({ ...model.source, point: { x: 0, y: 0 } });
  assert.deepEqual(gradientDirectionComponents(stationary, gradientUnitDirection(1, 0)), { kind: "stationary", totalRise: 0 });
  assert.throws(() => gradientLocalHeight(model, { x: NaN, y: 0 }), /finite/);
});

test("editorial evidence resolves to beats; ramp and components are distinct from the exact contour", () => {
  for (const slug of gradientContourBrief.evidenceBeats) assert.ok(gradientContourBeats.some(beat => beat.slug === slug));
  for (const value of Object.values(gradientContourBrief)) assert.ok(value.length > 0);
  assert.equal(at("height").rampPresence, 0);
  assert.equal(at("ramp").rampPresence, 1);
  assert.equal(at("components").componentPresence, 1);
  assert.equal(at("across").components.along, 0);
  assert.equal(sampleGradientContour(1).rampPresence, 0);
});

test("bounded overlay uses the canonical swept camera without nonfinite geometry", () => {
  const authority = createKpSurfaceContourStageAuthority();
  for (let index = 0; index <= 20; index++) {
    const state = sampleGradientContour(index / 20);
    const point = projectKpSurfaceContourPoint(authority, state.stage.viewProgress, { ...state.point, z: state.height * (1 - state.stage.viewProgress) });
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    assert.ok(point.x >= 0 && point.x <= 520 && point.y >= 0 && point.y <= 300);
  }
});

test("comparison is top-down before turning, with Euclidean rather than additive length", () => {
  assert.equal(at("ramp").localViewProgress, 0);
  for (const position of [0, .2, .4, .5, .6, .8, 1].map(t => gradientBeatIndex("level") + t)) {
    const state = sampleGradientContour(position / last);
    if (state.componentPresence > 0) assert.equal(state.localViewProgress, 1);
  }
  const authority = createKpSurfaceContourStageAuthority();
  const center = projectKpSurfaceContourPoint(authority, 1, { x: 1, y: .5, z: 0 });
  const radii: number[] = [];
  for (let index = 0; index <= 32; index++) {
    const angle = index * Math.PI / 16;
    const point = projectKpSurfaceContourPoint(authority, 1, { x: 1 + Math.cos(angle), y: .5 + Math.sin(angle), z: 0 });
    radii.push(Math.hypot(point.x - center.x, point.y - center.y));
  }
  assert.ok(Math.max(...radii) - Math.min(...radii) < 1e-10);
  for (const position of [0, .25, .5, .9, 1].map(t => gradientBeatIndex("components") + t)) {
    const state = sampleGradientContour(position / last);
    assert.equal(state.localViewProgress, 1);
    assert.ok(state.components.across <= 1 + 1e-12);
    assert.ok(Math.abs(state.components.across ** 2 + state.components.along ** 2 - 1) < 1e-12);
    assert.ok(Math.abs(state.components.acrossRise - state.slope) < 1e-12);
  }
  const final = gradientContourBeats[gradientBeatIndex("dot-product")]!;
  assert.match(final.html, /dot product/);
  assert.match(final.html, /class="katex"/);
  assert.match(final.html, /<math/);
  assert.doesNotMatch(final.html, /katex-error/);
});

test("prerequisite meanings precede their use and static reasoning holds its evidence", () => {
  const index = gradientBeatIndex;
  const chain = ["height", "east", "north", "linear-change", "gradient", "projection", "components", "across", "dot-product", "general-projection", "contour", "tangent"] as const;
  for (let i = 1; i < chain.length; i++) assert.ok(index(chain[i - 1]!) < index(chain[i]!));
  for (const slug of ["east", "north", "linear-change", "general-projection", "magnitude"] as const) {
    const before = sampleGradientContour((index(slug) - .5) / last), endpoint = at(slug);
    assert.deepEqual(before.direction, endpoint.direction);
    assert.deepEqual(before.stage, endpoint.stage);
    assert.equal(before.rampPresence, endpoint.rampPresence);
  }
  for (const beat of gradientContourBeats) assert.doesNotMatch(beat.html, /katex-error/);
  assert.match(gradientContourBeats[index("linear-change")]!.html, /diagonal move is longer/);
  assert.match(gradientContourBeats[index("projection")]!.html, /drop a perpendicular/);
  assert.match(gradientContourBeats[index("general-projection")]!.html, /length times/);
});
