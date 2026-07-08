import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKatexQuadFrame,
  createKatexWebGLRenderer
} from "../src/rendering/katex-webgl-transition.ts";
import type {
  KatexAtlasRegion,
  KatexMatchedToken,
  KatexMotionToken,
  KatexTextureAtlas,
  KatexTransitionPlan
} from "../src/rendering/katex-transition-types.ts";

test("createKatexQuadFrame interpolates matched token position and opacity", () => {
  const source = token("s-x", 10, 20, 8, 12);
  const target = token("t-x", 50, 80, 16, 24);
  const region: KatexAtlasRegion = {
    tokenId: source.id,
    page: 0,
    x: 0,
    y: 0,
    width: 8,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5
  };

  const frame = createKatexQuadFrame(
    {
      matched: [{ source, target } satisfies KatexMatchedToken],
      sourceOnly: [],
      targetOnly: [],
      diagnostics: {
        sourceTokenCount: 1,
        targetTokenCount: 1,
        matchedCount: 1,
        sourceOnlyCount: 0,
        targetOnlyCount: 0,
        ambiguousGroupCount: 0
      }
    },
    new Map([[source.id, region]]),
    0.5
  );

  assert.equal(frame.quads.length, 1);
  assert.deepEqual(frame.quads[0]?.rect, {
    left: 30,
    top: 50,
    width: 12,
    height: 18
  });
  assert.equal(frame.quads[0]?.opacity, 1);
});

test("createKatexQuadFrame fades source-only and target-only tokens", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const target = token("t-one", 50, 80, 8, 12);
  const regions = new Map<string, KatexAtlasRegion>([
    [source.id, regionFor(source.id)],
    [target.id, regionFor(target.id)]
  ]);

  const frame = createKatexQuadFrame(
    {
      matched: [],
      sourceOnly: [{ source }],
      targetOnly: [{ target }],
      diagnostics: {
        sourceTokenCount: 1,
        targetTokenCount: 1,
        matchedCount: 0,
        sourceOnlyCount: 1,
        targetOnlyCount: 1,
        ambiguousGroupCount: 0
      }
    },
    regions,
    0.25
  );

  assert.deepEqual(
    frame.quads.map((quad) => [quad.tokenId, quad.opacity]),
    [
      ["s-minus", 0.75],
      ["t-one", 0.25]
    ]
  );
});

test("katex-webgl-transition does not import Three.js", () => {
  const source = readFileSync(
    new URL("../src/rendering/katex-webgl-transition.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from "three"|from 'three'/);
});

test("createKatexWebGLRenderer uploads DPR-scaled quads and binds page textures", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const target = token("t-one", 50, 80, 6, 10);
  const gl = new FakeWebGLRenderingContext();
  const renderer = createKatexWebGLRenderer(
    fakeCanvas(gl, 200, 100),
    transitionPlan({
      sourceOnly: [{ source }],
      targetOnly: [{ target }]
    }),
    textureAtlas([
      regionFor(source.id, { page: 0, u0: 0, v0: 0, u1: 0.25, v1: 0.5 }),
      regionFor(target.id, { page: 1, u0: 0.5, v0: 0, u1: 0.75, v1: 0.5 })
    ])
  );

  renderer.render(0.25);

  assert.deepEqual(gl.viewports, [[0, 0, 200, 100]]);
  assert.equal(gl.createdTextures.length, 2);
  assert.deepEqual(gl.drawTextureIds, [1, 2]);
  assert.deepEqual(gl.uniform2fCalls.get("u_resolution"), [
    [200, 100],
    [200, 100]
  ]);
  assert.deepEqual(gl.uniform1fCalls.get("u_opacity"), [0.75, 0.25]);
  assert.deepEqual(gl.uniform1iCalls.get("u_texture"), [0]);
  assert.deepEqual(gl.activeTextureCalls, [gl.TEXTURE0]);
  assert.deepEqual(
    Array.from(gl.bufferUploads[0] ?? []),
    [
      20, 40, 0, 0,
      36, 40, 0.25, 0,
      20, 64, 0, 0.5,
      20, 64, 0, 0.5,
      36, 40, 0.25, 0,
      36, 64, 0.25, 0.5
    ]
  );
});

test("createKatexWebGLRenderer dispose is idempotent and render after dispose is a no-op", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const gl = new FakeWebGLRenderingContext();
  const renderer = createKatexWebGLRenderer(
    fakeCanvas(gl, 200, 100),
    transitionPlan({ sourceOnly: [{ source }] }),
    textureAtlas([regionFor(source.id)])
  );

  renderer.render(0);
  renderer.dispose();
  renderer.dispose();
  renderer.render(0.5);

  assert.equal(gl.drawArraysCalls.length, 1);
  assert.deepEqual(gl.deletedTextureIds, [1]);
  assert.deepEqual(gl.deletedBufferIds, [1]);
  assert.deepEqual(gl.deletedProgramIds, [1]);
});

