import type {
  KatexAtlasRegion,
  KatexTextureAtlas,
  KatexTokenRect,
  KatexTransitionPlan
} from "./katex-transition-types.ts";

export interface KatexQuad {
  tokenId: string;
  rect: KatexTokenRect;
  opacity: number;
  region: KatexAtlasRegion;
}

export interface KatexQuadFrame {
  quads: readonly KatexQuad[];
}

export interface KatexWebGLRenderer {
  render(progress: number): void;
  dispose(): void;
}

interface KatexWebGLProgramInfo {
  program: WebGLProgram;
  positionLocation: number;
  texCoordLocation: number;
  resolutionLocation: WebGLUniformLocation;
  opacityLocation: WebGLUniformLocation;
  textureLocation: WebGLUniformLocation;
}

export function createKatexQuadFrame(
  plan: KatexTransitionPlan,
  regions: ReadonlyMap<string, KatexAtlasRegion>,
  progress: number
): KatexQuadFrame {
  const clampedProgress = clamp(progress, 0, 1);
  const quads: KatexQuad[] = [];

  for (const match of plan.matched) {
    const region = regions.get(match.source.id);

    if (region !== undefined) {
      quads.push({
        tokenId: match.source.id,
        rect: interpolateRect(match.source.localRect, match.target.localRect, clampedProgress),
        opacity: 1,
        region
      });
    }
  }

  for (const entry of plan.sourceOnly) {
    const region = regions.get(entry.source.id);

    if (region !== undefined) {
      quads.push({
        tokenId: entry.source.id,
        rect: entry.source.localRect,
        opacity: 1 - clampedProgress,
        region
      });
    }
  }

  for (const entry of plan.targetOnly) {
    const region = regions.get(entry.target.id);

    if (region !== undefined) {
      quads.push({
        tokenId: entry.target.id,
        rect: entry.target.localRect,
        opacity: clampedProgress,
        region
      });
    }
  }

  return { quads };
}

export function createKatexWebGLRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexTransitionPlan,
  atlas: KatexTextureAtlas
): KatexWebGLRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: true
  });

  if (gl === null) {
    throw new Error("WebGL is unavailable for KaTeX transitions.");
  }

  let programInfo: KatexWebGLProgramInfo | undefined;
  let buffer: WebGLBuffer | null = null;
  const textures: WebGLTexture[] = [];

  try {
    programInfo = createProgram(gl);

    for (const page of atlas.pages) {
      textures.push(createTexture(gl, page));
    }

    buffer = gl.createBuffer();

    if (buffer === null) {
      throw new Error("Could not create a WebGL buffer for KaTeX transitions.");
    }
  } catch (error) {
    for (const texture of textures) {
      gl.deleteTexture(texture);
    }

    if (buffer !== null) {
      gl.deleteBuffer(buffer);
    }

    if (programInfo !== undefined) {
      gl.deleteProgram(programInfo.program);
    }

    throw error;
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let disposed = false;

  return {
    render(progress) {
      if (disposed) {
        return;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(programInfo.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(programInfo.textureLocation, 0);

      const frame = createKatexQuadFrame(plan, atlas.regions, progress);

      for (const quad of frame.quads) {
        const texture = textures[quad.region.page];

        if (texture === undefined) {
          continue;
        }

        drawQuad(gl, programInfo, texture, canvas, quad, atlas.pixelRatio);
      }
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;

      for (const texture of textures) {
        gl.deleteTexture(texture);
      }

      gl.deleteBuffer(buffer);
      gl.deleteProgram(programInfo.program);
    }
  };
}

function interpolateRect(
  source: KatexTokenRect,
  target: KatexTokenRect,
  progress: number
): KatexTokenRect {
  return {
    left: interpolate(source.left, target.left, progress),
    top: interpolate(source.top, target.top, progress),
    width: interpolate(source.width, target.width, progress),
    height: interpolate(source.height, target.height, progress)
  };
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createProgram(gl: WebGLRenderingContext): KatexWebGLProgramInfo {
  let vertexShader: WebGLShader | undefined;
  let fragmentShader: WebGLShader | undefined;

  try {
    vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        uniform vec2 u_resolution;
        varying vec2 v_texCoord;
        void main() {
          vec2 zeroToOne = a_position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;
          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `
    );
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_opacity;
        varying vec2 v_texCoord;
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          gl_FragColor = vec4(color.rgb, color.a * u_opacity);
        }
      `
    );
  } catch (error) {
    if (vertexShader !== undefined) {
      gl.deleteShader(vertexShader);
    }

    if (fragmentShader !== undefined) {
      gl.deleteShader(fragmentShader);
    }

    throw error;
  }

  const program = gl.createProgram();

  if (program === null) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Could not create a WebGL program for KaTeX transitions.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown WebGL program link error.";

    gl.deleteProgram(program);
    throw new Error(message);
  }

  try {
    return {
      program,
      positionLocation: getAttribLocation(gl, program, "a_position"),
      texCoordLocation: getAttribLocation(gl, program, "a_texCoord"),
      resolutionLocation: getUniformLocation(gl, program, "u_resolution"),
      opacityLocation: getUniformLocation(gl, program, "u_opacity"),
      textureLocation: getUniformLocation(gl, program, "u_texture")
    };
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);

  if (shader === null) {
    throw new Error("Could not create a WebGL shader for KaTeX transitions.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown WebGL shader compile error.";

    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function getAttribLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): number {
  const location = gl.getAttribLocation(program, name);

  if (location < 0) {
    throw new Error(`Could not find WebGL attribute ${name} for KaTeX transitions.`);
  }

  return location;
}

function getUniformLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);

  if (location === null) {
    throw new Error(`Could not find WebGL uniform ${name} for KaTeX transitions.`);
  }

  return location;
}

function createTexture(
  gl: WebGLRenderingContext,
  source: HTMLCanvasElement
): WebGLTexture {
  const texture = gl.createTexture();

  if (texture === null) {
    throw new Error("Could not create a WebGL texture for KaTeX transitions.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

  return texture;
}

function drawQuad(
  gl: WebGLRenderingContext,
  programInfo: KatexWebGLProgramInfo,
  texture: WebGLTexture,
  canvas: HTMLCanvasElement,
  quad: KatexQuad,
  pixelRatio: number
): void {
  const { left, top, width, height } = quad.rect;
  const x0 = left * pixelRatio;
  const x1 = (left + width) * pixelRatio;
  const y0 = top * pixelRatio;
  const y1 = (top + height) * pixelRatio;
  const { u0, v0, u1, v1 } = quad.region;
  const vertices = new Float32Array([
    x0,
    y0,
    u0,
    v0,
    x1,
    y0,
    u1,
    v0,
    x0,
    y1,
    u0,
    v1,
    x0,
    y1,
    u0,
    v1,
    x1,
    y0,
    u1,
    v0,
    x1,
    y1,
    u1,
    v1
  ]);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
  gl.enableVertexAttribArray(programInfo.positionLocation);
  gl.vertexAttribPointer(programInfo.positionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(programInfo.texCoordLocation);
  gl.vertexAttribPointer(programInfo.texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  gl.uniform2f(programInfo.resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(programInfo.opacityLocation, quad.opacity);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