test("createKatexWebGLRenderer cleans up partial initialization failures", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const gl = new FakeWebGLRenderingContext();

  gl.failCreateBuffer = true;

  assert.throws(
    () =>
      createKatexWebGLRenderer(
        fakeCanvas(gl, 200, 100),
        transitionPlan({ sourceOnly: [{ source }] }),
        textureAtlas([regionFor(source.id), regionFor("unused", { page: 1 })])
      ),
    /Could not create a WebGL buffer/
  );

  assert.deepEqual(gl.deletedTextureIds, [1, 2]);
  assert.deepEqual(gl.deletedProgramIds, [1]);
});

test("createKatexWebGLRenderer deletes partial texture when atlas upload fails", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const gl = new FakeWebGLRenderingContext();

  gl.failTexImage2DOnTextureId = 2;

  assert.throws(
    () =>
      createKatexWebGLRenderer(
        fakeCanvas(gl, 200, 100),
        transitionPlan({ sourceOnly: [{ source }] }),
        textureAtlas([regionFor(source.id), regionFor("unused", { page: 1 })])
      ),
    /texture upload failed/
  );

  assert.deepEqual(gl.deletedTextureIds, [2, 1]);
  assert.deepEqual(gl.deletedProgramIds, [1]);
  assert.deepEqual(gl.deletedBufferIds, []);
});

test("createKatexWebGLRenderer deletes vertex shader when fragment shader compilation fails", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const gl = new FakeWebGLRenderingContext();

  gl.failFragmentShaderCompile = true;

  assert.throws(
    () =>
      createKatexWebGLRenderer(
        fakeCanvas(gl, 200, 100),
        transitionPlan({ sourceOnly: [{ source }] }),
        textureAtlas([regionFor(source.id)])
      ),
    /fragment compile failed/
  );

  assert.deepEqual(gl.deletedShaderIds, [2, 1]);
  assert.deepEqual(gl.deletedProgramIds, []);
  assert.deepEqual(gl.deletedTextureIds, []);
});

test("createKatexWebGLRenderer deletes compiled shaders when program creation fails", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const gl = new FakeWebGLRenderingContext();

  gl.failCreateProgram = true;

  assert.throws(
    () =>
      createKatexWebGLRenderer(
        fakeCanvas(gl, 200, 100),
        transitionPlan({ sourceOnly: [{ source }] }),
        textureAtlas([regionFor(source.id)])
      ),
    /Could not create a WebGL program/
  );

  assert.deepEqual(gl.deletedShaderIds, [1, 2]);
  assert.deepEqual(gl.deletedProgramIds, []);
  assert.deepEqual(gl.deletedTextureIds, []);
});

function token(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number
): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left, top, width, height },
    localRect: { left, top, width, height },
    row: 0
  };
}

function regionFor(
  tokenId: string,
  overrides: Partial<Omit<KatexAtlasRegion, "tokenId">> = {}
): KatexAtlasRegion {
  return {
    tokenId,
    page: 0,
    x: 0,
    y: 0,
    width: 8,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5,
    ...overrides
  };
}

function transitionPlan(
  entries: Partial<Pick<KatexTransitionPlan, "matched" | "sourceOnly" | "targetOnly">>
): KatexTransitionPlan {
  const matched = entries.matched ?? [];
  const sourceOnly = entries.sourceOnly ?? [];
  const targetOnly = entries.targetOnly ?? [];

  return {
    matched,
    sourceOnly,
    targetOnly,
    diagnostics: {
      sourceTokenCount: matched.length + sourceOnly.length,
      targetTokenCount: matched.length + targetOnly.length,
      matchedCount: matched.length,
      sourceOnlyCount: sourceOnly.length,
      targetOnlyCount: targetOnly.length,
      ambiguousGroupCount: 0
    }
  };
}

function textureAtlas(regions: readonly KatexAtlasRegion[]): KatexTextureAtlas {
  const pageCount = Math.max(1, Math.max(...regions.map((region) => region.page)) + 1);

  return {
    width: 64,
    height: 64,
    pixelRatio: 2,
    pages: Array.from({ length: pageCount }, () => ({}) as HTMLCanvasElement),
    regions: new Map(regions.map((region) => [region.tokenId, region]))
  };
}

function fakeCanvas(
  gl: FakeWebGLRenderingContext,
  width: number,
  height: number
): HTMLCanvasElement {
  return {
    width,
    height,
    getContext(contextId: string) {
      assert.equal(contextId, "webgl");

      return gl;
    }
  } as unknown as HTMLCanvasElement;
}

interface FakeResource {
  id: number;
}

interface FakeUniformLocation {
  name: string;
}

class FakeWebGLRenderingContext {
  readonly ARRAY_BUFFER = 0x8892;
  readonly BLEND = 0x0be2;
  readonly CLAMP_TO_EDGE = 0x812f;
  readonly COLOR_BUFFER_BIT = 0x4000;
  readonly COMPILE_STATUS = 0x8b81;
  readonly FLOAT = 0x1406;
  readonly FRAGMENT_SHADER = 0x8b30;
  readonly LINEAR = 0x2601;
  readonly LINK_STATUS = 0x8b82;
  readonly ONE_MINUS_SRC_ALPHA = 0x0303;
  readonly RGBA = 0x1908;
  readonly SRC_ALPHA = 0x0302;
  readonly STREAM_DRAW = 0x88e0;
  readonly TEXTURE0 = 0x84c0;
  readonly TEXTURE_2D = 0x0de1;
  readonly TEXTURE_MAG_FILTER = 0x2800;
  readonly TEXTURE_MIN_FILTER = 0x2801;
  readonly TEXTURE_WRAP_S = 0x2802;
  readonly TEXTURE_WRAP_T = 0x2803;
  readonly TRIANGLES = 0x0004;
  readonly UNSIGNED_BYTE = 0x1401;
  readonly VERTEX_SHADER = 0x8b31;

  activeTextureCalls: number[] = [];
  bufferUploads: Float32Array[] = [];
  createdTextures: FakeResource[] = [];
  deletedBufferIds: number[] = [];
  deletedProgramIds: number[] = [];
  deletedShaderIds: number[] = [];
  deletedTextureIds: number[] = [];
  drawArraysCalls: Array<[number, number, number]> = [];
  drawTextureIds: number[] = [];
  failCreateBuffer = false;
  failCreateProgram = false;
  failFragmentShaderCompile = false;
  failTexImage2DOnTextureId: number | undefined;
  uniform1fCalls = new Map<string, number[]>();
  uniform1iCalls = new Map<string, number[]>();
  uniform2fCalls = new Map<string, number[][]>();
  viewports: number[][] = [];

  private bufferId = 0;
  private currentTexture: FakeResource | null = null;
  private programId = 0;
  private shaderId = 0;
  private textureId = 0;

  activeTexture(texture: number): void {
    this.activeTextureCalls.push(texture);
  }

  attachShader(): void {}

  bindBuffer(): void {}

  bindTexture(_target: number, texture: WebGLTexture | null): void {
    this.currentTexture = texture as FakeResource | null;
  }

  blendFunc(): void {}

  bufferData(_target: number, data: BufferSource, _usage: number): void {
    assert.ok(data instanceof Float32Array);
    this.bufferUploads.push(new Float32Array(data));
  }

  clear(): void {}

  clearColor(): void {}

  compileShader(): void {}

  createBuffer(): WebGLBuffer | null {
    if (this.failCreateBuffer) {
      return null;
    }

    return { id: ++this.bufferId } as unknown as WebGLBuffer;
  }

  createProgram(): WebGLProgram | null {
    if (this.failCreateProgram) {
      return null;
    }

    return { id: ++this.programId } as unknown as WebGLProgram;
  }

  createShader(): WebGLShader | null {
    return { id: ++this.shaderId } as unknown as WebGLShader;
  }

  createTexture(): WebGLTexture | null {
    const texture = { id: ++this.textureId };

    this.createdTextures.push(texture);

    return texture as unknown as WebGLTexture;
  }

  deleteBuffer(buffer: WebGLBuffer | null): void {
    if (buffer !== null) {
      this.deletedBufferIds.push((buffer as unknown as FakeResource).id);
    }
  }

  deleteProgram(program: WebGLProgram | null): void {
    if (program !== null) {
      this.deletedProgramIds.push((program as unknown as FakeResource).id);
    }
  }

  deleteShader(shader: WebGLShader | null): void {
    if (shader !== null) {
      this.deletedShaderIds.push((shader as unknown as FakeResource).id);
    }
  }

  deleteTexture(texture: WebGLTexture | null): void {
    if (texture !== null) {
      this.deletedTextureIds.push((texture as unknown as FakeResource).id);
    }
  }

  drawArrays(mode: number, first: number, count: number): void {
    this.drawArraysCalls.push([mode, first, count]);

    if (this.currentTexture !== null) {
      this.drawTextureIds.push(this.currentTexture.id);
    }
  }

  enable(): void {}

  enableVertexAttribArray(): void {}

  getAttribLocation(_program: WebGLProgram, name: string): number {
    return name === "a_position" ? 0 : 1;
  }

  getProgramInfoLog(): string | null {
    return null;
  }

  getProgramParameter(): boolean {
    return true;
  }

  getShaderInfoLog(): string | null {
    return this.failFragmentShaderCompile ? "fragment compile failed" : null;
  }

  getShaderParameter(shader: WebGLShader, _parameter: number): boolean {
    return !(
      this.failFragmentShaderCompile &&
      (shader as unknown as FakeResource).id === 2
    );
  }

  getUniformLocation(_program: WebGLProgram, name: string): WebGLUniformLocation | null {
    return { name } as unknown as WebGLUniformLocation;
  }

  linkProgram(): void {}

  shaderSource(): void {}

  texImage2D(): void {
    if (this.currentTexture?.id === this.failTexImage2DOnTextureId) {
      throw new Error("texture upload failed");
    }
  }

  texParameteri(): void {}

  uniform1f(location: WebGLUniformLocation | null, value: number): void {
    this.pushUniformValue(this.uniform1fCalls, location, value);
  }

  uniform1i(location: WebGLUniformLocation | null, value: number): void {
    this.pushUniformValue(this.uniform1iCalls, location, value);
  }

  uniform2f(location: WebGLUniformLocation | null, x: number, y: number): void {
    const name = this.uniformName(location);
    const values = this.uniform2fCalls.get(name) ?? [];

    values.push([x, y]);
    this.uniform2fCalls.set(name, values);
  }

  useProgram(): void {}

  vertexAttribPointer(): void {}

  viewport(x: number, y: number, width: number, height: number): void {
    this.viewports.push([x, y, width, height]);
  }

  private pushUniformValue(
    calls: Map<string, number[]>,
    location: WebGLUniformLocation | null,
    value: number
  ): void {
    const name = this.uniformName(location);
    const values = calls.get(name) ?? [];

    values.push(value);
    calls.set(name, values);
  }

  private uniformName(location: WebGLUniformLocation | null): string {
    assert.notEqual(location, null);

    return (location as unknown as FakeUniformLocation).name;
  }
}
